// The end-of-session update, on Fieldbook: two days of tagged commits not reported yet (T017 and
// S01 finished, tests green) and S02 started ahead of its day, in a file not committed.
//
// This file holds the scenario on the English demo, and `fieldbookDaily` for the French one
// (daily-fr.mjs): the developer types in French in both, and the plan is written in its own language.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBacklog, validate } from '../../src/backlog.mjs';
import { buildFieldbook, git } from '../fixtures.mjs';

const task = (b, id) => b.tasks.find((t) => t.id === id);
const english = (s) => !/[éèêàâçùûôî]|\b(les|des|une|avec|pour|est|sur)\b/i.test(s);

// language: { label, test }, the language of the plan and the test its log entry must pass.
// prompts: what the developer types once the update is proposed, French by default.
const FRENCH = { approve: 'Je valide tout. Charge du jour : 0,5.', reminded: "J'ai relancé Harbor & Pine pour Q01 aujourd'hui, par e-mail." };
export const fieldbookDaily = ({ name, title, build, language, prompts = FRENCH }) => ({
  name,
  title,
  build,
  // The project's own test command, which a developer allows once in their project. Claude Code
  // ignores a project's committed settings until the folder is trusted interactively.
  allow: ['Bash(npm test)', 'Bash(npm test *)'],

  // What the developer types. In `daily`, French on purpose: the skill writes in the language of the plan.
  turns: [
    {
      prompt: '/solopilot',
      checks(fx, run, ctx) {
        const said = run.texts.join('\n');
        return [
          ['nothing written before approval', readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8') === ctx.initialPlan],
          ['no commit in the pilot directory yet', git(fx.pilot, ['rev-parse', 'HEAD']) === ctx.initialPilotHead],
          ['proposes T017 and S01', /T017/.test(said) && /S01/.test(said)],
          ['flags S02, started ahead of its day', /S02/.test(said)],
          ['asks how much of the day went to the project', /effort|charge|share of (the|your) day|how much of (the|your) day|part de/i.test(said)],
          ['flags Q01 as to chase', /Q01/.test(said) && /chase|remind|relanc/i.test(said)],
          ['looks over the next days for missing answers', /D8|D9|J8|J9|S02|S03|S04|T018/.test(said) && /question|missing|manque|dependenc|dépendance/i.test(said)],
        ];
      },
    },
    {
      prompt: prompts.approve,
      checks(fx, run, ctx) {
        const b = readBacklog(fx.pilot);
        const session = b.log.find((e) => e.type === 'session' && String(e.date) === ctx.today);
        const pilotLog = git(fx.pilot, ['log', '--format=%s', `${ctx.initialPilotHead}..HEAD`]);
        return [
          ['the plan is valid', validate(b).errors.length === 0, validate(b).errors.join('; ')],
          ['T017 done today', task(b, 'T017').status === 'done' && String(task(b, 'T017').done_on) === ctx.today, `${task(b, 'T017').status} ${task(b, 'T017').done_on ?? ''}`],
          ['S01 done today', task(b, 'S01').status === 'done' && String(task(b, 'S01').done_on) === ctx.today, `${task(b, 'S01').status} ${task(b, 'S01').done_on ?? ''}`],
          ['S02 not done', task(b, 'S02').status !== 'done', task(b, 'S02').status],
          ['session logged today with effort 0.5', session?.effort === 0.5, JSON.stringify(session ?? null)],
          [`log written in ${language.label}, the language of the plan`, session ? language.test(`${session.title} ${session.note ?? ''}`) : false, session ? `${session.title} / ${session.note ?? ''}` : ''],
          ['last_commit is the project head', String(b.project.last_commit ?? '').startsWith(fx.head.slice(0, 7)), String(b.project.last_commit)],
          ['committed in the pilot directory', /update/i.test(pilotLog), pilotLog.replace(/\n/g, ' | ')],
          ['pilot directory clean', git(fx.pilot, ['status', '--porcelain']) === '', git(fx.pilot, ['status', '--porcelain'])],
          ['dashboard built', existsSync(join(fx.pilot, 'build', 'index.html'))],
          ['nothing committed in the project', git(fx.project, ['rev-parse', '--short=12', 'HEAD']) === fx.head],
          ['project tree untouched', git(fx.project, ['status', '--porcelain']) === '?? src/screens/site-list.mjs', git(fx.project, ['status', '--porcelain'])],
        ];
      },
    },
    {
      prompt: prompts.reminded,
      checks(fx, run, ctx) {
        const b = readBacklog(fx.pilot);
        const q = b.questions.find((x) => x.id === 'Q01');
        return [
          ['the reminder is recorded on Q01', String(q.reminded_on) === ctx.today, `reminded_on: ${q.reminded_on}`],
          ['Q01 is no longer to chase', !/To chase[\s\S]*Q01|À relancer[\s\S]*Q01/.test(run.final), ''],
          ['the plan is valid', validate(b).errors.length === 0, validate(b).errors.join('; ')],
        ];
      },
    },
  ],

  before(fx, ctx) {
    ctx.initialPlan = readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8');
    ctx.initialPilotHead = git(fx.pilot, ['rev-parse', 'HEAD']);
  },
});

export default fieldbookDaily({ name: 'daily', title: 'End-of-session update on Fieldbook', build: buildFieldbook, language: { label: 'English', test: english } });
