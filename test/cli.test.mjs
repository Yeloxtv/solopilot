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
const run = (args, env = {}) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', env: { ...process.env, SOLOPILOT_DIR: '', SOLOPILOT_REPO: '', ...env } });
const tmp = () => mkdtempSync(join(tmpdir(), 'solopilot-'));

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
