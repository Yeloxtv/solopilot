import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compute } from '../src/compute.mjs';
import { fixture } from './fixture.mjs';

const today = '2026-01-07';

test('plan done counts half a day for half its tasks', () => {
  const c = compute(fixture(), { today });
  assert.equal(c.pointsDone, 6);
  assert.equal(c.planDone, 1.5);
  assert.equal(c.currentDay, 2);
});

test('expected position follows the share of working days elapsed', () => {
  const c = compute(fixture(), { today });
  assert.equal(c.workingDays, 10);
  assert.equal(c.elapsed, 2);
  assert.ok(Math.abs(c.expected.core - 0.4) < 1e-9);
  assert.ok(Math.abs(c.expected.all - 0.6) < 1e-9);
  assert.ok(c.gap.core < 0, 'ahead of the core schedule');
});

test('projection uses points_per_day × focus, from today', () => {
  const c = compute(fixture(), { today });
  assert.equal(c.capacity, 2);
  assert.equal(c.finish.core, '2026-01-07');
  assert.equal(c.finish.all, '2026-01-09');
  assert.equal(c.margin.core, 7);
  assert.equal(c.work.all, 1.5);
});

test('a lower focus pushes the finish past the target', () => {
  const c = compute(fixture({ project: { focus: 0.1 } }), { today });
  assert.ok(c.finish.all > c.target);
  assert.ok(c.margin.all < 0);
});

test('due dates follow the work, not the calendar', () => {
  const c = compute(fixture(), { today });
  const q1 = c.watch.find((x) => x.id === 'Q01');
  const q2 = c.watch.find((x) => x.id === 'Q02');
  assert.equal(q1.level, 'now', 'day 1 is done, so an answer needed before day 2 is due now');
  assert.equal(q2.date, '2026-01-08');
  assert.equal(q2.level, 'soon');
  assert.equal(c.watch.some((x) => x.id === 'D01'), false, 'received dependencies are not watched');
});

test('time spent sums session effort, focus by default', () => {
  const c = compute(fixture(), { today });
  assert.equal(c.spent, 1.5);
  assert.equal(c.lastSession, '2026-01-06');
});

test('deferred tasks leave the day', () => {
  const b = fixture();
  b.tasks.find((t) => t.id === 'T003').status = 'deferred';
  const c = compute(b, { today });
  assert.equal(c.days.find((d) => d.day === 2).fraction, 1);
  assert.equal(c.planDone, 2);
  assert.equal(c.currentDay, 3);
});
