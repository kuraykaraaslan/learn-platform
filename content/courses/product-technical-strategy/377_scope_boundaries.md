# 377. Scope Boundaries — In Scope, Out of Scope, and Change Triggers

## What It Is
MVP scoping (lesson 375) and feature prioritization (lesson 376) decide what goes into a release. Scope boundaries write that decision down in a form nobody can quietly renegotiate later. The difference matters more than it sounds: a must-have feature list lives in your head or a planning doc, but a scope boundary document is the thing you can point to three weeks into a project when someone says "can you also just add refund automation, that was obviously part of this." If it isn't in the out-of-scope list, "obviously part of this" wins the argument by default, because silence reads as inclusion.

A complete scope boundary states six things: in scope, out of scope, assumptions, constraints, dependencies, and change-request triggers. In-scope items have to be specific and testable — "admin panel included" is not a scope statement, it's a placeholder that will be reinterpreted by whoever is unhappy with the final product. "Admin can create events, edit event details, define ticket types, view orders, export attendee lists, and validate QR tickets" is a scope statement, because you can check each clause against the delivered product and get a yes or no answer. Out-of-scope items need the same specificity, and they need to exist even when they feel too obvious to state — nobody assumes native iOS/Android apps are excluded from an MVP web admin panel until the client is standing in your office asking where the App Store listing is.

Assumptions and constraints are the quiet cousins of scope: facts you're building on that, if wrong, change the estimate. "Client will provide logo and brand assets," "only Turkish and English are required in MVP," "existing data migration is not included unless provided in clean CSV format" — each of these is a landmine if left unstated and it turns out false midway through delivery. Change-request triggers close the loop: instead of relitigating scope every time a new idea comes up, you pre-agree on the conditions that automatically mean "this is new scope, not a clarification" — a new user role, a new integration, an expanded approval workflow, a new language or platform. When the trigger fires, there's no debate about whether it's a change request, only a conversation about priority and cost.

## Key Concepts
- **Six required fields**: in scope, out of scope, assumptions, constraints, dependencies, change-request triggers
- **In-scope rule**: specific and testable ("admin can create events, define ticket types, view orders"), never a category label ("admin panel included")
- **Out-of-scope rule**: named explicitly, even when it feels obvious — undocumented exclusions become disputed inclusions
- **Assumptions as estimate inputs**: facts the scope and price depend on (who provides content, which languages, migration format) — wrong assumptions should trigger a re-scope, not silent absorption
- **Change-request triggers**: pre-agreed conditions (new role, new workflow, new integration, expanded approval logic, new language/platform) that automatically classify a request as new scope
- **Scope is a pricing/timeline gate**: nothing gets estimated credibly until in-scope and out-of-scope are both written down
- **Out of scope is not "rejected forever"**: it's a phase separation — the roadmap (lesson 382) is where excluded items get a future home

## Example Code
```markdown
## Scope Boundaries — Crew Scheduler MVP

### In Scope
- Coordinator creates a job with customer, address, and time window
- Coordinator assigns a technician with server-side conflict detection
- Day/week calendar view of all jobs for the coordinator's region
- Manual reassignment with SMS notification to the affected technician
- Audit log of every assignment and reassignment (who, when, from/to)

### Out of Scope
- Route optimization or sequencing within a technician's day
- Customer-facing self-scheduling portal
- Payroll or timesheet integration
- Native mobile app (SMS is the MVP notification channel)
- Multi-region or multi-dispatcher support

### Assumptions
- Technicians carry a smartphone capable of receiving SMS in the field
- Client provides the initial technician roster as a clean spreadsheet
- Single region, single coordinator for the pilot window

### Constraints
- Pilot must run within the client's existing SMS provider account (no new vendor contract)
- Launch date is fixed to the start of the client's next scheduling cycle

### Dependencies
- SMS provider credentials must be issued before development starts on notifications

### Change Request Triggers
- A second coordinator or region is added
- Route optimization is requested
- Any new integration (payroll, CRM, accounting) is requested
- Approval or reassignment rules change beyond single-coordinator conflict detection
```

## When to Use
- Before proposal, pricing, architecture, or sprint planning — never after
- Immediately after MVP scoping and feature prioritization produce a must-have list, to convert it into a defensible document
- Whenever a client says "can you also just add X" mid-project — check it against the change-request triggers instead of debating from scratch
- Before quoting a fixed price or fixed timeline, since the must-have list is what gets estimated, not the wishlist
- When scope feels like it's drifting — re-reading the out-of-scope list is often faster than re-running the whole strategy sequence

## Common Mistakes
- Writing in-scope items as vague categories ("dashboard included") that can be reinterpreted after delivery
- Treating exclusions as too obvious to write down, then losing the argument when the client disagrees about what "obvious" meant
- Skipping change-request triggers, so every new request becomes a fresh negotiation instead of a pre-agreed classification
- Confusing "out of scope" with "rejected" — out-of-scope items still belong on the roadmap, just not in this phase

## Further Reading
- Karl Wiegers & Joy Beatty — "Software Requirements" (on writing scope statements that survive contact with stakeholders)
- IIBA's BABOK Guide — the business analysis scope-definition techniques this rule compresses
- Basecamp's "Shape Up" (Appetite chapter, basecamp.com/shapeup) — on fixing scope boundaries around a fixed budget rather than negotiating endlessly
