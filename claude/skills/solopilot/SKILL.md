---
name: solopilot
description: Draws up a project's first plan from its spec and keeps the solopilot backlog (solopilot.yaml in the pilot directory) up to date from the work done, then regenerates the dashboard and posts the Slack digest. Use to plan a signed project from its documents ("draw up the plan", "plan from the spec", "planifie le projet", "à partir du cahier des charges"), at the end of a work session or day, and whenever the user says "update the plan", "where do we stand", "what's left", "fais le point", "mets à jour le suivi", "où on en est", "qu'est-ce qui reste". Also use when a milestone is reached, a dependency arrives, a question gets answered, a change request is triaged, or the plan changes after a client meeting.
---

# solopilot

The plan lives in a pilot directory kept outside the project repository. Its path is in `$SOLOPILOT_DIR`, the project's in `$SOLOPILOT_REPO`; `solopilot install` sets both in the project's `.claude/settings.local.json`. While the first plan is drawn up, Claude Code runs in the pilot directory itself: if `$SOLOPILOT_DIR` is empty but the current directory holds `solopilot.yaml`, work there. Otherwise, if `$SOLOPILOT_DIR` is empty, say so and suggest running `solopilot install <project-repo>` from the pilot directory, without looking for a backlog elsewhere.

`$SOLOPILOT_DIR/solopilot.yaml` is the source of truth. The dashboard and the Slack digest are generated views of it. This skill proposes changes, the user approves them, then the skill writes, regenerates and publishes.

Commands, all read-only on the backlog (they find it through `$SOLOPILOT_DIR`):

```bash
solopilot status              # where the project stands, current day, alerts; or the steps of the first plan
solopilot commits             # tagged project commits since the last update
solopilot head                # last commit of the project
solopilot check               # validation, to run after every write
solopilot build               # regenerate the dashboard
solopilot slack               # digest of the day; --dry-run to print it without sending
solopilot slack --milestone 5 # announce the milestone of plan day 5
```

Two commands write `solopilot.yaml`, and only while the first plan is drawn up: `solopilot layout` (the plan days) and `solopilot baseline` (the agreed plan). They change their own values and nothing else.

Write every title and note in the language of `project.locale`.

## Keep the pilot out of the project

The project repository may be handed over to the client with its history. Nothing from the pilot goes into it: no file, and no mention of the backlog, the internal target, the delay or the margin in a commit, a rule, a CLAUDE.md or a code comment. Only task ids in square brackets appear in the project's commit messages (`[T024]`, `[T025 S05]`); they reveal nothing. Every write and every commit for the pilot happens in `$SOLOPILOT_DIR`.

## Pick the mode

Read the request and the context, then follow the matching mode. By default, it is the end-of-session update.

### 0. First plan

When `project.phase` is `planning`, read `plan.md`, in this skill's directory, and follow it. Its six steps take the project documents to an agreed plan. No other mode applies until `solopilot baseline` ends the phase.

### 1. End-of-session update

1. Run `solopilot status`, `solopilot commits` and `git -C "$SOLOPILOT_REPO" status`. Read the tasks of the current day and those in progress.
2. Propose a table of changes: id, current status, proposed status, evidence (commit hash and subject, or file changed). A task touched without evidence that it is finished stays `doing`.
3. Flag what does not fit the plan: a task from a future day started, a current day that does not move, a dependency or question needed "now" or within three working days, a core projected after `project.target`. A due date follows the work, not the calendar: an answer is not late until the work reaches its day.
4. Ask how much of the day went to the project (`effort`, from 0 to 1) if the user has not said. Wait for approval. Write nothing before.
5. Write the backlog (see the writing rules), add the `session` entry to the log (date, effort, title, note), then `solopilot check`.
6. If a milestone is reached, set it to `reached` with `reached_on`. For a `client` milestone, also run `solopilot slack --milestone N`.
7. Run `solopilot build`, publish the dashboard (see "Published dashboard"), then `solopilot slack`. If the webhook is missing, say so in one line and carry on.
8. Write the output of `solopilot head` into `project.last_commit`, then commit in the pilot directory: `git -C "$SOLOPILOT_DIR" commit -am "update YYYY-MM-DD"`. This marker feeds the next `commits` and the reminder hook. Commit nothing in the project repository.
9. End with three lines: the state of the core and of everything (first two lines of `status`), what changed, and the next due date that needs an action from the user.

Time is not tracked by the hour: a solo developer often works on several projects a day. Each session records its `effort`, and `status` adds them up. A day spent only on planning, without development, is not a session: no `session` entry, no digest, only a rebuild. Progress is read from delivered points against the working-day calendar up to `project.target`. The projection follows the plan's estimate (`points_per_day`, `focus`), never the pace of the first days. These settings, like `plan_days`, `core` and `target`, change only on the user's explicit written decision.

### 2. Dependency received, question answered, milestone reached

Update the entry, add a log entry if the fact deserves a trace, then `check`, `build`, publish and commit in the pilot directory. A question becomes `answered` with the answer in `answer`; a dependency becomes `received`. If the answer changes the work to do, continue with mode 4.

### 3. Triage of a change request

No request becomes `accepted` without a written decision from the user in the conversation. Never infer a decision from a discussion or from reported client feedback.

An accepted request becomes one or more tasks with the next free ids, placed on a day. Their ids go in the request's `tasks`, the decision in `decision`. If it adds a feature, give it the next free `F` id with the request's id as its `source`, so the growth of the scope stays traceable. If the day's load grows, update its `points` (or give the new tasks their points, when the plan estimates each task) and switch to mode 4 to measure the impact.

### 4. Replan

After a client meeting, a demo or a slip.

1. Run `solopilot status` to note the gap of the core and of everything before the change.
2. Propose the changes: tasks moved (change `day`, never the id), day points changed, tasks added, tasks deferred.
3. Measure the impact: points added and removed, and the effect on the core (day 1 to `project.core`) and on everything against `project.target`. If total points grow without compensation, say it plainly and suggest what could go below the line (day `later`). A task entering the core weighs on the minimum commitment: flag it separately.
4. Wait for approval, write, then add a `replan` entry to the log saying why the plan changes.

Never delete a task. A dropped or postponed task becomes `deferred` with a note saying where it goes: the history must show it.

## Writing rules

- A task becomes `done` only if the tests covering it pass, with the project's test command. Never close a task in red.
- A screen (`S…`) becomes `done` only when all its views are wired: default, empty, loading, error and variants, as listed (or counted) in `views`.
- `done` takes `done_on`, today's date as YYYY-MM-DD.
- `blocked` takes a `note` saying what it waits for and from whom, with the id of the dependency or question if there is one.
- Keep one line per item, in the existing format, and leave comments alone. Edit with targeted replacements (`id: T024, day: 5, area: search, status: todo` → `id: T024, day: 5, area: search, status: done, done_on: 2026-10-08`), never by rewriting the file.
- A new task takes the next free number: the highest existing `T` or `S`, plus one. It takes an `area` from `areas`; a new area is decided with the user. When the plan estimates each task, a new task also takes its `feature`, its `kind` and its `points`, from the grid in `estimation`.
- After the plan is agreed, days move by hand, with a `replan` entry in the log. `solopilot layout` is for the first plan only.
- An open question, dependency or request lists in `tasks` the tasks waiting for its answer: that is what shows "Waits on Q…" on the task in the dashboard. When creating a question, propose these links along with it.
- A log entry takes a `title` of a few words, shown above its note.
- A meeting with the client (workshop, demo, steering committee) goes into `meetings`, with `date`, `title` and `with`, as soon as the user mentions it. The dashboard groups the answers to prepare for the next one.
- The log holds one `session` entry per day worked. A second update the same day amends that entry instead of adding one, and sends the digest again only if the user asks.
- Never edit `build/`.

## Published dashboard

`solopilot build` writes `build/index.html`, to open in a browser, and `build/publish.html`, a fragment for hosts that wrap pages in their own document, such as claude.ai artifacts.

If `project.dashboard_url` is set and the `Artifact` tool is available, publish `build/publish.html` with `url` set to `project.dashboard_url`. In a conversation that has neither read nor published that page yet, read it first (`action: "read"` with that `url`), then publish. Never publish it without `url`: that would create a second page and break the shared link. If `dashboard_url` is empty and the tool is available, offer once to publish it, and store the returned link in `project.dashboard_url`.

The dashboard shows internal delays and margins. It is shared by the user only, with the people they choose; never with the client unless they say so.

## Slack

The channel is internal: it may show the delay and the lead against the target. One digest per day worked, and one message per client milestone reached. Never one message per task.

The digest carries only the essentials: the target date and whether the core makes it, with the basis of the schedule, what is done, what is blocked, what needs settling now and from whom, the next client meeting, a line of counters, then the link to the dashboard. Do not lengthen it with what the dashboard already shows.

If the user asks for an update meant for the client, write a separate text centered on delivered features, milestones and what is expected from the client, without internal delays or margins.
