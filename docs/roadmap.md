# Roadmap

Where solopilot stands against its [product vision](vision.md), and what comes next. October 2026.

## Done

The first plan comes first: from the project documents to a dated plan, in six steps you approve one by one ([design](design/first-plan.md)). Six workstreams followed, each tried end to end on a fictional project, with real Claude Code sessions:

1. **Prove the daily routine.** An end-of-session update runs without a permission prompt: `install` allows the skill's own commands, the reminder hook keeps quiet while `/solopilot` runs, and work not committed yet counts as started, never as done. The scenario that tried it found and fixed five frictions. Publishing the dashboard to a claude.ai page is the one step not tried for real yet.
2. **Have the client approve the scope.** `solopilot scope` writes a scope document for the client, without a single delay or margin, and `solopilot scope --agreed-by` records the approval in writing. Every later request is measured against it ([design](design/client-scope.md)).
3. **Hold the plan against reality.** The real pace, points delivered per day of declared effort, shows beside the estimate, and raises a risk when it stays under. The projection stays on the plan's estimate; recalibrating is your decision. Measuring hours from Claude Code's sessions was tried and dropped: it only sees a floor of the work, and an employer reads any count of hours as the time worked ([design](design/real-pace.md)).
4. **Show scope growth.** How far the scope has grown since the client approved it, and from where: accepted requests, work added without a request, re-estimates, removals ([design](design/scope-growth.md)).
5. **Follow the life of questions.** When each question was asked, how long it has waited, who to chase, and what the work needs within two weeks that was never asked. At each update, the skill looks over the next three plan days for the answers still missing ([design](design/life-of-questions.md)).
6. **See all your projects together.** The share of the day each plan assumes, added up week by week: over one day, at least one projection will not hold. The skill checks it before planning a new project ([design](design/all-projects.md)).

Then solopilot went public, on October 12, 2026: the repository is open, 0.3.0 is on npm, the tests run on Linux, macOS and Windows at every push, and testers have a trial report to tell how it went ([design](design/public-release.md)).

## Next

- **A month of real use first.** The six workstreams were validated on one real project and on fictional ones. Nothing below starts before solopilot has run a month on a real project as it is: what that month teaches outranks any planned feature.
- **Learn to estimate from history**: the points estimated against the effort days each kind of task really took. It waits for the history of a real project far enough along.
- **A generated view for the client**, beyond the scope document, once the need is confirmed.
- **A page of all projects** to publish for an agency's management, once the need is confirmed.
- **Teams.** solopilot is built for one developer; a version for a small team may follow.
