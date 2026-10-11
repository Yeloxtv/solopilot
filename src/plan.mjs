// The first plan: where its drawing-up stands, and the layout of estimated tasks on plan days.
import { LATER, featureIds } from './backlog.mjs';

const EPS = 1e-9;
const round = (n) => Math.round(n * 100) / 100;
const sum = (xs) => xs.reduce((s, x) => s + x, 0);

// The six steps of the first plan. The skill records the last step the developer approved in
// project.planning_step; a file kept by hand falls back on what its sections show. The skill picks up
// from the first step not done; the developer may reopen any.
export function planningProgress(b) {
  const active = b.tasks.filter((t) => t.status !== 'deferred');
  const screens = active.filter((t) => String(t.id).startsWith('S'));
  const estimated = active.filter((t) => typeof t.points === 'number');
  const placed = active.filter((t) => t.day !== undefined);
  // Below the line is not promised: it stays out of the points weighed against the days sold.
  const below = (t) => t.day === LATER;
  const steps = [
    { key: 'features', done: b.features.length > 0, inScope: b.features.filter((f) => f.scope !== 'out').length, out: b.features.filter((f) => f.scope === 'out').length },
    { key: 'screens', done: screens.length > 0, screens: screens.length, views: sum(screens.map((t) => Number(t.views) || 0)) },
    // Questions are born at step 1 already: the pass of step 3 shows only once estimating has begun.
    { key: 'questions', done: b.questions.length + b.dependencies.length > 0 && estimated.length > 0, questions: b.questions.length, dependencies: b.dependencies.length },
    {
      key: 'estimation', done: active.length > 0 && estimated.length === active.length, estimated: estimated.length, total: active.length,
      points: round(sum(estimated.filter((t) => !below(t)).map((t) => t.points))), later: round(sum(estimated.filter(below).map((t) => t.points))),
    },
    { key: 'days', done: active.length > 0 && placed.length === active.length && b.days.length > 0, planDays: b.project.plan_days, core: b.project.core },
    { key: 'baseline', done: Boolean(b.project.baseline) },
  ];
  const approved = b.project.planning_step;
  if (Number.isInteger(approved)) steps.slice(0, 5).forEach((s, i) => { s.done = i + 1 <= approved; });
  const next = steps.findIndex((s) => !s.done);
  return { steps, next: next < 0 ? null : next + 1 };
}

// Lays the estimated tasks out on plan days, a full work day holding points_per_day:
//   1. foundations: tasks of kind setup without a feature, in file order;
//   2. tasks of core features, by feature priority, then file order;
//   3. the other tasks without a feature, which close the core: fixes after acceptance, an
//      accessibility pass, a guide, the handover;
//   4. tasks of the other features, by feature priority, then file order.
// The core ends with the last day of core work, and the rest starts on a fresh day. Tasks on "later"
// stay below the line, deferred tasks keep their day, and tasks of features out of scope are left out.
// Each open question and pending dependency is then needed before the first day of its work.
export function layoutPlan(b, { laterTitle = 'Below the line' } = {}) {
  const capacity = b.project.points_per_day;
  const errors = [];
  const warnings = [];
  const features = new Map(b.features.map((f, index) => [f.id, { ...f, index }]));
  const rank = (f) => [f.core ? 1 : 3, f.priority ?? Infinity, f.index];
  const GROUP = { foundations: [0, 0, 0], closing: [2, 0, 0] };
  const compare = (a, c) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== c[i]) return a[i] < c[i] ? -1 : 1;
    return 0;
  };
  const featureOf = (t) => featureIds(t).map((id) => features.get(id)).filter(Boolean).sort((a, c) => compare(rank(a), rank(c)))[0] ?? null;

  const queue = [];
  const later = [];
  b.tasks.forEach((t, index) => {
    if (t.status === 'deferred') return;
    if (t.day === LATER) return void later.push(t);
    const f = featureOf(t);
    if (f?.scope === 'out') return void warnings.push(`${t.id}: its feature ${f.id} is out of scope, so it is not laid out`);
    if (typeof t.points !== 'number') return void errors.push(`${t.id}: no points yet; every task needs its estimate before the layout`);
    queue.push({ t, f, key: [...(f ? rank(f) : t.kind === 'setup' ? GROUP.foundations : GROUP.closing), index] });
  });
  if (!(capacity > 0)) errors.push('project.points_per_day: the points a full work day holds');
  if (errors.length) return { errors, warnings };
  if (!queue.length) return { errors: ['no task to lay out'], warnings };
  if (b.features.length && !queue.some((x) => x.f?.core)) warnings.push('no feature is marked core: true, so the core is the whole plan');
  queue.sort((a, c) => compare(a.key, c.key));

  const days = [];
  let current = null;
  let previousCore = true;
  for (const x of queue) {
    const isCore = !x.f || Boolean(x.f.core);
    const full = current && current.points > EPS && current.points + x.t.points > capacity + EPS;
    if (!current || full || (previousCore && !isCore && current.points > EPS)) {
      current = { day: days.length + 1, points: 0, items: [] };
      days.push(current);
    }
    current.items.push(x);
    current.points = round(current.points + x.t.points);
    previousCore = isCore;
  }
  const coreDays = days.filter((d) => d.items.some((x) => !x.f || x.f.core));
  const core = b.features.some((f) => f.core) && coreDays.length ? coreDays[coreDays.length - 1].day : days.length;

  const areaTitle = new Map(b.areas.map((a) => [a.id, a.title]));
  const sprintOf = (n) => b.sprints.find((s) => n >= s.from && n <= s.to)?.id;
  // A day of one feature takes its title; a day of several takes the names of their areas, which
  // stay short enough for the calendar.
  const titleOf = (items) => {
    const features = [...new Set(items.map((x) => x.f?.title ?? x.t.title))];
    if (features.length === 1) return features[0];
    const names = [...new Set(items.map((x) => areaTitle.get(x.f?.area ?? x.t.area) ?? x.f?.title ?? x.t.title))];
    return names.slice(0, 3).join(', ') + (names.length > 3 ? '…' : '');
  };
  const dayEntries = days.map((d) => ({
    day: d.day,
    ...(sprintOf(d.day) !== undefined && { sprint: sprintOf(d.day) }),
    ...(d.points > capacity + EPS && { load: 'tight' }),
    title: titleOf(d.items),
  }));
  if (later.length) {
    const kept = b.days.find((d) => d.day === LATER);
    const unestimated = later.some((t) => typeof t.points !== 'number');
    dayEntries.push(kept ?? { day: LATER, ...(unestimated && { points: 0 }), title: laterTitle });
  }
  for (const t of b.tasks) {
    if (t.status === 'deferred' && Number.isInteger(t.day) && t.day > days.length) warnings.push(`${t.id}: deferred on day ${t.day}, past the ${days.length} plan days`);
  }

  const dayOf = new Map(days.flatMap((d) => d.items.map((x) => [x.t.id, d.day])));
  const firstDay = (x) => {
    const viaTasks = (x.tasks || []).map((id) => dayOf.get(id)).filter(Boolean);
    const viaFeatures = b.tasks.filter((t) => featureIds(t).some((id) => (x.features || []).includes(id))).map((t) => dayOf.get(t.id)).filter(Boolean);
    const all = viaTasks.length ? viaTasks : viaFeatures;
    return all.length ? Math.min(...all) : undefined;
  };
  const before = [
    ...b.questions.filter((q) => q.status !== 'answered').map((q) => ['questions', q]),
    ...b.dependencies.filter((d) => d.status !== 'received').map((d) => ['dependencies', d]),
  ].map(([section, x]) => ({ section, id: x.id, day: firstDay(x) })).filter((x) => x.day !== undefined);
  for (const s of b.sprints) if (s.to > days.length) warnings.push(`sprint ${s.id} runs to day ${s.to}, past the ${days.length} plan days`);
  for (const m of b.milestones) if (m.day > days.length) warnings.push(`milestone "${m.title}" is on day ${m.day}, past the ${days.length} plan days`);

  return {
    errors, warnings, capacity,
    planDays: days.length, core,
    points: round(sum(days.map((d) => d.points))),
    days: dayEntries,
    assign: [...dayOf],
    before,
    listing: days.map((d) => ({ day: d.day, points: d.points, title: titleOf(d.items), tasks: d.items.map((x) => x.t.id) })),
    later: later.map((t) => t.id),
  };
}
