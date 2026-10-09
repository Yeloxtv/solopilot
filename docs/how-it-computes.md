# How solopilot computes

solopilot never asks for hours. A solo developer often works on several projects a day, and a timesheet would be a fiction. Progress is read from what is delivered, against the calendar.

## Plan done

Each plan day carries load points. A day half done yields half its points, and the points delivered, placed back on the plan, give **plan done**, in plan days. A heavy day counts for its points, not for one day: with 6 points delivered on a plan of 4-point days, the plan is done up to day 1.5.

## Expected position and gap

The calendar runs from `project.start` to `project.target`, in working days: Monday to Friday by default (`working_days`), minus `holidays`. On a given date, the share of working days elapsed says where the plan should be, under two readings:

- the **core** (day 1 to `project.core`) delivered on the target date: the minimum commitment;
- **everything** (day 1 to `plan_days`) delivered on the target date: the goal.

The expected positions are computed in points, spread over the calendar, then placed back on the plan. The difference between plan done and each expected position, in plan days, is the lead or the delay.

## Projection

The estimated finish follows the **plan's own estimate**, never the pace of the first days: early days say nothing about the heavy days ahead. Two settings carry it:

- `points_per_day`: what a full work day is worth, at the plan estimate;
- `focus`: the share of each working day you spend on the project, on average.

The points left, for the core or for everything, are divided by this capacity, `points_per_day × focus` points per working day, starting today. The margin is the number of working days between that finish date and the target; negative, the plan ends after it.

**Work days and calendar days** are shown side by side: with a focus of 0.5, a planned work day takes two working days of calendar. Without that distinction, 40 working days left read as 40 days of work.

## Time spent

Each `session` entry of the log records its `effort`, the share of that day spent on the project. Their sum is the time spent, shown against `plan_days`. A session without `effort` counts as `project.focus`.

## Due dates that follow the work

`before: n` on a dependency, a question or a request means the answer is needed when the work reaches day *n*, not on a date of the calendar, which the project may run ahead of or behind. An answer is due **now** when the points delivered reach the start of day *n*. Otherwise its date is when the plan estimate gets there, and it becomes **soon** two working days ahead.

This is fairer to everyone: a project often starts before the client workshops, and a date drawn from day 1 would blame the client for answers the work does not need yet.

## Risks

The dashboard raises risks from the data alone, nothing written by hand:

- the core, or everything, projected after the target;
- answers that block the current day, and the task waiting on the most of them;
- one party holding half or more of the open answers;
- dependencies due now or soon;
- more than half of the remaining days marked `tight`.

## Plan of record and living plan

Your contractual roadmap, the one shown to the client, can stay where it is. `solopilot.yaml` is the living plan: it moves after every workshop, and every change is dated and explained in the log.
