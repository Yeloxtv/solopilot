// Reads and validates solopilot.yaml. The Claude Code skill (or you, by hand) edits it; every command
// reads it. Only `layout` and `baseline` write it, through src/edit.mjs, which changes the values
// they own and nothing else.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import YAML from 'yaml';
import { ISO } from './calendar.mjs';
import { availableLocales, isLocale } from './i18n.mjs';

export const FILE = 'solopilot.yaml';
export const LATER = 'later';
export const PLANNING = 'planning';
export const TASK_STATUSES = ['todo', 'doing', 'done', 'blocked', 'deferred'];
// What a task is, for learning what each kind of work costs. A screen (S…) is of kind "screen".
export const TASK_KINDS = ['setup', 'logic', 'integration', 'content', 'release'];
export const TASK_ID = /^[TS]\d{2,4}$/;
export const FEATURE_ID = /^F\d{2,4}$/;
// Task ids inside the square brackets of a commit subject: "[T024] …" or "[T025 S05] …".
export const TAG_IDS = /[TS]\d{2,4}/g;

const LISTS = ['people', 'sprints', 'milestones', 'meetings', 'dependencies', 'questions', 'requests', 'areas', 'features', 'days', 'tasks', 'log'];
const EPS = 1e-9;

// Pilot directory: --dir, then SOLOPILOT_DIR, then the first parent of cwd holding solopilot.yaml.
export function findPilotDir(explicit) {
  const given = explicit || process.env.SOLOPILOT_DIR;
  if (given) return resolve(given);
  for (let d = process.cwd(); ; d = dirname(d)) {
    if (existsSync(join(d, FILE))) return d;
    if (dirname(d) === d) return null;
  }
}

export function readBacklog(dir) {
  const raw = YAML.parse(readFileSync(join(dir, FILE), 'utf8')) || {};
  return normalize(raw);
}

// Optional sections default to empty lists, so a starter file can stay short.
export function normalize(raw) {
  const b = { ...raw, project: { ...(raw.project || {}) } };
  for (const k of LISTS) b[k] = raw[k] || [];
  const p = b.project;
  p.locale ??= 'en';
  p.working_days ??= [1, 2, 3, 4, 5];
  p.holidays ??= [];
  p.wip_limit ??= 4;
  // A pending request is answered by whoever you name, the client by default.
  b.requests = b.requests.map((r) => ({ ...r, who: r.who ?? p.client ?? p.owner ?? '?' }));
  // Views may be listed by name; everything downstream counts them.
  b.tasks = b.tasks.map((t) => (Array.isArray(t?.views) ? { ...t, views: t.views.length, view_names: t.views } : t));
  return b;
}

export const isPlanning = (b) => b.project.phase === PLANNING;
export const featureIds = (t) => [].concat(t.feature ?? []);
const hasPoints = (t) => typeof t.points === 'number';

// A day weighs the points of its tasks when every active one carries points, its own points otherwise.
export function dayLoad(d, tasks) {
  const active = tasks.filter((t) => t.status !== 'deferred');
  const pointed = active.length > 0 && active.every(hasPoints);
  const points = pointed ? active.reduce((s, t) => s + t.points, 0) : d.points;
  const done = active.filter((t) => t.status === 'done');
  const fraction = !active.length ? 0 : pointed ? (points > EPS ? done.reduce((s, t) => s + t.points, 0) / points : 0) : done.length / active.length;
  return { active, pointed, points, fraction };
}

const isIso = (v) => ISO.test(String(v));
const isInt = (v) => Number.isInteger(v);

export function validate(b) {
  const errors = [];
  const warnings = [];
  const err = (m) => errors.push(m);
  const p = b.project;
  // While the plan is being drawn up, tasks may wait for their day and the days for the layout.
  const planning = isPlanning(b);
  const maxDay = isInt(p.plan_days) ? p.plan_days : planning ? Infinity : 0;

  if (p.phase !== undefined && !planning) err(`project.phase: "${PLANNING}" while the plan is being drawn up, absent once it is agreed`);
  if (!p.name) err('project.name: the project name');
  if (!isIso(p.start)) err('project.start: date of day 1, as YYYY-MM-DD');
  if (!isIso(p.target)) err('project.target: target date, as YYYY-MM-DD');
  if (isIso(p.start) && isIso(p.target) && String(p.target) <= String(p.start)) err('project.target: must come after project.start');
  if (!(planning && p.plan_days === undefined) && !(isInt(p.plan_days) && p.plan_days >= 1)) err('project.plan_days: number of work days in the plan');
  if (!(planning && p.core === undefined) && !(isInt(p.core) && p.core >= 1 && p.core <= maxDay)) err('project.core: last day of the core, between 1 and plan_days');
  if (!(p.points_per_day > 0)) err('project.points_per_day: points a full work day is worth, at the plan estimate');
  if (!(p.focus > 0 && p.focus <= 1)) err('project.focus: share of each working day spent on the project, between 0 and 1');
  if (p.budget_days !== undefined && !(isInt(p.budget_days) && p.budget_days >= 1)) err('project.budget_days: the work days sold, a whole number');
  for (const h of p.holidays) if (!isIso(h)) err(`project.holidays: ${h} is not YYYY-MM-DD`);
  if (!(Array.isArray(p.working_days) && p.working_days.length && p.working_days.every((d) => isInt(d) && d >= 1 && d <= 7))) {
    err('project.working_days: ISO weekdays worked, 1 (Monday) to 7 (Sunday)');
  }
  if (!(isInt(p.wip_limit) && p.wip_limit >= 1)) err('project.wip_limit: tasks in progress before a warning');
  if (!isLocale(p.locale)) err(`project.locale: ${availableLocales().join(' or ')}, or a tag such as en-GB`);
  if (p.last_commit !== undefined && !/^[0-9a-f]{7,40}$/.test(String(p.last_commit))) err('project.last_commit: a commit hash, as written by `solopilot head`');
  if (p.dashboard_url !== undefined && !/^https:\/\/[^\s|<>]+$/.test(String(p.dashboard_url))) err('project.dashboard_url: an https URL');
  if (p.baseline !== undefined) {
    const s = p.baseline;
    if (!(s && isIso(s.date) && typeof s.points === 'number' && s.points >= 0 && isInt(s.plan_days) && s.plan_days >= 1)) {
      err('project.baseline: { date, points, plan_days }, as written by `solopilot baseline`');
    }
  }

  const sprints = new Set(b.sprints.map((s) => s.id));
  for (const s of b.sprints) {
    if (!(isInt(s.from) && isInt(s.to) && s.from <= s.to)) err(`sprint ${s.id}: from and to, two plan days`);
  }

  const areas = new Set(b.areas.map((a) => a.id));
  const features = new Set();
  for (const f of b.features) {
    if (!FEATURE_ID.test(f.id)) err(`${f.id}: invalid id (F01 for a feature)`);
    if (features.has(f.id)) err(`${f.id}: duplicate id`);
    features.add(f.id);
    if (!f.title) err(`${f.id}: title missing`);
    if (!f.source) err(`${f.id}: source, where it comes from in the project documents`);
    if (areas.size && !areas.has(f.area)) err(`${f.id}: area "${f.area}" not found in areas`);
    if (f.scope !== undefined && !['in', 'out'].includes(f.scope)) err(`${f.id}: scope is in or out`);
    if (f.core !== undefined && typeof f.core !== 'boolean') err(`${f.id}: core is true or false`);
    if (f.priority !== undefined && !(isInt(f.priority) && f.priority >= 1)) err(`${f.id}: priority is a whole number, 1 or more`);
  }
  const checkFeatures = (owner, list) => {
    for (const id of [].concat(list ?? [])) if (!features.has(id)) err(`${owner}: feature ${id} not found`);
  };

  const days = new Set();
  for (const d of b.days) {
    const k = String(d.day);
    if (days.has(k)) err(`day ${k}: listed twice`);
    days.add(k);
    if (d.day !== LATER && !(isInt(d.day) && d.day >= 1 && d.day <= maxDay)) err(`day ${k}: a number from 1 to plan_days, or "${LATER}"`);
    if (d.load !== undefined && !['normal', 'tight'].includes(d.load)) err(`day ${k}: load is normal or tight`);
    if (d.sprint !== undefined && !sprints.has(d.sprint)) err(`day ${k}: sprint ${d.sprint} not found in sprints`);
    const load = dayLoad(d, b.tasks.filter((t) => String(t.day) === k));
    if (!load.pointed && !(typeof d.points === 'number' && d.points >= 0)) err(`day ${k}: points, the load of the day (or points on each of its tasks)`);
    if (load.pointed && d.points !== undefined && Math.abs(d.points - load.points) > EPS) {
      warnings.push(`day ${k}: points ${d.points} ignored, its tasks add up to ${Math.round(load.points * 100) / 100}`);
    }
    if (!load.pointed && load.active.some(hasPoints)) warnings.push(`day ${k}: some tasks carry points and others not, so the day counts its own points`);
  }
  if (isInt(p.plan_days) && (!planning || b.days.length)) {
    for (let j = 1; j <= p.plan_days; j++) if (!days.has(String(j))) err(`day ${j}: missing from days (the plan runs from 1 to plan_days)`);
  }

  const ids = new Set();
  for (const t of b.tasks) {
    const screen = String(t.id).startsWith('S');
    if (!TASK_ID.test(t.id)) err(`${t.id}: invalid id (T001 for a task, S01 for a screen)`);
    if (ids.has(t.id)) err(`${t.id}: duplicate id`);
    ids.add(t.id);
    if (!t.title) err(`${t.id}: title missing`);
    if (!TASK_STATUSES.includes(t.status)) err(`${t.id}: unknown status "${t.status}" (${TASK_STATUSES.join(', ')})`);
    if (t.day === undefined) { if (!planning) err(`${t.id}: day missing`); }
    else if (!days.has(String(t.day)) && !(planning && t.day === LATER)) err(`${t.id}: day ${t.day} not found in days`);
    if (areas.size && !areas.has(t.area)) err(`${t.id}: area "${t.area}" not found in areas`);
    if (t.status === 'done' && !isIso(t.done_on)) err(`${t.id}: done without done_on`);
    if (t.status === 'blocked' && !t.note) err(`${t.id}: blocked without a note saying what it waits for`);
    if (t.status === 'deferred' && !t.note) err(`${t.id}: deferred without a note saying where it goes`);
    if (screen && t.views === undefined) err(`${t.id}: screen without its number of views`);
    const names = Array.isArray(t.views) ? t.views : t.view_names;
    if (names !== undefined && !(names.length && names.every((v) => typeof v === 'string' && v.trim()))) err(`${t.id}: views, a list naming at least one view`);
    else if (t.views !== undefined && !Array.isArray(t.views) && !(isInt(t.views) && t.views >= 1)) err(`${t.id}: views is a whole number, 1 or more, or a list of view names`);
    if (t.points !== undefined && !(typeof t.points === 'number' && t.points > 0)) err(`${t.id}: points, its estimated load, a positive number`);
    if (t.kind !== undefined && !(screen ? t.kind === 'screen' : TASK_KINDS.includes(t.kind))) err(`${t.id}: kind is ${screen ? 'screen for a screen' : TASK_KINDS.join(', ')}`);
    checkFeatures(t.id, t.feature);
    if (featureIds(t).length && featureIds(t).every((id) => b.features.find((f) => f.id === id)?.scope === 'out')) warnings.push(`${t.id}: its feature is out of scope`);
  }
  const doing = b.tasks.filter((t) => t.status === 'doing').length;
  if (doing > p.wip_limit) warnings.push(`${doing} tasks in progress at once (wip_limit: ${p.wip_limit})`);

  const refs = new Set();
  const checkRef = (x, prefix) => {
    if (!new RegExp(`^${prefix}\\d{2,4}$`).test(x.id)) err(`${x.id}: invalid id (${prefix}01)`);
    if (refs.has(x.id)) err(`${x.id}: duplicate id`);
    refs.add(x.id);
    if (!x.title) err(`${x.id}: title missing`);
    if (x.before !== undefined && !(isInt(x.before) && x.before >= 1 && x.before <= maxDay)) err(`${x.id}: before is a plan day`);
    if (x.priority !== undefined && !(isInt(x.priority) && x.priority >= 1)) err(`${x.id}: priority is a whole number, 1 or more`);
    for (const id of x.tasks || []) if (!ids.has(id)) err(`${x.id}: task ${id} not found`);
    checkFeatures(x.id, x.features);
  };
  for (const d of b.dependencies) {
    checkRef(d, 'D');
    if (!['waiting', 'received'].includes(d.status)) err(`${d.id}: status is waiting or received`);
    if (!d.who) err(`${d.id}: who, the person or party it comes from`);
  }
  for (const q of b.questions) {
    checkRef(q, 'Q');
    if (!['open', 'answered'].includes(q.status)) err(`${q.id}: status is open or answered`);
    if (q.status === 'answered' && !q.answer) err(`${q.id}: answered without the answer`);
    if (!q.who) err(`${q.id}: who, the person or party who answers`);
  }
  for (const r of b.requests) {
    checkRef(r, 'R');
    if (!['pending', 'accepted', 'declined', 'deferred'].includes(r.status)) err(`${r.id}: status is pending, accepted, declined or deferred`);
    if (r.status === 'accepted' && !(r.tasks || []).length) warnings.push(`${r.id}: accepted but no task created`);
  }
  for (const m of b.milestones) {
    if (!(isInt(m.day) && m.day >= 1 && m.day <= maxDay)) err(`milestone "${m.title}": day is a plan day`);
    if (!['client', 'checkpoint'].includes(m.type)) err(`milestone D${m.day}: type is client or checkpoint`);
    if (!['upcoming', 'reached'].includes(m.status)) err(`milestone D${m.day}: status is upcoming or reached`);
    if (m.status === 'reached' && !isIso(m.reached_on)) err(`milestone D${m.day}: reached without reached_on`);
  }
  for (const m of b.meetings) {
    if (!isIso(m.date) || !m.title || !m.with) err(`meeting ${m.date}: date as YYYY-MM-DD, title and with`);
  }
  if (b.estimation !== undefined) {
    const e = b.estimation || {};
    if (e.basis !== undefined && !['hypotheses', 'history'].includes(e.basis)) err('estimation.basis: hypotheses or history');
    for (const g of e.grid || []) {
      if (!(['screen', ...TASK_KINDS].includes(g.kind) && g.size && typeof g.points === 'number' && g.points > 0)) {
        err(`estimation.grid "${g.size}": kind (screen, ${TASK_KINDS.join(', ')}), size and points`);
      }
    }
  }
  for (const e of b.log) {
    if (!isIso(e.date)) err(`log entry "${e.title}": date as YYYY-MM-DD`);
    if (!['session', 'replan', 'baseline'].includes(e.type)) err(`log ${e.date}: type is session, replan or baseline`);
    if (e.type === 'replan' && !e.note) err(`log ${e.date}: replan without its reason`);
    if (e.effort !== undefined && !(e.effort > 0 && e.effort <= 1)) err(`log ${e.date}: effort, the share of the day spent on the project, between 0 and 1`);
  }
  return { errors, warnings };
}
