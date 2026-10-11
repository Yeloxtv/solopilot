# Specification: the first plan

Status: agreed on 2026-10-10, done. Mission 1 of the [product vision](../vision.md).

## Goal

Go from the documents of a signed project (spec, workshop notes, mockups if there are any, quote, launch date) to a complete `solopilot.yaml`, built with Claude in six steps approved one by one, that answers the question: *what can I promise?*

Once approved, this plan becomes the **agreed plan**: the project's reference.

## The flow

```bash
solopilot init ../acme-pilot     # pilot directory: sources/, empty plan in the planning phase, first commit
# put the project documents in ../acme-pilot/sources/
cd ../acme-pilot && claude       # Claude Code opened in the pilot directory
/solopilot                       # the skill sees a plan being drawn up: it runs the six steps
solopilot baseline               # freezes the agreed plan
solopilot install ../acme        # wires steering into the project repository, as today
```

Planning happens in the pilot directory, not in the project repository: the client's documents are confidential and have no place in a repository that will be handed over to them. It can also start before the project repository exists.

## Inputs

| Input | Form | Used for |
| --- | --- | --- |
| Spec(s) | PDF, Markdown, text. A Word file is converted to PDF or Markdown first | The features and their sources |
| Workshop notes | Same formats | The decisions already made, the questions already asked |
| Mockups, if any | Images, PDF, or Figma links if the Figma connector is available | The drawn screens and their views |
| Quote | The number of days sold | The ceiling of the plan |
| Dates | Start and launch | `start` and `target` |
| Availability | The share of each day given to the project, from 0 to 1 | `focus` |

The last three inputs are asked of the developer at the very start, if the documents do not give them.

## The six steps

Each step follows the same cycle:
1. Claude drafts a proposal.
2. The developer corrects and approves it.
3. Claude writes it into `solopilot.yaml`.
4. `solopilot check` passes.
5. Claude commits in the pilot directory, for example `plan: step 2, screens and views`.

Nothing is written before approval.

One rule holds for every step: **Claude invents nothing.** Every feature points to a source. What the documents do not say becomes a question, never a silent assumption.

### 1. The features

- **Claude** reads every source and lists each feature. It files it in an area and notes its exact source (file, page or section). It also picks out what the spec explicitly excludes, and what it leaves vague.
- **Written:** `areas`, `features`, and the first `questions`, born from the grey areas.
- **The developer checks** that the list is complete, that nothing is invented, that the areas hold up and that the exclusions are right.

### 2. The screens and their views

- **Claude** derives the screens that carry these features and, for each one, the list of its views: default, empty, loading, error, and the business variants. If there are mockups, it links each drawn screen to its entry, then flags the screens and views still to be drawn. Empty and error states are almost always missing.
- **Written:** the screen tasks `S…`, with their views, their features and their mockup, but no day yet. If a third party draws what is missing, a "screens to draw" dependency is added per batch.
- **The developer checks** the missing or extra screens, and the views.

### 3. The questions

- **Claude** combs through every feature and every screen: business rule, content, data, access, infrastructure, decision. It separates what must be **decided**, which becomes a question, from what must be **received** (access, content, mockups), which becomes a dependency.
- **Written:** `questions` and `dependencies`, each with `who` and the features waiting on it. If a client meeting is known, it is added in `meeting`.
- **The developer checks** that the questions are relevant, and who must answer each one.

### 4. The tasks and their estimate

- **Claude** first proposes an **estimation grid**: typical sizes per kind of task, with their points. For example: "screen of 3 simple views: 1 point", "resource with business rules: 1.5 points". Once the grid is approved, it splits each feature into tasks `T…` (logic, integration, content, release), each with its kind, its feature and its points. The screens get their points too.
- **Written:** `estimation` (the grid and its basis: assumptions for now, the history later), the tasks `T…`, and the points of every task. The questions' links to features are narrowed into links to tasks.
- **The developer approves** the grid first, then corrects the estimates they think are wrong.

### 5. The dated plan

- **Claude** ranks the features by priority:
  1. the foundations;
  2. an end-to-end path, before going wide;
  3. the rest of the core, that is, what is essential to the launch;
  4. the rest.

  `solopilot layout` then lays the tasks out on plan days, in that order, at `points_per_day` per day. Claude proposes the sprints and the milestones: end-of-sprint demo, acceptance, launch. Each question gets its `before`: the first day of the work waiting on it.
- **Written:** `days`, the `day` of each task, `project.core`, `plan_days`, `sprints`, `milestones`, and the `before` of the questions and dependencies.
- **The developer approves** the order, the core line and the milestones.

### 6. What you can promise

- **Claude** runs `solopilot status` on the plan. It compares the projected end of the core and that of everything with the target date, and `plan_days` with the days sold. If everything does not fit, it proposes what goes below the line, starting with the lowest-value features outside the core, until the core fits with a margin. It never cuts into the core without saying so.
- **Produces:**
  - an internal summary for the PO: what the core covers, the margin, the risks;
  - the list of questions to ask right away or at the next meeting, written for the client, with no delays or margins.
- **The developer confirms**, then runs `solopilot baseline`.

## Resuming midway

Planning can stretch over several sessions. The skill infers the step reached from the content of the file: whether it has features, screens, questions, points, days, an agreed plan. It picks up where it left off. (Since then, the skill records the last step approved in `project.planning_step`: the content alone could not tell a step approved from a step only started.) The developer can also reopen a step, for example step 2 when new mockups arrive. The later steps are then reviewed.

## Changes to the format

```yaml
project:
  phase: planning      # written by init, removed by `solopilot baseline`
  baseline: { date: 2026-10-14, points: 132, plan_days: 21 }   # written by `solopilot baseline`

features:
  - { id: F01, area: accounts, title: "Magic link sign-in", source: "spec.pdf p. 4, §2.1" }
  - { id: F02, area: inspections, title: "Signature at the end of an inspection", source: "workshop-1.md" }
  - { id: F03, area: reports, title: "Accounting export", source: "spec.pdf p. 9", scope: out, note: "Excluded in the quote" }

estimation:
  basis: hypotheses    # later: history
  grid:
    - { kind: screen, size: "3 simple views", points: 1 }
    - { kind: logic, size: "resource with business rules", points: 1.5 }

tasks:
  - { id: T004, feature: F01, day: 2, area: accounts, kind: logic, status: todo, points: 1.5, title: "Magic link: sending, expiry, single use" }
  - { id: S01, feature: F01, day: 7, area: accounts, status: todo, points: 1, views: [default, error, sending], design: "sources/mockups/sign-in.png", title: "Sign-in screen" }

questions:
  - { id: Q01, who: "Harbor & Pine", features: [F02], tasks: [T019], title: "Can a signed inspection still be edited?" }
```

| Field | Role |
| --- | --- |
| `project.phase` | `planning` until the plan is agreed. `check` then accepts tasks without a day and missing days |
| `project.baseline` | The agreed plan: date, total points, number of days. The reference for scope growth |
| `project.budget_days` | The days sold in the quote, which step 6 compares the plan with |
| `features` | `F01…`: area, title, source in the documents, `core: true` for a core feature, `priority` for the order of building, `scope: out` for an explicit exclusion, note |
| `tasks[].feature` | The feature or features the task delivers |
| `tasks[].points` | Its estimated load. A day's points become the sum of its tasks, and its progress is weighed by the points |
| `tasks[].kind` | `setup`, `logic`, `integration`, `content` or `release`. A screen is of kind `screen` automatically. Used for learning |
| `tasks[].views` | A whole number, as today, or the list of named views |
| `tasks[].design` | The link or the file of the mockup |
| `questions[].features`, `dependencies[].features` | The features waiting for the answer, before the tasks exist |
| `estimation` | The estimation grid and its basis |

Everything stays backward compatible. A file without `phase`, without `features` and without points per task reads exactly as today, and both the demo and the existing tests stay valid.

## Changes to the tool

**Command line**

- `init` creates `sources/`, writes `phase: planning`, and makes the pilot directory's first commit. That last point also fixes the flaw found in the first test: the hook stayed silent and `commit -am` failed.
- `check` follows the phase. It validates the features and their sources, the points, the kinds, the named views, and the links to features and tasks.
- `layout`, a new command, lays the tasks out on plan days, in the features' order of priority, at `points_per_day` per day. With `--dry-run`, it shows the layout without writing anything.
- `baseline`, a new command, checks that the plan is complete, writes `project.baseline`, removes `phase`, adds an entry to the log, and sets a git tag `baseline` in the pilot directory.
- `status`, in the planning phase, shows how far planning has come (features, screens and views, questions, points, days) instead of the projection.
- The computation weighs a day's progress by the points of its tasks when they have some.

**Skill**

- A "First plan" mode in `SKILL.md`. Its detailed walkthrough lives in `claude/skills/solopilot/plan.md`, read only in that mode, so as not to weigh down the daily updates.
- If `$SOLOPILOT_DIR` is empty but the current directory holds `solopilot.yaml`, the skill works in that directory. This is the case while planning.
- Texts are written in the language of `project.locale`.

## Decisions (2026-10-10)

1. **Points per task.** Learning what a screen or an integration is worth takes points per task. Points per day are still read for existing files.
2. **`solopilot layout` lays out the days**, from the features' order of priority. The computation stays exact and reproducible, and Claude and the developer adjust it afterwards.
3. **Named views**, with a number still accepted. The list says what must be built, and the rule "a screen is done when all its views are wired" becomes checkable.
4. **The sources are versioned** in the pilot directory, which is private, so that the references stay readable.
5. **A single skill**, with a `plan.md` file read only in planning mode.

`layout` and `baseline` are the only two commands that write `solopilot.yaml`. They do it keeping the comments and the formatting, and refuse to write if they cannot guarantee it.

## Not in this version

- Estimating from the history (mission 6). The grid is designed to be replaced by the history later. Here, it starts from assumptions only.
- Measuring time.
- Showing the growth of the scope. The agreed plan is recorded, but the gap is not shown yet.
- Reading mockups beyond the inventory of screens and views.

## How it is tested

- **A fictional spec**, five to eight pages long, for a sandbox project, with:
  - deliberate gaps: unsettled rules, missing content, access to obtain;
  - a section of explicit exclusions;
  - two or three mockups as images, with some views missing.
- **A complete planning run** in a Claude Code session opened in the pilot directory. What is checked:
  - each feature has its source;
  - each deliberate gap has become a question or a dependency;
  - the empty and error views show up;
  - the plan fits, or the core line is proposed;
  - `check` passes at every step;
  - `baseline` sets the reference.
- **Unit tests**: validation in the planning phase, progress weighed by points (and the demo unchanged without points), the layout made by `layout`, `baseline`. The current 43 tests stay green.
