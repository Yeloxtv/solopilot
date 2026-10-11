// Drives real Claude Code sessions without a terminal, for the end-to-end scenarios.
import { spawn } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// The Claude Code binary: CLAUDE_BIN, else the newest one shipped with an editor extension (the
// version the developer works with), else ~/.local/bin, else `claude` on the PATH.
export function findClaude() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  const exe = process.platform === 'win32' ? 'claude.exe' : 'claude';
  const found = [];
  for (const editor of ['.vscode', '.cursor', '.vscode-insiders', '.windsurf']) {
    const base = join(homedir(), editor, 'extensions');
    if (!existsSync(base)) continue;
    for (const name of readdirSync(base)) {
      const m = name.match(/^anthropic\.claude-code-(\d+)\.(\d+)\.(\d+)/);
      const bin = join(base, name, 'resources', 'native-binary', exe);
      if (m && existsSync(bin)) found.push({ bin, version: m.slice(1).map(Number) });
    }
  }
  found.sort((a, b) => b.version[0] - a.version[0] || b.version[1] - a.version[1] || b.version[2] - a.version[2]);
  if (found.length) return found[0].bin;
  const local = join(homedir(), '.local', 'bin', exe);
  return existsSync(local) ? local : 'claude';
}

// Tools that reach outside the sandbox (publishing, connectors, notifications, the web): never
// during a scenario.
export const OFF_LIMITS = [
  'Artifact', 'mcp__*', 'PushNotification', 'RemoteTrigger', 'ShareOnboardingGuide', 'SendMessage',
  'Workflow', 'CronCreate', 'ScheduleWakeup', 'DesignSync', 'WebFetch', 'WebSearch',
];

const short = (s, n = 160) => (s.length > n ? `${s.slice(0, n)}…` : s);

// What a tool call did, in one line: the command run, the file touched, the skill invoked.
function describe(name, input = {}) {
  if (name === 'Bash' || name === 'PowerShell') return short(String(input.command ?? '').replace(/\s+/g, ' '));
  if (input.file_path) return input.file_path;
  if (name === 'Skill') return String(input.skill ?? input.command ?? '');
  return short(JSON.stringify(input));
}

// One turn of a session: the first one fixes the session id, the next ones resume it.
export function turn(prompt, { bin, cwd, session, first, model, effort, budget, mode = 'default', allow = [], timeoutMs = 20 * 60e3 }) {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--permission-mode', mode, '--max-turns', '80'];
  args.push(first ? '--session-id' : '--resume', session);
  if (model) args.push('--model', model);
  if (effort) args.push('--effort', effort);
  if (budget) args.push('--max-budget-usd', String(budget)); // per turn: a resumed run does not count earlier spend
  if (allow.length) args.push('--allowedTools', ...allow);
  args.push('--disallowedTools', ...OFF_LIMITS);

  return new Promise((resolve) => {
    const started = Date.now();
    const child = spawn(bin, args, {
      cwd,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS: '30000' },
    });
    const events = [];
    let buffer = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      buffer += chunk;
      let i;
      while ((i = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, i).trim();
        buffer = buffer.slice(i + 1);
        if (line) try { events.push(JSON.parse(line)); } catch { events.push({ type: 'unparsed', line }); }
      }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => child.kill('SIGTERM'), timeoutMs);
    child.on('close', (code) => {
      clearTimeout(timer);
      const tools = [];
      const texts = [];
      for (const e of events) {
        if (e.type !== 'assistant') continue;
        for (const c of e.message?.content ?? []) {
          if (c.type === 'text' && c.text.trim()) texts.push(c.text);
          if (c.type === 'tool_use') tools.push({ name: c.name, what: describe(c.name, c.input) });
        }
      }
      const result = events.find((e) => e.type === 'result') ?? {};
      resolve({
        code,
        timedOut: Date.now() - started >= timeoutMs,
        seconds: Math.round((Date.now() - started) / 1000),
        cost: result.total_cost_usd,
        turns: result.num_turns,
        isError: Boolean(result.is_error) || code !== 0,
        final: result.result ?? texts.at(-1) ?? '',
        texts,
        tools,
        denials: result.permission_denials ?? [],
        hooks: events.filter((e) => e.type === 'system' && e.subtype === 'hook_response'),
        model: events.find((e) => e.type === 'system' && e.subtype === 'init')?.model,
        stderr: stderr.trim(),
        events,
      });
    });
  });
}
