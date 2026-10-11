import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalize, validate } from '../src/backlog.mjs';
import { compute } from '../src/compute.mjs';
import { layoutPlan, planningProgress } from '../src/plan.mjs';
import { fixture } from './fixture.mjs';

// A plan being drawn up: three features, the first two in the core, one out of scope.
function draft(overrides = {}) {
  return normalize({
    project: { name: 'Draft', phase: 'planning', start: '2026-01-05', target: '2026-03-27', points_per_day: 6, focus: 0.5, ...overrides.project },
    areas: [{ id: 'app', title: 'App' }],
    features: [
      { id: 'F01', area: 'app', title: 'Reports', source: 'spec p. 5', priority: 3 },
      { id: 'F02', area: 'app', title: 'Inspections', source: 'spec p. 3', core: true, priority: 2 },
      { id: 'F03', area: 'app', title: 'Sign-in', source: 'spec p. 2', core: true, priority: 1 },
      { id: 'F04', area: 'app', title: 'Export', source: 'spec p. 6', scope: 'out' },
    ],
    questions: [
      { id: 'Q01', status: 'open', who: 'Acme', title: 'Edit after signing?', tasks: ['T004'] },
      { id: 'Q02', status: 'open', who: 'Acme', title: 'Report page one?', features: ['F01'] },
    ],
    tasks: [
      { id: 'T001', feature: 'F01', area: 'app', status: 'todo', points: 4, title: 'PDF' },
      { id: 'T002', area: 'app', kind: 'setup', status: 'todo', points: 2, title: 'Repository' },
      { id: 'T003', feature: 'F03', area: 'app', status: 'todo', points: 3, title: 'Magic link' },
      { id: 'S01', feature: 'F03', area: 'app', status: 'todo', points: 2, views: ['default', 'error'], title: 'Sign-in screen' },
      { id: 'T004', feature: 'F02', area: 'app', status: 'todo', points: 5, title: 'Run an inspection' },
      { id: 'T005', feature: 'F04', area: 'app', status: 'todo', points: 1, title: 'CSV' },
      { id: 'T006', feature: 'F01', area: 'app', status: 'todo', day: 'later', points: 2, title: 'Report by email' },
    ],
    ...overrides.sections,
  });
}

test('a plan being drawn up is valid before its days exist', () => {
  assert.deepEqual(validate(draft()).errors, []);
});

test('layout: foundations, then the core by priority, then the rest from a fresh day', () => {
  const r = layoutPlan(draft());
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.listing.map((d) => d.tasks), [['T002', 'T003'], ['S01'], ['T004'], ['T001']]);
  assert.equal(r.planDays, 4);
  assert.equal(r.core, 3);
  assert.deepEqual(r.later, ['T006']);
  assert.deepEqual(r.days.slice(0, 2).map((d) => d.title), ['App', 'Sign-in'], 'several features: their areas; one feature: its title');
  assert.match(r.warnings.join('\n'), /T005: its feature F04 is out of scope/);
  assert.equal(r.days.at(-1).day, 'later');
});

test('layout: other tasks without a feature close the core, they do not open the plan', () => {
  const b = draft();
  b.tasks.push({ id: 'T007', area: 'app', kind: 'release', status: 'todo', points: 1, title: 'Fixes after acceptance' });
  const r = layoutPlan(b);
  assert.deepEqual(r.listing.map((d) => d.tasks), [['T002', 'T003'], ['S01'], ['T004', 'T007'], ['T001']]);
  assert.equal(r.core, 3);
});

test('layout: a task bigger than a day fills a day of its own, marked tight', () => {
  const b = draft();
  b.tasks.find((t) => t.id === 'T004').points = 8;
  const day = layoutPlan(b).days.find((d) => d.title === 'Inspections');
  assert.equal(day.load, 'tight');
});

test('layout: every task needs its points first', () => {
  const b = draft();
  delete b.tasks.find((t) => t.id === 'T003').points;
  assert.match(layoutPlan(b).errors.join('\n'), /T003: no points yet/);
});

test('layout: each open question is needed before the first day of its work', () => {
  const before = Object.fromEntries(layoutPlan(draft()).before.map((x) => [x.id, x.day]));
  assert.deepEqual(before, { Q01: 3, Q02: 4 });
});

test('the laid-out plan validates once agreed, and its days weigh their tasks', () => {
  const b = draft();
  const r = layoutPlan(b);
  const day = new Map(r.assign);
  const agreed = normalize({
    ...b,
    project: { ...b.project, phase: undefined, plan_days: r.planDays, core: r.core },
    days: r.days,
    tasks: b.tasks.map((t) => (day.has(t.id) ? { ...t, day: day.get(t.id) } : t)).filter((t) => t.feature !== 'F04'),
  });
  delete agreed.project.phase;
  assert.deepEqual(validate(agreed).errors, []);
  assert.equal(compute(agreed, { today: '2026-01-05' }).pointsTotal, 16);
});

test('planning progress follows the file, step by step', () => {
  const empty = planningProgress(draft({ sections: { features: [], tasks: [], questions: [] } }));
  assert.equal(empty.next, 1);
  const p = planningProgress(draft());
  assert.deepEqual(p.steps.map((s) => s.done), [true, true, true, true, false, false]);
  assert.equal(p.next, 5);
  assert.equal(p.steps[3].points, 17);
  assert.equal(p.steps[3].later, 2);
});

test('the step recorded by the skill wins over what the sections show', () => {
  const p = planningProgress(draft({ project: { planning_step: 1 } }));
  assert.deepEqual(p.steps.map((s) => s.done), [true, false, false, false, false, false]);
  assert.equal(p.next, 2);
  assert.match(validate(draft({ project: { planning_step: 7 } })).errors.join('\n'), /project\.planning_step/);
  assert.match(validate(fixture({ project: { planning_step: 2 } })).errors.join('\n'), /project\.planning_step/, 'only while planning');
});

test('without a recorded step, questions alone do not make step 3 done', () => {
  const b = draft();
  for (const t of b.tasks) delete t.points;
  assert.deepEqual(planningProgress(b).steps.map((s) => s.done).slice(0, 3), [true, true, false]);
});

test('before day 1, the projection and the due dates start on day 1', () => {
  const b = fixture();
  for (const t of b.tasks) { t.status = 'todo'; delete t.done_on; }
  const early = compute(b, { today: '2025-12-29' });
  const onDay1 = compute(b, { today: '2026-01-05' });
  assert.equal(early.notStarted, true);
  assert.equal(onDay1.notStarted, false);
  assert.deepEqual(early.finish, onDay1.finish);
  assert.deepEqual(early.watch.map((x) => x.date), onDay1.watch.map((x) => x.date));
});

test('the real pace is judged only after 5 sessions and 15% of the plan, and is a risk under 80%', () => {
  const early = compute(fixture(), { today: '2026-01-07' });
  assert.equal(early.pace.judged, false, 'two sessions say nothing yet');
  assert.equal(early.pace.finish, null);

  const b = fixture();
  for (const date of ['2026-01-07', '2026-01-08', '2026-01-09']) b.log.push({ date, type: 'session', effort: 0.5, title: 'More' });
  const c = compute(b, { today: '2026-01-09' });
  // 6 points delivered over 1 + 0.5 + 1.5 days of effort: 2 points a day, for 4 estimated.
  assert.equal(c.pace.value, 2);
  assert.equal(c.pace.ratio, 0.5);
  assert.equal(c.pace.judged, true);
  assert.equal(c.pace.risk, true);
  assert.ok(c.pace.finish.core > c.finish.core, 'at the real pace the core ends later than at the estimate');
});

test('features need a source, a known area and well-formed flags', () => {
  const b = draft();
  b.features.push({ id: 'F03', area: 'nope', title: 'Dup', scope: 'maybe', core: 'yes' });
  const e = validate(b).errors.join('\n');
  assert.match(e, /F03: duplicate id/);
  assert.match(e, /F03: source/);
  assert.match(e, /area "nope" not found/);
  assert.match(e, /scope is in or out/);
  assert.match(e, /core is true or false/);
});

test('tasks check their feature, points, kind and named views', () => {
  const b = draft();
  Object.assign(b.tasks[0], { feature: 'F99', points: 0, kind: 'magic' });
  b.tasks[3].kind = 'logic';
  b.tasks[3].view_names = ['default', ''];
  const e = validate(b).errors.join('\n');
  assert.match(e, /T001: feature F99 not found/);
  assert.match(e, /T001: points/);
  assert.match(e, /T001: kind is setup, logic/);
  assert.match(e, /S01: kind is screen for a screen/);
  assert.match(e, /S01: views, a list naming at least one view/);
});

test('once agreed, every task needs its day, and the phase has a single value', () => {
  const b = draft({ project: { phase: 'drafting' } });
  const e = validate(b).errors.join('\n');
  assert.match(e, /project\.phase/);
  assert.match(e, /T001: day missing/);
  assert.match(e, /project\.plan_days/);
});

test('a day weighs its tasks when each carries points, and warns about a stale total', () => {
  const b = fixture();
  b.days[1].points = 9;
  b.tasks[1].points = 1;
  b.tasks[2].points = 3;
  const c = compute(b, { today: '2026-01-07' });
  const two = c.days.find((d) => d.day === 2);
  assert.equal(two.points, 4);
  assert.equal(two.fraction, 0.25);
  assert.match(validate(b).warnings.join('\n'), /day 2: points 9 ignored, its tasks add up to 4/);
});

test('a day with tasks partly estimated counts its own points, with a warning', () => {
  const b = fixture();
  b.tasks[1].points = 1;
  const { errors, warnings } = validate(b);
  assert.deepEqual(errors, []);
  assert.match(warnings.join('\n'), /day 2: some tasks carry points and others not/);
  assert.equal(compute(b, { today: '2026-01-07' }).days.find((d) => d.day === 2).points, 4);
});

test('the agreed plan and its log entry are checked', () => {
  const b = fixture({ project: { baseline: { date: '2026-01-05', points: 12 } } });
  b.log.push({ date: '2026-01-05', type: 'baseline', title: 'Plan agreed' });
  const e = validate(b).errors.join('\n');
  assert.match(e, /project\.baseline/);
  assert.doesNotMatch(e, /type is session/);
});
