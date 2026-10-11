# Product vision

## Why solopilot exists

solopilot was born in a small agency where its author is the only developer. There is no project manager, and no technical product owner (PO).

A project always starts the same way. There is a spec that describes what the app must do, and a few UX and UI workshops. Then the developer is on their own. The client signs a quote for "the development of the app", but nobody agreed on a list of features. What the developer really receives fits in one sentence: *we want this app, and it ships on this day.*

Run this way, a project almost certainly hits the wall. The date is fixed, the scope is not, and nobody is in charge of reconciling the two. Problems show up late: a feature cannot be built because the client never said how it should work, the plan grew silently after every workshop, and the delay comes to light the week of the launch.

This is not peculiar to small companies. Web projects sell for less and less, and AI pushes to deliver ever faster. Steering is the first thing to go: there is no longer the budget for someone to spend hours keeping a schedule, chasing the client and writing status updates. Yet it is without steering that projects go off the rails.

solopilot makes steering a by-product of development. The plan is updated from the work actually done, and whoever follows the project only has to open the dashboard to know where it stands.

## Who it is for

**Those who deliver.** Developers who build web apps for clients on their own, with a fixed date, a tight budget and a scope still open, in an agency or freelance, with nobody to plan and make the calls for them.

**Those who follow.** On the agency's side: the PO, the project manager or management, who need to know where the project stands without calling a meeting or waiting for a written update.

solopilot comes in once the project is under way: the quote is signed, the budget and the date are set.

Several developers on the same project is an idea for a V2. Nor is solopilot meant for work billed by the hour, or for products with no delivery date.

## What it must do

### 1. Turn a spec into a dated plan

Start from the project documents (spec, workshop notes, mockups if there are any) to list every feature the app needs, and derive the screens and their views from them. Estimate each task, and lay it all out on plan days, grouped into sprints, starting from the launch date.

The estimate is not for pricing, since the budget is already signed: it is for deciding. It separates the **core**, the minimum that must ship on the date, from the rest, and explicitly puts **below the line** what will not fit. When the budget or the deadline is tight, the estimate draws the line: you secure the core first, then build the rest.

The question to answer from day one: *with this budget, this date and the time I can give this project, what can I promise?*

This work is done with Claude, step by step, and the developer approves each step (see "The first plan, step by step").

### 2. Track progress and the real pace

Know at any time where the project stands against the plan: what is done, the lead or delay of the core and of everything, and the date each one should finish. Compare the real pace, the points delivered per day of declared effort, with the plan's estimate, and raise an alert when the gap lasts.

### 3. Ask the blocking questions before they block

Most delays are not development problems. They are missing answers: a business rule never settled, content never delivered, a server never opened. Every question that will block a feature must be spotted early, tied to the work waiting on it, and asked before that work starts, not when the developer reaches it and has to stop.

### 4. Make the risks visible

Show clearly what threatens the date: a core projected late, answers that block the work in progress, a client who owes most of the answers awaited, days too tight, a scope that keeps growing. Risks must come from the data, not from someone's mood.

### 5. Give the project's status to those who follow it

The PO or the project manager opens the dashboard and knows in a minute where the project stands, what is blocking, and what is expected from whom. No status meeting, no progress report to write: the developer wastes no time telling, and the PO none asking.

### 6. Learn from each project to estimate the next one better

Estimating a project has become too hard: with agentic coding, you go much faster, but nobody knows yet by how much, or on which kind of work. Rather than guess, solopilot gathers the data of each project (what was estimated, the effort actually spent) and uses it to propose better estimates for the next project (see "Learning to estimate").

## Principles

- **The date holds, the scope moves.** The core is the commitment, everything is the goal, the rest goes below the line. Every change of scope has a visible cost.
- **Honest by design.** The projection follows the plan's estimate and the share of each day really given to the project, never the pace of the first days. The estimate, for its part, improves from one project to the next, from the effort each kind of task really took, the speed of agentic coding included. Work days and calendar days are never confused.
- **Steering happens while you work.** No timesheet, no stopwatch, no tickets to move, no progress report to write. Claude Code reads the work actually done (tagged commits, green tests), proposes the updates, and the developer approves them.
- **No surveillance.** solopilot never measures the developer's hours. A measure drawn from their sessions would only see a floor of their work, and a number of hours always reads as time worked. Effort is declared, as a share of the day.
- **The developer decides.** solopilot proposes, measures and alerts. It never accepts a change request, never moves a due date and never recalibrates the plan on its own.
- **The plan belongs to the agency.** It is a single versioned text file, kept out of the client's repository. Delays and margins never reach the client.
- **Three audiences, three levels of detail.** The developer keeps the plan up to date effortlessly. The PO, on the agency's side, reads the dashboard with the whole internal truth: delays, margins, risks. The client sees only the features delivered, the milestones, and what is expected from them.
- **Small and local.** A command-line tool, one dependency, no server, no account. The data stays on the developer's machine.

## Where solopilot stands today

What is done, and what comes next, is in the [roadmap](roadmap.md). The reasoning behind each part is in the [design notes](design/).

## The first plan, step by step

This is the work that takes the most time at the start, and the one that decides what follows. It is done with Claude, in six steps. Claude drafts, and the developer corrects and approves each step before moving on to the next.

**Inputs.** The spec or specs, the workshop notes, the quote (the number of days sold), the launch date, the share of each day the developer can give the project, and the mockups if there are any.

1. **The features.** The full inventory of what the app must do, grouped by area. Each feature points to the place in the spec it comes from: when the client asks for an addition, you know whether it was planned. What the spec leaves vague becomes a question.
2. **The screens and their views.** The screens the app needs to carry these features, and for each one its views: default, empty, loading, error, variants. At this stage, mockups usually do not exist: the inventory is derived from the spec. If there are some, Claude reads them, links each drawn screen to its entry, and flags the screens and views still to be drawn.
3. **The questions.** For each feature and each screen, what is missing to build it: a business rule, a content, an access, a decision. Each question names who must answer and the work waiting on it.
4. **The tasks and their estimate.** Each feature is split into tasks (back end, front end, integration), each screen becomes a task with its number of views, and each task gets its load points, proposed from the developer's history when there is one.
5. **The dated plan.** The tasks are laid out on plan days and sprints, starting with what removes the most uncertainty: an end-to-end path before going wide. The milestones (demos, acceptance rounds, launch) are set, and each question gets the day its answer is needed by.
6. **What you can promise.** Against the date and the days sold: what the core covers, what fits on top, what goes below the line, and the questions to ask right away. If everything does not fit, the core comes first, and the rest is built after it, in order of value.

Once approved, this first plan becomes the **agreed plan**: the reference the growth of the scope is then measured against.

## Learning to estimate

Nobody knows yet how to estimate well when developing with an agent. Yesterday's benchmarks, built by coding by hand, overestimate one part of the work, the part the agent writes fast, and underestimate another: reviewing, testing and fixing what it produced. Rather than guess, solopilot learns.

For each task finished, it keeps what was estimated (the points), the effort actually spent and the kind of task: a screen and its number of views, business logic, a third-party integration, a production release. Effort is tied to tasks through the commits: the effort-days declared between a task's first and last commit go to it, shared with the tasks carried out at the same time. This data builds up from one project to the next in a local history, the developer's own, never in the client's repository.

On the next project, the first plan's estimate starts from this history: what a five-view screen or a payment integration is worth for this developer, and how many effort-days a point really costs. On the first project, with no history, the estimate starts from written assumptions, which the first data will correct.

During a project, the real pace may lead to recalibrating the plan, but only when the developer decides it, and never on the strength of the first days.

## Out of scope

- Pricing a quote: solopilot comes in once the project is signed.
- Tracking hours, entered or measured: timesheets, stopwatches, activity tracking.
- Team features (assigning tasks, workload per person), until a possible V2.
- Replacing the contractual roadmap shown to the client. solopilot is the living plan behind it.
- A hosted service.

## Open questions

- **Starting without history.** On the first project, on what assumptions does Claude propose the points, and how can they be made explicit so the data corrects them?
- **Where to publish the dashboard.** A page the PO opens without any particular account, always up to date after each update.
- **Without Claude Code.** What use should the command-line tool have on its own?
