# Specification: showing scope growth

Status: agreed on 2026-10-11, done. Workstream 4 of the [roadmap](../roadmap.md).

## Goal

When nothing is fixed at signing, every workshop adds work, and the plan grows in silence. This workstream says in one line how far the scope has moved since the agreement, and why.

## The reference

- **The client's approval**, if there is one: the plan as it stood at the tag `scope-agreed-<date>`.
- **Otherwise, the plan agreed internally**: the plan as it stood at the tag `baseline`.
- **Without a tag** (a pilot directory without git, a plan kept by hand): the total of points recorded in `project.baseline`. Only the total change is then known, not its breakdown.

## What is measured

The plan's points, below the line left out, are compared between the reference and today, task by task:

| Movement | What it counts |
| --- | --- |
| Added by a request | The new tasks an accepted request created (`R01`, in its `tasks`) |
| Added without a request | The other new tasks: work found on the way |
| Re-estimated | The change in points of the tasks that already existed |
| Removed | The tasks deferred (`deferred`) or moved below the line since the agreement |

The net change, in points and as a percentage of the reference, sums it all up.

## Where it shows

- **`status`**: "Scope since the client's approval (October 20): +12 points (+11%). +8 from requests R01 and R03, +6 added without a request, −2 removed."
- **The dashboard**: a line in the explanation of the plan. A risk is raised beyond +10% net, high beyond +25%.
- **The Slack digest**: the scope line, only on the days the plan changed (a replan in the log that day), so as not to repeat the same figure every day.
- **The skill**, when triaging a request, puts a figure on what it would add to the net change before the developer decides.

None of this appears in the scope document sent to the client.

## Decisions (2026-10-11)

1. **What is counted.** *Recommended: the plan's points outside "below the line", with the breakdown by movement.*
2. **The risk thresholds.** *Recommended: +10% net for a medium risk, +25% for a high risk.* What was offset (removed, moved below the line) is deducted before comparing.
3. **The digest.** *Recommended: only on the days the plan changed.*

## How it is tested

- Unit tests: the breakdown by movement on a made-up reference and plan; the net change; the fallback to `project.baseline` without a tag; the risk thresholds; nothing in the client's document.
- End-to-end scenario: on Kerlan, after the client's approval, an accepted request makes the growth appear, attributed to the request.
