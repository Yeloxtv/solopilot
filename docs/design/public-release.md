# Specification: preparing the public release

Status: agreed on 2026-10-11, in progress. Follows the [roadmap](../roadmap.md), section "Next".

## Goal

A developer who finds the repository must understand in five minutes what solopilot does and what they need to start. They must be able to install it and try it alone, without us. The repository tells a single story: a project's documents, the first plan drawn from them, then the project under way.

## What is already ready

Checked on October 11:

- **The history is clean.** The 18 commits contain no client project name, no personal email address, no token, no local path. They are authored with GitHub's noreply address.
- **The name is free.** `solopilot` does not exist on npm yet.
- **The foundations are there**: MIT license, CHANGELOG, README in English and French, and the documentation of the format and the computations, already in English.

## 1. Saying what you need to start

A "What you need to start" section in the README:

- **essential**: a document that describes what the application must do (spec, brief, meeting notes), the go-live date, the days sold, and the share of the day given to the project. On the tools side: Claude Code, Node.js 20 and git;
- **useful**: the workshop notes, the mockups (images, PDFs, Figma links), the quote.

## 2. A demo that tells the whole story

- **Fieldbook's documents.** The demo gets `examples/demo/sources/`, in English: a spec, a workshop note, a quote and two mockups. They are written to match the existing plan: same features, same exclusions, same open questions.
- **The plan in the current format.** The demo's plan moves to today's format:
  - the features, with their source, the core and the priority;
  - points per task and named views;
  - the estimation grid and the days sold;
  - the agreed plan and the client's approval;
  - a question already asked.

  The ids and the dates do not change. The dashboard, the tests and the daily scenario therefore keep working. The screenshot `docs/dashboard.png` is redone.
- **Two ways to try it**, in the README:
  - see a project under way: `npm run demo`;
  - replay the first plan from the documents: `solopilot init fieldbook-pilot --example` copies Fieldbook's documents into `sources/`, then `/solopilot` in Claude Code.
- **Kerlan stays a test fixture of the harness**, in French. It is not presented as a demo.

## 3. The working documents in English

- **The vision**, `docs/vision.md`, is translated.
- **The state of play** becomes a short roadmap in English, `docs/roadmap.md`:
  - what is done: the six workstreams, one line each;
  - what comes next: learning to estimate, which waits for the history of a real project; a generated client view; a version for a team.
- **The six specifications** are translated and kept as design notes, in `docs/design/`. They explain the choices, for example why solopilot never measures hours.
- **The French originals are removed.** Git history keeps them. Only the README stays maintained in both languages, with `README.fr.md`.
- **The next specifications** will still be written in French, then translated once agreed.

## 4. Contributing

A `CONTRIBUTING.md` file:

- **getting started**: clone, `npm install`, then `npm link` so the skill finds the command;
- **the tests**: `npm test`, and what each suite covers;
- **the end-to-end scenarios**: they drive real Claude Code sessions, cost tokens and stay out of `npm test`. The file explains how to run one and where to read the report;
- **the principles to respect**:
  - never measure the developer's hours;
  - the client sees no delay and no margin;
  - the plan stays out of the project's repository;
  - the commands that write `solopilot.yaml` keep the comments;
  - every text exists in English and in French;
- **proposing a change**: an issue first for a change of behavior, a pull request for the rest.

## 5. The npm package

- **Version 0.2.0.** 0.1.0 was never published. The CHANGELOG keeps its history: 0.1.0 is the extraction, 0.2.0 everything that followed.
- **The package contents**: the package ships the whole demo, plan and documents, for `--example`. A `prepublishOnly` script runs the tests before any publication.
- **Before publishing**, two checks:
  - `npm pack --dry-run` to check the contents and the size;
  - a real install from the tarball, in a temporary directory: `solopilot --version`, then `solopilot init --example`.
- **The install line in the README** becomes `npm install -g solopilot`.
- **The publication itself** goes through the maintainer's npm account, with `npm publish`, once these checks pass. The release is tagged `v0.2.0` in git.

## 6. The GitHub repository

- **The topics**: claude-code, project-management, solo-developer, freelance, agency, forecasting, backlog, dashboard, cli. The keywords in `package.json` follow. The repository owner adds them from GitHub.
- **Going public**: the repository owner switches it to public once the branch is merged.

## 7. Rereading the README

- The install from npm.
- "What you need to start" and the two ways to try it.
- The "Status" section:
  - the format may still change before 1.0;
  - issues are welcome;
  - a link to the roadmap and to CONTRIBUTING.
- `README.fr.md` follows, identically.

## Decisions (2026-10-11)

1. **The working documents.** *Recommended: translate everything, remove the French originals (except the README).* The alternative is to translate only the vision and keep the specifications in French: less work, but a repository half in a language most readers do not read.
2. **`solopilot init --example`.** *Recommended: yes.* Without this option, you have to clone the repository to replay the first plan. With it, installing the package is enough.
3. **The published version.** *Recommended: 0.2.0.* The alternative, folding everything into 0.1.0, would rewrite the CHANGELOG.
4. **A code of conduct.** *Recommended: not for now.* It can come with the first contributors.

## Decisions (2026-10-12)

5. **A French demo.** Built with `--locale fr`, the English demo showed a French interface around English content, which is not what a French project looks like. `examples/demo-fr` tells the same story in French, documents included, and `init --example --locale fr` copies them. A test keeps the two demos identical except for their text. Kerlan stays a test fixture.
6. **The published version becomes 0.3.0.** `v0.2.0` was tagged when the repository went public, and main has moved since: the bilingual dashboard, the French demo, the scope document reread. npm gets 0.3.0 as its first version, and the CHANGELOG says 0.2.0 was never published there.
7. **Feedback and tests in the open.** A trial report and a bug report as issue templates, the Discussions for questions, and the tests on Linux, macOS and Windows at every push.

## How it is tested

- **Unit tests**:
  - the migrated demo is valid in the current format;
  - `init --example` copies the documents;
  - the CLI and dashboard tests pass on the migrated demo.
- **Daily scenario**: it is built from the demo, and it must pass as it is.
- **A new scenario, `first-plan-en`**: the first plan drawn from Fieldbook's documents, in English. The first plan has only been tried in French. The checks cover the features linked to their sources, the gaps turned into questions and the exclusions out of scope. The resulting plan must look like the demo's.
- **The package**: `npm pack --dry-run`, then the install from the tarball in a temporary directory.
