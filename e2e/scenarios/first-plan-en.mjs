// The first plan of Fieldbook, drawn up from the documents `solopilot init --example` copies: a spec
// with deliberate gaps and explicit exclusions, kickoff workshop notes, a 20-day quote and two mockups
// showing default states only. The developer approves every proposal, step after step, until the plan
// is agreed. The plan should look like the demo's, drawn from the same documents.
//
// This file holds the scenario in English, and `fieldbookFirstPlan` for its other languages: each
// passes the words its checks look for (first-plan-fr.mjs).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBacklog, validate } from '../../src/backlog.mjs';
import { buildFieldbookDocs, git } from '../fixtures.mjs';

const text = (x) => `${x.title ?? ''} ${x.note ?? ''} ${x.answer ?? ''} ${x.stake ?? ''}`.toLowerCase();

export function fieldbookFirstPlan(L) {
  return {
    name: L.name,
    title: L.title,
    build: L.build,

    before(fx, ctx) {
      ctx.initialPlan = readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8');
    },

    progress: (fx) => `${readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8')}\n${git(fx.pilot, ['rev-parse', 'HEAD'])}`,

    turns: [
      {
        prompt: '/solopilot',
        checks: (fx, run, ctx) => [
          ['nothing written before approval', readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8') === ctx.initialPlan],
          ['reads the documents in sources/', run.tools.some((x) => /sources/.test(x.what))],
          [`answers in ${L.language}`, L.answers(run.texts.join(' '))],
        ],
      },
      {
        prompt: L.prompt,
        repeat: { max: 9, until: (fx) => Boolean(readBacklog(fx.pilot).project.baseline) },
        checks(fx) {
          const b = readBacklog(fx.pilot);
          const answers = [...b.questions, ...b.dependencies];
          const covered = (re) => answers.some((x) => re.test(text(x)));
          const inScope = b.features.filter((f) => f.scope !== 'out');
          const out = b.features.filter((f) => f.scope === 'out');
          const screens = b.tasks.filter((t) => String(t.id).startsWith('S'));
          const names = (t) => (t.view_names ?? []).join(' ').toLowerCase();
          const answered = b.questions.filter((q) => q.status === 'answered');
          const steps = git(fx.pilot, ['log', '--format=%s']).split('\n').filter((s) => L.steps.test(s));
          return [
            ['the plan is agreed', Boolean(b.project.baseline) && b.project.phase === undefined, JSON.stringify(b.project.baseline ?? null)],
            ['the plan is valid', validate(b).errors.length === 0, validate(b).errors.slice(0, 5).join('; ')],
            ['dates and days sold taken from the quote', String(b.project.start) === '2026-09-28' && String(b.project.target) === '2026-11-27' && b.project.budget_days === 20, `${b.project.start} → ${b.project.target}, ${b.project.budget_days} days sold`],
            [`written in ${L.language}`, b.project.locale === L.locale && !L.foreign.test(b.features.map((f) => f.title).join(' '))],
            ['every feature points to a document of sources/', b.features.length > 0 && b.features.every((f) => L.sources.test(String(f.source))), `${b.features.length} features`],
            ['about as many features as the demo (15 in scope)', inScope.length >= 8 && inScope.length <= 30, `${inScope.length} in scope`],
            ['working offline is in the core', inScope.some((f) => f.core && L.offline.test(text(f))), inScope.filter((f) => f.core).map((f) => f.title).join(' | ')],
            ...Object.entries(L.gaps).map(([label, re]) => [`gap turned into a question or dependency: ${label}`, covered(re)]),
            ...Object.entries(L.exclusions).map(([label, re]) => [`exclusion kept out of scope: ${label}`, out.some((f) => re.test(text(f)))]),
            ['kickoff decisions recorded as answered questions', L.decisions.filter((re) => answered.some((q) => re.test(text(q)))).length >= 2, `${answered.length} answered`],
            ['screens list empty, offline or error views', screens.length > 0 && screens.filter((t) => L.views.test(names(t))).length >= screens.length / 2, `${screens.length} screens`],
            ['drawn screens linked to their mockup', b.tasks.some((t) => L.mockups.test(String(t.design ?? '')))],
            ['days laid out, the core inside the plan, about as long as the demo (20 days)', b.project.plan_days >= 10 && b.project.plan_days <= 30 && b.project.core <= b.project.plan_days, `${b.project.plan_days} days, core up to ${b.project.core}`],
            ['each approved step committed', steps.length >= 4, `${steps.length} commits`],
            ['scope document generated for the client', existsSync(join(fx.pilot, 'build', 'scope.html')) && existsSync(join(fx.pilot, 'build', 'scope.md'))],
          ];
        },
      },
    ],
  };
}

export default fieldbookFirstPlan({
  name: 'first-plan-en',
  title: 'First plan of Fieldbook, from its documents, in English',
  build: buildFieldbookDocs,
  language: 'English',
  locale: 'en',
  prompt: [
    'For what is missing: I give this project half of each working day, and a full day is worth 6 points.',
    'The dates and the days sold are in the quote: keep them, even if day 1 is already behind us.',
    'Your proposal suits me: I approve it, write it and go on to the next step. For the core and the order, keep what you propose.',
    'When the plan is ready to be agreed, I confirm it: run solopilot baseline.',
  ].join(' '),
  answers: (t) => /\b(the|and|features?)\b/i.test(t) && !/\b(les|fonctionnalités)\b/i.test(t),
  // Words that must not show in the feature titles of a plan in this language.
  foreign: /\b(les|des|écran)\b/i,
  // What the documents leave open, each to become a question or a dependency.
  gaps: {
    'whether a submitted inspection can be corrected': /correct|edit|send.* back|submitted/,
    'how long photos are kept': /photo/,
    'what page one of the report shows': /page one|first page|page 1/,
    'what a manager sees': /manager|role/,
    'the list of sites': /site/,
    'the sample checklists': /checklist|form/,
    'the inspection screens from the design team': /screen|design/,
    'the staging server, domain and certificate': /staging|domain|certificate/,
  },
  exclusions: { 'native apps in the stores': /native|store/, 'maintenance software': /maintenance/, invoicing: /invoic|billing/, 'other languages': /language/ },
  decisions: [/severit/, /version/, /resiz|location/],
  sources: /spec|kickoff|quote|mockup|\.md|\.svg|R\d/i,
  mockups: /mockups\//,
  views: /empty|error|offline|no result/,
  offline: /offline|network/i,
  steps: /plan|step/i,
});
