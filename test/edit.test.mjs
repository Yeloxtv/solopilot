import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BacklogEditor, EditRefused, yamlValue } from '../src/edit.mjs';

const FILE = `# A plan
project:
  name: Acme
  core: 2              # last day of the core
  holidays: [2026-11-11]
  # plan_days: written by layout

days: []

# T… are tasks
tasks:
  - { id: T001, day: 1, status: todo, title: "First" }
  - { id: T002, feature: F01, status: todo, title: "Second" }

log:
  - { date: 2026-01-05, type: session, title: "Start" }
`;

const edited = (fn, src = FILE) => {
  const ed = new BacklogEditor(src);
  fn(ed);
  return ed.toString();
};

test('values are written plain only when they read back the same', () => {
  assert.equal(yamlValue('todo'), 'todo');
  assert.equal(yamlValue('T024'), 'T024');
  assert.equal(yamlValue('2026-10-14'), '2026-10-14');
  assert.equal(yamlValue('Sign-in'), '"Sign-in"');
  assert.equal(yamlValue('yes'), '"yes"');
  assert.equal(yamlValue('Un "titre"'), '"Un \\"titre\\""');
  assert.equal(yamlValue({ date: '2026-10-14', points: 1.5, tags: ['a', 'b'] }), '{ date: 2026-10-14, points: 1.5, tags: [a, b] }');
});

test('a project key is replaced in place, its comment kept, or added after the last key', () => {
  const out = edited((ed) => {
    ed.setProject('core', 3);
    ed.setProject('plan_days', 4);
    ed.setProject('phase', 'planning');
  });
  assert.match(out, /^ {2}core: 3 {14}# last day of the core$/m);
  assert.match(out, /holidays: \[2026-11-11\]\n {2}plan_days: 4\n {2}phase: planning\n {2}# plan_days: written by layout/);
});

test('a project key is removed with its line', () => {
  const out = edited((ed) => ed.removeProject('core'));
  assert.doesNotMatch(out, /core:/);
  assert.match(out, /name: Acme\n {2}holidays/);
});

test('a key of a one-line entry is replaced, or added after the first anchor it has', () => {
  const out = edited((ed) => {
    ed.setField('tasks', 'T001', 'day', 3, ['feature', 'id']);
    ed.setField('tasks', 'T002', 'day', 2, ['feature', 'id']);
  });
  assert.match(out, /\{ id: T001, day: 3, status: todo, title: "First" \}/);
  assert.match(out, /\{ id: T002, feature: F01, day: 2, status: todo, title: "Second" \}/);
});

test('a list is replaced by one-line entries, without a trailing space or the blank line after it', () => {
  const out = edited((ed) => ed.replaceList('days', [{ day: 1, title: 'One' }, { day: 'later', title: 'Below the line' }]));
  assert.match(out, /\ndays:\n {2}- \{ day: 1, title: "One" \}\n {2}- \{ day: later, title: "Below the line" \}\n\n# T… are tasks/);
  const again = edited((ed) => ed.replaceList('days', [{ day: 1, title: 'Only' }]), out);
  assert.match(again, /\ndays:\n {2}- \{ day: 1, title: "Only" \}\n\n# T/);
});

test('a missing list goes before the comment block of the section named', () => {
  const out = edited((ed) => ed.replaceList('features', [{ id: 'F01', title: 'Sign-in', source: 'spec.pdf' }], { before: 'tasks' }));
  assert.match(out, /days: \[\]\n\nfeatures:\n {2}- \{ id: F01, title: "Sign-in", source: "spec\.pdf" \}\n\n# T… are tasks\ntasks:/);
});

test('an entry is appended to a list, one-line or block', () => {
  const out = edited((ed) => {
    ed.append('log', { date: '2026-01-06', type: 'baseline', title: 'Plan agreed' });
    ed.append('days', { day: 1, title: 'One' });
  });
  assert.match(out, /title: "Start" \}\n {2}- \{ date: 2026-01-06, type: baseline, title: "Plan agreed" \}\n$/);
  assert.match(out, /\ndays:\n {2}- \{ day: 1, title: "One" \}\n/);
});

test('line endings are kept', () => {
  const crlf = FILE.replace(/\n/g, '\r\n');
  const out = edited((ed) => ed.setProject('core', 3), crlf);
  assert.equal(out.replace(/\r\n/g, '').includes('\n'), false);
  assert.match(out, /core: 3/);
});

test('an entry spread over several lines is refused, and nothing changes', () => {
  const src = `project:\n  name: Acme\ntasks:\n  - id: T001\n    status: todo\n    title: First\n`;
  assert.throws(() => edited((ed) => ed.setField('tasks', 'T001', 'day', 1), src), EditRefused);
  assert.throws(() => edited((ed) => ed.setField('tasks', 'T404', 'day', 1)), /T404 not found/);
});

test('two changes of the same value are refused', () => {
  assert.throws(() => edited((ed) => {
    ed.setProject('core', 3);
    ed.setProject('core', 4);
  }), /same place/);
});
