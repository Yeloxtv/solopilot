# The backlog format

`solopilot.yaml` is the single source of truth. The `/solopilot` skill edits it after your approval, or you edit it by hand, then run `solopilot check`. Two commands write it, and only while the first plan is drawn up: `solopilot layout` and `solopilot baseline`. They change their own values and nothing else, and refuse to write when they cannot keep the rest of the file as it is.

Dates are written `YYYY-MM-DD`. Only `project`, `days` and `tasks` are required; every other section defaults to an empty list.

## The planning phase

`solopilot init` starts a plan with `project.phase: planning`. While it lasts, tasks may wait for their day, `days`, `plan_days` and `core` may be missing, and `solopilot build`, `slack` and `commits` refuse to run. `solopilot status` shows the six steps of the first plan instead of the projection. `solopilot layout` writes the plan days, and `solopilot baseline` records the agreed plan in `project.baseline` and removes `phase`. From then on, every task needs its day.

## project

| Key | Required | Meaning |
| --- | --- | --- |
| `name` | yes | Project name, shown on the dashboard and in the digest |
| `client` | | Who the project is for. Pending requests are attributed to them by default |
| `owner` | | You. Excluded when looking for the party most answers depend on, your own questions stay out of the scope document, and your own questions and dependencies are never counted as asked, to chase or never asked |
| `locale` | | `en` (default) or `fr`, or a tag such as `en-GB` to change date formats too. The dashboard opens in it, and its reader can switch to the other language |
| `goal` | | What happens on the target date, e.g. `"Launch"` or `"Demo"` |
| `start` | yes | Date of day 1 |
| `target` | yes | The date you committed to: the core at least, everything ideally |
| `phase` | | `planning` while the first plan is drawn up, absent once it is agreed |
| `planning_step` | | While planning: the last of the six steps you approved, 0 to 6. Written by the skill, removed by `solopilot baseline` |
| `budget_days` | | The work days sold in the quote, which the plan is weighed against |
| `chase_after` | | Working days without an answer before an asked question or dependency is to chase, 5 by default |
| `plan_days` | once agreed | Number of work days in the plan. `days` must list every day from 1 to this number. Written by `solopilot layout` |
| `core` | once agreed | Last day of the core, the minimum commitment. Written by `solopilot layout` |
| `baseline` | | The agreed plan, `{ date, points, plan_days }`, written by `solopilot baseline` |
| `scope_agreed` | | The client's approval of the scope, `{ by, date }`, written by `solopilot scope --agreed-by`. Once there, it is the reference any request is measured against; the scope as approved stays readable at the git tag `scope-agreed-<date>` |
| `points_per_day` | yes | Load points a full work day is worth, at the plan estimate |
| `focus` | yes | Share of each working day spent on the project, from 0 to 1. Drives the projection |
| `holidays` | | Weekday dates not worked |
| `working_days` | | ISO weekdays worked, `[1, 2, 3, 4, 5]` (Monday to Friday) by default |
| `wip_limit` | | Tasks in progress before `check` warns, 4 by default |
| `last_commit` | | Last project commit taken into account. Written by the skill from `solopilot head` |
| `dashboard_url` | | Where the dashboard is published; the digest links to it |

## people

An optional list of names. When answers are grouped by who gives them, these come first, in this order.

## sprints

`{ id, from, to, title }`: a range of plan days. Days point to their sprint with `sprint: id`.

## days

One entry per plan day, from 1 to `plan_days`.

| Key | Meaning |
| --- | --- |
| `day` | The plan day number, or `later` for what sits below the line |
| `points` | The load of the day. A heavy day carries more points than a light one. Not needed when every task of the day carries its own points: the day then weighs their sum |
| `load` | `normal` or `tight`. Tight days show on the calendar, and many of them raise a risk |
| `sprint` | Optional sprint id |
| `phase`, `title`, `note` | Free text shown on the dashboard |

A day with no active task does not count in the plan.

## tasks

| Key | Meaning |
| --- | --- |
| `id` | `T001` for a task, `S01` for a screen. Ids never change |
| `day` | The plan day it belongs to, or `later`. May wait for `solopilot layout` while planning |
| `feature` | The feature, or the list of features, the task delivers |
| `area` | An id from `areas`, required when `areas` is not empty |
| `kind` | `setup`, `logic`, `integration`, `content` or `release`. A screen is of kind `screen` |
| `points` | Its estimated load. When every task of a day has points, the day weighs their sum |
| `status` | `todo`, `doing`, `done`, `blocked` or `deferred` |
| `done_on` | Required when `done` |
| `note` | Required when `blocked` (what it waits for) or `deferred` (where it goes) |
| `views` | Required for screens: the views to build, by name (`[default, empty, loading, error]`) or as a number |
| `design` | The mockup of a screen: a file in `sources/` or a link |
| `admin` | `true` for a screen provided by a framework, left out of the screen count |
| `title` | What the task delivers |

A day's progress is the share of its active tasks that are done: half the tasks done, half the points delivered. When the tasks carry points, the share is weighed by them. Deferred tasks leave the count. A task is never deleted: it becomes `deferred`, with a note.

## features

`{ id, area, title, source, core, priority, scope, note }`: what the app must do, each feature traced to its `source` in the project documents (required, such as `"spec.pdf p. 4"`, or the id of the request that added it, which the scope document shows as "requested by"). `core: true` marks the minimum that must ship on the target date, and `priority` the order to build in; `solopilot layout` follows both. `scope: out` keeps what the documents explicitly exclude.

Tasks without a feature place themselves: those of kind `setup` (the foundations) open the plan, the others (fixes after acceptance, an accessibility pass, a guide, the handover) close the core.

## estimation

`{ basis, grid }`: the typical sizes agreed before the tasks are estimated, such as `{ kind: screen, size: "3 simple views", points: 1 }`. `basis` is `hypotheses` until solopilot learns from past projects.

## areas

`{ id, title }`: groups of tasks across days, like epics. The dashboard shows the backlog by area.

## milestones

`{ day, type, status, title, criterion }`. `type` is `client` (announced to the client, posted to Slack when reached) or `checkpoint` (internal). `status` is `upcoming` or `reached`, with `reached_on`.

## meetings

`{ date, title, with }`. The dashboard groups the answers to prepare for the next one: those raised there (`meeting: <date>` on the question), and those due before it from the same party.

## dependencies, questions, requests

What you need from others. They share these keys:

| Key | Meaning |
| --- | --- |
| `id` | `D01`, `Q01` or `R01` |
| `title` | What is needed |
| `who` | Who gives it. Required for dependencies and questions; requests default to `project.client` |
| `before` | The plan day it is needed by. Its due date follows the work, see [how it computes](how-it-computes.md) |
| `tasks` | The tasks waiting for it. They show "Waits on Q01" on the dashboard |
| `features` | The features waiting for it, before their tasks exist |
| `asked_on` | The day it was asked of whoever owes it. Without it, an answer needed within two weeks shows as never asked |
| `reminded_on` | The day of the last reminder. An answer is to chase `chase_after` working days after it was asked or last reminded |
| `meeting`, `priority`, `stake` | The meeting where to raise it, its rank there, and what it unlocks |
| `note` | Free text |

Statuses:

- **dependencies**: `waiting` or `received`;
- **questions**: `open` or `answered`, with the `answer`;
- **requests** (change requests to triage): `pending`, `accepted` (with the `tasks` it created and the `decision`), `declined` or `deferred`. `recommendation` holds your advice before the decision.

## log

One `session` entry per day worked, one `replan` entry whenever the plan changes, the `baseline` entry written when the plan is agreed, and an `agreed` entry each time the client approves the scope.

| Key | Meaning |
| --- | --- |
| `date` | The day |
| `type` | `session`, `replan`, `baseline` or `agreed` |
| `effort` | For sessions: the share of the day spent on the project, from 0 to 1. Defaults to `project.focus` |
| `title` | A few words, shown above the note |
| `note` | What happened. Required for `replan`: why the plan changes |

## Commit convention

In the project repository, every commit that moves a task starts with its id in square brackets: `[T024] add search`, `[T025 S05] wire the site list`. `solopilot commits` and the reminder hook read them; nothing else from the plan enters the project.
