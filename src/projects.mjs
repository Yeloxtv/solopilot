// All of a developer's projects together: a personal registry of pilot directories, a line for each
// project, and the share of each working day promised to all of them, week by week. Each plan assumes
// its own share (project.focus); when they add up to more than a day, at least one projection is wrong.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { isPlanning, readBacklog, validate } from './backlog.mjs';
import { localToday } from './calendar.mjs';
import { compute } from './compute.mjs';
import { reference, scopeGrowth } from './growth.mjs';
import { canonical } from './repo.mjs';

const EPS = 1e-9;

// The registry holds paths only, never the plans, and stays on this machine.
export const registryFile = () => join(process.env.SOLOPILOT_HOME || join(homedir(), '.solopilot'), 'projects.json');


export function registered() {
  try {
    const list = JSON.parse(readFileSync(registryFile(), 'utf8'));
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function save(list) {
  const file = registryFile();
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify([...new Set(list)].sort(), null, 2) + '\n');
}

export const register = (dir) => save([...registered(), canonical(dir)]);
export function forget(dir) {
  const target = canonical(dir).toLowerCase();
  const list = registered();
  const kept = list.filter((x) => x.toLowerCase() !== target && resolve(x).toLowerCase() !== resolve(dir).toLowerCase());
  save(kept);
  return list.length - kept.length;
}
export const isRegistered = (dir) => registered().some((x) => x.toLowerCase() === canonical(dir).toLowerCase());

// One project as the portfolio sees it: when it works, how much of the day it takes, how it stands.
export function projectInfo(dir, { today } = {}) {
  if (!existsSync(join(dir, 'solopilot.yaml'))) return { dir, missing: true };
  let b;
  try { b = readBacklog(dir); } catch (e) { return { dir, error: e.message }; }
  const p = b.project;
  const base = { dir, name: p.name, client: p.client, start: String(p.start), target: String(p.target), focus: p.focus, locale: p.locale };
  if (validate(b).errors.length) return { ...base, error: 'invalid plan: run `solopilot check` there' };
  if (isPlanning(b)) return { ...base, phase: 'planning', end: String(p.target), done: false };
  const c = compute(b, { today });
  const growth = scopeGrowth(reference(dir, b), b);
  return {
    ...base,
    phase: 'agreed',
    finishCore: c.finish.core,
    marginCore: c.margin.core,
    end: c.finish.all,
    done: c.pointsTotal > EPS && c.pointsDone >= c.pointsTotal - EPS,
    chase: c.chase.length,
    unasked: c.unasked.length,
    growthLevel: growth?.level ?? null,
  };
}

const mondayOf = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
};
const plusDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// The share of a working day promised each week, from this week to the end of the last project. A
// project counts from its start to its projected end (its target while it is being planned); one fully
// delivered no longer counts.
export function weeklyLoad(projects, today) {
  const active = projects.filter((x) => !x.missing && !x.error && !x.done && x.end >= today);
  if (!active.length) return [];
  const last = active.reduce((m, x) => (x.end > m ? x.end : m), today);
  const weeks = [];
  for (let week = mondayOf(today); week <= last; week = plusDays(week, 7)) {
    const friday = plusDays(week, 4);
    const on = active.filter((x) => x.start <= friday && x.end >= week);
    weeks.push({ week, load: Math.round(on.reduce((s, x) => s + x.focus, 0) * 100) / 100, projects: on.map((x) => x.name) });
  }
  return weeks;
}

// Consecutive weeks of the same load as ranges, from a Monday to a Friday.
export function loadRanges(weeks) {
  const ranges = [];
  for (const w of weeks) {
    const prev = ranges.at(-1);
    if (prev && Math.abs(prev.load - w.load) < EPS && prev.projects.join() === w.projects.join()) prev.to = plusDays(w.week, 4);
    else ranges.push({ from: w.week, to: plusDays(w.week, 4), load: w.load, projects: w.projects });
  }
  return ranges.map((r) => ({ ...r, over: r.load > 1 + EPS }));
}

// The portfolio of the registered pilot directories.
export function portfolio({ today = localToday() } = {}) {
  const projects = registered().map((dir) => projectInfo(dir, { today }));
  const weeks = weeklyLoad(projects, today);
  return { projects, ranges: loadRanges(weeks) };
}

// The overloaded ranges that fall while a given project runs, for its status.
export const overloadsDuring = (ranges, from, to) => ranges.filter((r) => r.over && r.to >= from && r.from <= to);

// The first overloaded range while a registered project runs (from today, or its start, to its projected
// end), or null. A directory that is not registered stays out of it: its status speaks for itself.
export function overloadFor(dir, { today, start, end }) {
  if (!isRegistered(dir)) return null;
  const from = today > start ? today : start;
  return overloadsDuring(portfolio({ today }).ranges, from, end)[0] ?? null;
}
