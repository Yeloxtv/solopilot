// How far the scope has moved since it was agreed: the client's approval when there is one, the plan
// agreed internally otherwise. Both are tagged in the pilot directory, so the plan as it stood then is
// compared with today's, task by task.
import YAML from 'yaml';
import { FILE, LATER, normalize } from './backlog.mjs';
import { git } from './repo.mjs';

const EPS = 1e-9;

// The weight of each task in the plan (below the line and deferred tasks excluded): its own points,
// or an equal share of its day's points when the plan estimates days rather than tasks.
function weights(b) {
  const days = new Map(b.days.map((d) => [String(d.day), d]));
  const active = (t) => t.status !== 'deferred' && t.day !== LATER && t.day !== undefined;
  const perDay = new Map();
  for (const t of b.tasks.filter(active)) perDay.set(String(t.day), (perDay.get(String(t.day)) ?? 0) + 1);
  const w = new Map();
  for (const t of b.tasks.filter(active)) {
    const points = typeof t.points === 'number' ? t.points : (days.get(String(t.day))?.points ?? 0) / perDay.get(String(t.day));
    w.set(t.id, points);
  }
  return w;
}
const sum = (m) => [...m.values()].reduce((s, x) => s + x, 0);
const round = (n) => Math.round(n * 100) / 100;

// The reference the scope is measured against, and the plan as it stood then, read from its git tag.
export function reference(dir, b) {
  const p = b.project;
  const agreed = p.scope_agreed;
  const ref = agreed
    ? { basis: 'agreed', date: String(agreed.date), by: agreed.by, tag: `scope-agreed-${agreed.date}` }
    : p.baseline ? { basis: 'baseline', date: String(p.baseline.date), tag: 'baseline' } : null;
  if (!ref) return null;
  const text = git(['show', `${ref.tag}:${FILE}`], dir);
  let backlog = null;
  if (text) try { backlog = normalize(YAML.parse(text) || {}); } catch { backlog = null; }
  return { ...ref, backlog, points: backlog ? null : p.baseline?.points };
}

// The movement, in points: added by accepted requests, added without one (work found on the way),
// re-estimated, removed (deferred or below the line since). Without the plan as it stood, only the
// net change against the recorded total is known.
export function scopeGrowth(ref, b) {
  if (!ref) return null;
  const now = weights(b);
  const current = sum(now);
  const level = (ratio) => (ratio > 0.25 + EPS ? 'high' : ratio > 0.1 + EPS ? 'medium' : null);
  const base = { basis: ref.basis, date: ref.date, by: ref.by };
  if (!ref.backlog) {
    if (typeof ref.points !== 'number' || ref.points <= 0) return null;
    const net = current - ref.points;
    return { ...base, detailed: false, reference: round(ref.points), current: round(current), net: round(net), ratio: net / ref.points, level: level(net / ref.points) };
  }
  const then = weights(ref.backlog);
  const reference = sum(then);
  const requested = new Map();
  for (const r of b.requests.filter((x) => x.status === 'accepted')) for (const id of r.tasks ?? []) requested.set(id, r.id);
  const moves = { requests: 0, requestIds: new Set(), unrequested: 0, reestimated: 0, removed: 0 };
  for (const [id, points] of now) {
    if (!then.has(id)) {
      if (requested.has(id)) {
        moves.requests += points;
        moves.requestIds.add(requested.get(id));
      } else moves.unrequested += points;
    } else moves.reestimated += points - then.get(id);
  }
  for (const [id, points] of then) if (!now.has(id)) moves.removed += points;
  const net = current - reference;
  const ratio = reference > EPS ? net / reference : 0;
  return {
    ...base,
    detailed: true,
    reference: round(reference),
    current: round(current),
    net: round(net),
    ratio,
    level: level(ratio),
    requests: round(moves.requests),
    requestIds: [...moves.requestIds].sort(),
    unrequested: round(moves.unrequested),
    reestimated: round(moves.reestimated),
    removed: round(moves.removed),
  };
}
