#!/usr/bin/env node
// End-to-end scenarios: real Claude Code sessions driving the /solopilot skill on fictional projects,
// rebuilt from scratch on every run, with the developer's answers scripted turn by turn. They spend
// real tokens: run them on purpose, never from `npm test`.
//
//   node e2e/run.mjs <scenario> [--model sonnet] [--effort medium] [--mode default] [--allow "Bash(solopilot *)"]...
//
// --allow may repeat; --budget caps the spend of each turn, in dollars. The report (turns, tools
// used, permission denials, hooks, checks, cost) lands in e2e/results/.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { localToday } from '../src/calendar.mjs';
import { findClaude, turn } from './claude.mjs';
import { ROOT } from './fixtures.mjs';

const opts = { model: 'sonnet', effort: 'medium', mode: 'default', allow: [], _: [] };
for (const argv = process.argv.slice(2); argv.length;) {
  const a = argv.shift();
  if (a === '--allow') opts.allow.push(argv.shift());
  else if (a.startsWith('--')) opts[a.slice(2)] = argv.shift();
  else opts._.push(a);
}
const [name] = opts._;
if (!name) {
  console.error('Usage: node e2e/run.mjs <scenario> [--model sonnet] [--effort medium] [--mode default] [--allow "Bash(solopilot *)"]...');
  process.exit(1);
}

// The skill calls the CLI by name: it must be the one of this repository (npm link).
try {
  execFileSync('solopilot', ['--version'], { stdio: 'ignore', shell: process.platform === 'win32' });
} catch {
  console.error('`solopilot` is not on the PATH: run `npm link` in this repository first.');
  process.exit(1);
}

const scenario = (await import(`./scenarios/${name}.mjs`)).default;
// Every turn of the run, for the checks that span several exchanges.
const ctx = { today: localToday(), runs: [] };
const { model, effort, mode, allow } = opts;
const safely = (fn) => { try { return fn(); } catch { return false; } };
const settings = { bin: findClaude(), model, effort, mode, budget: opts.budget, allow: [...allow, ...(scenario.allow ?? [])] };
const sandbox = mkdtempSync(join(tmpdir(), `solopilot-e2e-${name}-`));
// The list of all projects lives in the sandbox too: the machine's own is never touched.
process.env.SOLOPILOT_HOME = join(sandbox, 'solopilot-home');
const fx = scenario.build(sandbox, ctx);
scenario.before?.(fx, ctx);
const session = randomUUID();
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const out = join(ROOT, 'e2e', 'results', `${stamp}-${name}`);
mkdirSync(out, { recursive: true });

console.log(`${scenario.title}: sandbox ${sandbox}`);
console.log(`Claude Code ${settings.bin}, model ${settings.model}, effort ${settings.effort}, mode ${settings.mode}${allow.length ? `, allowed ${allow.join(' ')}` : ''}`);

const report = [`# ${scenario.title}`, '', `- Run: ${stamp}, today ${ctx.today}`, `- Sandbox: \`${sandbox}\``, `- Claude Code: \`${settings.bin}\`, model ${settings.model}, effort ${settings.effort}, permission mode ${settings.mode}${allow.length ? `, allowed ${allow.join(' ')}` : ''}`, ''];
let failed = 0;
let cost = 0;
let n = 0;
let remindedBefore = 0;
let stalled = 0;
let lastProgress = null;
// A turn may repeat the same answer (`repeat: { max, until }`) until the files show what it waits
// for: the number of exchanges a step takes varies from one session to the next.
const plan = scenario.turns.flatMap((t) => Array.from({ length: t.repeat?.max ?? 1 }, (_, k) => ({ ...t, last: k === (t.repeat?.max ?? 1) - 1 })));
for (const t of plan) {
  if (t.skip) continue;
  const i = n++;
  process.stdout.write(`\nTurn ${i + 1}: ${t.prompt.length > 90 ? `${t.prompt.slice(0, 90)}…` : t.prompt}\n`);
  const run = await turn(t.prompt, { ...settings, cwd: fx.cwd, session, first: i === 0 });
  writeFileSync(join(out, `turn-${i + 1}.jsonl`), run.events.map((e) => JSON.stringify(e)).join('\n'));
  ctx.runs.push(run);
  cost = run.cost ?? cost;
  // A repeated answer stops when the files show what it waits for, or after two turns that changed
  // nothing: a stuck session should not burn its whole budget.
  const progress = scenario.progress ? safely(() => scenario.progress(fx)) : null;
  stalled = progress !== null && progress === lastProgress ? stalled + 1 : 0;
  lastProgress = progress;
  if (t.repeat && stalled >= 2) console.log('  two turns without any change: stopping here');
  const done = t.repeat ? t.last || stalled >= 2 || safely(() => t.repeat.until(fx, ctx)) : true;
  if (t.repeat && done) for (const rest of plan) if (rest.prompt === t.prompt && rest !== t && plan.indexOf(rest) > plan.indexOf(t)) rest.skip = true;
  let checks = [];
  if (done && t.checks) {
    try {
      checks = t.checks(fx, run, ctx).map(([label, ok, detail = '']) => ({ label, ok: Boolean(ok), detail: String(detail) }));
    } catch (e) {
      checks = [{ label: 'checks could run', ok: false, detail: e.message }];
    }
  }
  failed += checks.filter((c) => !c.ok).length;

  report.push(`## Turn ${i + 1}: \`${t.prompt}\``, '');
  report.push(`${run.seconds} s, ${run.turns ?? '?'} model turns${run.isError ? `, **error** (exit ${run.code}${run.timedOut ? ', timed out' : ''})` : ''}${run.model ? `, ${run.model}` : ''}`, '');
  report.push('### Checks', '', ...checks.map((c) => `- ${c.ok ? '✓' : '✗'} ${c.label}${c.detail && !c.ok ? ` — ${c.detail}` : c.detail ? ` (${c.detail})` : ''}`), '');
  report.push('### Permission denials', '', ...(run.denials.length ? run.denials.map((d) => `- ${d.tool_name}: \`${JSON.stringify(d.tool_input ?? {}).slice(0, 200)}\``) : ['- none']), '');
  report.push('### Hooks', '', ...(run.hooks.length ? run.hooks.map((h) => `- ${h.hook_event ?? h.hook_event_name ?? ''} ${h.hook_name ?? ''}: \`${String(h.output ?? h.stdout ?? JSON.stringify(h)).replace(/\s+/g, ' ').slice(0, 240)}\``) : ['- none']), '');
  // The reminder hook leaves a marker in the temp directory the first time it speaks in a session.
  const reminders = readdirSync(tmpdir()).filter((f) => f.startsWith(`solopilot-reminder-${session}-`));
  const reminded = reminders.length > remindedBefore;
  remindedBefore = reminders.length;
  report.push(`Reminder hook: ${reminded ? '**fired during this turn**' : 'silent'}`, '');
  if (reminded) console.log('  the reminder hook fired during this turn');
  report.push('### Tools used', '', ...(run.tools.length ? run.tools.map((x) => `- ${x.name}: \`${x.what.replace(/`/g, "'")}\``) : ['- none']), '');
  report.push('### What Claude said', '', run.texts.join('\n\n---\n\n') || '(nothing)', '');
  if (run.stderr) report.push('### stderr', '', '```', run.stderr.slice(0, 2000), '```', '');

  for (const c of checks) console.log(`  ${c.ok ? '✓' : '✗'} ${c.label}${c.ok ? '' : c.detail ? ` — ${c.detail}` : ''}`);
  if (run.denials.length) console.log(`  permission denials: ${run.denials.map((d) => d.tool_name).join(', ')}`);
  console.log(`  ${run.seconds} s${run.cost !== undefined ? `, $${run.cost.toFixed(2)} so far` : ''}`);
  if (run.isError) break;
}

report.splice(5, 0, `- Result: ${failed ? `**${failed} check(s) failed**` : 'all checks passed'}, cost about $${cost.toFixed(2)}`, '');
writeFileSync(join(out, 'report.md'), report.join('\n'));
console.log(`\n${failed ? `${failed} check(s) failed` : 'All checks passed'}. Report: ${join(out, 'report.md')}`);
process.exit(failed ? 1 : 0);
