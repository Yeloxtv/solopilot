import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compute } from '../src/compute.mjs';
import { renderDashboard } from '../src/dashboard.mjs';
import { loadLocale } from '../src/i18n.mjs';
import { digestMessage, milestoneMessage } from '../src/report.mjs';
import { fixture } from './fixture.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BIN = join(ROOT, 'bin', 'solopilot.mjs');
const DEMO = join(ROOT, 'examples', 'demo');
const tmp = () => mkdtempSync(join(tmpdir(), 'solopilot-'));
// A home of its own: init and install copy the skill there, and the machine's git settings (global
// excludes, identity) cannot hide a mistake.
const HOME = tmp();
const run = (args, env = {}) => spawnSync(process.execPath, [BIN, ...args], {
  encoding: 'utf8',
  env: { ...process.env, SOLOPILOT_DIR: '', SOLOPILOT_REPO: '', HOME, USERPROFILE: HOME, ...env },
});

test('the demo checks and reports', () => {
  assert.equal(run(['check', '--dir', DEMO]).status, 0);
  const status = run(['status', '--dir', DEMO, '--today', '2026-10-21']);
  assert.equal(status.status, 0);
  assert.match(status.stdout, /Launch on November 27/);
  assert.match(run(['status', '--dir', DEMO, '--today', '2026-10-21', '--locale', 'fr']).stdout, /le 27 novembre/);
});

test('slack --dry-run prints Block Kit JSON', () => {
  const out = run(['slack', '--dry-run', '--dir', DEMO, '--today', '2026-10-21']);
  assert.equal(out.status, 0);
  const message = JSON.parse(out.stdout);
  assert.equal(message.blocks[0].type, 'header');
});

test('build writes both pages, with every placeholder filled', () => {
  const dir = tmp();
  cpSync(join(DEMO, 'solopilot.yaml'), join(dir, 'solopilot.yaml'));
  assert.equal(run(['build', '--dir', dir, '--today', '2026-10-21']).status, 0);
  const page = readFileSync(join(dir, 'build', 'index.html'), 'utf8');
  assert.ok(existsSync(join(dir, 'build', 'publish.html')));
  assert.doesNotMatch(page, /__TITLE__|__DATA__|__MAKE_T__/);
  assert.match(page, /<title>Fieldbook · solopilot<\/title>/);
});

test('data cannot close the script tag', () => {
  const b = fixture();
  b.tasks[3].title = '</script><img src=x onerror=alert(1)>';
  const page = renderDashboard(b, compute(b, { today: '2026-01-07' }), loadLocale('en'));
  assert.equal(page.match(/<\/script>/g).length, 1);
});

test('a marker in the data does not consume the next one', () => {
  const b = fixture({ project: { name: '/*__DATA__*/null __TITLE__' } });
  const page = renderDashboard(b, compute(b, { today: '2026-01-07' }), loadLocale('en'));
  assert.match(page, /const D = \{/);
  assert.match(page, /const makeT = function makeT/);
});

test('Slack messages escape user text', () => {
  const b = fixture();
  b.tasks[1].title = '<!channel> <https://evil.example|Open>';
  const c = compute(b, { today: '2026-01-07' });
  const json = JSON.stringify(digestMessage(b, c, loadLocale('en').t));
  assert.match(json, /&lt;!channel&gt;/);
  assert.doesNotMatch(json, /<!channel>/);
});

test('messages name the milestone or refuse an unknown one', () => {
  const b = fixture();
  const c = compute(b, { today: '2026-01-07' });
  const { t } = loadLocale('en');
  assert.match(milestoneMessage(b, c, t, 2).text, /milestone D2 reached: Demo/);
  assert.throws(() => milestoneMessage(b, c, t, 3), /No milestone on day 3/);
  assert.match(digestMessage(b, c, t).blocks[0].text.text, /^Test, update of /);
});

test('init creates a valid starter', () => {
  const dir = join(tmp(), 'acme-pilot');
  assert.equal(run(['init', dir]).status, 0);
  assert.match(readFileSync(join(dir, 'solopilot.yaml'), 'utf8'), /name: acme/);
  assert.equal(run(['check', '--dir', dir]).status, 0);
  assert.notEqual(run(['init', dir]).status, 0, 'init refuses to overwrite');
});

// A git identity of its own, so commits work on a machine without one.
const GIT_ID = { GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@example.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@example.com' };
const gitOut = (dir, ...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' }).trim();

test('init starts a plan being drawn up, in a repository of its own with a first commit', () => {
  const dir = join(tmp(), 'acme-pilot');
  assert.equal(run(['init', dir], GIT_ID).status, 0);
  assert.ok(existsSync(join(dir, 'sources', '.gitkeep')));
  assert.ok(existsSync(join(HOME, '.claude', 'skills', 'solopilot', 'plan.md')), 'the skill is there for the first plan');
  assert.equal(gitOut(dir, 'log', '--format=%s'), 'solopilot init');
  assert.equal(gitOut(dir, 'status', '--porcelain'), '');
  assert.match(run(['status', '--dir', dir]).stdout, /plan being drawn up, next step 1 of 6: Features/);
  const build = run(['build', '--dir', dir]);
  assert.notEqual(build.status, 0);
  assert.match(build.stderr, /still being drawn up/);
});

test('init inside another repository commits nothing there', () => {
  const project = join(tmp(), 'project');
  execFileSync('git', ['init', '--quiet', project]);
  const out = run(['init', join(project, 'pilot')], GIT_ID);
  assert.equal(out.status, 0);
  assert.match(out.stdout, /inside the git repository/);
  assert.equal(spawnSync('git', ['rev-parse', 'HEAD'], { cwd: project }).status === 0, false, 'no commit in the enclosing repository');
});

test('layout and baseline take a plan from drawn up to agreed', () => {
  const dir = join(tmp(), 'acme-pilot');
  run(['init', dir, '--name', 'Acme'], GIT_ID);
  const file = join(dir, 'solopilot.yaml');
  writeFileSync(file, readFileSync(file, 'utf8')
    .replace('features: []', 'features:\n  - { id: F01, title: "Sign-in", source: "spec.pdf p. 2", core: true, priority: 1 }\n  - { id: F02, title: "Reports", source: "spec.pdf p. 5", priority: 2 }')
    .replace('questions: []', 'questions:\n  - { id: Q01, status: open, who: "Acme", features: [F02], title: "Report page one?" }')
    .replace('tasks: []', [
      'tasks:',
      '  - { id: T001, kind: setup, status: todo, points: 2, title: "Repository" }',
      '  - { id: T002, feature: F01, kind: logic, status: todo, points: 3, title: "Magic link" }',
      '  - { id: S01, feature: F01, status: todo, points: 2, views: [default, error], title: "Sign-in screen" }',
      '  - { id: T003, feature: F02, kind: integration, status: todo, points: 4, title: "PDF" }',
    ].join('\n')));

  const layout = run(['layout', '--dir', dir]);
  assert.equal(layout.status, 0, layout.stderr);
  assert.match(layout.stdout, /11 points over 3 plan days, core up to day 2/);
  const laid = readFileSync(file, 'utf8');
  assert.match(laid, /\{ id: T002, feature: F01, day: 1, kind: logic/);
  assert.match(laid, /\{ id: Q01, before: 3, status: open/);
  assert.match(laid, /^ {2}plan_days: 3\n {2}core: 2$/m);
  assert.match(laid, /# What the app must do/, 'comments survive');

  const baseline = run(['baseline', '--dir', dir, '--today', '2026-02-02'], GIT_ID);
  assert.equal(baseline.status, 0, baseline.stderr);
  const agreed = readFileSync(file, 'utf8');
  assert.doesNotMatch(agreed, /phase: planning/);
  assert.match(agreed, /baseline: \{ date: 2026-02-02, points: 11, plan_days: 3 \}/);
  assert.match(agreed, /type: baseline, title: "Plan agreed"/);
  assert.equal(gitOut(dir, 'tag'), 'baseline');
  assert.equal(run(['check', '--dir', dir]).status, 0);
  assert.equal(run(['status', '--dir', dir, '--today', '2026-02-02']).status, 0);
  assert.match(run(['baseline', '--dir', dir]).stderr, /agreed on 2026-02-02/);
  assert.match(run(['layout', '--dir', dir]).stderr, /This plan is agreed/);
});

test('baseline refuses a plan that is not complete', () => {
  const dir = join(tmp(), 'acme-pilot');
  run(['init', dir], GIT_ID);
  const out = run(['baseline', '--dir', dir]);
  assert.notEqual(out.status, 0);
  assert.match(out.stdout, /project\.plan_days/);
  assert.match(readFileSync(join(dir, 'solopilot.yaml'), 'utf8'), /phase: planning/);
});

test('install wires a project without committing anything there', () => {
  const home = tmp();
  const project = join(tmp(), 'project');
  execFileSync('git', ['init', '--quiet', project]);
  const pilot = join(tmp(), 'pilot');
  run(['init', pilot]);
  const out = run(['install', project, '--dir', pilot], { HOME: home, USERPROFILE: home });
  assert.equal(out.status, 0, out.stderr);
  const settings = JSON.parse(readFileSync(join(project, '.claude', 'settings.local.json'), 'utf8'));
  assert.ok(settings.env.SOLOPILOT_DIR.endsWith('/pilot'));
  assert.match(JSON.stringify(settings.hooks.Stop), /solopilot\/remind\.mjs/);
  assert.ok(existsSync(join(home, '.claude', 'skills', 'solopilot', 'SKILL.md')));
  assert.match(readFileSync(join(project, '.git', 'info', 'exclude'), 'utf8'), /\.claude\/settings\.local\.json/);
  assert.match(readFileSync(join(pilot, '.env'), 'utf8'), /^PROJECT_REPO=/m);
  // Without the machine's global excludes, which could hide a mistake.
  const noGlobal = join(tmp(), 'empty-excludes');
  writeFileSync(noGlobal, '');
  assert.equal(execFileSync('git', ['-c', `core.excludesFile=${noGlobal}`, 'status', '--porcelain'], { cwd: project, encoding: 'utf8' }), '');
});

test('install refuses a pilot directory inside the project', () => {
  for (const name of ['pilot', '..pilot']) {
    const project = join(tmp(), 'project');
    execFileSync('git', ['init', '--quiet', project]);
    const pilot = join(project, name);
    run(['init', pilot]);
    const out = run(['install', project, '--dir', pilot], { HOME: tmp(), USERPROFILE: tmp() });
    assert.notEqual(out.status, 0, name);
    assert.match(out.stderr, /inside the project repository/);
  }
});

test('install stops when the project re-includes the settings file', () => {
  const project = join(tmp(), 'project');
  execFileSync('git', ['init', '--quiet', project]);
  writeFileSync(join(project, '.gitignore'), '!.claude/settings.local.json\n');
  const pilot = join(tmp(), 'pilot');
  run(['init', pilot]);
  const out = run(['install', project, '--dir', pilot], { HOME: tmp(), USERPROFILE: tmp() });
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /re-include/);
  assert.equal(existsSync(join(project, '.claude', 'settings.local.json')), false);
  assert.equal(existsSync(join(pilot, '.env')), false);
});

test('install refuses settings of an unexpected shape, before writing anything', () => {
  const project = join(tmp(), 'project');
  execFileSync('git', ['init', '--quiet', project]);
  mkdirSync(join(project, '.claude'));
  const settings = '{ "permissions": { "additionalDirectories": "C:/shared" } }';
  writeFileSync(join(project, '.claude', 'settings.local.json'), settings);
  const pilot = join(tmp(), 'pilot');
  run(['init', pilot]);
  const out = run(['install', project, '--dir', pilot], { HOME: tmp(), USERPROFILE: tmp() });
  assert.notEqual(out.status, 0);
  assert.match(out.stderr, /shape Claude Code expects/);
  assert.equal(readFileSync(join(project, '.claude', 'settings.local.json'), 'utf8'), settings);
  assert.equal(existsSync(join(pilot, '.env')), false);
});
