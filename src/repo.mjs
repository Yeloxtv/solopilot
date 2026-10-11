// The project repository: found through SOLOPILOT_REPO (set by `solopilot install` in Claude Code's
// local settings) or PROJECT_REPO in the pilot directory's .env. solopilot only reads it.
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { TAG_IDS } from './backlog.mjs';

export function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
}

export function readEnv(dir, key) {
  if (process.env[key]) return process.env[key];
  const file = join(dir, '.env');
  if (!existsSync(file)) return null;
  const line = readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() || null : null;
}

export function projectRepo(dir) {
  const path = process.env.SOLOPILOT_REPO || readEnv(dir, 'PROJECT_REPO');
  if (!path) return null;
  const abs = resolve(dir, path);
  return git(['rev-parse', '--show-toplevel'], abs) ? abs : null;
}

export const NO_REPO = 'Project repository not found: set PROJECT_REPO in the pilot directory .env, or run `solopilot install <repo>`';

// Commits to look at: since project.last_commit if it still exists, otherwise since the last commit
// of the backlog in the pilot directory, otherwise the whole history.
function range(b, dir, repo) {
  const ref = b.project.last_commit;
  if (ref && git(['cat-file', '-e', `${ref}^{commit}`], repo) !== null) return [`${ref}..HEAD`];
  const date = git(['log', '-1', '--format=%cI', '--', 'solopilot.yaml'], dir);
  return date ? [`--since=${date}`, 'HEAD'] : ['HEAD'];
}

// Tagged commits of a git log, each with the files it touched: the evidence a status change rests on.
function tagged(repo, args) {
  const out = git(['log', ...args, '--name-only', '--format=%x1e%h%x09%s'], repo) || '';
  return out.split('\x1e').filter((s) => s.trim()).map((block) => {
    const [head, ...files] = block.split('\n');
    const [hash, ...rest] = head.split('\t');
    const subject = rest.join('\t');
    return { hash, subject, ids: tagIds(subject), files: files.map((f) => f.trim()).filter(Boolean) };
  }).filter((c) => c.ids.length);
}

export function taggedCommits(b, dir) {
  const repo = projectRepo(dir);
  if (!repo) throw new Error(NO_REPO);
  return tagged(repo, range(b, dir, repo));
}

// Commits already taken into account by an earlier update, for the tasks given: a task spread over
// several sessions shows all its evidence, not only the latest.
export function reportedBefore(b, dir, ids) {
  const repo = projectRepo(dir);
  const ref = b.project.last_commit;
  if (!repo || !ref || git(['cat-file', '-e', `${ref}^{commit}`], repo) === null) return [];
  const wanted = new Set(ids);
  return tagged(repo, ['-n', '2000', ref]).filter((c) => c.ids.some((id) => wanted.has(id)));
}

export const tagIds = (subject) => [...subject.matchAll(/\[([^\]]+)\]/g)].flatMap((m) => m[1].match(TAG_IDS) || []);

export function head(dir) {
  const repo = projectRepo(dir);
  if (!repo) throw new Error(NO_REPO);
  return git(['rev-parse', '--short=12', 'HEAD'], repo);
}
