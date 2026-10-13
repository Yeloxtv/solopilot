// Fictional projects for the end-to-end scenarios, rebuilt from scratch on every run. Dates are set
// against the real today, so a scenario reads the same whenever it runs.
import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const BIN = join(ROOT, 'bin', 'solopilot.mjs');

export const addDays = (iso, n) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const weekday = (iso) => new Date(`${iso}T12:00:00Z`).getUTCDay();
const daysBetween = (from, to) => Math.round((Date.parse(`${to}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 864e5);

const IDENTITY = ['-c', 'user.name=solopilot e2e', '-c', 'user.email=e2e@example.com'];
export const git = (cwd, args, env = {}) => execFileSync('git', [...IDENTITY, ...args], { cwd, encoding: 'utf8', env: { ...process.env, ...env } }).trim();
export const solopilot = (args, cwd) => execFileSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' });

export function newRepo(dir) {
  mkdirSync(dir, { recursive: true });
  execFileSync('git', ['init', '--quiet', '-b', 'main'], { cwd: dir });
  for (const [k, v] of [['user.name', 'solopilot e2e'], ['user.email', 'e2e@example.com'], ['core.autocrlf', 'false']]) execFileSync('git', ['config', k, v], { cwd: dir });
}

export function writeFiles(dir, files) {
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
}

export function commit(dir, message, isoDateTime, files = {}) {
  writeFiles(dir, files);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '--quiet', '-m', message], { GIT_AUTHOR_DATE: isoDateTime, GIT_COMMITTER_DATE: isoDateTime });
  return git(dir, ['rev-parse', '--short=12', 'HEAD']);
}

// ---------------------------------------------------------------- Fieldbook

// The demo plan stands as of Wednesday 2026-10-21. It moves by whole weeks to the last Wednesday
// that leaves Thursday and Friday before today: the work of those two days is committed in the
// project and not reported yet.
const DEMO_DAY = '2026-10-21';

const FILES = {
  base: {
    'package.json': '{\n  "name": "fieldbook",\n  "private": true,\n  "type": "module",\n  "scripts": { "test": "node --test" }\n}\n',
    'README.md': '# Fieldbook\n\nMobile inspection app for Harbor & Pine\'s facilities teams.\n\n```bash\nnpm test\n```\n',
    'src/inspections.mjs': `export const SEVERITIES = ['low', 'medium', 'high', 'critical'];

export function addFinding(inspection, { item, severity, note = '' }) {
  if (!SEVERITIES.includes(severity)) throw new Error(\`unknown severity: \${severity}\`);
  return { ...inspection, findings: [...inspection.findings, { item, severity, note: note.trim() }] };
}

export function addNote(inspection, index, note) {
  return { ...inspection, findings: inspection.findings.map((f, i) => (i === index ? { ...f, note: note.trim() } : f)) };
}
`,
    'test/inspections.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import { addFinding, addNote } from '../src/inspections.mjs';

test('a finding takes a known severity', () => {
  const i = addFinding({ findings: [] }, { item: 'Fire door', severity: 'high' });
  assert.equal(i.findings[0].severity, 'high');
  assert.throws(() => addFinding(i, { item: 'Exit sign', severity: 'urgent' }));
});

test('a note is attached to its finding', () => {
  const i = addNote(addFinding({ findings: [] }, { item: 'Fire door', severity: 'high' }), 0, '  Hinge loose ');
  assert.equal(i.findings[0].note, 'Hinge loose');
});
`,
  },
  colors: { 'src/design/colors.mjs': "export const colors = {\n  ink: '#1b2421', paper: '#f7f5f0', pine: '#2f5d50', harbor: '#2b4c6f',\n  severity: { low: '#6b8f71', medium: '#c9a227', high: '#d2691e', critical: '#b22222' },\n};\n" },
  type: { 'src/design/type.mjs': "export const type = { family: 'Inter, system-ui, sans-serif', scale: { caption: 12, body: 16, title: 20, heading: 28 } };\n\nexport const space = [0, 4, 8, 12, 16, 24, 32];\n" },
  components: {
    'src/design/components.mjs': `import { colors } from './colors.mjs';
import { space } from './type.mjs';

export const button = ({ label, tone = 'pine', disabled = false }) => ({ kind: 'button', label, disabled, style: { background: colors[tone], padding: space[3] } });
export const input = ({ name, label, error = null }) => ({ kind: 'input', name, label, error, style: { borderColor: error ? colors.severity.critical : colors.ink } });
export const card = (children) => ({ kind: 'card', children, style: { background: colors.paper, padding: space[4] } });
`,
    'test/design.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import { button, input, card } from '../src/design/components.mjs';

test('a disabled button keeps its label', () => assert.equal(button({ label: 'Sign in', disabled: true }).label, 'Sign in'));
test('an input in error shows a critical border', () => assert.equal(input({ name: 'email', label: 'Email', error: 'Required' }).style.borderColor, '#b22222'));
test('a card wraps its children', () => assert.equal(card([button({ label: 'OK' })]).children.length, 1));
`,
  },
  signin: (loading) => ({
    'src/screens/signin.mjs': `import { button, card, input } from '../design/components.mjs';

// Sign-in screen: the magic link is sent to the email typed in.
export function signinScreen({ error = null${loading ? ', sending = false' : ''} } = {}) {
  return card([
    input({ name: 'email', label: 'Work email', error }),
    button({ label: ${loading ? "sending ? 'Sending…' : 'Send me a sign-in link', disabled: sending" : "'Send me a sign-in link'"} }),
  ]);
}
`,
    'test/signin.test.mjs': `import test from 'node:test';
import assert from 'node:assert/strict';
import { signinScreen } from '../src/screens/signin.mjs';

test('default view: an email field and a send button', () => assert.equal(signinScreen().children[0].name, 'email'));
test('error view: the field carries the message', () => assert.equal(signinScreen({ error: 'Unknown email' }).children[0].error, 'Unknown email'));
${loading ? "test('loading view: the button is disabled while the link is sent', () => assert.equal(signinScreen({ sending: true }).children[1].disabled, true));\n" : ''}`,
  }),
  readme: { 'README.md': '# Fieldbook\n\nMobile inspection app for Harbor & Pine\'s facilities teams.\n\n```bash\nnpm test\n```\n\nScreens live in `src/screens/`, built from the components of `src/design/`.\n' },
  started: { 'src/screens/site-list.mjs': "import { card } from '../design/components.mjs';\n\n// Site list, sorted by name. Work in progress: empty and loading views to come.\nexport const siteListScreen = ({ sites = [] } = {}) => card(sites.map((s) => ({ kind: 'row', label: `${s.name}, ${s.city}` })));\n" },
};

// The commit subjects, in the language of the developer of each demo.
const SUBJECTS = {
  demo: ['[T016] Notes on findings', '[T017] Start the design system: color tokens', '[T017] Type scale and spacing tokens', '[T017] Button, input and card components',
    '[S01] Sign-in screen: default and error views', '[S01] Sign-in screen: loading view', 'Document where screens live'],
  'demo-fr': ['[T016] Notes sur les constatations', '[T017] Début du design system : couleurs', '[T017] Échelle typographique et espacements', '[T017] Composants bouton, champ et carte',
    '[S01] Écran de connexion : vues par défaut et erreur', '[S01] Écran de connexion : vue de chargement', 'Documenter où vivent les écrans'],
};

// demo: `demo` (English) or `demo-fr` (French), the plan the pilot directory starts from.
export function buildFieldbook(root, { today }, { demo = 'demo' } = {}) {
  let wednesday = addDays(today, -2);
  while (weekday(wednesday) !== 3) wednesday = addDays(wednesday, -1);
  const shift = daysBetween(DEMO_DAY, wednesday);
  const at = (offset, time) => `${addDays(wednesday, offset)}T${time}:00`;
  const s = SUBJECTS[demo];

  const project = join(root, 'fieldbook');
  newRepo(project);
  commit(project, s[0], at(-1, '18:00'), FILES.base);
  const lastCommit = commit(project, s[1], at(0, '17:30'), FILES.colors);
  commit(project, s[2], at(1, '10:15'), FILES.type);
  commit(project, s[3], at(1, '16:40'), FILES.components);
  commit(project, s[4], at(2, '11:05'), FILES.signin(false));
  commit(project, s[5], at(2, '15:20'), FILES.signin(true));
  const head = commit(project, s[6], at(2, '17:45'), FILES.readme);
  writeFiles(project, FILES.started);

  // The pilot directory, as `solopilot init` makes it, holding the demo plan moved in time. The
  // client workshop stays ahead: the first Tuesday after today.
  const pilot = join(root, 'fieldbook-pilot');
  newRepo(pilot);
  solopilot(['init', pilot, '--name', 'Fieldbook'], root);
  let meeting = addDays(today, 1);
  while (weekday(meeting) !== 2) meeting = addDays(meeting, 1);
  const plan = readFileSync(join(ROOT, 'examples', demo, 'solopilot.yaml'), 'utf8')
    .replaceAll('2026-10-23', '__MEETING__')
    .replace(/\b20\d\d-\d\d-\d\d\b/g, (d) => addDays(d, shift))
    .replaceAll('__MEETING__', meeting)
    .replace(/^(#.*\r?\n)+/, '# Fieldbook, a fictional project for the solopilot end-to-end scenarios.\n')
    .replace(/^(  holidays: .*)$/m, `$1\n  last_commit: ${lastCommit}`)
    // Q01 went to the client on the Monday of the week before: to chase by now.
    .replace(/(\{ id: Q01, [^}]*?asked_on: )[\d-]+/, `$1${addDays(wednesday, -9)}`);
  writeFileSync(join(pilot, 'solopilot.yaml'), plan);
  git(pilot, ['add', '-A']);
  git(pilot, ['commit', '--quiet', '-m', `plan as of ${wednesday}`]);
  solopilot(['install', project, '--dir', pilot], root);
  return { project, pilot, lastCommit, head, wednesday, meeting, cwd: project };
}

// The same week of work, on the French demo: its plan, and a developer who writes in French.
export const buildFieldbookFr = (root, ctx) => buildFieldbook(root, ctx, { demo: 'demo-fr' });

// ---------------------------------------------------------------- Kerlan

// A signed project, in French, before its first plan: a spec with deliberate gaps and explicit
// exclusions, notes from a first workshop, the quote, and two mockups showing default states only.
export function buildKerlan(root) {
  const pilot = join(root, 'kerlan-pilot');
  newRepo(pilot);
  solopilot(['init', pilot, '--name', 'Kerlan', '--locale', 'fr'], root);
  cpSync(join(ROOT, 'e2e', 'fixtures', 'kerlan', 'sources'), join(pilot, 'sources'), { recursive: true });
  git(pilot, ['add', '-A']);
  git(pilot, ['commit', '--quiet', '-m', 'sources du projet']);
  return { pilot, cwd: pilot };
}

// ---------------------------------------------------------------- Fieldbook, from its documents

// Fieldbook before its first plan, as `solopilot init --example` starts it: the documents of the
// demo in sources/ (a spec with deliberate gaps and explicit exclusions, kickoff workshop notes, the
// quote and two mockups showing default states only), in English, or in French with `--locale fr`.
export function buildFieldbookDocs(root, ctx, { locale = 'en' } = {}) {
  const pilot = join(root, 'fieldbook-pilot');
  newRepo(pilot);
  solopilot(['init', pilot, '--example', '--locale', locale], root);
  return { pilot, cwd: pilot };
}

export const buildFieldbookDocsFr = (root, ctx) => buildFieldbookDocs(root, ctx, { locale: 'fr' });
