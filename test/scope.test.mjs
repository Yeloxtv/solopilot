import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/backlog.mjs';
import { compute } from '../src/compute.mjs';
import { loadLocale } from '../src/i18n.mjs';
import { scopeData, scopeHtml, scopeMarkdown } from '../src/scope.mjs';
import { fixture } from './fixture.mjs';

// The fixture with four features: two in the core and the plan, one below the line, one excluded.
function withFeatures(project = {}) {
  const b = fixture({ project });
  b.areas.push({ id: 'admin', title: 'Administration' });
  b.features = [
    { id: 'F01', area: 'core', title: 'Sign-in', source: 'Spec, §2.1', core: true },
    { id: 'F02', area: 'core', title: 'Exports', source: 'Spec, §4' },
    { id: 'F03', area: 'admin', title: 'Statistics', source: 'Workshop 1' },
    { id: 'F04', area: 'admin', title: 'Accounting', source: 'Spec, §6', scope: 'out', note: 'Excluded in the spec' },
  ];
  b.days.push({ day: 'later', points: 2, title: 'If time allows' });
  Object.assign(b.tasks[0], { feature: 'F01' });
  Object.assign(b.tasks[1], { feature: 'F01' });
  Object.assign(b.tasks[2], { feature: 'F02' });
  Object.assign(b.tasks[3], { feature: 'F02' });
  b.tasks.push({ id: 'T005', feature: 'F03', day: 'later', area: 'admin', status: 'todo', title: 'Charts' });
  b.dependencies.push({ id: 'D02', before: 3, status: 'waiting', who: 'Acme', title: 'Logo files' });
  return b;
}

const render = (b, lang = 'en', today = '2026-01-07') => {
  const { t } = loadLocale(lang);
  const s = scopeData(b, compute(b, { today }));
  return { s, md: scopeMarkdown(s, t), html: scopeHtml(s, t, lang) };
};

test('each feature lands in its place: guaranteed, planned, not planned, out of scope', () => {
  const b = withFeatures();
  assert.deepEqual(validate(b).errors, []);
  const { s } = render(b);
  const titles = (k) => s.groups[k].map((f) => f.title);
  assert.deepEqual([titles('core'), titles('planned'), titles('later'), titles('out')], [['Sign-in'], ['Exports'], ['Statistics'], ['Accounting']]);
});

test('the document carries what the client needs, sources and dates included', () => {
  const { md } = render(withFeatures());
  assert.match(md, /^# Test: project scope$/m);
  assert.match(md, /## Guaranteed for January 16, 2026\n\n\*The core of the product[^\n]*\n\n### Core\n\n- Sign-in \(source: Spec, §2\.1\)/);
  assert.match(md, /## Out of scope[\s\S]*- Accounting \(Excluded in the spec\)/);
  assert.match(md, /## What we need from you\n\n- \*\*Acme\*\*: Logo files \(needed around January \d+, 2026\)/);
  assert.match(md, /## Questions to settle\n\n- \*\*Acme\*\*: Who signs off\?/);
  assert.match(md, /## Pending requests[\s\S]*- Dark mode/);
  assert.match(md, /## Agreement\n\nApproved: name, date and signature\./);
});

test('nothing internal reaches the client: no lead, delay, margin, points or projected date', () => {
  const b = withFeatures();
  b.questions[0].priority = 1;
  const c = compute(b, { today: '2026-01-14' });
  assert.ok(c.gap.all > 0, 'the plan is behind, so there is a delay to hide');
  for (const lang of ['en', 'fr']) {
    const { md, html } = render(b, lang, '2026-01-14');
    for (const doc of [md, html.replace(/<style>[\s\S]*?<\/style>/, '')]) {
      assert.doesNotMatch(doc, /margin|marge|behind|retard|ahead|avance|delay|points?\b|recommend/i);
    }
  }
});

test('user text is escaped in the page', () => {
  const b = withFeatures();
  b.features[0].title = '<script>alert(1)</script>';
  assert.doesNotMatch(render(b).html, /<script>alert/);
});

test('an approval shows in the document, in the language of the plan', () => {
  const b = withFeatures({ locale: 'fr', scope_agreed: { by: 'Mme Le Goff', date: '2026-01-08' } });
  assert.deepEqual(validate(b).errors, []);
  const { md } = render(b, 'fr');
  assert.match(md, /## Accord\n\nValidé par Mme Le Goff le 8 janvier 2026\./);
  assert.match(md, /## Garanti pour le 16 janvier 2026/);
  assert.match(validate(withFeatures({ scope_agreed: { by: '' } })).errors.join('\n'), /project\.scope_agreed/);
});

test('French writes the first of the month as an ordinal', () => {
  const { t } = loadLocale('fr');
  assert.equal(t.date('2026-12-01', { day: 'numeric', month: 'long' }), '1er décembre');
  assert.equal(t.date('2026-12-11', { day: 'numeric', month: 'long' }), '11 décembre');
  assert.equal(loadLocale('en').t.date('2026-12-01', { day: 'numeric', month: 'long' }), 'December 1');
});
