#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILE, findPilotDir, readBacklog, validate } from '../src/backlog.mjs';
import { ISO } from '../src/calendar.mjs';
import { compute } from '../src/compute.mjs';
import { renderDashboard, writeDashboard } from '../src/dashboard.mjs';
import { loadLocale } from '../src/i18n.mjs';
import { digestMessage, helpers, milestoneMessage, statusText } from '../src/report.mjs';
import { head, readEnv, taggedCommits } from '../src/repo.mjs';
import { cliOnPath, init, install } from '../src/setup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

const USAGE = `solopilot ${VERSION}: project steering for solo developers

Usage: solopilot <command> [options]

Commands
  init [dir]              create a pilot directory with a starter ${FILE}
  install <project-repo>  wire this pilot directory into a project for Claude Code
  check                   validate ${FILE}
  status                  where the project stands (default command)
  commits                 tagged commits in the project since the last update
  head                    last commit of the project, for project.last_commit
  build                   generate the dashboard in build/
  slack [--dry-run]       post the digest to Slack
  slack --milestone <n>   announce the milestone of plan day n

Options
  --dir <path>            pilot directory (default: SOLOPILOT_DIR, or the nearest ${FILE})
  --today <YYYY-MM-DD>    compute as of another date (also SOLOPILOT_TODAY)
  --locale <en|fr>        override project.locale for this run
  --name <name>           project name, for init
  -h, --help              show this help
  -v, --version           show the version`;

function parse(argv) {
  const opts = { _: [] };
  const valued = new Set(['dir', 'today', 'locale', 'name', 'milestone']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h' || a === '--help') opts.help = true;
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
    const dir = init(opts._[0] || '.', { name: opts.name, locale: opts.locale });
    console.log(`Pilot directory ready: ${dir}`);
    console.log(`Next: fill in ${FILE} (project, days, tasks), then \`solopilot install <project-repo>\` from that directory.`);
  },

  install(opts) {
    if (!opts._[0]) fail('Usage: solopilot install <project-repo>');
    const { dir } = load(opts, { strict: false });
    const { project, log } = install(dir, opts._[0]);
    for (const l of log) console.log(`  ${l}`);
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
    const { b, t, today } = load(opts);
    console.log(statusText(b, compute(b, { today }), t));
  },

  commits(opts) {
    const { dir, b, t, today } = load(opts);
    const { day } = helpers(compute(b, { today }), t);
    let commits;
    try { commits = taggedCommits(b, dir); } catch (e) { fail(e.message); }
    if (!commits.length) return console.log('No tagged commit in the project since the last update.');
    const tasks = new Map(b.tasks.map((x) => [x.id, x]));
    const byTask = new Map();
    for (const c of commits) for (const id of c.ids) {
      if (!byTask.has(id)) byTask.set(id, []);
      byTask.get(id).push(c);
    }
    for (const [id, cs] of byTask) {
      const x = tasks.get(id);
      console.log(`${id}  ${x ? `${t(`task.${x.status}`)}, ${day(x.day)}, ${x.title}` : 'UNKNOWN in the backlog'}`);
      for (const c of cs) console.log(`      ${c.hash}  ${c.subject}`);
    }
  },

  head(opts) {
    const { dir } = load(opts, { strict: false });
    try { console.log(head(dir)); } catch (e) { fail(e.message); }
  },

  build(opts) {
    const { dir, b, locale, today } = load(opts);
    const { local, fragment } = writeDashboard(dir, renderDashboard(b, compute(b, { today }), locale), locale.lang);
    console.log(`Dashboard: ${local}`);
    console.log(`Fragment to publish: ${fragment}`);
  },

  async slack(opts) {
    const { dir, b, t, today } = load(opts);
    const c = compute(b, { today });
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
