// The board: the tasks as cards, in columns by status, one row per sprint.
//
// A task belongs to the sprint of its day. A plan without sprints is one row, the whole plan; tasks
// whose day falls in no sprint share a row of their own, placed by their first day; what sits below
// the line closes the board. Deferred tasks leave the columns, as they leave the count.
//
// Rows open on the sprint of the current day and on any row with work in progress. The current day is
// the first one not finished, so a sprint left with a task behind is still the current one: what lags
// shows. The board only reads the plan: a card never moves by hand, its status changes through
// /solopilot.
//
// "To do" is what piles up on a real project, so its cards gather under their plan day: the next two
// days open, the others fold to a line. No day before the current one has a task to do, so the first
// days of the column are always the next ones.
import { LATER } from './backlog.mjs';

export const COLUMNS = ['todo', 'doing', 'blocked', 'done'];
export const OPEN_DAYS = 2;

// The plan's order: by day, tasks before screens, then by id.
const byPlan = (a, b) => (a.day === LATER ? Infinity : a.day) - (b.day === LATER ? Infinity : b.day)
  || (a.id[0] === b.id[0] ? 0 : a.id[0] === 'T' ? -1 : 1) || a.id.localeCompare(b.id, 'en', { numeric: true });
const recentFirst = (a, b) => String(b.done_on ?? '').localeCompare(String(a.done_on ?? '')) || byPlan(a, b);

// The tasks to do, already in the plan's order, gathered by day. A day's points add up its tasks' own,
// when the plan estimates each task.
function todoDays(tasks) {
  const days = [];
  for (const t of tasks) {
    const last = days[days.length - 1];
    if (last?.day === t.day) last.tasks.push(t);
    else days.push({ day: t.day, tasks: [t] });
  }
  return days.map(({ day, tasks: ts }, i) => {
    const pointed = ts.filter((t) => t.points !== undefined);
    return {
      day, tasks: ts.map((t) => t.id),
      ...(pointed.length && { points: Math.round(pointed.reduce((s, t) => s + Number(t.points), 0) * 100) / 100 }),
      open: i < OPEN_DAYS,
    };
  });
}

// plan: the plan days as compute details them (tasks, points, pointsDone), later the days below the line.
export function board(sprints, { plan, later, currentDay }) {
  const row = (base, days) => {
    const tasks = days.flatMap((d) => d.tasks);
    const active = tasks.filter((t) => t.status !== 'deferred');
    const sorted = Object.fromEntries(COLUMNS.map((c) => [c, active.filter((t) => t.status === c).sort(c === 'done' ? recentFirst : byPlan)]));
    const columns = Object.fromEntries(COLUMNS.map((c) => [c, sorted[c].map((t) => t.id)]));
    const done = columns.done.length;
    const r = {
      ...base,
      points: days.reduce((s, d) => s + d.points, 0),
      pointsDone: days.reduce((s, d) => s + d.pointsDone, 0),
      active: active.length, done, delivered: done === active.length,
      columns, deferred: tasks.filter((t) => t.status === 'deferred').sort(byPlan).map((t) => t.id),
      // Below the line has no days: its cards stay one list.
      todoDays: base.kind === LATER ? [] : todoDays(sorted.todo),
    };
    r.when = r.id === LATER ? LATER : r.to < currentDay ? 'past' : r.from > currentDay ? 'upcoming' : 'current';
    r.open = r.when === 'current' || columns.doing.length > 0;
    return r;
  };
  const span = (days) => ({ from: Math.min(...days.map((d) => d.day)), to: Math.max(...days.map((d) => d.day)) });
  const rows = [];
  if (sprints.length) {
    const inSprint = (day) => sprints.some((s) => day >= s.from && day <= s.to);
    for (const s of sprints) {
      rows.push(row({ id: String(s.id), kind: 'sprint', title: s.title || '', from: s.from, to: s.to },
        plan.filter((d) => d.day >= s.from && d.day <= s.to)));
    }
    // Outside any sprint, a row for the days whose tasks would otherwise be lost.
    const out = plan.filter((d) => !inSprint(d.day) && d.tasks.length);
    if (out.length) rows.push(row({ id: 'out', kind: 'out', title: '', ...span(out) }, out));
    rows.sort((a, b) => a.from - b.from);
  } else if (plan.length) {
    rows.push(row({ id: 'plan', kind: 'plan', title: '', ...span(plan) }, plan));
  }
  if (later.some((d) => d.tasks.length)) rows.push(row({ id: LATER, kind: LATER, title: '' }, later));
  return rows;
}
