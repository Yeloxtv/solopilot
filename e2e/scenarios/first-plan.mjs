// The first plan of Kerlan, drawn up from its documents: a seven-page spec with deliberate gaps and
// explicit exclusions, workshop notes, an 18-day quote, and two mockups showing default states only.
// The developer approves every proposal, step after step, until the plan is agreed.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBacklog, validate } from '../../src/backlog.mjs';
import { buildKerlan, git } from '../fixtures.mjs';

const text = (x) => `${x.title ?? ''} ${x.note ?? ''} ${x.answer ?? ''} ${x.stake ?? ''}`.toLowerCase();

// What the spec leaves open, each to become a question or a dependency.
const GAPS = {
  'cancellation conditions': /annul/,
  'payment method': /paiement|régl/,
  'who cancels for the weather': /météo/,
  'what instructors may do on the boat planning': /moniteur/,
  'bookings on a boat put in maintenance': /maintenance/,
  'boat photos and descriptions': /photo|description/,
  'access to the hosting': /hébergement|domaine|sous-domaine/,
  'price list': /tarif/,
};
const EXCLUSIONS = { 'native app': /natif|native|mobile/, 'accounting export': /comptab|factur/, 'several clubs': /club/, 'messaging': /messag/ };
const DECISIONS = [/deux|2\b/, /à jour/, /semaine en cours/];

export default {
  name: 'first-plan',
  title: 'First plan of Kerlan, from its documents',
  build: buildKerlan,

  before(fx, ctx) {
    ctx.initialPlan = readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8');
  },

  // What changes when a turn gets somewhere: the plan, or the pilot directory's history.
  progress: (fx) => `${readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8')}\n${git(fx.pilot, ['rev-parse', 'HEAD'])}`,

  turns: [
    {
      prompt: '/solopilot',
      checks: (fx, run, ctx) => [
        ['nothing written before approval', readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8') === ctx.initialPlan],
        ['reads the documents in sources/', run.tools.some((x) => /sources/.test(x.what))],
      ],
    },
    {
      // One answer that fits every step: the missing inputs, then approval of whatever was proposed.
      prompt: [
        'Pour ce qui manque : je consacre 0,5 jour par jour ouvré à ce projet, et une journée pleine vaut 6 points.',
        'Les dates et les jours vendus sont dans le devis.',
        'Ta proposition me convient : je valide, écris-la et passe à l\'étape suivante. Pour le cœur et l\'ordre, garde ce que tu proposes.',
        'Quand le plan est prêt à être convenu, je le confirme : lance solopilot baseline.',
      ].join(' '),
      repeat: { max: 9, until: (fx) => Boolean(readBacklog(fx.pilot).project.baseline) },
      checks(fx) {
        const b = readBacklog(fx.pilot);
        const answers = [...b.questions, ...b.dependencies];
        const covered = (re) => answers.some((x) => re.test(text(x)));
        const out = b.features.filter((f) => f.scope === 'out');
        const screens = b.tasks.filter((t) => String(t.id).startsWith('S'));
        const names = (t) => (t.view_names ?? []).join(' ').toLowerCase();
        const answered = b.questions.filter((q) => q.status === 'answered');
        const steps = git(fx.pilot, ['log', '--format=%s']).split('\n').filter((s) => /plan|étape|step/i.test(s));
        return [
          ['the plan is agreed', Boolean(b.project.baseline) && b.project.phase === undefined && b.project.planning_step === undefined, JSON.stringify(b.project.baseline ?? null)],
          ['the plan is valid', validate(b).errors.length === 0, validate(b).errors.slice(0, 5).join('; ')],
          ['dates and days sold taken from the quote', String(b.project.start) === '2026-10-19' && String(b.project.target) === '2026-12-18' && b.project.budget_days === 18, `${b.project.start} → ${b.project.target}, ${b.project.budget_days} days sold`],
          ['every feature points to a document of sources/', b.features.length > 0 && b.features.every((f) => /cahier|atelier|devis|maquette|\.md|\.svg|R\d/i.test(String(f.source))), `${b.features.length} features`],
          ...Object.entries(GAPS).map(([label, re]) => [`gap turned into a question or dependency: ${label}`, covered(re)]),
          ...Object.entries(EXCLUSIONS).map(([label, re]) => [`exclusion kept out of scope: ${label}`, out.some((f) => re.test(text(f)))]),
          ['workshop decisions recorded as answered questions', DECISIONS.filter((re) => answered.some((q) => re.test(text(q)))).length >= 2, `${answered.length} answered`],
          ['the new request (rating a boat) is a request, not a planned feature', b.requests.some((r) => /not(e|er|ation)|signal|évalu/i.test(text(r))), b.requests.map((r) => r.title).join(' | ')],
          ['screens list empty and error views', screens.length > 0 && screens.filter((t) => /vide|empty|aucun/.test(names(t)) || /erreur|error/.test(names(t))).length >= screens.length / 2, `${screens.length} screens`],
          ['drawn screens linked to their mockup', b.tasks.some((t) => /maquettes\//.test(String(t.design ?? '')))],
          ['days laid out, the core inside the plan', b.project.plan_days >= 1 && b.project.core <= b.project.plan_days, `${b.project.plan_days} days, core up to ${b.project.core}`],
          ['each approved step committed', steps.length >= 4, `${steps.length} commits`],
          ['scope document generated for the client', existsSync(join(fx.pilot, 'build', 'scope.html')) && existsSync(join(fx.pilot, 'build', 'scope.md'))],
        ];
      },
    },
    {
      prompt: 'Le client a validé le périmètre par e-mail : c\'est Mme Le Goff, la présidente, le 20 octobre 2026.',
      checks(fx) {
        const b = readBacklog(fx.pilot);
        const md = existsSync(join(fx.pilot, 'build', 'scope.md')) ? readFileSync(join(fx.pilot, 'build', 'scope.md'), 'utf8') : '';
        return [
          ['approval recorded', /Le Goff/.test(b.project.scope_agreed?.by ?? '') && String(b.project.scope_agreed?.date) === '2026-10-20', JSON.stringify(b.project.scope_agreed ?? null)],
          ['approval logged', b.log.some((e) => e.type === 'agreed')],
          ['approved scope tagged', /scope-agreed-2026-10-20/.test(git(fx.pilot, ['tag']))],
          ['document shows the approval', /Validé par .*Le Goff/.test(md)],
          ['the plan is still valid', validate(b).errors.length === 0, validate(b).errors.slice(0, 3).join('; ')],
        ];
      },
    },
  ],
};
