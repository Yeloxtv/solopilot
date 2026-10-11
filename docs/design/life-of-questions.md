# Specification: following the life of questions

Status: agreed on 2026-10-11, done. Workstream 5 of the [roadmap](../roadmap.md).

## Goal

The screening done for the first plan finds the questions, and their due dates follow the work. But two things still escape the tool:

- a question is not necessarily **asked**: nothing says whether it went out to the client, or how long it has been waiting;
- questions also come up **during development**, as the work gets close to a feature.

This workstream follows each question from the day it is asked to its answer, offers the reminders, and looks for the missing questions before the work reaches them.

## Asked, waiting, to chase

Two dates, on questions and dependencies alike:

| Field | Meaning |
| --- | --- |
| `asked_on` | The day it was asked of the client, or requested |
| `reminded_on` | The day of the last reminder |

What follows from them:

- **Waiting since**: the working days since `asked_on`.
- **To chase**: no answer 5 working days after it was asked or last reminded.
- **Never asked**: an answer needed within two weeks, or now, that has no `asked_on`. It is the costliest case: the question exists in the plan, but nobody sent it.

## Where it shows

- **`status`**: under "To watch", each answer says whether it was asked and since when ("asked October 12, 7 d") or that it was not. A line lists the reminders to send, by person.
- **The dashboard**: each answer carries its state (asked since, to chase, never asked). A risk is raised when answers needed within two weeks were never asked, high if one is needed now.
- **The Slack digest**: the list of reminders to send, by person, when there are any.

## The skill

- **When the developer says they sent questions**, for example with the scope document or in an email, the skill sets `asked_on` on those.
- **For a reminder**, it drafts the message to the client, grouped by person, without any internal delay or margin. Once the developer has sent it, it sets `reminded_on`.
- **At each end-of-session update**, it screens the tasks of the next three plan days. For each one, it asks what is still missing to build it: a business rule, a content, a piece of data, an access, a decision. It proposes the new questions or dependencies, linked to their tasks, with their `before`.

## Decisions (2026-10-11)

1. **The fields.** *Recommended: `asked_on` and `reminded_on`, on questions and dependencies alike.*
2. **The time before a reminder.** *Recommended: 5 working days after it was asked or last reminded, adjustable with `project.chase_after`.*
3. **The risk of questions never asked.** *Recommended: raised for answers needed within two weeks, high if one is needed now.*
4. **Screening along the way.** *Recommended: the tasks of the next three plan days, at each end-of-session update.*

## How it is tested

- Unit tests: the wait in working days, the reminder due after 5 days then pushed back by `reminded_on`, the answers never asked and the risk, the validation of the dates.
- End-to-end scenario: on Fieldbook, the end-of-session update flags the reminders and proposes a new question for a day close by; then "I chased the client about Q03" sets `reminded_on`.
