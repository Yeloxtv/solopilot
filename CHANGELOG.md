# Changelog

## Unreleased

The first plan, drawn up with Claude from the project documents.

- Planning phase: `init` starts the plan with `project.phase: planning`, creates `sources/` for the project documents, and makes the pilot directory's first commit (never inside an enclosing repository).
- `/solopilot` drafts the first plan in six approved steps: features traced to their sources, screens and their named views, questions and dependencies, tasks estimated from an agreed grid, the dated plan, and what can be promised.
- New format: `features` (source, core, priority, scope), `estimation`, task `feature`, `kind`, `points` and `design`, named `views`, `project.budget_days`, `project.baseline`, `features` on questions and dependencies, `baseline` log entries.
- Points per task: a day whose tasks all carry points weighs their sum, and its progress is weighed by them. Plans with points per day read as before.
- `solopilot layout`: lays the estimated tasks out on plan days, foundations and the core first, by feature priority, and sets when each open question is needed.
- `solopilot baseline`: records the agreed plan, ends the planning phase, logs it, commits and tags `baseline`.
- `layout` and `baseline` write `solopilot.yaml` through surgical edits: only their own values change, and nothing is written unless the file reads back exactly as intended.
- `status` shows the six steps while planning, the estimate against the days sold, and when the core and everything finish once the days are laid out.

## 0.1.0

First version, extracted from a tool used daily on a client project.

- `solopilot.yaml` backlog: plan days with load points, tasks and screens, areas, sprints, milestones, meetings, dependencies, questions, change requests and a log.
- Projection at the plan estimate (`points_per_day × focus`), core and everything against the target date, due dates that follow the work.
- Commands: `init`, `install`, `check`, `status`, `commits`, `head`, `build`, `slack`.
- Single-file dashboard and Slack digest, in English and French.
- Claude Code integration: the `/solopilot` skill and a Stop hook that reminds you to report tagged commits.
