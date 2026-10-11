#!/usr/bin/env node
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILE, PLANNING, findPilotDir, isPlanning, readBacklog, validate } from '../src/backlog.mjs';
import { ISO, localToday } from '../src/calendar.mjs';
import { compute } from '../src/compute.mjs';
import { renderDashboard, writeDashboard } from '../src/dashboard.mjs';
import { BacklogEditor, EditRefused } from '../src/edit.mjs';
import { loadLocale } from '../src/i18n.mjs';
import { layoutPlan } from '../src/plan.mjs';
import { forget, overloadFor, portfolio, register, registryFile } from '../src/projects.mjs';
import { reference, scopeGrowth } from '../src/growth.mjs';
import { digestMessage, growthView, helpers, milestoneMessage, planningText, projectsText, statusText } from '../src/report.mjs';
import { git, head, projectRepo, readEnv, reportedBefore, taggedCommits } from '../src/repo.mjs';
import { scopeData, writeScope } from '../src/scope.mjs';
import { cliOnPath, init, install } from '../src/setup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const USAGE = `solopilot ${VERSION}: project steering for solo developers

Usage: solopilot <command> [options]

Commands
  init [dir]              create a pilot directory, its sources/ and a plan in the planning phase
  install <project-repo>  wire this pilot directory into a project for Claude Code
  check                   validate ${FILE}
  status                  where the project stands, or where its first plan stands (default)
  layout [--dry-run]      lay the estimated tasks out on plan days, while planning
  baseline                record the agreed plan and end the planning phase
  commits                 tagged commits in the project since the last update, and what is not committed there
  head                    last commit of the project, for project.last_commit
  commit [-m <message>]   commit the pilot directory (default message: update <today>)
  build                   generate the dashboard in build/
  scope                   generate the scope document for the client, in build/
  scope --agreed-by <name> [--on <date>]
                          record the client's approval of the scope
  slack [--dry-run]       post the digest to Slack
  slack --milestone <n>   announce the milestone of plan day n
  projects                all your projects, and the share of the day promised to them week by week
  projects --forget <dir> take a pilot directory off the list

Options
  --dir <path>            pilot directory (default: SOLOPILOT_DIR, or the nearest ${FILE})
  --today <YYYY-MM-DD>    compute as of another date (also SOLOPILOT_TODAY)
  --locale <en|fr>        override project.locale for this run
  --name <name>           project name, for init
  -h, --help              show this help
  -v, --version           show the version`;

const PLANNING_ONLY = `The plan is still being drawn up (project.phase: ${PLANNING}). Run \`solopilot status\` to see where it stands, and \`solopilot baseline\` once it is agreed.`;
const round = (n) => Math.round(n * 100) / 100;

function printIssues({ errors, warnings }) {
  for (const w of warnings) console.log(`warning  ${w}`);
  for (const e of errors) console.log(`error    ${e}`);
}

// Writes the edits of a command that owns some values of the backlog, or explains why it did not.
function writeEdits(dir, edit) {
  const file = join(dir, FILE);
  try {
    const ed = new BacklogEditor(readFileSync(file, 'utf8'));
    edit(ed);
    writeFileSync(file, ed.toString());
  } catch (e) {
    if (e instanceof EditRefused) fail(`\nNothing written: ${e.message}. Apply the change by hand, then run \`solopilot check\`.`);
    throw e;
  }
  return file;
}

// The computation, with the scope's movement since it was agreed (read from the pilot directory's tags).
function computeAll(dir, b, t, today) {
  const c = compute(b, { today });
  c.growth = scopeGrowth(reference(dir, b), b);
  c.growthView = growthView(c.growth, t);
  return c;
}

// The pilot directory as its own repository (never an enclosing one, such as the project's).
function ownRepo(dir) {
  const top = git(['rev-parse', '--show-toplevel'], dir);
  return Boolean(top) && realpathSync(resolve(top)) === realpathSync(dir);
}

function parse(argv) {
  const opts = { _: [] };
  const valued = new Set(['dir', 'today', 'locale', 'name', 'milestone', 'message', 'agreed-by', 'on', 'forget']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') opts.help = true;
    else if (a === '-m') opts.message = argv[++i];
    else if (a === '-v' || a === '--version') opts.version = true;
    else if (a.startsWith('--')) {
      const [k, inline] = a.slice(2).split('=');
      if (valued.has(k)) opts[k] = inline ?? argv[++i];
      else opts[k] = true;
    } else opts._.push(a);
  }
  return opts;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function load(opts, { strict = true } = {}) {
  const dir = findPilotDir(opts.dir);
  if (!dir) fail(`No ${FILE} found here or above. Run \`solopilot init\`, or pass --dir.`);
  let b;
  try { b = readBacklog(dir); } catch (e) { fail(`Cannot read ${join(dir, FILE)}: ${e.message}`); }
  if (strict && validate(b).errors.length) fail(`${FILE} is invalid: run \`solopilot check\` for details.`);
  const today = opts.today || process.env.SOLOPILOT_TODAY;
  if (today && !ISO.test(today)) fail('--today: a date as YYYY-MM-DD');
  const locale = loadLocale(opts.locale || b.project.locale);
  return { dir, b, locale, t: locale.t, today };
}

const commands = {
  init(opts) {
    const { dir, repo, own, committed, skill } = init(opts._[0] || '.', { name: opts.name, locale: opts.locale });
    console.log(`Pilot directory ready: ${dir}`);
    console.log(`  Skill /solopilot copied to ${skill}`);
    register(dir);
    console.log(`  Listed in ${registryFile()}: \`solopilot projects\` shows all your projects together`);
    if (!own && repo) console.log(`  It sits inside the git repository ${repo}: keep the pilot directory outside the project's repository. Nothing was committed.`);
    else if (!committed) console.log(`  The first commit failed (is a git identity set?). Commit it yourself: git -C "${dir}" add -A && git -C "${dir}" commit -m "solopilot init"`);
    console.log('Next: put the project documents (spec, workshop notes, mockups) in sources/, open Claude Code in that directory and run /solopilot to draw up the first plan.');
  },

  install(opts) {
    if (!opts._[0]) fail('Usage: solopilot install <project-repo>');
    const { dir } = load(opts, { strict: false });
    const { project, log } = install(dir, opts._[0]);
    for (const l of log) console.log(`  ${l}`);
    register(dir);
    if (!readEnv(dir, 'SLACK_WEBHOOK_URL')) console.log('  SLACK_WEBHOOK_URL is not set in .env yet: the digest will be skipped (see .env.example)');
    if (!cliOnPath()) console.log('  `solopilot` is not on your PATH: the skill calls it by name. Run `npm install -g solopilot` (or `npm link` in a clone).');
    console.log(`Ready. Restart Claude Code in ${project} to load the skill and the hook.`);
  },

  check(opts) {
    const { dir, b } = load(opts, { strict: false });
    const { errors, warnings } = validate(b);
    for (const w of warnings) console.log(`warning  ${w}`);
    for (const e of errors) console.log(`error    ${e}`);
    if (errors.length) fail(`\n${errors.length} error(s) in ${join(dir, FILE)}`);
    console.log(`${FILE} is valid (${b.tasks.length} tasks)`);
  },

  status(opts) {
    const { dir, b, t, today } = load(opts);
    if (isPlanning(b)) return console.log(planningText(b, t, { today }));
    const c = computeAll(dir, b, t, today);
    c.overload = overloadFor(dir, { today: c.today, start: String(b.project.start), end: c.finish.all });
    console.log(statusText(b, c, t));
  },

  // Every registered pilot directory, wherever it is: no pilot directory is needed to run it.
  projects(opts) {
    if (opts.forget !== undefined) {
      if (opts.forget === true) fail('Usage: solopilot projects --forget <pilot-directory>');
      const n = forget(opts.forget);
      return console.log(n ? `Taken off the list: ${opts.forget}` : `Not on the list: ${opts.forget} (see ${registryFile()})`);
    }
    const today = opts.today || process.env.SOLOPILOT_TODAY || localToday();
    if (!ISO.test(today)) fail('--today: a date as YYYY-MM-DD');
    const { projects, ranges } = portfolio({ today });
    // In the language of the pilot directory it is run from, if any, else of the first project.
    const here = findPilotDir(opts.dir);
    let lang = opts.locale;
    if (!lang && here) try { lang = readBacklog(here).project.locale; } catch { /* not a readable plan */ }
    const { t } = loadLocale(lang || projects.find((x) => x.locale)?.locale);
    console.log(projectsText(projects, ranges, t, today));
  },

  layout(opts) {
    const { dir, b, t } = load(opts);
    if (!isPlanning(b)) fail(`layout lays out a plan being drawn up (project.phase: ${PLANNING}). This plan is agreed: move tasks by hand, and log a replan saying why.`);
    const r = layoutPlan(b, { laterTitle: t('later.long') });
    printIssues(r);
    if (r.errors.length) fail(`\nNothing laid out: ${r.errors.length} error(s).`);
    console.log(`At ${r.capacity} points per work day: ${r.points} points over ${r.planDays} plan days, core up to day ${r.core}.`);
    for (const d of r.listing) console.log(`  D${String(d.day).padEnd(3)} ${String(d.points).padStart(5)}  ${d.title}  (${d.tasks.join(' ')})`);
    if (r.later.length) console.log(`  later       (${r.later.join(' ')})`);
    if (opts['dry-run']) return console.log('\nDry run: nothing written.');
    const byId = (section, id) => b[section].find((x) => x.id === id);
    const file = writeEdits(dir, (ed) => {
      ed.replaceList('days', r.days, { before: 'tasks' });
      for (const [id, day] of r.assign) if (byId('tasks', id).day !== day) ed.setField('tasks', id, 'day', day, ['feature', 'id']);
      for (const x of r.before) if (byId(x.section, x.id).before !== x.day) ed.setField(x.section, x.id, 'before', x.day);
      ed.setProject('plan_days', r.planDays);
      ed.setProject('core', r.core);
    });
    console.log(`\nWritten to ${file}.`);
    const issues = validate(readBacklog(dir));
    printIssues(issues);
    if (issues.errors.length) fail(`\n${issues.errors.length} error(s) left to fix by hand (sprints and milestones follow the new days).`);
  },

  baseline(opts) {
    const { dir, b, t, today: asOf } = load(opts);
    if (!isPlanning(b)) fail(b.project.baseline ? `The plan was agreed on ${b.project.baseline.date}.` : `baseline agrees a plan being drawn up (project.phase: ${PLANNING}).`);
    const agreed = { ...b, project: { ...b.project } };
    delete agreed.project.phase;
    delete agreed.project.planning_step;
    const issues = validate(agreed);
    printIssues(issues);
    if (issues.errors.length) fail(`\nThe plan is not complete yet: ${issues.errors.length} error(s), as it would be checked once agreed.`);
    const p = agreed.project;
    const today = asOf || localToday();
    const points = round(compute(agreed, { today }).pointsTotal);
    const file = writeEdits(dir, (ed) => {
      ed.removeProject('phase');
      ed.removeProject('planning_step');
      ed.setProject('baseline', { date: today, points, plan_days: p.plan_days });
      ed.append('log', { date: today, type: 'baseline', title: t('log.baselineTitle'), note: t('log.baselineNote', { points: t('planning.points', { n: points }), days: p.plan_days, core: t('day', { n: p.core }) }) });
    });
    console.log(`Plan agreed on ${today}: ${points} points over ${p.plan_days} plan days, core up to day ${p.core}. Written to ${file}.`);
    // Plan days are filled up to points_per_day, not always to the brim: the load is what weighs.
    const workDays = points / p.points_per_day;
    if (p.budget_days && workDays > p.budget_days + 0.05) console.log(`warning  the plan holds ${round(workDays)} work days of load, ${p.budget_days} were sold`);
    if (!ownRepo(dir)) return console.log('The pilot directory is not its own git repository: commit the agreed plan yourself.');
    if (git(['commit', '--quiet', '-m', `baseline ${today}`, '--', FILE], dir) === null) return console.log(`The commit failed: commit ${FILE} yourself, then tag it baseline.`);
    console.log(git(['tag', 'baseline'], dir) === null ? 'Committed. The tag baseline already exists: tag this commit yourself if it should move.' : 'Committed and tagged baseline in the pilot directory.');
  },

  commits(opts) {
    const { dir, b, t, today } = load(opts);
    if (isPlanning(b)) fail(PLANNING_ONLY);
    const { day } = helpers(compute(b, { today }), t);
    let commits;
    try { commits = taggedCommits(b, dir); } catch (e) { fail(e.message); }
    if (!commits.length) console.log('No tagged commit in the project since the last update.');
    const tasks = new Map(b.tasks.map((x) => [x.id, x]));
    const byTask = new Map();
    for (const c of commits) for (const id of c.ids) {
      if (!byTask.has(id)) byTask.set(id, []);
      byTask.get(id).push(c);
    }
    const earlier = reportedBefore(b, dir, [...byTask.keys()]);
    const files = (c) => (c.files.length ? `  (${c.files.slice(0, 6).join(', ')}${c.files.length > 6 ? ', …' : ''})` : '');
    for (const [id, cs] of byTask) {
      const x = tasks.get(id);
      console.log(`${id}  ${x ? `${t(`task.${x.status}`)}, ${day(x.day)}, ${x.title}` : 'UNKNOWN in the backlog'}`);
      for (const c of cs) console.log(`      ${c.hash}  ${c.subject}${files(c)}`);
      for (const c of earlier.filter((e) => e.ids.includes(id))) console.log(`      ${c.hash}  ${c.subject}${files(c)}  [taken into account by an earlier update]`);
    }
    // Work under way that no commit shows yet: evidence that a task started, not that it is done.
    const repo = projectRepo(dir);
    const pending = repo && git(['status', '--porcelain'], repo);
    if (pending) console.log(`\nNot committed in the project:\n${pending.split('\n').map((l) => `  ${l}`).join('\n')}`);
  },

  commit(opts) {
    const { dir } = load(opts, { strict: false });
    if (!ownRepo(dir)) fail('The pilot directory is not a git repository of its own: run `git init` there first.');
    git(['add', '-A'], dir);
    if (!git(['status', '--porcelain'], dir)) return console.log('Nothing to commit in the pilot directory.');
    const message = opts.message || `update ${opts.today || process.env.SOLOPILOT_TODAY || localToday()}`;
    if (git(['commit', '--quiet', '-m', message], dir) === null) fail('The commit failed: is a git identity set?');
    console.log(`Committed in the pilot directory: ${git(['log', '-1', '--format=%h %s'], dir)}`);
  },

  head(opts) {
    const { dir } = load(opts, { strict: false });
    try { console.log(head(dir)); } catch (e) { fail(e.message); }
  },

  build(opts) {
    const { dir, b, t, locale, today } = load(opts);
    if (isPlanning(b)) fail(PLANNING_ONLY);
    const { local, fragment } = writeDashboard(dir, renderDashboard(b, computeAll(dir, b, t, today), locale), locale.lang);
    console.log(`Dashboard: ${local}`);
    console.log(`Fragment to publish: ${fragment}`);
  },

  // The scope document is built from chosen fields only (features, answers awaited, requests): no
  // lead, delay, margin or projected date reaches the client.
  scope(opts) {
    const { dir, b, t, locale, today: asOf } = load(opts);
    if (isPlanning(b)) fail('The scope document comes from an agreed plan: run `solopilot baseline` first.');
    const today = asOf || localToday();
    const generate = (backlog) => writeScope(dir, scopeData(backlog, compute(backlog, { today })), t, locale.lang);
    if (opts['agreed-by'] === undefined) {
      const { html, md } = generate(b);
      console.log(`Scope document, to print as PDF: ${html}`);
      console.log(`The same as text, for an email: ${md}`);
      return;
    }
    const by = String(opts['agreed-by']).trim();
    if (!by || by === 'true') fail('--agreed-by: the name of the person who approved the scope');
    const date = opts.on || today;
    if (!ISO.test(date)) fail('--on: a date as YYYY-MM-DD');
    const file = writeEdits(dir, (ed) => {
      ed.setProject('scope_agreed', { by, date });
      ed.append('log', { date, type: 'agreed', title: t('log.agreedTitle'), note: t('log.agreedNote', { by }) });
    });
    console.log(`Scope approved by ${by} on ${date}. Written to ${file}.`);
    const { html } = generate(readBacklog(dir));
    console.log(`Scope document updated with the approval: ${html}`);
    if (!ownRepo(dir)) return console.log('The pilot directory is not its own git repository: commit the approval yourself.');
    if (git(['commit', '--quiet', '-m', `scope agreed by ${by}, ${date}`, '--', FILE], dir) === null) return console.log(`The commit failed: commit ${FILE} yourself, then tag it scope-agreed-${date}.`);
    console.log(git(['tag', `scope-agreed-${date}`], dir) === null ? `Committed. The tag scope-agreed-${date} already exists: tag this commit yourself if it should move.` : `Committed and tagged scope-agreed-${date}: the approved scope stays readable as it was.`);
  },

  async slack(opts) {
    const { dir, b, t, today } = load(opts);
    if (isPlanning(b)) fail(PLANNING_ONLY);
    const c = computeAll(dir, b, t, today);
    const message = opts.milestone !== undefined ? milestoneMessage(b, c, t, Number(opts.milestone)) : digestMessage(b, c, t);
    if (opts['dry-run']) return console.log(JSON.stringify(message, null, 2));
    const url = readEnv(dir, 'SLACK_WEBHOOK_URL');
    if (!url) fail('SLACK_WEBHOOK_URL is not set, neither in the environment nor in .env');
    const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
    if (!r.ok) fail(`Slack answered ${r.status}: ${await r.text()}`);
    console.log('Message sent to Slack.');
  },
};

const opts = parse(process.argv.slice(2));
if (opts.version) console.log(VERSION);
else if (opts.help) console.log(USAGE);
else {
  const name = opts._.shift() || 'status';
  if (!commands[name]) fail(`Unknown command: ${name}\n\n${USAGE}`);
  try {
    await commands[name](opts);
  } catch (e) {
    fail(e.message);
  }
}
