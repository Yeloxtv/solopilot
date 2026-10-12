# Contributing to solopilot

Thanks for your interest. solopilot is young, and its file format may still change before 1.0: issues that tell how you plan and steer your own projects are as welcome as code.

## Getting started

Requires Node.js 20 or later, git, and [Claude Code](https://claude.com/claude-code) to try the skill.

```bash
git clone https://github.com/Yeloxtv/solopilot && cd solopilot
npm install
npm link          # the skill calls `solopilot` by name: this makes it the one of your clone
npm test
```

`npm run demo` builds the dashboard of the Fieldbook demo in `examples/demo/build/index.html`, and `npm run demo:fr` the French one in `examples/demo-fr/build/index.html`.

## Where things are

| Path | What it holds |
| --- | --- |
| `bin/solopilot.mjs` | The command line: one function per command |
| `src/` | The engine: reading and checking the backlog, the projection, the plan layout, the reports, the surgical editor that writes `solopilot.yaml` |
| `templates/` | The starter plan and the dashboard page |
| `locales/` | Every string the user reads, in English and in French |
| `claude/skills/solopilot/` | The `/solopilot` skill, its first-plan guide and the reminder hook |
| `examples/demo/` | Fieldbook: its documents in `sources/`, and its plan mid-way |
| `examples/demo-fr/` | The same Fieldbook in French, documents included |
| `docs/` | The backlog format, how it computes, the vision, the roadmap and the design notes |
| `e2e/` | End-to-end scenarios that drive real Claude Code sessions |

## Tests

`npm test` runs every `test/*.test.mjs` with Node's test runner, in a few seconds. They cover the backlog checks, the calendar, the projection, the layout, the surgical edits, scope growth, the questions, the scope document, the list of projects and the commands themselves, run as a user would, in temporary directories with a home of their own. GitHub Actions runs them on Linux, macOS and Windows, with Node 22 and 24, at every push.

## End-to-end scenarios

`e2e/` replays real Claude Code sessions on fictional projects rebuilt from scratch at each run, with scripted answers, then checks the files written:

```bash
npm run e2e -- daily          # an end-of-session update on Fieldbook, about $0.25
npm run e2e -- first-plan     # the first plan of Kerlan, in French, about $1.20
npm run e2e -- first-plan-en  # the first plan of Fieldbook, from its documents
```

They spend real tokens on your account, so they stay out of `npm test`. Run the one that matches what you changed. Run all three after editing the skill, and whenever Claude Code's default model changes: the skill is prose, and only these scenarios tell whether a new model still follows it. Each run writes a report in `e2e/results/` (not committed): the checks, the tools Claude used, the permission denials and what it said. Options: `--model`, `--effort`, `--budget` (dollars per turn).

## Principles to keep

- **Never measure the developer's hours.** Effort is declared, as a share of the day. A count of hours reads as time worked, whatever it really measures.
- **The client never sees a delay or a margin.** The scope document is built from chosen fields only.
- **The plan stays out of the project's repository.** Only task ids travel with the code, in commit messages.
- **Commands that write `solopilot.yaml` keep the rest of the file as it is**, comments included, or refuse to write.
- **Every string exists in English and in French**, in `locales/`.
- **The two demos tell the same story.** A change to `examples/demo` goes to `examples/demo-fr` too: a test fails as soon as their ids, dates, statuses or points differ.
- **The developer decides.** solopilot proposes, measures and alerts; it never changes the plan on its own.

## Proposing a change

Open an issue first for a change of behaviour or of the file format, to agree on it before the code. For a fix or a small improvement, a pull request is enough: keep it focused, add or update the tests, and update the docs and both locales when the change shows.
