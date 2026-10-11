// The end-of-session update, on Fieldbook: two days of tagged commits not reported yet (T017 and
// S01 finished, tests green) and S02 started ahead of its day, in a file not committed.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readBacklog, validate } from '../../src/backlog.mjs';
import { buildFieldbook, git } from '../fixtures.mjs';

const task = (b, id) => b.tasks.find((t) => t.id === id);
const english = (s) => !/[éèêàâçùûôî]|\b(les|des|une|avec|pour|est|sur)\b/i.test(s);

export default {
  name: 'daily',
  title: 'End-of-session update on Fieldbook',
  build: buildFieldbook,
  // The project's own test command, which a developer allows once in their project. Claude Code
  // ignores a project's committed settings until the folder is trusted interactively.
  allow: ['Bash(npm test)', 'Bash(npm test *)'],

  // What the developer types. French on purpose: the skill writes in the language of the plan.
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
        ];
      },
    },
    {
      prompt: 'Je valide tout. Charge du jour : 0,5.',
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
          ['log written in English, the language of the plan', session ? english(`${session.title} ${session.note ?? ''}`) : false, session ? `${session.title} / ${session.note ?? ''}` : ''],
          ['last_commit is the project head', String(b.project.last_commit ?? '').startsWith(fx.head.slice(0, 7)), String(b.project.last_commit)],
          ['committed in the pilot directory', /update/i.test(pilotLog), pilotLog.replace(/\n/g, ' | ')],
          ['pilot directory clean', git(fx.pilot, ['status', '--porcelain']) === '', git(fx.pilot, ['status', '--porcelain'])],
          ['dashboard built', existsSync(join(fx.pilot, 'build', 'index.html'))],
          ['nothing committed in the project', git(fx.project, ['rev-parse', '--short=12', 'HEAD']) === fx.head],
          ['project tree untouched', git(fx.project, ['status', '--porcelain']) === '?? src/screens/site-list.mjs', git(fx.project, ['status', '--porcelain'])],
        ];
      },
    },
  ],

  before(fx, ctx) {
    ctx.initialPlan = readFileSync(join(fx.pilot, 'solopilot.yaml'), 'utf8');
    ctx.initialPilotHead = git(fx.pilot, ['rev-parse', 'HEAD']);
  },
};
