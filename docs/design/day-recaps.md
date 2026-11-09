# Specification: a recap of each plan day

Status: agreed on 2026-11-09, to build. Listed under "Next" in the [roadmap](../roadmap.md).

## Goal

The dashboard tells those who follow the project where it stands: the margin, what blocks, who owes what. It does not tell what was built. A PO or a manager who does not read the diff, and does not master the back end, sees a day's tasks turn green without knowing what a user can now do, who may do it, or which risk was taken off the table that day.

A recap is a private page, one per plan day, that shows this in plain words: what works now, with a screenshot, who can do what, the obstacles lifted and how we know, what remains and when. It exists from the first work delivered on the day and follows it until the day is done: a task still blocked does not hide what already works. It serves point 5 of the [vision](../vision.md): give the project's status to those who follow it, without a meeting and without a report written by hand.

## Where it comes from

The format was used and approved on a real client project, steered with an older ancestor of solopilot. The roadmap puts what real use teaches ahead of any planned feature: after nearly a month of real use of solopilot, this is the second need it raised, after the [board](board.md).

## Who it is for

**Those who follow, on the agency's side**: the PO, the project manager, management. The same readers as the dashboard, and the same privacy: the recaps are read from the dashboard's page, shared by the developer only.

It is not for the client in this version. The [client's view](#a-view-for-the-client-later) is discussed below.

## The page

Sections in this order. Every claim comes from something solopilot or the project can show: a tagged commit, a log entry, a question answered, a test that passes, an acceptance run done. What was not verified is not written, and no duration is made up.

| Section | What it holds | Who writes it |
| --- | --- | --- |
| Header | The day, its title and sprint; done and when, or in progress with the tasks done, those left and those blocked, with what they wait for; the questions and dependencies settled for it; the milestone reached. Then one sentence from a user's point of view | solopilot computes the facts from the plan; the sentence is written |
| What works now | One card per feature the day moves: three or four plain bullets, what comes later and when, a screenshot | The skill drafts, the developer approves |
| Who can do what | A table: the day's actions in rows, the project's roles in columns, Yes or No with the nuance in small print. Under it, the tests that prove it | From the project's own access rules and tests |
| Obstacles lifted | One card per obstacle: the risk, as its consequence for a user; the solution; the proof (a test, a review, the acceptance run) | From the day's answered questions, log notes and the project |
| What remains | Known limits, tasks blocked or deferred, questions still open, each with its "when" | From the plan |
| In figures | Commits, tests of the suites touched, questions settled | From the plan and the project |
| Technical appendix | Folded: endpoints, data, reviews | From the project |

A section with nothing to say is left out: a day that adds no role has no table.

### For example: Fieldbook, days 5 and 6

Day 5, "Inspection runs", finished on October 14 with its checkpoint reached. Three tasks done: start, save and submit an inspection (T011), findings with a severity (T012), an audit trail of every change (T013).

- **The sentence**: "An inspector can now go through a checklist, record what is not compliant with its severity, and submit the inspection; every change leaves a trace."
- **What works now**: the inspection run and the findings, two cards. Day 5 is back end only: there is no screen to capture yet, and the cards say so, with when it becomes visible (the inspection screens, days 9 and 10, shown at the demo of day 10). No mockup stands in for a screenshot.
- **Who can do what**: "Submit an inspection" is Yes for an inspector (*sites of their region*), No for a manager and an administrator; "Change a submitted inspection" is No for everyone (*until Q01 is settled*). Under it: the access tests of the inspection endpoints, and how many pass.
- **Obstacles lifted**: "A submitted inspection is final, but nothing showed who had changed it before." Solution: every change records who, when and what (T013). Proof: its tests, and the checkpoint reached.
- **What remains**: whether an inspector may edit a submitted inspection is still open (Q01, raised at the meeting of October 23); editing rules wait for it (T014, day 6).

Day 6, "Photos, notes and edits", is not done: photo upload (T015) and notes on findings (T016) are, but the editing rules (T014) wait for Q01. Its recap exists all the same. The header says "in progress, 2 of 3 tasks, T014 waits for Q01"; the photos and the notes have their cards; "What remains" says what Q01 holds back. When Q01 is answered and T014 is done, the same recap is updated and the day reads done.

## Where it lives

One folder per plan day in the pilot directory, next to `sources/`:

```
fieldbook-pilot/
├── solopilot.yaml
├── recaps/
│   └── day-05/
│       ├── recap.md       the written sections
│       └── *.png          the screenshots it shows
└── build/
```

No new key in `solopilot.yaml`: a day has a recap when its folder holds a `recap.md`. The folder is committed with the plan, in the pilot directory, never in the project.

`recap.md` holds the written sections only; the header is computed from the plan at each build, so the recap and the plan never disagree, and a day that moves from in progress to done says so without a word rewritten. It is Markdown, in a small subset that solopilot renders itself, with no new dependency:

- `##` headings for the sections, in the project's language;
- `###` headings for the cards: a feature that works now, an obstacle lifted;
- paragraphs, bullets, bold, links, tables, and images that point to a file of the folder (`![The site list](site-list.png)`);
- a line `---`: everything after it is the folded technical appendix.

Nothing else: no raw HTML, no scripts. A restricted format keeps every recap alike, and `solopilot check` can tell when one goes beyond it.

## The build

`solopilot build` also renders each recap:

- **`build/recaps/day-05.html`**: a complete page, in the dashboard's style, light and dark. Its images are embedded in it (`data:` URIs): each recap is a single file. A day of four phone screenshots weighs about a megabyte.
- **`solopilot check`** flags a recap folder for a day that does not exist, an image named but missing, and Markdown outside the subset.

### Read from the dashboard

There is one link to share, the dashboard's. The menu in its header, which already switches between the overview and the [board](board.md), gains a third page, "Recaps" ("Restitutions" in French), shown once a day has one. The page holds one tag per plan day that has a recap, in the order of the days, marked done or in progress, the latest selected. A click on a tag shows that day's recap under the tags, at full width, its height following its content. On the overview, the row of a day that has a recap carries a "Recap" link that opens this page on its tag.

The panel loads `recaps/day-05.html` only when its tag is chosen, so `build/publish.html` does not grow with each recap: twenty days of screenshots inside it would pass the 16 MB a claude.ai page allows. Tags suit the twenty or so days of a plan; past that, a select may replace them, without changing anything else.

### Publishing

When `project.dashboard_url` is set, the skill publishes `build/publish.html` as today, with the recaps as supporting files of the same page (`files: { "recaps/day-05.html": "build/recaps/day-05.html" }`), so the panel reaches them by their relative path.

This has to be tried first: whether a claude.ai page can show one of its own supporting files in its panel. If it cannot, the recaps are embedded in the dashboard's page itself, their screenshots resized, and the build refuses beyond the size limit instead of publishing a page that would not load.

## The skill

- **When.** At each end-of-session update whose tagged commits move tasks of a plan day, the skill offers to draft that day's recap, or to update it if it exists. A blocked or unfinished task does not hold it back: what already works is shown, what is blocked goes to "What remains". It is an offer, not a step: the developer may decline, and no recap is drafted for past days unless asked.
- **An update** rewrites only what the new work changes: a new card, a row added to the table, an obstacle lifted, a limit gone from "What remains". The developer sees what changes before it is written.
- **The format** goes in `recap.md`, in the skill's directory, read only when drafting, as `plan.md` is for the first plan.
- **What solopilot already knows**, which the skill drafts from: the day's tasks and points, the features they deliver, the commits tagged with their ids, the questions and dependencies settled for them, the log entries of the days it took, the milestone reached. `solopilot commits --day 5` lists the commits tagged with a day's tasks, over the whole history: today's `commits` only sees those since the last update, and the skill does not run git itself.
- **What only the project knows**: the screenshots, the roles and the access rules, the tests and their count. The screenshots are taken by the project's own method (a Playwright script on the dev stack, at phone width, cropped to what matters, with a frame around what the day adds) and dropped into the folder. solopilot never takes them: the stack, the accounts and the seed data are the project's.
- **Approval.** The skill shows the draft, the developer corrects and approves, then it writes `recap.md`, runs `build`, publishes and commits in the pilot directory. `solopilot install` allows writing in `recaps/`, so this runs without a permission prompt.
- **The prose never mentions delays, margins, points or the projection.** The dashboard holds them. This keeps the recap readable by someone who does not follow the plan, and keeps a future client view cheap.

## A view for the client, later

The roadmap lists "a generated view for the client" once the need is confirmed. The recaps would be its best material: they tell what works, in the client's words, with screenshots. They are not that view yet. Before a recap could reach a client, it would lose:

- the plan's day number, its points and the date it was planned for, which tell the pace to whoever compares them;
- the tasks blocked or deferred, and the known limits that reveal a cut in scope;
- the questions the developer owes themself (`who` is `project.owner`), as in the scope document;
- obstacles that tell an internal difficulty rather than a risk lifted for the user;
- the technical appendix.

With the prose rule above, most of this sits in the parts solopilot computes, and the client view would be a second rendering of the same file rather than a second text. It is out of this version.

## Out of scope

- Taking the screenshots, and any browser or Playwright dependency.
- A recap for the client, or sent to the client.
- A recap per sprint or per week: a sprint's recaps are its days' tags.
- A recap drafted or published without the developer's approval.
- A key or section in `solopilot.yaml`.
- The recap in the Slack digest, beyond what the dashboard link already gives.

## Decisions (2026-11-09)

1. **The recap's file.** Markdown in a subset solopilot renders, the header computed from the plan.
2. **The images.** Embedded in each recap's page.
3. **One link.** The recaps are read from the dashboard, on a page of its header menu beside the board: a tag per day, and a click shows that day's recap. The form, tags or a select, is settled when the page is built.
4. **When.** At each update that moves a day's tasks, not only once the day is done: a blocked task does not hide what already works.
5. **The prose rule.** No delay, margin, points or projection in what is written.
6. **When to build it.** Now: after nearly a month of real use, it is a real need.

## How it would be tested

- Unit tests: the header computed from the plan, for a day done and a day in progress with a blocked task; the Markdown subset, cards and the folded appendix; images embedded, and a missing one flagged by `check`; the dashboard showing a tag only for the days that have a recap, and the day rows linking to them; `publish.html` not growing with the recaps; `commits --day` listing the commits of the day's tasks across updates.
- End-to-end scenario: on Fieldbook, an end-of-session update moves day 6 with T014 still blocked; the skill offers the recap and drafts it from the plan and the commits, T014 under "What remains"; once approved, the recap is written, built and shown from its tag. A later update closes T014, and the same recap is updated and reads done.
