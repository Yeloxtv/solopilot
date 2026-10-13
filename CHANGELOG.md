# Changelog

## Unreleased

- The skill talks to the developer in the language they write in, and in the plan's language until they have written anything: a bare `/solopilot` on a French plan no longer answers in English.
- End-to-end scenarios in French: `first-plan-fr`, the first plan from the French documents of Fieldbook, and `daily-fr`, an end-of-session update on the French demo, with commits written in French. `daily-en` runs the update with a developer typing in English; `daily` keeps a developer typing in French on an English plan, on purpose.

## 0.3.0

The first version published on npm.

- The dashboard carries English and French. It opens in the plan's language, and a switch in its header changes the page's words and date formats; the browser remembers the reader's choice. The plan's own text (titles, notes, questions) stays as it was written.
- `README.fr.md` shows the dashboard in French (`docs/dashboard.fr.png`).
- On Windows, `init`, `install`, `baseline`, `scope` and `commit` know a folder however its path is spelled. Started from a terminal that writes `c:\` where git writes `C:/`, `init` took its own pilot directory for part of another repository and committed nothing.
- A French demo, `examples/demo-fr`: the same Fieldbook, plan and documents in French (`npm run demo:fr`). `init --example --locale fr` copies its documents, and a test keeps the two demos telling the same story.

The scope document, reread:

- The dates it gives the client are the plan's, computed from day 1 at the plan estimate as if no work had been done: they move only when the plan changes, and never show the project ahead or behind.
- The questions the developer must answer themselves (`who` is `project.owner`) stay out of it.
- A feature added by a request (`source: R01`) reads "requested by Harbor & Pine", never the request's id. `check` refuses a request as a source when no request carries that id.
- `status` and the dashboard say when the estimate rests on hypotheses alone, until the real pace is judged.
- The dashboard's risks no longer escape a name twice: "Harbor & Pine" instead of "Harbor &amp;amp; Pine".
- A value that already ends on a period takes no second one: "vers le 22 oct." instead of "vers le 22 oct..".

## 0.2.0

The version the repository went public with, tagged `v0.2.0`. It was never published on npm.

The first plan, drawn up with Claude from the project documents.

- Planning phase: `init` starts the plan with `project.phase: planning`, creates `sources/` for the project documents, and makes the pilot directory's first commit (never inside an enclosing repository).
- `/solopilot` drafts the first plan in six approved steps: features traced to their sources, screens and their named views, questions and dependencies, tasks estimated from an agreed grid, the dated plan, and what can be promised.
- New format: `features` (source, core, priority, scope), `estimation`, task `feature`, `kind`, `points` and `design`, named `views`, `project.budget_days`, `project.baseline`, `features` on questions and dependencies, `baseline` log entries.
- Points per task: a day whose tasks all carry points weighs their sum, and its progress is weighed by them. Plans with points per day read as before.
- `solopilot layout`: lays the estimated tasks out on plan days, foundations and the core first, by feature priority, and sets when each open question is needed.
- `solopilot baseline`: records the agreed plan, ends the planning phase, logs it, commits and tags `baseline`.
- `layout` and `baseline` write `solopilot.yaml` through surgical edits: only their own values change, and nothing is written unless the file reads back exactly as intended.
- `status` shows the six steps while planning, the estimate against the days sold, and when the core and everything finish once the days are laid out. The skill records the last step approved in `project.planning_step`.
- Tasks without a feature place themselves: foundations (`kind: setup`) open the plan, the other ones close the core.
- Before day 1, the projection and the due dates start on day 1 instead of today, and the dashboard header shows the start date.
- `init` writes the goal in the plan's language ("Mise en ligne" in French), and French text goes on in lower case after a colon ("L'objectif : mise en ligne…").

The daily mode, tried end to end:

- `install` allows the skill's own commands (`solopilot …`, and edits of `solopilot.yaml`) in the project's local settings: an update no longer asks for a permission at every step.
- `solopilot commit` commits the pilot directory, and `solopilot commits` lists what is not committed in the project, the files each commit touches, and a task's commits taken into account by earlier updates. The skill no longer calls git itself: Claude Code never pre-approves a command that expands `$SOLOPILOT_DIR`.
- The surgical editor grows a list created or emptied in the same edit, and can replace an entry by key.
- The reminder hook keeps quiet once `/solopilot` ran in the session, instead of asking for it while the update waits for approval.
- `e2e/`: end-to-end scenarios that drive real Claude Code sessions on fictional projects rebuilt from scratch, with scripted answers and checks on the files written (`npm run e2e -- daily`). They spend real tokens and stay out of `npm test`.

The scope, approved by the client:

- `solopilot scope` writes the scope document for the client, `build/scope.html` to print as PDF and `build/scope.md` for an email: what is guaranteed on the date, planned next, not planned, out of scope, each feature with its source; what is expected from the client and by when; the questions to settle; the pending requests. Built from chosen fields only, it carries no delay, margin or projected date.
- `solopilot scope --agreed-by <name> [--on <date>]` records the approval in `project.scope_agreed`, logs it, commits and tags `scope-agreed-<date>`. The dashboard mentions it, and the skill measures any request against it.
- French dates write the first of the month as an ordinal ("1er décembre").

The plan against reality:

- The real pace (points delivered per day of effort the developer declares) shows in `status` once judged, after 5 sessions and 15% of the plan, with the date the core would end at that pace; under 80% of the estimate, the dashboard raises a risk. The projection stays on the plan's estimate.
- Scope growth: against the client's approval, or the agreed plan, the plan as it stood then (read from its git tag) is compared with today's, task by task. `status` and the dashboard show the net change and where it comes from (accepted requests, work added without a request, re-estimates, removals); the dashboard raises a risk beyond +10% net (high beyond 25%), and the digest mentions it on the days the plan changed. The skill weighs each request against it before the developer decides. Never in the client's scope document.
- The life of questions: `asked_on` and `reminded_on` on questions and dependencies. Each answer shows whether it was asked and since when; it is to chase after `project.chase_after` working days (5 by default) without an answer; an answer the work needs within two weeks that was never asked raises a risk (high if needed now). `status` and the digest list who to chase. The skill records what the developer sends, drafts the reminders, and at each update looks over the next three plan days for the questions still missing.
- solopilot never measures the developer's hours. Measuring them from Claude Code's sessions was tried and dropped: it only sees a floor of the work, and an employer reads any count of hours as the time worked.

All your projects together:

- `init` and `install` add the pilot directory to `~/.solopilot/projects.json` (`SOLOPILOT_HOME` moves it), paths only. `solopilot projects --forget <dir>` takes one off.
- `solopilot projects` shows one line per project (phase, target, share of the day, core finish and margin, answers to chase, never asked, scope grown) and the share of the working day promised to all of them, week by week. Over one day, at least one projection will not hold.
- `status` says when all projects together take more than a day while this one runs. The skill checks the other projects before planning a new one, and flags the overload at the end of a session.

Ready to try:

- The Fieldbook demo tells one story: its documents in `examples/demo/sources/` (a spec, kickoff workshop notes, a quote, two mockups), and its plan mid-way, in the current format (features traced to these documents, points per task, named views, the agreed plan and the client's approval).
- `solopilot init <dir> --example` starts a pilot directory with the Fieldbook documents, to draw up a first plan without a project of your own.
- The docs are in English: the product vision, the roadmap, and the design notes of each part (`docs/design/`). `CONTRIBUTING.md` tells how to run the tests and the end-to-end scenarios.

## 0.1.0

First version, extracted from a tool used daily on a client project.

- `solopilot.yaml` backlog: plan days with load points, tasks and screens, areas, sprints, milestones, meetings, dependencies, questions, change requests and a log.
- Projection at the plan estimate (`points_per_day × focus`), core and everything against the target date, due dates that follow the work.
- Commands: `init`, `install`, `check`, `status`, `commits`, `head`, `build`, `slack`.
- Single-file dashboard and Slack digest, in English and French.
- Claude Code integration: the `/solopilot` skill and a Stop hook that reminds you to report tagged commits.
