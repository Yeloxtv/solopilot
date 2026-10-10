# The first plan

Read this when `project.phase` is `planning`: `solopilot status` then shows "plan being drawn up" and the six steps. The goal is a complete `solopilot.yaml`, drawn from the project documents in six steps, each approved by the developer, that answers one question: *with this budget, this date and the time I can give this project, what can I promise?*

solopilot comes in once the project is signed: the budget and the date are fixed. The estimate does not price anything; it decides what goes in the core, what follows, and what sits below the line.

## Before the first step

1. Work in the pilot directory: `$SOLOPILOT_DIR`, or the current directory when it holds `solopilot.yaml`. The project documents live in its `sources/` folder, versioned with the plan. They never go into the project repository.
2. Run `solopilot status` to see the step reached, and pick up from there. The developer may ask to reopen an earlier step; the later steps are then reviewed too.
3. List `sources/` and read every document in full: specs, workshop notes, quotes, mockups. Read PDFs and images directly. A Word file has to be converted first: ask the developer to export it to PDF, or convert it with `pandoc` if it is installed. Read Figma links through the Figma connector when it is available; otherwise ask for exported images.
4. Check the inputs that the documents may not give, and ask for the missing ones in one message:
   - `project.start` and `project.target`: day 1 and the production date;
   - `project.budget_days`: the work days sold in the quote;
   - `project.focus`: the share of each working day the developer gives the project, from 0 to 1;
   - `project.points_per_day`: what a full work day holds at the plan estimate, 6 by default. One point is then about an hour and a quarter of focused work, agent included.
   - `project.client` and `project.locale`, if they are still placeholders.

## The cycle of every step

1. Draft the step and show it as a compact table, area by area for a large spec (about twenty lines at a time).
2. Wait for the developer's approval. Write nothing before.
3. Write the approved lines into `solopilot.yaml`, one entry per line, in the existing format, with targeted edits. Leave comments alone.
4. Run `solopilot check`. Fix what it reports before going on.
5. Commit in the pilot directory: `git -C "<pilot dir>" add -A` then `git -C "<pilot dir>" commit -m "plan: step N, <name>"`.

**Never invent.** Every feature points to its source. What the documents leave open becomes a question, never a silent assumption. A decision already recorded in workshop notes becomes an `answered` question, with its answer and its source.

Write every title, note and question in the language of `project.locale`.

## Step 1: features

- Propose the areas first if `areas` is empty: a handful of groups such as accounts, catalogue, payments, administration.
- List every feature the app needs, area by area: `{ id: F01, area: accounts, title: "…", source: "spec.pdf p. 4, §2.1" }`. The source names the file in `sources/` and the page or section.
- What the documents explicitly exclude becomes a feature with `scope: out` and a note saying where it is excluded. That list is the one to reread when the client asks for "just a small addition".
- Each grey area becomes a question, linked to its features with `features: [F03]`. Steps 3 and 4 complete them.
- Leave `core` and `priority` for step 5.

## Step 2: screens and their views

- Derive the screens that carry the features. Each one is a task `S01…` with its `feature`, `area`, `status: todo`, and `views` as a list of names: `views: [default, empty, loading, error]`, plus the business variants (read-only, offline, quota reached…). No points and no day yet.
- Without mockups, which is the usual case at this stage, derive the inventory from the spec.
- With mockups, link each drawn screen with `design: "sources/mockups/sign-in.png"` (or its Figma link). Then flag the screens nobody drew, and the views the mockups lack: empty and error states are almost always missing.
- If a designer or the client draws what is missing, add one dependency per batch: `{ id: D01, status: waiting, who: "Design team", title: "Screens of the booking flow", tasks: [S04, S05] }`.

## Step 3: questions

- Go through every feature and every screen and ask what is missing to build it: a business rule, a content, a piece of data, an access, an environment, a decision.
- Something to **decide** is a question. Something to **receive** (an access, a content, a mockup, a server) is a dependency.
- Each one names `who` answers and what waits for it: `features` for now, `tasks` for screens. When a client meeting is known, add it to `meetings`, and give the questions to raise there their `meeting`, `priority` and `stake`.

## Step 4: tasks and their estimate

- Propose the **estimation grid** first, and wait for its approval: a few typical sizes per kind, with their points, in `estimation.grid`, with `basis: hypotheses`. For example `{ kind: screen, size: "3 simple views", points: 1 }`, `{ kind: logic, size: "resource with business rules", points: 1.5 }`, `{ kind: integration, size: "third-party API with webhooks", points: 4 }`. Kinds: `screen`, `setup`, `logic`, `integration`, `content`, `release`.
- Then split each feature into tasks `T…`, with `feature`, `area`, `kind`, `status: todo` and `points` taken from the grid. Foundations (repository, CI, data model, deployment pipeline) are tasks of kind `setup`, without a feature. Give the screens their points too.
- Include what is easy to forget: deployment and environments, accessibility and performance passes, content loading, fixes after the client's review, handover.
- Turn the `features` links of the questions into `tasks` links where the waiting task is clear.

## Step 5: the dated plan

- Propose the **core**: the features that must ship on the target date (`core: true`). Then propose the **order** (`priority: 1, 2, …`): an end-to-end path first, before going wide, and the features that remove the most uncertainty early. The rest follows by value.
- Run `solopilot layout --dry-run`, show the days it proposes, and adjust the priorities or the core with the developer. Then run `solopilot layout`: it writes the days, the day of every task, `plan_days`, `core`, and the `before` of each open question and dependency.
- Propose the sprints (ranges of plan days) and the milestones: a client demo at the end of each sprint, the acceptance rounds, the production release, and internal checkpoints where a decision is due if things slip.
- `layout` regenerates the days on every run: rerun it after any change of estimate, core or order, then review the sprints and milestones again.

## Step 6: what can be promised

- Run `solopilot status`. Once the days are laid out, it shows the points against the days sold and when the core and everything finish, against the target.
- If everything does not fit, propose what goes below the line: the features outside the core with the least value, whose tasks take `day: later`. Rerun `layout`. Never cut into the core without saying so plainly. If the core itself does not fit, say it, with the options: more time on the project, a later date, or a smaller core decided with the client.
- Write two texts in the conversation, not in the file:
  - for the PO, internal: what the core covers, the margin, the main risks, and the questions that block the first days;
  - for the client: the questions to ask now or at the next meeting, written for them, without internal delays or margins.
- When the developer confirms, run `solopilot baseline`. It records the agreed plan (the reference that scope growth is measured against), ends the planning phase, logs it, commits and tags `baseline`.
- Then suggest `solopilot install <project-repo>` from the pilot directory, and publishing the dashboard (see "Published dashboard" in SKILL.md).
