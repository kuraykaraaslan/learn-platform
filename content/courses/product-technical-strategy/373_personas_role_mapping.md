# 373. Personas & Role Mapping — Buyer, User, Admin, and Operator

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `target-user-and-persona.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Most B2B and internal software has more than one human touching it, and the roles do not share a goal. The person who signs the check is frequently not the person who opens the app every day; the person configuring permissions is not the person filing a support ticket about a permission they don't have. Role mapping is the step of separating these people explicitly — buyer, decision maker, primary user, secondary user, admin/operator, support user, external customer, technical maintainer — before a single feature is designed, because a feature that satisfies one role can actively work against another.

The buyer-vs-user split is the one that kills products fastest. A tool that pleases the buyer (rich reporting, cost controls, an impressive sales demo) but frustrates the daily user (extra clicks, unclear states, slow forms) gets purchased and then quietly abandoned in favor of the spreadsheet everyone already knew how to use. A tool that pleases the user but never speaks to the buyer's need for cost visibility or approval controls doesn't get purchased at all. Both perspectives need to be written down, even when — especially when — the same person plays both roles on a small team, because writing them separately is what surfaces the tension between them before it becomes a shipped feature nobody uses.

Personas here are deliberately not the marketing kind. A persona in this framework is a job, a pain, a set of actions, and a definition of success — not a name, an age, and a stock photo. "Ayşe is 34 and likes coffee" is noise unless her age or coffee habit changes what she needs from the product. The discipline is to write only what changes a product decision: what she can view, what she can create, what she is blocked from doing, and what "this worked" looks like from her seat. That last field — permission awareness (can view / create / update / delete / approve / export) — is the bridge between product strategy and the RBAC model that Technical Architecture will eventually build; getting it right here saves a redesign of the permission system after launch.

## Key Concepts
- **Role inventory**: buyer, decision maker, primary user, secondary user, admin/operator, support user, external customer, technical maintainer — include only the roles that actually exist in this project
- **Persona fields**: role name, goal, pain, context of use, decisions they make, data they can access, actions they can perform, success definition, risk if ignored
- **Buyer vs. user split**: write both perspectives explicitly when they differ; a product that satisfies only one of them fails at either adoption or purchase
- **Permission awareness**: for each role, note can-view / can-create / can-update / can-delete / can-approve / can-export / can-invite / can-manage-settings — this is not RBAC implementation, but it is RBAC's direct input
- **Decorative persona anti-pattern**: age, hobbies, and stock-photo detail are noise unless they change a product decision — cut anything that doesn't
- **Context of use**: where and when the role interacts with the product (in the field on a phone, at a desk before a weekly call, once a quarter during an audit) shapes UI and performance requirements as much as the goal does
- **Risk if ignored**: naming what breaks if this role's needs are skipped turns an abstract "we should think about admins too" into a concrete, prioritizable risk

## Example Code
```markdown
## User Role Map — Crew Scheduler

| Role | Goal | Pain | Main actions | Success | Priority |
|---|---|---|---|---|---|
| Ops Manager (Buyer) | Reduce rework hours, prove ROI | No visibility into double-bookings | View reports, approve billing | Rework hours trend down | P0 |
| Dispatch Coordinator (Primary User) | Assign jobs without conflicts | Manual reassignment is slow and error-prone | Create job, assign, reassign | Reassignment under 2 min | P0 |
| Field Technician (Secondary User) | Know today's job without calling in | Finds out about changes too late | View assignments, confirm | Confirms before arriving on site | P0 |
| Support Admin (Operator) | Fix a stuck job record for a client | No safe way to override a locked job | Force-unlock, edit job state, view audit log | Resolves ticket without a database query | P1 |

## Persona: Dispatch Coordinator

**Goal:** Assign and reassign technicians to jobs without creating double-bookings.
**Pain:** Currently uses a shared spreadsheet; reassigning during a live conflict means
calling both technicians to confirm who has capacity.
**Context:** At a desk, multitasking across phone calls, throughout the business day —
needs the schedule visible at a glance, not buried in a multi-step flow.
**Key actions:** Create job, assign technician, view day/week calendar, reassign on conflict,
mark job complete.
**Data access:** Full read/write on jobs and assignments within their region; read-only on
technician availability set by ops.
**Success definition:** Can resolve a same-day reassignment in under 2 minutes without a phone call.
**Risk if ignored:** If the calendar view isn't fast enough for a coordinator juggling calls,
they revert to the spreadsheet and the product fails to displace the workaround it was built to replace.
```

## When to Use
- Immediately after problem framing (lesson 372) and before writing user stories or a PRD — role mapping is what the PRD's "target users and roles" section depends on
- Whenever a buyer and a daily user are different people or different departments — write both perspectives even if it feels redundant
- Before designing the permission model — the "can view / create / update / delete / approve" column is the direct input to RBAC design (see lesson 390)
- When a feature debate stalls — check whether the disagreement is actually "which role are we optimizing for," not a disagreement about the feature itself
- When onboarding a new team member to an existing product — the role map is faster context than a walkthrough of every screen

## Common Mistakes
- Writing personas as narrative fiction (age, hobbies, a name with no bearing on the product) instead of job, pain, permission, and success
- Treating "users" as one undifferentiated group when a buyer, an admin, and a daily user clearly want different things
- Skipping the permission-awareness fields and discovering the gaps only when the RBAC model is being implemented, at which point changing it is a migration, not an edit
- Assuming the buyer and the user are the same person by default, without checking — even solo internal tools often have a manager who approves and a staff member who executes

## Further Reading
- Alan Cooper — "The Inmates Are Running the Asylum" (the original case for goal-directed personas over demographic ones)
- Indi Young — "Practical Empathy" (persona and role work grounded in actual behavior rather than assumption)
- Intercom's "Jobs to Be Done" resources on intercom.com — useful bridge between role mapping and lesson 374
