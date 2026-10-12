// The scope document for the client: what the plan commits to, what follows, what is not planned or
// excluded, and what is expected from the client. It is built from a few chosen fields only: no lead,
// delay, margin or projected date can reach it, and the dates are the plan's, not the work's.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { LATER, REQUEST_ID, featureIds } from './backlog.mjs';
import { compute } from './compute.mjs';

// Each feature in one of four places: guaranteed (the core), planned next, not planned (below the
// line), out of scope.
export function scopeData(b, { today }) {
  const p = b.project;
  const area = new Map(b.areas.map((a) => [a.id, a.title]));
  const place = (f) => {
    if (f.scope === 'out') return 'out';
    const tasks = b.tasks.filter((t) => t.status !== 'deferred' && featureIds(t).includes(f.id));
    if (tasks.length && tasks.every((t) => t.day === LATER)) return 'later';
    return f.core ? 'core' : 'planned';
  };
  // A feature added by a request shows who asked for it, never the request's id.
  const requestedBy = (f) => (REQUEST_ID.test(f.source) ? b.requests.find((r) => r.id === f.source)?.who : undefined);
  const groups = { core: [], planned: [], later: [], out: [] };
  for (const f of b.features) {
    const who = requestedBy(f);
    groups[place(f)].push({ title: f.title, source: who ? undefined : f.source, requestedBy: who, area: area.get(f.area) ?? '', note: f.scope === 'out' ? f.note : undefined });
  }
  // When is it needed: the plan's date, computed as if no work had been done, so it moves only when
  // the plan itself changes. Where the work stands, ahead or behind, never reaches the client.
  const planned = compute({ ...b, tasks: b.tasks.map((t) => (t.status === 'done' ? { ...t, status: 'todo' } : t)) }, { today: String(p.start) });
  const due = new Map(planned.watch.map((x) => [x.id, x.date]));
  const soonest = (a, z) => (a.by ?? '9999').localeCompare(z.by ?? '9999');
  // The owner's own answers are not the client's business.
  const ours = (x) => x.who !== p.owner;
  return {
    name: p.name, client: p.client, goal: p.goal || null, target: String(p.target), today,
    agreed: p.scope_agreed,
    groups,
    dependencies: b.dependencies.filter((d) => d.status !== 'received' && ours(d)).map((d) => ({ who: d.who, title: d.title, by: due.get(d.id) ?? null })).sort(soonest),
    questions: b.questions.filter((q) => q.status !== 'answered' && ours(q)).map((q) => ({ who: q.who, title: q.title, stake: q.stake, by: due.get(q.id) ?? null })).sort(soonest),
    requests: b.requests.filter((r) => r.status === 'pending').map((r) => ({ title: r.title })),
  };
}

const byArea = (items) => {
  const areas = new Map();
  for (const x of items) {
    if (!areas.has(x.area)) areas.set(x.area, []);
    areas.get(x.area).push(x);
  }
  return [...areas];
};

// The document as sections of plain values, shared by both renderings.
function sections(s, t) {
  const date = (d) => t.date(String(d), { day: 'numeric', month: 'long', year: 'numeric' });
  const goal = s.goal || t('goal');
  const when = (by) => (by ? t('scope.by', { date: date(by) }) : t('scope.toSet'));
  const aside = (x) => x.note ?? (x.requestedBy ? t('scope.sourceRequest', { who: x.requestedBy }) : x.source ? t('scope.source', { source: x.source }) : '');
  const out = [{ title: t('scope.goal'), text: t('scope.goalLine', { goal, target: date(s.target) }) }];
  const features = (key, title) => {
    if (!s.groups[key].length) return;
    out.push({ title, sub: t(`scope.${key}Sub`), areas: byArea(s.groups[key]).map(([name, items]) => ({ name, items: items.map((x) => ({ text: x.title, aside: aside(x) })) })) });
  };
  features('core', t('scope.core', { target: date(s.target) }));
  features('planned', t('scope.planned'));
  features('later', t('scope.later'));
  features('out', t('scope.out'));
  if (s.dependencies.length) out.push({ title: t('scope.dependencies'), items: s.dependencies.map((d) => ({ who: d.who, text: d.title, aside: when(d.by) })) });
  if (s.questions.length) out.push({ title: t('scope.questions'), items: s.questions.map((q) => ({ who: q.who, text: q.title, aside: [q.stake, when(q.by)].filter(Boolean).join(' · ') })) });
  if (s.requests.length) out.push({ title: t('scope.requests'), sub: t('scope.requestsSub'), items: s.requests.map((r) => ({ text: r.title })) });
  out.push({ title: t('scope.agreement'), text: s.agreed ? t('scope.agreed', { by: s.agreed.by, date: date(s.agreed.date) }) : t('scope.agreementBlank'), signature: !s.agreed });
  return {
    heading: t('scope.title', { name: s.name }),
    subtitle: s.client ? t('scope.subtitle', { client: s.client, date: date(s.today) }) : t('scope.subtitleNoClient', { date: date(s.today) }),
    sections: out,
  };
}

export function scopeMarkdown(s, t) {
  const doc = sections(s, t);
  const line = (x) => `- ${x.who ? `**${x.who}**${t('colon')}` : ''}${x.text}${x.aside ? ` (${x.aside})` : ''}`;
  const md = [`# ${doc.heading}`, '', doc.subtitle, ''];
  for (const sec of doc.sections) {
    md.push(`## ${sec.title}`, '');
    if (sec.sub) md.push(`*${sec.sub}*`, '');
    if (sec.text) md.push(sec.text, '');
    for (const a of sec.areas ?? []) {
      if (a.name) md.push(`### ${a.name}`, '');
      md.push(...a.items.map(line), '');
    }
    if (sec.items) md.push(...sec.items.map(line), '');
    if (sec.signature) md.push('', '_________________________________', '');
  }
  return md.join('\n');
}

const esc = (v) => String(v ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

export function scopeHtml(s, t, lang) {
  const doc = sections(s, t);
  const item = (x) => `<li>${x.who ? `<strong>${esc(x.who)}</strong>${esc(t('colon'))}` : ''}${esc(x.text)}${x.aside ? ` <span class="aside">${esc(x.aside)}</span>` : ''}</li>`;
  const body = doc.sections.map((sec) => `<section>
<h2>${esc(sec.title)}</h2>
${sec.sub ? `<p class="sub">${esc(sec.sub)}</p>` : ''}${sec.text ? `<p>${esc(sec.text)}</p>` : ''}
${(sec.areas ?? []).map((a) => `${a.name ? `<h3>${esc(a.name)}</h3>` : ''}<ul>${a.items.map(item).join('')}</ul>`).join('\n')}${sec.items ? `<ul>${sec.items.map(item).join('')}</ul>` : ''}${sec.signature ? '<div class="signature"></div>' : ''}
</section>`).join('\n');
  return `<!doctype html>
<html lang="${esc(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(doc.heading)}</title>
<style>
/* A document to read and print: light on purpose, whatever the reader's theme. */
:root { --text: #1d2327; --muted: #5d6b73; --line: #d9e0e4; --accent: #2f5d8a; color-scheme: light; }
* { box-sizing: border-box; }
body { margin: 0; background: #fff; color: var(--text); font: 15px/1.55 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 48px 24px 64px; }
h1 { font-size: 26px; margin: 0 0 4px; }
.subtitle { color: var(--muted); margin: 0 0 32px; }
section { border-top: 1px solid var(--line); padding-top: 18px; margin-top: 22px; break-inside: avoid-page; }
h2 { font-size: 18px; margin: 0 0 6px; color: var(--accent); }
h3 { font-size: 15px; margin: 14px 0 4px; }
.sub { color: var(--muted); margin: 0 0 8px; font-style: italic; }
ul { margin: 4px 0 0; padding-left: 20px; }
li { margin: 3px 0; }
.aside { color: var(--muted); font-size: 13px; }
.signature { height: 72px; border-bottom: 1px solid var(--text); width: 60%; margin-top: 24px; }
@media (max-width: 520px) { main { padding: 28px 16px 40px; } h1 { font-size: 22px; } }
@page { margin: 18mm 16mm; }
@media print { main { padding: 0; } a { color: inherit; } }
</style>
</head>
<body>
<main>
<h1>${esc(doc.heading)}</h1>
<p class="subtitle">${esc(doc.subtitle)}</p>
${body}
</main>
</body>
</html>
`;
}

export function writeScope(dir, s, t, lang) {
  const out = join(dir, 'build');
  mkdirSync(out, { recursive: true });
  const html = join(out, 'scope.html');
  const md = join(out, 'scope.md');
  writeFileSync(html, scopeHtml(s, t, lang));
  writeFileSync(md, scopeMarkdown(s, t));
  return { html, md };
}
