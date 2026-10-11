# Specification: seeing all your projects together

Status: agreed on 2026-10-11, done. Workstream 6 of the [roadmap](../roadmap.md).

## Goal

A solo developer often runs several projects at once. Each plan assumes its own share of the day (`focus`), and each projection depends on it. Nobody checks that these shares hold together: three projects at 0.5 d per working day make a day and a half promised every day. At least one projection is then wrong, and you only find out once you are late.

This workstream shows all the projects at a glance, and the total load promised against a day of work.

## Knowing your projects

A personal registry, `~/.solopilot/projects.json`, lists the pilot directories on the machine. `solopilot init` and `solopilot install` add the directory to it. A directory that has disappeared is flagged, then ignored, and `solopilot projects --forget <dir>` removes it. The registry holds only paths, never the content of the plans, and it never leaves the machine.

## The overview

`solopilot projects` shows:

- **one line per project**: name, client, phase (being planned, or agreed), target date, projected end of the core and margin, and what calls for an action (answers to chase, never asked, a scope grown beyond the threshold);
- **the load promised week by week**, up to the end of the last project. Each project counts for its share of the day, from its start to its projected end, and a project fully delivered no longer counts. Weeks over one day are flagged: "October 19 to November 13: 1.25 d promised per working day. At least one projection will not hold."

## Warning before it is too late

- **When a project starts.** Before the first step of the first plan, the skill runs `solopilot projects`. If the new project's share of the day takes the total over one day while it runs, it says so, and offers to adjust the share, the target date or the other projects.
- **Day to day.** `status` adds a line when the total load goes over one day while the project runs. The end-of-session update flags it.

## Decisions (2026-10-11)

1. **The registry.** *Recommended: `~/.solopilot/projects.json`, filled by `init` and `install`, with `--forget` to remove a project.* The alternative is to look for pilot directories under a parent directory, which assumes they are all kept in the same place.
2. **Computing the load.** *Recommended: the sum of the shares of the day of the active projects, week by week, each from its start to its projected end.* A project fully delivered leaves the computation.
3. **Where to warn.** *Recommended: when a project starts, in the skill, and day to day, in `status`.*
4. **A portfolio page.** *Recommended: not in this version.* The terminal view first; a page to publish for management can follow if the need is confirmed.

## How it is tested

- Unit tests: the registry (registration, a directory that has disappeared, `--forget`); the load week by week on made-up projects that overlap; a delivered project leaving the computation; the `status` line on overload.
- End-to-end scenario: a second fictional project already exists, and Kerlan's planning flags the overload when its share of the day is set.
