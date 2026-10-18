import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/backlog.mjs';
import { compute } from '../src/compute.mjs';
import { fixture } from './fixture.mjs';

const today = '2026-01-07';

// Six plan days in two sprints, and what sits below the line. Day 2 is where the work is.
const sprints = (overrides = {}) => fixture({
  project: { plan_days: 6, core: 4 },
  sections: {
    sprints: [{ id: 1, from: 1, to: 3, title: 'Base' }, { id: 2, from: 4, to: 6, title: 'Rest' }],
    days: [
      ...[1, 2, 3].map((day) => ({ day, sprint: 1, points: 4, title: `Day ${day}` })),
      ...[4, 5, 6].map((day) => ({ day, sprint: 2, points: 4, title: `Day ${day}` })),
      { day: 'later', points: 2, title: 'If time allows' },
    ],
    tasks: [
      { id: 'T001', day: 1, area: 'core', status: 'done', done_on: '2026-01-05', title: 'Done first' },
      { id: 'S01', day: 2, area: 'core', status: 'done', done_on: '2026-01-06', views: 2, title: 'Done screen' },
      { id: 'T003', day: 2, area: 'core', status: 'doing', title: 'Under way' },
      { id: 'T002', day: 2, area: 'core', status: 'todo', title: 'Waiting on Q01' },
      { id: 'T004', day: 3, area: 'core', status: 'blocked', note: 'Waits for D02', title: 'Stuck' },
      { id: 'T005', day: 3, area: 'core', status: 'deferred', note: 'Moved to V2', title: 'Dropped' },
      { id: 'T006', day: 4, area: 'core', status: 'todo', title: 'Next sprint' },
      { id: 'T007', day: 'later', area: 'core', status: 'todo', title: 'Maybe' },
    ],
    ...overrides,
  },
});

test('each status goes to its column, deferred tasks aside', () => {
  const b = sprints();
  assert.deepEqual(validate(b).errors, []);
  const [first] = compute(b, { today }).board;
  assert.equal(first.id, '1');
  assert.deepEqual(first.columns, { todo: ['T002'], doing: ['T003'], blocked: ['T004'], done: ['S01', 'T001'] });
  assert.deepEqual(first.deferred, ['T005']);
  assert.equal(first.active, 5);
  assert.equal(first.done, 2);
});

test('a task waiting on an open question stays in its column', () => {
  const b = sprints();
  b.questions = [{ id: 'Q01', before: 2, status: 'open', who: 'Acme', title: 'Which rule?', tasks: ['T002'] }];
  assert.deepEqual(compute(b, { today }).board[0].columns.todo, ['T002']);
});

test('one row per sprint, by the day of each task, then what sits below the line', () => {
  const rows = compute(sprints(), { today }).board;
  assert.deepEqual(rows.map((r) => [r.id, r.kind]), [['1', 'sprint'], ['2', 'sprint'], ['later', 'later']]);
  assert.deepEqual(rows[1].columns.todo, ['T006']);
  assert.deepEqual(rows[2].columns.todo, ['T007']);
  assert.deepEqual([rows[1].from, rows[1].to, rows[1].title], [4, 6, 'Rest']);
});

test('a plan without sprints is one row, the whole plan', () => {
  const b = sprints({ sprints: [] });
  for (const d of b.days) delete d.sprint;
  const rows = compute(b, { today }).board;
  assert.deepEqual(rows.map((r) => r.id), ['plan', 'later']);
  assert.deepEqual([rows[0].from, rows[0].to, rows[0].active], [1, 6, 6]);
});

test('tasks on a day outside every sprint share a row, placed by their day', () => {
  const b = sprints();
  b.sprints = [{ id: 1, from: 1, to: 3, title: 'Base' }];
  for (const d of b.days) if (d.sprint === 2) delete d.sprint;
  const rows = compute(b, { today }).board;
  assert.deepEqual(rows.map((r) => r.id), ['1', 'out', 'later']);
  assert.deepEqual(rows[1].columns.todo, ['T006']);
  assert.deepEqual([rows[1].from, rows[1].to], [4, 4]);
});

test('in a column, the plan order: by day, tasks before screens; done, the most recent first', () => {
  const b = sprints();
  b.tasks.push(
    { id: 'S02', day: 2, area: 'core', status: 'todo', views: 1, title: 'Screen of day 2' },
    { id: 'T010', day: 1, area: 'core', status: 'todo', title: 'Late find on day 1' },
    { id: 'T008', day: 3, area: 'core', status: 'done', done_on: '2026-01-07', title: 'Done last' },
  );
  const [first] = compute(b, { today }).board;
  assert.deepEqual(first.columns.todo, ['T010', 'T002', 'S02']);
  assert.deepEqual(first.columns.done, ['T008', 'S01', 'T001']);
});

test('rows open on the current sprint and on work in progress; delivered and upcoming ones fold', () => {
  const state = (b, at = today) => compute(b, { today: at }).board.map((r) => [r.id, r.when, r.open]);
  assert.deepEqual(state(sprints()), [['1', 'current', true], ['2', 'upcoming', false], ['later', 'later', false]]);

  // Work under way in the next sprint opens it too.
  const ahead = sprints();
  ahead.tasks.find((x) => x.id === 'T006').status = 'doing';
  assert.deepEqual(state(ahead)[1], ['2', 'upcoming', true]);

  // Sprint 1 delivered: it folds once the work is past it.
  const past = sprints();
  for (const x of past.tasks) if (x.day !== 'later' && x.day <= 3 && x.status !== 'deferred') Object.assign(x, { status: 'done', done_on: '2026-01-06' });
  delete past.tasks.find((x) => x.id === 'T004').note;
  const rows = compute(past, { today }).board;
  assert.deepEqual(rows.map((r) => [r.id, r.when, r.open, r.delivered]).slice(0, 2), [['1', 'past', false, true], ['2', 'current', true, false]]);
});

test('a sprint left with a blocked task stays the current one, and open', () => {
  const b = sprints();
  // T004 stays blocked on day 3; the rest of sprint 1 is done, and the work goes on in sprint 2.
  for (const x of b.tasks) if (['T002', 'T003'].includes(x.id)) Object.assign(x, { status: 'done', done_on: '2026-01-06' });
  b.tasks.find((x) => x.id === 'T006').status = 'done';
  b.tasks.find((x) => x.id === 'T006').done_on = '2026-01-07';
  b.tasks.push({ id: 'T009', day: 5, area: 'core', status: 'todo', title: 'Day 5' });
  const c = compute(b, { today });
  // The current day stays where a task is left: day 3, in sprint 1. The board says the same.
  assert.equal(c.currentDay, 3);
  assert.deepEqual(c.board.slice(0, 2).map((r) => [r.id, r.when, r.open]), [['1', 'current', true], ['2', 'upcoming', false]]);
});

test('to do gathers by plan day: the next two days open, the others fold', () => {
  const b = sprints();
  b.tasks.push(
    { id: 'S03', day: 4, area: 'core', status: 'todo', views: 2, title: 'Screen of day 4' },
    { id: 'T011', day: 5, area: 'core', status: 'todo', title: 'Day 5' },
    { id: 'T012', day: 6, area: 'core', status: 'todo', title: 'Day 6' },
    { id: 'T013', day: 4, area: 'core', status: 'doing', title: 'Under way on day 4' },
  );
  const [first, second] = compute(b, { today }).board;
  assert.deepEqual(second.todoDays, [
    { day: 4, tasks: ['T006', 'S03'], open: true },
    { day: 5, tasks: ['T011'], open: true },
    { day: 6, tasks: ['T012'], open: false },
  ]);
  // Sprint 1 has one task to do, on day 2: the current day, never one before it.
  assert.deepEqual(first.todoDays, [{ day: 2, tasks: ['T002'], open: true }]);
});

test("a day of to do adds up its tasks' points, when the plan estimates each task", () => {
  const b = sprints();
  b.tasks.find((x) => x.id === 'T006').points = 0.1;
  b.tasks.push({ id: 'T011', day: 4, area: 'core', status: 'todo', points: 0.2, title: 'Day 4 too' });
  const second = compute(b, { today }).board[1];
  assert.deepEqual(second.todoDays, [{ day: 4, tasks: ['T006', 'T011'], points: 0.3, open: true }]);
});

test('below the line has no days, nor a row with nothing to do', () => {
  const b = sprints();
  b.tasks.find((x) => x.id === 'T002').status = 'done';
  b.tasks.find((x) => x.id === 'T002').done_on = '2026-01-06';
  const rows = compute(b, { today }).board;
  assert.deepEqual(rows[0].todoDays, []);
  assert.deepEqual(rows[2].columns.todo, ['T007']);
  assert.deepEqual(rows[2].todoDays, []);
});

test('the progress of a row is the points of its days delivered', () => {
  const [first, second] = compute(sprints(), { today }).board;
  assert.equal(first.points, 12);
  assert.ok(first.pointsDone > 0 && first.pointsDone < first.points);
  assert.equal(second.pointsDone, 0);
});
