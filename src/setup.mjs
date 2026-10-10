// solopilot init: create a pilot directory. solopilot install: wire it into a project repository
// for Claude Code, without committing anything there.
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILE } from './backlog.mjs';
import { calendar, localToday } from './calendar.mjs';
import { git } from './repo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKILL = join(ROOT, 'claude', 'skills', 'solopilot');
const LOCAL_SETTINGS = '.claude/settings.local.json';
const slash = (p) => p.replace(/\\/g, '/');

function writeIfMissing(file, content) {
  if (!existsSync(file)) writeFileSync(file, content);
}

// One skill for every project: the paths come from each project's local settings, or from the
// current directory while a first plan is drawn up in the pilot directory.
export function installSkill() {
  const skills = join(homedir(), '.claude', 'skills', 'solopilot');
  rmSync(skills, { recursive: true, force: true });
  mkdirSync(dirname(skills), { recursive: true });
  cpSync(SKILL, skills, { recursive: true });
  return skills;
}

export function init(dir, { name, locale = 'en', today = localToday() } = {}) {
  const target = resolve(dir);
  if (existsSync(join(target, FILE))) throw new Error(`${join(target, FILE)} already exists`);
  mkdirSync(target, { recursive: true });
  const projectName = name || target.split(/[\\/]/).filter(Boolean).pop().replace(/-pilot$/, '');
  // A first guess at the target: 31 plan days at half a day per working day, about 12 weeks out.
  const guess = calendar().add(today, 62);
  const starter = readFileSync(join(ROOT, 'templates', 'solopilot.yaml'), 'utf8')
    .replaceAll('__NAME__', projectName)
    .replaceAll('__LOCALE__', locale)
    .replaceAll('__START__', today)
    .replaceAll('__TARGET__', guess);
  writeFileSync(join(target, FILE), starter);
  writeIfMissing(join(target, '.gitignore'), 'build/\n.env\nnode_modules/\n');
  writeIfMissing(join(target, '.env.example'), '# Copy to .env (never committed). `solopilot install` adds PROJECT_REPO.\nSLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ\n');
  // The project documents the first plan is drawn from, versioned with it: features point to them.
  mkdirSync(join(target, 'sources'), { recursive: true });
  writeIfMissing(join(target, 'sources', '.gitkeep'), '');

  // Its own repository, with a first commit: the skill records each update with `commit -am`, and the
  // reminder hook reads the history of the backlog. Never a commit in an enclosing repository, which
  // could be the project's.
  let repo = git(['rev-parse', '--show-toplevel'], target);
  if (!repo) {
    git(['init', '--quiet'], target);
    repo = git(['rev-parse', '--show-toplevel'], target);
  }
  const own = Boolean(repo) && realpathSync(resolve(repo)) === realpathSync(target);
  let committed = false;
  if (own) {
    git(['add', '--', FILE, '.gitignore', '.env.example', 'sources/.gitkeep'], target);
    committed = git(['commit', '--quiet', '-m', 'solopilot init'], target) !== null;
  }
  // The first plan is drawn up with /solopilot in this directory, before any project is wired.
  const skill = installSkill();
  return { dir: target, repo, own, committed, skill };
}

function setEnv(dir, key, value) {
  const file = join(dir, '.env');
  const lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/).filter((l) => l && !l.startsWith(`${key}=`)) : [];
  lines.push(`${key}=${value}`);
  writeFileSync(file, lines.join('\n') + '\n');
}

export function cliOnPath() {
  try {
    execFileSync('solopilot', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
    return true;
  } catch {
    return false;
  }
}

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Claude Code's local settings, checked before anything is written: a shape we do not expect is
// refused rather than merged into something wrong.
function readSettings(file) {
  if (!existsSync(file)) return {};
  let s;
  try { s = JSON.parse(readFileSync(file, 'utf8')); } catch { throw new Error(`${file} is not valid JSON; nothing was changed`); }
  const ok = isObject(s)
    && (s.env === undefined || isObject(s.env))
    && (s.permissions === undefined || isObject(s.permissions))
    && (s.permissions?.additionalDirectories === undefined || Array.isArray(s.permissions.additionalDirectories))
    && (s.hooks === undefined || isObject(s.hooks))
    && (s.hooks?.Stop === undefined || Array.isArray(s.hooks.Stop));
  if (!ok) throw new Error(`${file} does not have the shape Claude Code expects (objects for env, permissions and hooks; lists for additionalDirectories and hooks.Stop); nothing was changed`);
  return s;
}

export function install(dir, repoArg) {
  const log = [];
  const top = git(['rev-parse', '--show-toplevel'], resolve(repoArg));
  if (!top) throw new Error(`${repoArg} is not a git repository`);
  // Real paths, so a link or a junction cannot hide a pilot directory inside the project.
  const project = realpathSync(resolve(top));
  const pilot = realpathSync(resolve(dir));
  const rel = relative(project, pilot);
  if (!(rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))) {
    throw new Error('The pilot directory is inside the project repository: move it next to it, or it would be committed with the project');
  }
  if (git(['ls-files', '--error-unmatch', LOCAL_SETTINGS], project) !== null) {
    throw new Error(`${LOCAL_SETTINGS} is tracked in the project: the pilot paths would be committed. Untrack it first.`);
  }
  const file = join(project, LOCAL_SETTINGS);
  const s = readSettings(file);

  // Exclude the settings file locally, then make sure git really ignores it: a negation in the
  // project's .gitignore beats .git/info/exclude, and the pilot paths would reach the client.
  let exclude = git(['rev-parse', '--git-path', 'info/exclude'], project);
  if (!exclude) throw new Error(`Cannot locate .git/info/exclude in ${project}; nothing was changed`);
  if (!isAbsolute(exclude)) exclude = join(project, exclude);
  mkdirSync(dirname(exclude), { recursive: true });
  const current = existsSync(exclude) ? readFileSync(exclude, 'utf8') : '';
  if (!current.split(/\r?\n/).includes(LOCAL_SETTINGS)) writeFileSync(exclude, current + (current && !current.endsWith('\n') ? '\n' : '') + LOCAL_SETTINGS + '\n');
  if (git(['check-ignore', '-q', LOCAL_SETTINGS], project) === null) {
    throw new Error(`git still tracks changes to ${LOCAL_SETTINGS} in the project (does its .gitignore re-include it?). Fix that first: only the local exclusion was added.`);
  }
  log.push(`${LOCAL_SETTINGS} excluded from git locally`);

  setEnv(pilot, 'PROJECT_REPO', project);
  log.push(`PROJECT_REPO written to ${join(pilot, '.env')}`);

  const skills = installSkill();
  log.push(`Skill /solopilot copied to ${skills}`);

  s.env = { ...(s.env || {}), SOLOPILOT_DIR: slash(pilot), SOLOPILOT_REPO: slash(project) };
  s.permissions = s.permissions || {};
  s.permissions.additionalDirectories = [...new Set([...(s.permissions.additionalDirectories || []), slash(pilot)])];
  s.hooks = s.hooks || {};
  const stop = (s.hooks.Stop || []).filter((g) => !JSON.stringify(g).includes('solopilot/remind.mjs'));
  stop.push({ hooks: [{ type: 'command', command: `node "${slash(join(skills, 'remind.mjs'))}"` }] });
  s.hooks.Stop = stop;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(s, null, 2) + '\n');
  log.push(`Pilot paths, folder access and reminder hook written to ${file}`);
  return { project, pilot, log };
}
