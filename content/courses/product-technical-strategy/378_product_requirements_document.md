# 378. Product Requirements Document (PRD)

## What It Is
Everything the Product Strategy Operating System (lesson 371) produces — problem statement, personas, value proposition, MVP definition, scope boundaries, prioritized features — lives in separate documents written at separate times, often by whoever was in the room that week. A PRD is where all of it gets compiled into one build-ready artifact that client, design, engineering, and QA can all point to as the single source of truth. Its real job isn't describing the product; it's preventing context loss between the sales conversation where the product was imagined and the implementation where it actually gets built. Without it, "we already discussed this" becomes the most common — and least verifiable — sentence in the project.

A PRD is not a feature list with better formatting. The required structure runs sixteen sections: Overview, Problem Statement, Goals and Non-Goals, Target Users and Roles, MVP Scope, User Flows, Functional Requirements, Non-Functional Requirements, Data and Content Requirements, Integrations, Permissions and Roles, Edge Cases and Error States, Success Metrics, Assumptions and Risks, Out-of-Scope Items, and Open Questions. Each of these sections already has a source lesson in this course — the PRD's job is to pull them together, not to reinvent them. What's genuinely new here is the functional requirement itself: each one gets an FR-00X entry with a user role, description, business reason, inputs, expected behavior, edge cases, and acceptance criteria — enough that a developer who never sat in the discovery call can implement it correctly, and a QA engineer can test it without guessing what "correct" means.

The single most-skipped section is Open Questions, and it's the one that separates a professional PRD from an optimistic one. Every real project has unknowns — which payment provider, whether seat-level selection is required, who approves refunds — and the discipline is naming them explicitly instead of quietly picking an answer and hoping nobody asks. A requirement is only build-ready when it clears a specific bar: specific, testable, owned by a user role, connected to an outcome, and clear enough to implement without a follow-up meeting. "The system should be easy to use" fails every part of that bar. "Admin must be able to create a new event by entering title, date, venue, ticket types, capacity, and publication status from one form" passes all five.

## Key Concepts
- **Sixteen-section structure**: Overview through Open Questions — the PRD assembles the outputs of earlier strategy lessons rather than replacing them
- **FR-00X format**: user role, description, business reason, inputs, expected behavior, edge cases, acceptance criteria — the atomic unit of a functional requirement
- **Requirement quality bar**: specific, testable, owned by a role, connected to outcome, implementation-clear — a requirement failing any of these isn't build-ready yet
- **NFR categories folded in**: security, performance, accessibility, SEO, localization, browser/device support, data retention, logging, auditability, scalability, availability, backup/export
- **Open Questions is mandatory, not optional**: uncertainty gets named explicitly (payment provider, seat-level selection, refund approver, migration need, launch languages), never hidden inside an assumed answer
- **PRD as context-loss prevention**: the artifact that keeps the sales conversation and the implementation team aligned on the same product, months apart
- **A PRD is not a feature list**: it must include users, goals, non-goals, flows, edge cases, and metrics, or it isn't finished

## Example Code
```template
# Product Requirements Document: Crew Scheduler

## 1. Overview
Web-based dispatch tool replacing spreadsheet + group-chat scheduling for field service teams.

## 2. Problem Statement
[from lesson 372 — dispatch loses 6+ hours/week to double-bookings and missed reassignments]

## 3. Goals and Non-Goals
Goal: eliminate double-booking incidents for one region within a 2-week pilot.
Non-Goal: route optimization, customer self-scheduling (see Out-of-Scope Items).

## 4. Target Users and Roles
Dispatch coordinator (primary), field technician (secondary), ops manager (buyer).

## 5. MVP Scope
[from lesson 375]

## 7. Functional Requirements

### FR-001: Technician Assignment with Conflict Detection
**User role:** Dispatch coordinator
**Description:** Coordinator assigns a technician to a job from the calendar view.
**Business reason:** Prevents the double-booking that causes ~6 hrs/week of rework today.
**Inputs:** Job ID, technician ID, time window.
**Expected behavior:** Assignment succeeds unless the technician has an overlapping job;
on conflict, the system blocks the assignment and shows the conflicting job.
**Edge cases:** Technician is reassigned mid-day; job time window is edited after assignment.
**Acceptance criteria:** Given an overlapping window, when the coordinator attempts assignment,
then the system rejects it and names the conflicting job.

## 16. Open Questions
- Which SMS provider will be used, and who owns the account?
- Is a second region required for the pilot, or strictly single-region?
- Who is authorized to override a conflict-detection block?
```

## When to Use
- Before architecture, UI design, development, QA, or client sign-off begins
- Whenever "we already discussed this" is used as a substitute for a written requirement
- When a project is handed to a different developer, designer, or QA engineer than the one who ran discovery
- As the compilation step immediately after scope boundaries (lesson 377) are agreed
- Before estimating — a PRD's functional requirements are what actually get sized, not a verbal feature list

## Common Mistakes
- Writing a PRD that's a feature list with headings, missing users, goals, non-goals, flows, edge cases, or metrics
- Writing requirements in vague adjectives ("easy to use," "modern," "fast") instead of specific, testable behavior
- Hiding uncertainty by quietly picking an answer instead of listing it under Open Questions
- Writing the PRD before the problem, MVP, and scope boundaries exist, so it inherits no real constraints and reads as a wishlist

## Further Reading
- Karl Wiegers & Joy Beatty — "Software Requirements" (the standard reference for the specific/testable/owned quality bar used here)
- [Atlassian's Product Requirements template documentation](https://atlassian.com) — a widely used practical structure
- Marty Cagan's writings on PRDs vs. "product specs" at svpg.com — on why a PRD should describe outcomes and constraints, not a locked blueprint
