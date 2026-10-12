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
  delete agreed.project.planning_step;
  if (steps[4].done && !validate(agreed).errors.length) {
    const c = compute(agreed, { today });
    const { date, focus } = helpers(c, t);
    const when = (d) => (d > c.target ? t('status.onLate', { date: date(d) }) : t('status.on', { date: date(d) }));
    if (!p.budget_days) out.push('');
    out.push(t('status.projection', { focus, core: when(c.finish.core), all: when(c.finish.all) }));
  }
  return out.join('\n');
}

// The scope's movement in words, for status, the digest and the dashboard: one line for the net change,
// and the detail of where it comes from.
const signed = (n, t) => `${n > 0.005 ? '+' : n < -0.005 ? '−' : ''}${t.num(Math.abs(n))}`;
export function growthView(g, t) {
  if (!g) return null;
  const since = t(g.basis === 'agreed' ? 'growth.sinceAgreed' : 'growth.sinceBaseline', { date: t.date(g.date, { day: 'numeric', month: 'long' }) });
  const moved = Math.abs(g.net) > 0.005 || (g.detailed && [g.requests, g.unrequested, g.reestimated, g.removed].some((x) => Math.abs(x) > 0.005));
  if (!moved) return { line: t('growth.unchanged', { since }), details: '', since, pct: t('growth.percent', { n: '0' }), level: null };
  const pct = t('growth.percent', { n: `${g.ratio > 0.005 ? '+' : g.ratio < -0.005 ? '−' : ''}${Math.round(Math.abs(g.ratio) * 100)}` });
  const parts = g.detailed ? [
    g.requests ? t('growth.requests', { n: g.requestIds.length, points: signed(g.requests, t), ids: t.list(g.requestIds) }) : '',
    g.unrequested ? t('growth.unrequested', { n: g.unrequested, points: signed(g.unrequested, t) }) : '',
    Math.abs(g.reestimated) > 0.005 ? t('growth.reestimated', { points: signed(g.reestimated, t) }) : '',
    g.removed ? t('growth.removed', { n: g.removed, points: signed(-g.removed, t) }) : '',
  ].filter(Boolean) : [];
  return {
    line: t('growth.line', { since, net: t('growth.points', { n: Math.abs(g.net), signed: signed(g.net, t) }), pct }),
    details: parts.length ? `${parts.join(', ')}.` : '',
    since, pct, level: g.level,
  };
}

// A date as the reports write it: the year only when it is not the current one.
const dateOf = (t, today) => (s) => t.date(String(s), { day: 'numeric', month: 'long', ...(String(s).slice(0, 4) !== today.slice(0, 4) && { year: 'numeric' }) });

export function helpers(c, t) {
  const date = dateOf(t, c.today);
  const day = (n) => t('day', { n });
  // The gap is counted in plan days: "2 d behind" means two plan days to catch up.
  const situation = (g) => (Math.abs(g) < 0.25 ? t('situation.onTime') : g > 0 ? t('situation.behind', { n: g }) : t('situation.ahead', { n: -g }));
  const goal = c.goal || t('goal');
  const focus = t.num(c.focus, 2);
  return { date, day, situation, goal, goalMid: midSentence(goal), focus };
}

// The goal after a colon, as French typography wants it: "Kerlan : mise en ligne le…". A word that
// is not a plain capitalised one (MVP, V1) keeps its case.
export const midSentence = (s) => (/^\p{Lu}\p{Ll}/u.test(s) ? s[0].toLocaleLowerCase() + s.slice(1) : s);

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
  // Until the real pace is judged, the projection rests on the estimate's hypotheses alone.
  if (b.estimation?.basis === 'hypotheses' && !c.pace?.judged) out.push(t('status.hypotheses'));
  const k = c.counters;
  out.push(t('status.tasks', { done: k.tasks.done, total: k.tasks.total })
    + (k.screens.total ? t('status.screens', { done: k.screens.done, total: k.screens.total, vdone: k.views.done, vtotal: k.views.total }) : ''));
  out.push(t('status.spent', { spent: t('units.days', { n: c.spent }), planDays: c.planDays, focus }));
  if (c.pace?.finish) {
    const n = Math.round(Math.abs(1 - c.pace.ratio) * 100);
    out.push(t(c.pace.ratio < 1 ? 'status.paceUnder' : 'status.paceOver', { pace: c.pace.value, estimate: c.pace.estimate, n, core: when(c.pace.finish.core) }));
  }
  const growth = growthView(c.growth, t);
  if (growth) out.push(`${growth.line}${growth.details ? ` ${growth.details}` : ''}`);
  if (c.overload) out.push(t('status.overload', { load: t.num(c.overload.load, 2), from: date(c.overload.from), to: date(c.overload.to) }));
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
      const asked = x.kind === 'request' ? '' : ` · ${x.asked ? t('status.askedFor', { date: date(x.asked_on), n: x.waiting }) : t('status.notAsked')}`;
      out.push(`  ${x.id}  ${t('status.before', { day: day(x.before) }).padEnd(12)}  ${due.padEnd(22)}  ${x.title} (${x.who})${asked}`);
    }
  }
  // Who to chase, and what was never sent although the work needs it soon.
  const byWho = (items) => [...new Set(items.map((x) => x.who))].map((who) => `  ${who}${t('colon')}${items.filter((x) => x.who === who).map((x) => x.id).join(', ')}`);
  if (c.chase.length) out.push('', t('status.chase'), ...byWho(c.chase));
  if (c.unasked.length) out.push('', t('status.neverAsked'), ...byWho(c.unasked));
  return out.join('\n');
}

// ---------------------------------------------------------------- All projects

// One line for each registered project, then the share of the working day promised to all of them,
// week by week: over one day, at least one projection will not hold.
export function projectsText(projects, ranges, t, today) {
  if (!projects.length) return t('projects.none');
  const date = dateOf(t, today);
  const out = [];
  for (const x of projects) {
    if (x.missing) { out.push(t('projects.missing', { dir: x.dir })); continue; }
    if (x.error) { out.push(`${x.name ?? x.dir}${t('colon')}${x.error}`, `  ${x.dir}`); continue; }
    const parts = [t(x.done ? 'projects.done' : `projects.${x.phase}`), t('projects.target', { date: date(x.target) }), t('projects.focus', { n: t.num(x.focus, 2) })];
    if (x.phase === 'agreed' && !x.done) {
      parts.push(t(x.marginCore < 0 ? 'projects.coreLate' : 'projects.core', { date: date(x.finishCore), n: Math.abs(x.marginCore) }));
      if (x.chase) parts.push(t('projects.chase', { n: x.chase }));
      if (x.unasked) parts.push(t('projects.unasked', { n: x.unasked }));
      if (x.growthLevel) parts.push(t('projects.growth'));
    }
    out.push(`${x.name}${x.client ? ` (${x.client})` : ''} · ${parts.join(' · ')}`, `  ${x.dir}`);
  }
  const busy = ranges.filter((r) => r.load > 0);
  if (busy.length) {
    out.push('', t('projects.load'));
    for (const r of busy) out.push(`${r.over ? '! ' : '  '}${t('projects.range', { from: date(r.from), to: date(r.to), load: t.num(r.load, 2), projects: t.list(r.projects) })}`);
    out.push('', t(busy.some((r) => r.over) ? 'projects.over' : 'projects.fine'));
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
  const { date, day, goalMid } = helpers(c, t);
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
  // The scope's movement, on the days the plan changed only: the same figure every day is noise.
  const growth = growthView(c.growth, t);
  if (growth && b.log.some((e) => e.type === 'replan' && String(e.date) === String(on))) section(se(`${growth.line}${growth.details ? ` ${growth.details}` : ''}`));
  if (now.length) {
    const byWho = [...new Set(now.map((x) => x.who))].map((who) => `• ${se(who)}${t('colon')}${now.filter((x) => x.who === who).map((x) => x.id).join(', ')}`);
    section(`${t('slack.now', { n: now.length, day: day(c.currentDay) })}\n${byWho.join('\n')}`);
  }
  const perWho = (items) => [...new Set(items.map((x) => x.who))].map((who) => `• ${se(who)}${t('colon')}${items.filter((x) => x.who === who).map((x) => x.id).join(', ')}`).join('\n');
  if (c.chase.length) section(`${t('slack.chase', { n: c.chase.length })}\n${perWho(c.chase)}`);
  if (c.unasked.length) section(`${t('slack.neverAsked', { n: c.unasked.length })}\n${perWho(c.unasked)}`);
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
  return { text: t('slack.fallback', { name: se(name), goalMid: se(goalMid), target: date(c.target), coreEnd: date(c.finish.core) }), blocks };
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
