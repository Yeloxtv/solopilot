# solopilot

**Project steering for solo developers.** A versioned backlog, an honest projection, a dashboard and a Slack digest, wired into [Claude Code](https://claude.com/claude-code).

[Version française](README.fr.md)

![The solopilot dashboard on the Fieldbook demo project](docs/dashboard.png)

You are building a real app for a client, alone. No project manager, no ticketing tool, a spec and a deadline. Every few days, the same questions come back: *Will the core be ready on time? What is blocking me? What do I need from the client, and by when?*

solopilot answers them from one YAML file you keep in git, without timesheets.

## What makes it different

- **An honest projection.** The plan is estimated upfront in work days, each carrying load points. The projection divides what is left by the plan's own estimate times the share of your day you really give the project, never by the pace of the first days, which says nothing about the heavy days ahead.
- **Work days are not calendar days.** If you give a project half of each day, one planned work day takes two working days of calendar. The dashboard shows both, side by side.
- **Core and everything.** You commit to a core (day 1 to day *n*) and aim for the whole plan. Both are tracked against the target date, with the margin in working days.
- **Due dates follow the work.** A question needed before day 9 becomes urgent when the work reaches day 9, not on a date fixed at kickoff. You stop blaming a client for being "late" on something you have not reached yet.
- **Private by design.** The plan lives in its own directory, next to the project, never inside it. Your client gets a clean repository; your delays and margins stay yours. Only task ids travel with the code, in commit messages: `[T024] add search`.
- **Claude Code native.** The `/solopilot` skill reads your tagged commits, proposes status changes, writes them once you approve, rebuilds the dashboard and posts the digest. A hook reminds you when commits are waiting to be reported.
- **English and French**, for the dashboard, the digest and the terminal report.

## Quick start

Requires Node.js 20 or later and git.

```bash
npm install -g github:Yeloxtv/solopilot

solopilot init ../acme-pilot          # a pilot directory next to your project
cd ../acme-pilot
# describe your plan in solopilot.yaml: days, points, tasks
solopilot check                       # validate it
solopilot status                      # where the project stands
solopilot build                       # dashboard in build/index.html
solopilot install ../acme             # wire it into Claude Code for that project
```

To try it on the demo project first:

```bash
git clone https://github.com/Yeloxtv/solopilot && cd solopilot
npm install
npm run demo                          # then open examples/demo/build/index.html
```

## Layout

One pilot directory per project, ideally its own private git repository:

```
workspace/
├── acme/                 the project, handed over to the client
└── acme-pilot/           private, never handed over
    ├── solopilot.yaml    the source of truth
    ├── .env              SLACK_WEBHOOK_URL, PROJECT_REPO (not committed)
    └── build/            the generated dashboard (not committed)
```

`solopilot install ../acme` commits nothing in the project. It writes to `acme/.claude/settings.local.json`, which it excludes from git locally:

- the paths of both directories, for the skill and the hook;
- Claude Code's access to the pilot directory;
- the reminder hook.

It also copies the `/solopilot` skill to `~/.claude/skills/`, shared by all your projects.

## Day to day

1. In the project, start every commit that moves a task with its id: `[T024] search by city`, or `[T025 S05] wire the site list`.
2. At the end of a session, in Claude Code: `/solopilot`. The skill lists the tagged commits, proposes a table of status changes with their evidence, and waits for your approval.
3. Once you approve, it writes `solopilot.yaml`, logs the session, rebuilds the dashboard, posts the digest and commits in the pilot directory.

After a client meeting, ask it to replan: it measures the impact of every change on the core and on the whole plan before writing anything.

## Commands

| Command | What it does |
| --- | --- |
| `solopilot init [dir]` | Create a pilot directory with a commented starter `solopilot.yaml` |
| `solopilot install <repo>` | Wire the pilot directory into a project for Claude Code |
| `solopilot check` | Validate `solopilot.yaml` |
| `solopilot status` | Where the project stands: gap, projection, current day, alerts |
| `solopilot commits` | Tagged project commits since the last update, grouped by task |
| `solopilot head` | Last project commit, recorded in `project.last_commit` |
| `solopilot build` | Generate `build/index.html`, plus `build/publish.html` to host elsewhere |
| `solopilot slack [--dry-run]` | Post the digest to Slack, or print it |
| `solopilot slack --milestone <n>` | Announce the milestone of plan day *n* |

Options: `--dir <path>` (otherwise `SOLOPILOT_DIR`, or the nearest `solopilot.yaml`), `--today <YYYY-MM-DD>` to compute as of another date, `--locale en|fr` to override the project's language.

## The backlog

```yaml
project:
  name: Fieldbook
  client: Harbor & Pine
  locale: en
  start: 2026-09-28      # day 1
  target: 2026-11-27     # the date you committed to
  plan_days: 20          # work days in the plan
  core: 14               # the core: day 1 to day 14
  points_per_day: 6.3    # what a full work day is worth
  focus: 0.5             # share of each working day spent on this project

days:
  - { day: 1, points: 5, title: "Repository and data model" }
  # …

tasks:
  - { id: T001, day: 1, area: setup, status: done, done_on: 2026-09-28, title: "Repository, CI and test command" }
  - { id: S01, day: 7, area: accounts, status: todo, views: 3, title: "Sign-in screen" }

questions:
  - { id: Q01, before: 6, status: open, who: "Harbor & Pine", title: "Can an inspector edit a submitted inspection?", tasks: [T014] }
```

Every section is described in [docs/backlog.md](docs/backlog.md), and [examples/demo/solopilot.yaml](examples/demo/solopilot.yaml) shows a complete project. How the gap and the projection are computed is explained in [docs/how-it-computes.md](docs/how-it-computes.md).

## Slack and hosting

- **Slack**: create an app with Incoming Webhooks, connect it to an internal channel, and put the URL in `.env` as `SLACK_WEBHOOK_URL`. The digest shows internal delays: keep the channel away from your client.
- **Hosting the dashboard**: `build/index.html` is a single self-contained file (fonts aside). When `project.dashboard_url` points to a claude.ai artifact, the skill republishes `build/publish.html` there after each update, and the digest links to it.

## Status

solopilot comes from a tool used daily on a real client project, and is now being opened up. The file format may still change before 1.0. Ideas, issues and pull requests are welcome.

Run the tests with `npm test`.

## License

[MIT](LICENSE)
