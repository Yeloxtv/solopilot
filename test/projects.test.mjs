import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadLocale } from '../src/i18n.mjs';
import { forget, isRegistered, loadRanges, overloadsDuring, projectInfo, register, registered, weeklyLoad } from '../src/projects.mjs';
import { projectsText } from '../src/report.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BIN = join(ROOT, 'bin', 'solopilot.mjs');
const DEMO = join(ROOT, 'examples', 'demo');
const tmp = () => mkdtempSync(join(tmpdir(), 'solopilot-'));
// The registry of this test run, never the machine's.
process.env.SOLOPILOT_HOME = tmp();

// Wednesday 2026-10-14. A runs at half a day until November 13; B at three quarters from October 26;
// C is delivered.
const TODAY = '2026-10-14';
const A = { name: 'A', start: '2026-09-28', end: '2026-11-13', focus: 0.5, done: false };
const B = { name: 'B', start: '2026-10-26', end: '2026-12-04', focus: 0.75, done: false };
const C = { name: 'C', start: '2026-10-01', end: '2026-12-31', focus: 0.5, done: true };

test('the registry lists each pilot directory once, and forgets it', () => {
  const a = tmp();
  register(a);
  register(`${a}/`);
  assert.equal(registered().length, 1);
  assert.ok(isRegistered(a));
  assert.equal(forget(a), 1);
  assert.deepEqual(registered(), []);
  assert.equal(forget(a), 0);
});

test('a folder that is gone is shown, and left out of the load', () => {
  const gone = projectInfo(join(tmp(), 'gone'));
  assert.equal(gone.missing, true);
  assert.deepEqual(weeklyLoad([gone, A], TODAY).map((w) => w.projects.join()), ['A', 'A', 'A', 'A', 'A']);
  assert.match(projectsText([gone], [], loadLocale('en').t, TODAY), /^folder not found: /);
});

test('the promised load adds up week by week, and a delivered project no longer counts', () => {
  const ranges = loadRanges(weeklyLoad([A, B, C], TODAY));
  assert.deepEqual(ranges.map(({ from, to, load, over }) => [from, to, load, over]), [
    ['2026-10-12', '2026-10-23', 0.5, false],
    ['2026-10-26', '2026-11-13', 1.25, true],
    ['2026-11-16', '2026-12-04', 0.75, false],
  ]);
  assert.deepEqual(ranges[1].projects, ['A', 'B']);
  assert.deepEqual(overloadsDuring(ranges, '2026-11-20', '2026-12-04'), [], 'after the overlap, B holds');
  assert.equal(overloadsDuring(ranges, TODAY, '2026-11-02').length, 1);
});

test('the overview says when at least one projection will not hold', () => {
  const ranges = loadRanges(weeklyLoad([A, B], TODAY));
  const en = projectsText([], ranges, loadLocale('en').t, TODAY);
  assert.match(en, /^No project registered yet/);
  const projects = [
    { ...A, dir: '/a', client: 'Acme', phase: 'agreed', target: '2026-11-20', finishCore: '2026-11-06', marginCore: 10, chase: 1, unasked: 2, growthLevel: 'medium' },
    { ...B, dir: '/b', phase: 'planning', target: '2026-12-04' },
  ];
  const text = projectsText(projects, ranges, loadLocale('en').t, TODAY);
  assert.match(text, /^A \(Acme\) · agreed · target November 20 · 0\.5 d per working day · core November 6, 10 working days to spare · 1 to chase · 2 never asked · scope grown\n {2}\/a\n/);
  assert.match(text, /\nB · being planned · target December 4 · 0\.75 d per working day\n/);
  assert.match(text, /\n! October 26 to November 13: 1\.25 d per working day \(A and B\)\n/);
  assert.match(text, /\nOver one day: at least one projection will not hold\.$/);
  const fr = projectsText(projects, ranges, loadLocale('fr').t, TODAY);
  assert.match(fr, /cœur le 6 novembre, 10 j ouvrés d'avance · 1 à relancer · 2 jamais posées · périmètre en hausse/);
  assert.match(fr, /\n! Du 26 octobre au 13 novembre : 1,25 j par jour ouvré \(A et B\)\n/);
  assert.match(projectsText([projects[1]], loadRanges(weeklyLoad([B], TODAY)), loadLocale('en').t, TODAY), /Never over one day/);
});

test('an agreed plan is read as the portfolio sees it', () => {
  const dir = tmp();
  cpSync(join(DEMO, 'solopilot.yaml'), join(dir, 'solopilot.yaml'));
  const x = projectInfo(dir, { today: '2026-10-21' });
  assert.equal(x.phase, 'agreed');
  assert.equal(x.focus, 0.5);
  assert.equal(x.done, false);
  assert.ok(x.end >= x.finishCore && x.finishCore > '2026-10-21');
});

test('solopilot projects lists the registered projects, and status warns while they overlap', () => {
  const HOME = tmp();
  const env = { ...process.env, SOLOPILOT_HOME: '', SOLOPILOT_DIR: '', SOLOPILOT_REPO: '', HOME, USERPROFILE: HOME, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
  const run = (...args) => spawnSync(process.execPath, [BIN, ...args], { encoding: 'utf8', env });
  const base = tmp();
  const fieldbook = join(base, 'fieldbook-pilot');
  const kerlan = join(base, 'kerlan-pilot');
  assert.match(run('init', fieldbook).stdout, /Listed in .*projects\.json/);
  cpSync(join(DEMO, 'solopilot.yaml'), join(fieldbook, 'solopilot.yaml'));
  run('init', kerlan, '--name', 'Kerlan');
  const file = join(kerlan, 'solopilot.yaml');
  writeFileSync(file, readFileSync(file, 'utf8').replace(/start: \S+/, 'start: 2026-10-26').replace(/target: \S+/, 'target: 2026-12-18').replace('focus: 0.5', 'focus: 0.75'));

  const all = run('projects', '--today', '2026-10-21');
  assert.equal(all.status, 0, all.stderr);
  assert.match(all.stdout, /Fieldbook \(Harbor & Pine\) · agreed · target November 27/);
  assert.match(all.stdout, /Kerlan · being planned · target December 18 · 0\.75 d per working day/);
  assert.match(all.stdout, /\n! October 26 to \w+ \d+: 1\.25 d per working day \(Fieldbook and Kerlan\)/);
  assert.match(run('status', '--dir', fieldbook, '--today', '2026-10-21').stdout, /All projects together: 1\.25 d promised per working day from October 26 to/);
  assert.match(run('projects', '--today', '2026-10-21', '--locale', 'fr').stdout, /! Du 26 octobre au/);

  assert.match(run('projects', '--forget', kerlan).stdout, /Taken off the list/);
  assert.match(run('projects', '--today', '2026-10-21').stdout, /Never over one day/);
  assert.doesNotMatch(run('status', '--dir', fieldbook, '--today', '2026-10-21').stdout, /All projects together/);
  mkdirSync(join(base, 'empty'));
  assert.match(run('projects', '--forget', join(base, 'empty')).stdout, /Not on the list/);
});
