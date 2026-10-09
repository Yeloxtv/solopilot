// Where the project stands, from the backlog alone.
//
// Plan days carry load points. A half-done day yields half its points, and the points delivered,
// placed back on the plan, give "plan done" in plan days. The calendar runs from project.start to
// project.target in working days; the share already elapsed says where the plan should be, either
// for the core (day 1 to project.core) or for everything. The gap between the two is the lead or
// the delay.
//
// The projection follows the plan's own estimate, never the pace of the first days: a full work day
// is worth points_per_day, and project.focus of each working day goes to the project.
import { calendar, localToday, nextDay } from './calendar.mjs';
import { LATER } from './backlog.mjs';

const EPS = 1e-9;

export function compute(b, { today = localToday(), now = new Date() } = {}) {
  const p = b.project;
  const planDays = p.plan_days;
  const coreDay = p.core;
  const focus = p.focus;

  const byDay = new Map();
  for (const t of b.tasks) {
    const k = String(t.day);
    if (!byDay.has(k)) byDay.set(k, []);
    byDay.get(k).push(t);
  }
  const detail = (d) => {
    const tasks = byDay.get(String(d.day)) || [];
    const active = tasks.filter((t) => t.status !== 'deferred');
    const done = active.filter((t) => t.status === 'done').length;
    const fraction = active.length ? done / active.length : 0;
    return { ...d, tasks, active: active.length, done, fraction, pointsDone: d.points * fraction, empty: !active.length };
  };
  const plan = b.days.filter((d) => d.day !== LATER).map(detail).sort((a, c) => a.day - c.day);
  const later = b.days.filter((d) => d.day === LATER).map(detail);

  const pointsTotal = plan.filter((d) => !d.empty).reduce((s, d) => s + d.points, 0);
  const pointsDone = plan.reduce((s, d) => s + d.pointsDone, 0);
  const pointsCore = plan.filter((d) => !d.empty && d.day <= coreDay).reduce((s, d) => s + d.points, 0);

  // Where does this many points land on the plan? Half of a day counts as half a plan day,
  // whether the day carries 3 points or 17.
  const dayReached = (points) => {
    if (points <= 0) return 0;
    let total = 0;
    let last = 0;
    for (const d of plan) {
      if (d.empty) { last = d.day; continue; }
      if (points < total + d.points - EPS) return d.day - 1 + (points - total) / d.points;
      total += d.points;
      last = d.day;
    }
    return last;
  };
  const planDone = dayReached(pointsDone);

  const start = String(p.start);
  const target = String(p.target);
  const cal = calendar({ holidays: p.holidays, workingDays: p.working_days });
  const workingDays = cal.between(start, nextDay(target));
  const elapsed = Math.min(workingDays, cal.between(start, today));
  const remaining = workingDays - elapsed;
  const share = workingDays ? elapsed / workingDays : 1;
  // Where the plan should be today to finish the core, or everything, on the target date: points
  // spread over the calendar, so a heavy day takes more room than a light one.
  const expected = { core: dayReached(pointsCore * share), all: dayReached(pointsTotal * share) };
  const gap = { core: expected.core - planDone, all: expected.all - planDone }; // > 0: behind

  const capacity = p.points_per_day * focus; // points per working day
  const left = (upTo) => plan.filter((d) => !d.empty && d.day <= upTo).reduce((s, d) => s + d.points - d.pointsDone, 0);
  const inWorkingDays = (points) => Math.ceil(points / capacity - EPS);
  const finishDate = (points) => cal.add(today, Math.max(0, inWorkingDays(points) - 1));
  const finish = { core: finishDate(left(coreDay)), all: finishDate(left(planDays)) };
  const currentDay = plan.find((d) => !d.empty && d.done < d.active)?.day ?? planDays;
  const sessions = b.log.filter((e) => e.type === 'session');
  const lastSession = sessions.length ? String(sessions[sessions.length - 1].date) : null;
  // Time spent is what each session records (effort, in days); a session without it counts as focus.
  const spent = sessions.reduce((s, e) => s + (e.effort ?? focus), 0);

  // "before: n" means the answer is needed when the work reaches day n, not on a calendar date the
  // project may run ahead of or behind. That moment is dated at the plan estimate, like the projection.
  const dueDate = (before) => {
    const rest = left(before - 1);
    return rest <= EPS ? today : cal.add(today, inWorkingDays(rest));
  };
  const level = (date) => (date == null ? 'ok' : today >= date ? 'now' : cal.between(today, date) <= 2 ? 'soon' : 'ok');

  // For the page: when the work reaches each plan day and when it finishes it; the plan day reached
  // at the target; the margins in working days (negative: after the target).
  const dayDates = Object.fromEntries(plan.filter((d) => !d.empty).map((d) => {
    const rest = left(d.day);
    return [d.day, { start: dueDate(d.day), end: rest <= EPS ? null : finishDate(rest) }];
  }));
  const planAtTarget = Math.min(planDays, dayReached(pointsDone + capacity * remaining));
  const margin = { core: cal.until(finish.core, target), all: cal.until(finish.all, target) };
  // Work days (a full day is worth points_per_day) against the calendar days they take: without
  // this distinction, 49 working days read as 49 days of work.
  const work = { core: left(coreDay) / p.points_per_day, all: left(planDays) / p.points_per_day, available: remaining * focus };
  const calendarLeft = { core: inWorkingDays(left(coreDay)), all: inWorkingDays(left(planDays)) };
  const horizon = cal.add(today, 10);

  const watch = [
    ...b.dependencies.filter((d) => d.status !== 'received').map((d) => ({ ...d, kind: 'dependency' })),
    ...b.questions.filter((q) => q.status !== 'answered').map((q) => ({ ...q, kind: 'question' })),
    ...b.requests.filter((r) => r.status === 'pending' && r.before).map((r) => ({ ...r, kind: 'request' })),
  ]
    .map((x) => {
      const date = x.before ? dueDate(x.before) : null;
      return { ...x, date, left: date ? cal.between(today, date) : null, level: level(date) };
    })
    .sort((a, c) => (a.before ?? Infinity) - (c.before ?? Infinity));

  const inPlan = (t) => t.day !== LATER;
  const screens = b.tasks.filter((t) => t.id.startsWith('S') && inPlan(t));
  const tasks = b.tasks.filter((t) => t.id.startsWith('T') && inPlan(t) && t.status !== 'deferred');
  const nextMilestone = b.milestones.filter((m) => m.status !== 'reached').sort((a, c) => a.day - c.day)[0] || null;

  return {
    generatedAt: now.toISOString(),
    today, horizon, start, target, goal: p.goal || null,
    planDays, core: coreDay, focus, capacity, pointsPerDay: p.points_per_day,
    workingDays, elapsed, remaining, expected, gap, finish, margin, work, calendarLeft,
    currentDay, planDone, planAtTarget, lastSession, spent,
    pointsTotal, pointsDone, pointsCore, dayDates,
    counters: {
      tasks: { done: tasks.filter((t) => t.status === 'done').length, total: tasks.length },
      screens: { done: screens.filter((t) => !t.admin && t.status === 'done').length, total: screens.filter((t) => !t.admin).length },
      views: { done: screens.filter((t) => t.status === 'done').reduce((s, t) => s + t.views, 0), total: screens.reduce((s, t) => s + t.views, 0) },
      later: later.reduce((s, d) => s + d.points, 0),
    },
    inProgress: b.tasks.filter((t) => t.status === 'doing'),
    blocked: b.tasks.filter((t) => t.status === 'blocked'),
    watch, nextMilestone,
    days: [...plan, ...later],
  };
}
