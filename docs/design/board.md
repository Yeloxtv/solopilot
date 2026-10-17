# Specification: the board of tasks by sprint

Status: agreed on 2026-10-17, done on 2026-10-17. The first need to come from real use, after [going public](public-release.md); see the [roadmap](../roadmap.md).

## Goal

Project management tools all have a view solopilot lacked: a board where each task is a card, sorted into its column (to do, in progress, done). It shows at a glance where a sprint stands, without opening the days one by one.

The dashboard showed the tasks in two ways: day by day, where each day has to be unfolded, and by area, as lists. Neither answers fast the question the developer asks when starting their day, or the PO when opening the page: *in this sprint, what is done, what is moving, what is left, and what is stuck?*

This work adds a **Board** tab to the dashboard: the tasks as cards, in columns by status, one row per sprint.

## Why not an existing tool

Plugging solopilot into an open source tool (Taiga, Plane, Kanboard, Wekan, Focalboard) was ruled out:

- **Two sources of truth.** The plan lives in `solopilot.yaml`. An outside tool would mean syncing the tasks, their statuses, their days and the sprints both ways. That sync is what costs and breaks, not the display.
- **A server and accounts.** solopilot is small and local: no server, no account, the data stays on the machine.
- **A status is not dragged by hand.** A task becomes `done` on the evidence of a commit and green tests, once the developer approves. A drag and drop in another tool would bypass the rule.
- **The tool would know nothing of the rest.** Neither the projection, nor the core, nor the points, nor the questions holding a task.

The dashboard already carries every piece of data needed. The board is one more view.

## The board

### The columns

Four columns, in this order:

| Column | Statuses |
| --- | --- |
| To do | `todo` |
| In progress | `doing` |
| Blocked | `blocked` |
| Done | `done` |

Deferred tasks leave the columns, as they leave the count: a folded line under the row, "2 deferred tasks", shows them with their note.

An empty column stays on screen, with a dash: an empty "Blocked" is information.

"Done" shows its five most recent cards, and a button shows the others: a sprint well under way would otherwise stretch its row with what matters least.

### The rows

One row per sprint, in the order of the sprints, with its number, its title, its plan days and its progress (the points of its days delivered, as everywhere else on the dashboard). Then a last row for what sits below the line (`day: later`), when there is any.

- **The sprint of the current day is open.** The current day is the first one not finished, so a sprint left with a task behind it, a blocked one for instance, is still the current sprint: what lags shows.
- **A row with work in progress is open too.** When the developer works ahead, on the next sprint, while a task of the previous one waits, both show.
- **The others are folded**: a delivered sprint shows its header, "Sprint 1 · API · D1 to D6 · delivered · 14/14"; an upcoming one unfolds with a click.

A plan without sprints has a single row, the whole plan, then the row of what sits below the line.

A sprint covers plan days; a task belongs to the sprint of its day. Tasks whose day falls in no sprint go to an "Outside sprints" row, placed by their first day.

### The cards

Each card carries:

- the id and the title;
- the area, and the points when the plan estimates each task;
- for a screen, its number of views;
- the plan day;
- for a done task, the day it was done (`done_on`);
- for a blocked task, its note;
- the "Waits on Q03" badge when an open question or dependency holds it, in the same urgency colour as the "Day by day" tab, with the full question on hover. A task to do that waits on an answer stays in "To do": the badge warns, not the column.

Tasks of the core carry a discreet mark, to tell the commitment from the rest.

In a column, the cards follow the plan's order: by day, then tasks before screens, then by id. In "Done", the most recent first.

### The filters

Above the board:

- **the sprints**, with the chips the "Day by day" tab already uses: all, one sprint, below the line;
- **the areas**, in a drop-down list;
- **"Waiting on an answer"**, to keep only the tasks held by an open question or dependency;
- the search by id or title, as in "Backlog by area".

While filtering by area, answer or search, only the rows with a match show, unfolded, with every matching card.

### Read only

The board changes nothing. A card does not move from one column to another: the status changes through `/solopilot`, from the commits, once approved. The dashboard is a generated, published file; it has no way of writing the plan anyway.

### On a phone

The four columns stand side by side from a tablet's width. Below, they stack: each column becomes a folding section, "In progress" and "Blocked" open. The page never scrolls sideways.

## Where it is computed

How the tasks spread (which sprint, which column, which order, which rows open by default) is computed in `src/board.mjs`, with the rest of the projection, and handed to the page like the rest. The page only draws it. The logic is tested like the rest of the computation, without a browser.

## What does not change

- **The client's scope document.** The board shows the internal progress; it does not go to the client.
- **The terminal.** `solopilot status` stays a summary. No board in the terminal in this version.
- **The plan's format.** No new key: the board reads the tasks, their days and the existing sprints.

## Decisions

1. **The tool.** *A view of the dashboard, built in solopilot.* The alternative, an open source tool synced with the plan, costs a sync both ways, a server and accounts.
2. **The columns.** *Four: To do, In progress, Blocked, Done.* Three columns, with "Blocked" as a badge on the card, would hide what is stuck inside "To do" or "In progress".
3. **A task waiting on an answer.** *It stays in its column, with the "Waits on Q03" badge.* Only the `blocked` status, set by the developer with its note, puts it in "Blocked".
4. **The open rows.** *The sprint of the current day, and any row with work in progress.* The draft also opened past sprints not delivered; there are none, since the current day is the first one not finished.
5. **Moving the cards.** *None: the board is read only.*
6. **The tab it opens on.** *"Pending answers" stays the first tab, and the board comes second.* A link to `…#board` opens the board directly, to share it.
7. **The tab's name.** *"Board" in English, "Vue Kanban" in French.* The draft proposed "Tableau", which reads too close to "tableau de bord", the dashboard the tab lives in; "Kanban" is the word French project tools use.

## How it is tested

- **Unit tests** (`test/board.test.mjs`) on how the tasks spread, with made-up plans: each status in its column; deferred tasks aside; a task per sprint by its day; a plan without sprints in a single row; tasks outside any sprint; the row below the line; the order in a column, and "Done" from the most recent; the rows open by default (the current sprint, a row with work in progress) and folded (a delivered sprint, the upcoming ones); a sprint left with a blocked task staying the current one; a task to do waiting on an open question staying to do.
- **Both languages**: the new strings exist in English and in French, as the locale test already checks.
- **On the Fieldbook demo**, in English and in French, on October 21: sprint 1 open, since T014 stays blocked there, with its done cards capped; sprint 2 open with its task in progress and the ones waiting on an answer; sprint 3 and what sits below the line folded. Checked in Chromium on a desktop and a phone width, with no script error and no sideways scroll; the filters, the folds and the language switch tried there. Captured for the README.
