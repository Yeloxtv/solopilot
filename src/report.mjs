// Text views of the computation: the terminal status and the Slack messages.
import { validate } from './backlog.mjs';
import { compute } from './compute.mjs';
import { planningProgress } from './plan.mjs';

// While the first plan is being drawn up: where each of the six steps stands, what the estimate
// weighs against the days sold and, once the days are laid out, when the core and everything finish.
export function planningText(b, t, { today } = {}) {
  const p = b.project;
  const { steps, next } = planningProgress(b);
  const step = (s) => t(`planning.steps.${s.key}`);
  const day = (n) => t('day', { n });
  const ready = steps[3].done && steps[4].done;
  const out = [ready ? t('planning.ready', { name: p.name }) : t('planning.lead', { name: p.name, n: next, step: step(steps[next - 1]) })];
  const detail = {
    features: (s) => t('planning.features', { n: s.inScope }) + (s.out ? t('planning.out', { n: s.out }) : ''),
    screens: (s) => `${t('planning.screens', { n: s.screens })}, ${t('units.views', { n: s.views })}`,
    questions: (s) => `${t('planning.questions', { n: s.questions })}, ${t('planning.dependencies', { n: s.dependencies })}`,
    estimation: (s) => `${t('planning.estimated', { done: s.estimated, total: s.total })}, ${t('planning.points', { n: s.points })}`
      + (s.later ? t('planning.below', { points: t('planning.points', { n: s.later }) }) : ''),
    days: (s) => (s.done ? t('planning.days', { n: s.planDays, core: day(s.core) }) : t('planning.notYet')),
    baseline: () => t('planning.notYet'),
  };
  const width = Math.max(...steps.map((s) => step(s).length));
  steps.forEach((s, i) => out.push(`  ${s.done ? '✓' : i + 1 === next ? '→' : ' '} ${i + 1}. ${step(s).padEnd(width)}  ${detail[s.key](s)}`));
  const points = steps[3].points;
  if (points > 0 && p.budget_days) {
    const days = points / p.points_per_day;
    const vars = { ppd: p.points_per_day, points: t('planning.points', { n: points }), days, budget: p.budget_days };
    out.push('', days - p.budget_days > 0.05 ? t('planning.budgetOver', { ...vars, over: t('units.days', { n: days - p.budget_days }) }) : t('planning.budget', vars));
  }
  // What can be promised: the plan read as if it were agreed, from today.
  const agreed = { ...b, project: { ...p } };
  delete agreed.project.phase;
  if (steps[4].done && !validate(agreed).errors.length) {
    const c = compute(agreed, { today });
    const { date, focus } = helpers(c, t);
    const when = (d) => (d > c.target ? t('status.onLate', { date: date(d) }) : t('status.on', { date: date(d) }));
    if (!p.budget_days) out.push('');
    out.push(t('status.projection', { focus, core: when(c.finish.core), all: when(c.finish.all) }));
  }
  return out.join('\n');
}

export function helpers(c, t) {
  const year = c.today.slice(0, 4);
  const date = (s) => t.date(String(s), { day: 'numeric', month: 'long', ...(String(s).slice(0, 4) !== year && { year: 'numeric' }) });
  const day = (n) => t('day', { n });
  // The gap is counted in plan days: "2 d behind" means two plan days to catch up.
  const situation = (g) => (Math.abs(g) < 0.25 ? t('situation.onTime') : g > 0 ? t('situation.behind', { n: g }) : t('situation.ahead', { n: -g }));
  const goal = c.goal || t('goal');
  const focus = t.num(c.focus, 2);
  return { date, day, situation, goal, focus };
}

export function statusText(b, c, t) {
  const { date, day, situation, goal, focus } = helpers(c, t);
  const out = [];
  const when = (d) => (d > c.target ? t('status.onLate', { date: date(d) }) : t('status.on', { date: date(d) }));
  out.push(t('status.lead', { goal, target: date(c.target), calendar: t('status.calendar', { n: c.remaining, total: c.workingDays }), day: day(c.planDone) }));
  out.push(t('status.split', {
    core: t('range', { from: day(1), to: day(c.core) }), coreGap: situation(c.gap.core),
    all: t('range', { from: day(1), to: day(c.planDays) }), allGap: situation(c.gap.all),
  }));
  out.push(t('status.projection', { focus, core: when(c.finish.core), all: when(c.finish.all) }));
  const k = c.counters;
  out.push(t('status.tasks', { done: k.tasks.done, total: k.tasks.total })
    + (k.screens.total ? t('status.screens', { done: k.screens.done, total: k.screens.total, vdone: k.views.done, vtotal: k.views.total }) : ''));
  out.push(t('status.spent', { spent: t('units.days', { n: c.spent }), planDays: c.planDays, focus }));
  if (c.nextMilestone) out.push(t('status.nextMilestone', { day: day(c.nextMilestone.day), title: c.nextMilestone.title }));

  const current = c.days.find((d) => d.day === c.currentDay);
  if (current) {
    out.push('', `${day(current.day)}, ${current.title} (${current.done}/${current.active})`);
    for (const x of current.tasks) out.push(`  ${x.id}  ${t(`task.${x.status}`).padEnd(12)}  ${x.title}`);
  }
  if (c.inProgress.length) {
    out.push('', t('status.inProgress'));
    for (const x of c.inProgress) out.push(`  ${x.id}  ${day(x.day)}  ${x.title}`);
  }
  if (c.blocked.length) {
    out.push('', t('status.blocked'));
    for (const x of c.blocked) out.push(`  ${x.id}  ${x.title} (${x.note})`);
  }
  const alerts = c.watch.filter((x) => x.level !== 'ok');
  if (alerts.length) {
    out.push('', t('status.watch'));
    for (const x of alerts) {
      const due = x.level === 'now' ? t('status.now') : t('status.around', { date: date(x.date) });
      out.push(`  ${x.id}  ${t('status.before', { day: day(x.before) }).padEnd(12)}  ${due.padEnd(22)}  ${x.title} (${x.who})`);
    }
  }
  return out.join('\n');
}

// ---------------------------------------------------------------- Slack

// User text goes into Slack mrkdwn escaped: a title copied from a client must not ping the channel
// (<!channel>) or disguise a link (<url|label>).
const se = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const bullets = (items, t, max = 8, suffix = () => '') => {
  const lines = items.slice(0, max).map((x) => `• \`${x.id}\` ${se(x.title)}${suffix(x)}`);
  if (items.length > max) lines.push(`• ${t('slack.more', { n: items.length - max })}`);
  return lines.join('\n');
};

// The answer leadership looks for: the target date, and whether the core makes it. The basis of the
// schedule is restated every time: without it, the dates read as full work days.
function targetLine(c, t) {
  const { date, goal, focus } = helpers(c, t);
  const margin = (m) => (m >= 0 ? t('slack.margin', { n: m }) : t('slack.afterTarget', { n: -m }));
  return t('slack.target', {
    goal: se(goal), target: date(c.target), coreEnd: date(c.finish.core), coreMargin: margin(c.margin.core),
    allEnd: date(c.finish.all), allMargin: margin(c.margin.all), focus, ratio: t.num(1 / c.focus),
  });
}

// The digest carries only the essentials; the detail lives on the dashboard (project.dashboard_url).
export function digestMessage(b, c, t) {
  const { date, day, goal } = helpers(c, t);
  const name = b.project.name;
  const on = c.lastSession || c.today;
  const pretty = t.date(on, { weekday: 'long', day: 'numeric', month: 'long' });
  const done = b.tasks.filter((x) => x.status === 'done' && String(x.done_on) === String(on));
  const now = c.watch.filter((x) => x.level === 'now');
  const meeting = b.meetings.filter((m) => String(m.date) >= c.today).sort((x, y) => String(x.date).localeCompare(String(y.date)))[0];
  // Same rule as the page: raised at the meeting, or due before it; in priority order.
  const toPrepare = meeting ? c.watch
    .filter((x) => x.meeting === String(meeting.date) || (x.level !== 'now' && x.date && x.date <= String(meeting.date) && x.who.includes(meeting.with)))
    .sort((x, y) => (x.priority ?? 99) - (y.priority ?? 99)) : [];

  const blocks = [
    { type: 'header', text: { type: 'plain_text', text: t('slack.header', { name, date: pretty }) } },
    { type: 'section', text: { type: 'mrkdwn', text: targetLine(c, t) } },
  ];
  const section = (text) => blocks.push({ type: 'section', text: { type: 'mrkdwn', text } });
  if (done.length) section(`${t('slack.done', { n: done.length })}\n${bullets(done, t, 5)}`);
  if (c.blocked.length) section(`${t('slack.blocked', { n: c.blocked.length })}\n${bullets(c.blocked, t, 5, (x) => `${t('colon')}${se(x.note)}`)}`);
  if (now.length) {
    const byWho = [...new Set(now.map((x) => x.who))].map((who) => `• ${se(who)}${t('colon')}${now.filter((x) => x.who === who).map((x) => x.id).join(', ')}`);
    section(`${t('slack.now', { n: now.length, day: day(c.currentDay) })}\n${byWho.join('\n')}`);
  }
  if (meeting) {
    const first = toPrepare.filter((x) => x.priority).slice(0, 6).map((x) => x.id);
    section(t('slack.meeting', {
      title: se(meeting.title), with: se(meeting.with), date: date(meeting.date),
      questions: t('slack.questions', { n: toPrepare.length }), first: first.length ? t('slack.first', { ids: first.join(', ') }) : '',
    }));
  }

  const milestone = b.milestones.filter((m) => m.status !== 'reached' && m.type === 'client').sort((x, y) => x.day - y.day)[0];
  const milestoneEnd = milestone && c.dayDates[milestone.day]?.end;
  blocks.push({ type: 'context', elements: [{ type: 'mrkdwn', text: [
    t('slack.current', { day: day(c.currentDay) }),
    t('slack.tasks', { done: c.counters.tasks.done, total: c.counters.tasks.total }),
    t('slack.spent', { spent: t('units.days', { n: c.spent }), planDays: c.planDays }),
    milestone ? t('slack.milestone', { day: day(milestone.day), title: se(milestone.title), when: milestoneEnd ? t('slack.around', { date: date(milestoneEnd) }) : '' }) : '',
  ].filter(Boolean).join('  ·  ') }] });
  if (b.project.dashboard_url) section(t('slack.link', { url: b.project.dashboard_url }));
  return { text: t('slack.fallback', { name: se(name), goal: se(goal), target: date(c.target), coreEnd: date(c.finish.core) }), blocks };
}

export function milestoneMessage(b, c, t, dayNumber) {
  const m = b.milestones.find((x) => x.day === dayNumber);
  if (!m) throw new Error(`No milestone on day ${dayNumber}`);
  const { day } = helpers(c, t);
  return {
    text: t('slack.reachedFallback', { name: se(b.project.name), day: day(m.day), title: se(m.title) }),
    blocks: [
      { type: 'section', text: { type: 'mrkdwn', text: `${t('slack.reached', { day: day(m.day) })}\n${se(m.title)}${m.criterion ? `\n_${se(m.criterion)}_` : ''}` } },
      { type: 'context', elements: [{ type: 'mrkdwn', text: targetLine(c, t) }] },
    ],
  };
}
