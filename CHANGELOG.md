# Changelog

## 0.1.0

First version, extracted from a tool used daily on a client project.

- `solopilot.yaml` backlog: plan days with load points, tasks and screens, areas, sprints, milestones, meetings, dependencies, questions, change requests and a log.
- Projection at the plan estimate (`points_per_day × focus`), core and everything against the target date, due dates that follow the work.
- Commands: `init`, `install`, `check`, `status`, `commits`, `head`, `build`, `slack`.
- Single-file dashboard and Slack digest, in English and French.
- Claude Code integration: the `/solopilot` skill and a Stop hook that reminds you to report tagged commits.
