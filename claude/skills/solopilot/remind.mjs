#!/usr/bin/env node
// Claude Code Stop hook: reminds you to run /solopilot when tagged commits in the project have not
// been reported in the backlog yet. Never blocks; reminds once per session until something new is
// committed. Declared in the project's .claude/settings.local.json by `solopilot install`.
//
// Node built-ins only: it runs from ~/.claude/skills/solopilot/, without solopilot's dependencies.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let input = {};
try { input = JSON.parse(readFileSync(0, 'utf8')); } catch {}
if (input.stop_hook_active) process.exit(0);

const pilot = process.env.SOLOPILOT_DIR;
const project = process.env.SOLOPILOT_REPO || process.env.CLAUDE_PROJECT_DIR || input.cwd;
const backlog = pilot && join(pilot, 'solopilot.yaml');
if (!project || !backlog || !existsSync(backlog)) process.exit(0);

const git = (args, cwd) => {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { return null; }
};

if (git(['status', '--porcelain', '--', 'solopilot.yaml'], pilot)) process.exit(0); // an update is under way

const ref = (readFileSync(backlog, 'utf8').match(/^\s*last_commit:\s*"?([0-9a-f]{7,40})/m) || [])[1];
let range = ['HEAD'];
if (ref && git(['cat-file', '-e', `${ref}^{commit}`], project) !== null) range = [`${ref}..HEAD`];
else {
  const date = git(['log', '-1', '--format=%cI', '--', 'solopilot.yaml'], pilot);
  if (date) range = [`--since=${date}`, 'HEAD'];
}

const subjects = (git(['log', ...range, '--format=%s'], project) || '').split('\n');
const ids = new Set(subjects.flatMap((s) => [...s.matchAll(/\[([^\]]+)\]/g)].flatMap((m) => m[1].match(/[TS]\d{2,4}/g) || [])));
if (!ids.size) process.exit(0);

const mark = join(tmpdir(), `solopilot-reminder-${input.session_id || 'session'}-${ids.size}`);
if (existsSync(mark)) process.exit(0);
writeFileSync(mark, '');

const list = [...ids].slice(0, 6).join(', ') + (ids.size > 6 ? '…' : '');
console.log(JSON.stringify({
  systemMessage: `solopilot: ${ids.size} task(s) committed since the last update (${list}). Run /solopilot at the end of the session.`,
}));
