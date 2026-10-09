import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/backlog.mjs';
import { tagIds } from '../src/repo.mjs';
import { fixture } from './fixture.mjs';

const errorsOf = (b) => validate(b).errors;

test('the fixture is valid', () => {
  assert.deepEqual(errorsOf(fixture()), []);
});

test('normalize fills defaults', () => {
  const b = fixture();
  assert.equal(b.project.locale, 'en');
  assert.deepEqual(b.project.working_days, [1, 2, 3, 4, 5]);
  assert.equal(b.requests[0].who, 'Acme', 'requests default to the client');
});

test('a done task needs done_on', () => {
  const b = fixture();
  delete b.tasks[0].done_on;
  assert.match(errorsOf(b).join('\n'), /T001: done without done_on/);
});

test('blocked and deferred tasks need a note', () => {
  const b = fixture();
  b.tasks[2].status = 'blocked';
  b.tasks[3].status = 'deferred';
  const e = errorsOf(b).join('\n');
  assert.match(e, /T003: blocked without a note/);
  assert.match(e, /T004: deferred without a note/);
});

test('ids, days and areas must exist', () => {
  const b = fixture();
  b.tasks.push({ id: 'T001', day: 9, area: 'nope', status: 'todo', title: 'Dup' });
  const e = errorsOf(b).join('\n');
  assert.match(e, /T001: duplicate id/);
  assert.match(e, /day 9 not found/);
  assert.match(e, /area "nope" not found/);
});

test('every plan day must be listed', () => {
  const b = fixture();
  b.days = b.days.filter((d) => d.day !== 2);
  assert.match(errorsOf(b).join('\n'), /day 2: missing from days/);
});

test('answered questions carry their answer', () => {
  const b = fixture();
  b.questions[0].status = 'answered';
  assert.match(errorsOf(b).join('\n'), /Q01: answered without the answer/);
});

test('screens need their views', () => {
  const b = fixture();
  b.tasks.push({ id: 'S01', day: 3, area: 'core', status: 'todo', title: 'Home' });
  assert.match(errorsOf(b).join('\n'), /S01: screen without its number of views/);
});

test('numbers meant for the page are checked: views and priority', () => {
  const b = fixture();
  b.tasks[3].views = '<img src=x onerror=alert(1)>';
  b.questions[0].priority = '<b>1</b>';
  const e = errorsOf(b).join('\n');
  assert.match(e, /T004: views is a whole number/);
  assert.match(e, /Q01: priority is a whole number/);
});

test('project settings that reach commands, links or files are checked', () => {
  const e = errorsOf(fixture({ project: { last_commit: '--output=x', dashboard_url: 'javascript:alert(1)', locale: '../package' } })).join('\n');
  assert.match(e, /project\.last_commit/);
  assert.match(e, /project\.dashboard_url/);
  assert.match(e, /project\.locale/);
  assert.deepEqual(errorsOf(fixture({ project: { last_commit: 'abc1234def56', dashboard_url: 'https://claude.ai/artifact/x', locale: 'en-GB' } })), []);
});

test('too many tasks in progress is a warning, not an error', () => {
  const b = fixture({ project: { wip_limit: 1 } });
  b.tasks[2].status = 'doing';
  b.tasks[3].status = 'doing';
  const { errors, warnings } = validate(b);
  assert.deepEqual(errors, []);
  assert.match(warnings.join('\n'), /2 tasks in progress/);
});

test('commit tags are read inside square brackets only', () => {
  assert.deepEqual(tagIds('[T024] add search'), ['T024']);
  assert.deepEqual(tagIds('[T025 S05] wire the list'), ['T025', 'S05']);
  assert.deepEqual(tagIds('fix T024 without brackets'), []);
  assert.deepEqual(tagIds('[wip] T001'), []);
});
