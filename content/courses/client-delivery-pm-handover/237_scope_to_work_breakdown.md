# 237. Scope to Work Breakdown

## What It Is
A signed proposal is not an execution plan. "Admin panel for managing events, venues, ticket categories, and orders" is a sentence a client will happily sign, but it contains zero information about screens, roles, validation rules, or what happens when a category is deleted while orders reference it. Scope-to-work breakdown is the deliberate translation step between "what we agreed to build" and "the tracked list of things someone will actually do" — and skipping it is how a single vague scope line turns into three weeks of undiscovered work.

The breakdown follows a hierarchy — project, phase, milestone, feature/module, task, and only rarely subtask — and the discipline is knowing when to stop decomposing. Over-planning every technical micro-step produces bureaucracy nobody reads; under-planning leaves "build the admin panel" as one card on a board, which tells you nothing about whether it's 20% or 90% done. The right granularity is a task whose title describes an outcome a non-engineer could evaluate: "Create admin event list with search and status filter," not "Backend part."

The second half of this discipline is making the invisible parts of scope visible: for every feature a client might assume is included, you explicitly mark it included, excluded, deferred, or optional. A client who assumed refunds were part of "payment integration" and discovers otherwise at UAT is not being unreasonable — they were never told otherwise. The same rigor applies to assumptions: if a task depends on the client delivering a final category list, write down both the assumption and the risk if it changes late (schema and UI rework, likely a change request). This is what separates a work breakdown from a to-do list: it carries the reasoning, not just the tasks.

## Key Concepts
- **Work breakdown hierarchy**: Project → Phase → Milestone → Feature/Module → Task → Subtask (only if genuinely needed) — avoid skipping straight from proposal paragraph to code
- **Outcome-based task titles**: a task describes a result a client could evaluate, not an internal technical step ("Add role-based access control to order export" not "Backend work")
- **Exclusion mapping**: every assumable feature is explicitly marked included / excluded / deferred / change-request-only, closing the gap between what was signed and what people assumed
- **Assumption logging**: when a task depends on something unconfirmed, the assumption and its downstream risk are written down at breakdown time, not discovered during QA
- **Category checklist**: frontend screens, backend APIs, database models, roles/permissions, validation, notifications, integrations, error/empty/loading states, deployment, testing, and documentation tasks all get checked — not just the "obvious" feature work
- **Owner separation**: client-owed tasks (content, approvals, data) and developer-owed tasks live in the same breakdown but are never merged into one ambiguous item
- **Breakdown timing**: happens after scope is approved and before sprint/task execution — it is the bridge, not a formality tacked onto either end

## Example Code
```template
## Work Breakdown

### Phase: Admin Core

**Goal:** Staff can manage the event catalog without developer involvement
**Deliverable:** Events module with full CRUD and status workflow
**Dependencies:** Final event field list confirmed by client (owner: Elena, due 2026-08-29)

| Task | Owner | Priority | Status | Acceptance Criteria |
|---|---|---:|---|---|
| Define event data model (title, dates, venue, capacity, status) | Dev | Must | Done | Schema reviewed against confirmed field list |
| Create event list screen with search + status filter | Dev | Must | In Progress | Staff can find an event by name or filter by draft/published |
| Create event create/edit form with validation | Dev | Must | Not Started | Start date must precede end date; capacity must be positive integer |
| Add role-based access (Admin: full CRUD, Staff: view + edit only) | Dev | Must | Not Started | Staff role cannot delete or change published status |
| Add status field workflow: draft → published → cancelled | Dev | Should | Not Started | Cancelled events cannot be edited back to published |
| Client: confirm final event field list | Client | Must | Blocked | Written confirmation received |

### Exclusion Mapping
Included: Single-venue event creation with manual capacity entry.
Excluded: Recurring/series events, waitlist management, multi-venue events.
Deferred: Bulk CSV import of events (candidate for Phase 2).
```

## When to Use
- Immediately after scope is signed off in the kickoff, before creating the first sprint or task board
- Whenever a proposal line item is vague enough that two people could reasonably build different things from it
- Before quoting a change request, to confirm the new item doesn't silently touch categories you previously marked excluded
- When a project stalls because "everything is in progress" — a proper breakdown usually reveals the vague mega-tasks hiding the real status

## Common Mistakes
- Tracking a large feature as one vague board card instead of decomposing it, which makes "90% done" meaningless
- Starting implementation directly from a proposal paragraph, skipping the exclusion-mapping step that would have caught an assumed feature
- Treating client-owed items (content, data, approvals) as outside the work breakdown instead of tracking them with the same owner/date discipline as developer tasks
- Ignoring documentation, deployment, and error/empty-state tasks because they don't feel like "real" features, then discovering them unplanned during QA

## Further Reading
- Mike Cohn, *User Stories Applied: For Agile Software Development* — the standard reference for decomposing scope into outcome-based, evaluable units of work
- Atlassian, "How to write a work breakdown structure" — practical WBS guidance for turning scope into a hierarchy of trackable deliverables: https://www.atlassian.com/agile/project-management/work-breakdown-structure
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Scope Management knowledge area formalizes the WBS concept this lesson applies to freelance/small-team delivery
