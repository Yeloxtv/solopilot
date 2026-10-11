# Specification: checking the plan against reality

Status: agreed on 2026-10-11, then revised the same day: the measurement of hours was dropped. Workstream 3 of the [roadmap](../roadmap.md).

## Goal

The plan never met reality: the projection followed the estimate forever. This workstream compares the real pace with the estimate, and warns when the gap lasts.

## The real pace

- **What it measures**: the points delivered per day of declared effort, that is the sum of the sessions' `effort`, which the developer gives as a share of the day. The plan's estimate is `points_per_day`.
- **When it counts**: after at least 5 sessions and 15% of the plan delivered. Before that, the first days say nothing.
- **Where it shows**: a line in `status`, with the date the core would end at that pace. For example: "Real pace: 4.1 points per day of work, for 6.3 estimated (35% under). At that pace, core on December 2."
- **The risk**: under 80% of the estimate, the dashboard raises a risk, high under 60%.
- **The official projection stays on the plan's estimate.** Recalibrating `points_per_day`, or cutting the scope, remains the developer's decision, logged as a replan. The skill offers it when the risk appears.

## Why solopilot does not measure hours

A first version measured time from Claude Code's logs: the developer's attention (the delay before each of their messages, capped when they stepped away), the agent's time, and the span of the day. It proposed each session's effort from the attention.

It was removed before it shipped, for three reasons:

- **It only sees a floor.** Code written by hand, meetings, calls and thinking escape it.
- **A number of hours is always read as time worked.** An employer who reads "1.2 h of attention" understands "my developer worked an hour". That is wrong, and the tool must protect the developer, not watch them.
- **It skews the rest.** An effort proposed from a floor is underestimated, and the real pace then looks better than it is.

So the effort stays declared by the developer, as a share of the day. Learning what each kind of task costs will use the same unit: the days of effort elapsed between the start and the end of each task, from the commits.

## Changes to the tool

- The computation adds the real pace, the date at the real pace and the risk. `status` and the dashboard show them.
- The skill flags the risk in the end-of-session update, and offers to recalibrate or to cut the scope, on the developer's written decision.

## How it is tested

- Unit tests: the real pace is not judged before 5 sessions and 15% of the plan; it is afterwards; the risk is raised under 80%; the date at the real pace falls after the estimated date when the pace is slower.
- The `daily` end-to-end scenario still passes.
