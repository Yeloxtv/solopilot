# Specification: the board of tasks by sprint

Status: agreed and done on 2026-10-17. Reread on a real project, agreed and done on 2026-10-18: "To do" by day, and compact cards. The first need to come from real use, after [going public](public-release.md); see the [roadmap](../roadmap.md).

## Goal

Project management tools all have a view solopilot lacked: a board where each task is a card, sorted into its column (to do, in progress, done). It shows at a glance where a sprint stands, without opening the days one by one.

The dashboard showed the tasks in two ways: day by day, where each day has to be unfolded, and by area, as lists. Neither answers fast the question the developer asks when starting their day, or the PO when opening the page: *in this sprint, what is done, what is moving, what is left, and what is stuck?*

This work adds a **Board** page to the dashboard: the tasks as cards, in columns by status, one row per sprint. A menu in the header switches between it and the steering overview.

On the first real project followed with solopilot, 187 tasks over three sprints, the first version became a long scroll:

- **A sprint's row is as tall as its longest column**, and that is always "To do": 44 cards in the sprint under way, 69 in the next.
- **Each card carried all its detail on three lines**: the id and the points, the title, then the area, the day and the views. In a quarter of the width, a real title of a hundred characters took three or four lines.
- **Beside it, "In progress" and "Blocked" held a card or two**: three columns almost empty along a column thousands of pixels high.

"Done" had had the same flaw, settled from the first version by showing its five most recent cards. "To do" had not. The note was reread then: "To do" gathers under its plan days, and every card is compact. On the Fieldbook demo, on a screen 1,024 px wide, sprint 2 went from 2,369 to 549 px high, and the whole board from 3,260 to 1,196 px.

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

"To do" gathers under its plan days, the next two open: see [below](#to-do-by-day).

### The rows

One row per sprint, in the order of the sprints, with its number, its title, its plan days and its progress (the points of its days delivered, as everywhere else on the dashboard). Then a last row for what sits below the line (`day: later`), when there is any.

- **The sprint of the current day is open.** The current day is the first one not finished, so a sprint left with a task behind it, a blocked one for instance, is still the current sprint: what lags shows.
- **A row with work in progress is open too.** When the developer works ahead, on the next sprint, while a task of the previous one waits, both show.
- **The others are folded**: a delivered sprint shows its header, "Sprint 1 · API · D1 to D6 · delivered · 14/14"; an upcoming one unfolds with a click.

A plan without sprints has a single row, the whole plan, then the row of what sits below the line.

A sprint covers plan days; a task belongs to the sprint of its day. Tasks whose day falls in no sprint go to an "Outside sprints" row, placed by their first day.

### "To do" by day

In "To do", the cards gather under their plan day ("D7", "D8"…), in the plan's order.

- **The first two days are open**: the next two days with tasks left to do. The current day is the first one not finished, so no day before it has a task to do: the first days of the column are always the next ones.
- **The current day has its name in the accent colour**, as its sprint's row.
- **The other days fold to a line**, "D11 · 3 tasks · 8 pts". The points show only when the plan estimates each task. A click unfolds the day.
- **Each open row has its two days open.** A sprint open for its work in progress shows where that work leads.
- **What the reader opens or folds stays so** while the page is open, through filters and language switches. A reload goes back to the default.
- **While filtering** by area, answer or search, every day that keeps a card is open, and does not fold: looking for a task, you must see it.
- **What sits below the line has no days.** Its cards stay one list, in the plan's order.

The other columns keep their order: "In progress" and "Blocked" hold few cards, and "Done" keeps its five most recent.

### The cards

Each card holds on two lines:

- **at the top**, the id then the title, on two lines at most; a longer title ends with "…";
- **below**, on a single line: the core mark, then the plan day, the day a done task was done (`done_on`), a screen's number of views and the area, then the "Waits on Q03" badge, and the points on the right when the plan estimates each task. When room runs short, the text of this line gives way from its end: the area first.

Hovering a card reads it whole: the id, the full title and the whole line below. A card under its day in "To do" does not repeat the day. A cut text stays whole in the page: a screen reader reads it, and the search finds it.

The note of a blocked task stays whole, under the card's lines: it says why, and it is what one comes to read.

The badge shows when an open question or dependency holds the task, in the same urgency colour as the "Day by day" tab, with the full question on hover. A task to do that waits on an answer stays in "To do": the badge warns, not the column.

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

A column then takes the whole width: nothing on a card is cut, and the line below wraps when it must.

## Where it is computed

How the tasks spread (which sprint, which column, which order, which rows open by default, and the days of "To do", with their points and which ones open by default) is computed in `src/board.mjs`, with the rest of the projection, and handed to the page like the rest. The page only draws it, and remembers what the reader opened or folded. The logic is tested like the rest of the computation, without a browser.

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
6. **Where it lives.** *A page of its own, chosen from a menu in the header: "Overview" ("Pilotage") and "Board" ("Vue Kanban").* It was first a second tab under the overview, at the bottom of a long page: the first real user found it too far down to read, and asked for the header to carry a menu. The overview opens by default; a link to `…#board` opens the board directly, to share it, and switching pages keeps that address up to date.
7. **The page's name.** *"Board" in English, "Vue Kanban" in French.* The draft proposed "Tableau", which reads too close to "tableau de bord", the dashboard the page lives in; "Kanban" is the word French project tools use.
8. **"To do" by day, two days open.** *The next two days with work open; the others fold to a line.* A plan day holds three to six tasks: two days are the next two sessions of work, what one looks for when opening the page. One day would hide what comes right after; three would stretch the column again on a large project.
9. **Only "To do" goes by day.** "In progress" and "Blocked" stay short. "Done" reads from the most recent, which a split by day would break.
10. **Compact cards everywhere.** *Two lines, in every column.* A card reads the same in each column.
11. **The line below on one row, the area last.** A column is never wider than 270 px, since the page stops at 1,240. Letting this line wrap gave cards of three or four lines: the problem we started from. The area is what is best lost: it repeats from card to card, and the filter finds it again. The day and the day done say where the card stands.
12. **Ruled out, to make the board read on a real project:**
    - *a maximum height per column, with a scroll of its own*: a scroll inside the scroll, content hidden in print and in PDF, and awkward with a finger;
    - *rows by day instead of by sprint*: the "Day by day" tab of the overview, again;
    - *a "compact / detailed" setting*: one more setting for a single right answer, when the compact cards keep all the information.

## How it is tested

- **Unit tests** (`test/board.test.mjs`) on how the tasks spread, with made-up plans: each status in its column; deferred tasks aside; a task per sprint by its day; a plan without sprints in a single row; tasks outside any sprint; the row below the line; the order in a column, and "Done" from the most recent; the rows open by default (the current sprint, a row with work in progress) and folded (a delivered sprint, the upcoming ones); a sprint left with a blocked task staying the current one; a task to do waiting on an open question staying to do; the days of "To do" in the plan's order, the first two open and the next ones folded; a day's points added up, and absent when the plan does not estimate each task; no days below the line, nor in a row with nothing to do.
- **Both languages**: the new strings exist in English and in French, as the locale test already checks.
- **On the Fieldbook demo**, in English and in French, on October 21: sprint 1 open, since T014 stays blocked there, with its done cards capped; sprint 2 open with its task in progress and the ones waiting on an answer; sprint 3 and what sits below the line folded. Checked in Chromium on a desktop and a phone width, with no script error and no sideways scroll; the filters, the folds and the language switch tried there. Captured for the README.
- **Reread on October 18**, on the same demo: sprint 2's "To do" with D7 and D8 open and D9 to D14 folded; compact cards in the four columns; a day opened, then kept through a filter and a language switch; a filter opening the day it keeps, with that day's own points. On a desktop and a phone width, with no script error and no sideways scroll. Captured again for the README.
