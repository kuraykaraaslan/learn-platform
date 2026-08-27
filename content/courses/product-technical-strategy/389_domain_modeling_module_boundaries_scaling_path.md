# 389. Domain Modeling, Module Boundaries, and the Staged Scaling Path

## What It Is
Before schema and API routes exist, a system needs a shared vocabulary — not the code-level DDD implementation exercise (aggregates, repositories, and tactical patterns are covered elsewhere in this curriculum's architecture-and-patterns material), but a strategic discipline: naming the business's real concepts so "ticket," "pass," "booking," and "reservation" don't quietly become four different words for the same thing across four modules. For each project, define a domain glossary specific to the business, the bounded contexts that partition it (business areas with their own language and rules — Identity, Catalog, Ordering, Fulfillment, Notifications, Reporting, Admin Operations), and, for any workflow with a lifecycle, an explicit state machine naming who can trigger each transition, what side effects follow, and what must be audited.

Module boundaries decide where responsibilities live once that vocabulary exists, and this is an organizational decision more than a technical one. The default for a solo or small team is a modular monolith — clear domain modules named after business capabilities (Auth, Users, Appointments, Payments — never "Helpers," "Utils," or "Managers"), explicit interfaces between them, and a single deployable unit — because shared database transactions, fast iteration, and a limited operational budget usually outweigh whatever theoretical benefit a service split offers this early. Splitting into separate services is justified only by a concrete reason: an independent scaling requirement, a separate deployment lifecycle, a genuinely strong data-ownership boundary, security isolation, or a real team-ownership boundary — never because microservices "sound more professional" for a product that hasn't yet proven it has users.

The staged scaling path turns this into a sequence instead of a one-time guess, and it directly informs when — if ever — a service split from the previous paragraph becomes justified. Stage 1 is clean queries, pagination, indexes, and optimized assets — the fixes that resolve most early performance complaints without adding a single piece of new infrastructure. Stage 2 adds caching, background jobs, and CDN or object storage. Stage 3 is vertical scaling, read replicas, and dedicated queue workers. Stage 4 — service extraction — is the last stage, not the first, and it applies only to modules that hit one of the concrete triggers above. A performance budget stated explicitly per critical flow ("checkout completes in under 3 seconds, excluding provider delay") is what tells you which stage actually applies to your system right now, rather than architecting for a scale anxiety hasn't earned yet.

## Key Concepts
- **Domain vocabulary discipline**: a project-specific glossary that prevents the same business concept from acquiring different names across different modules
- **Bounded context**: a business area with its own language and rules (Identity, Catalog, Ordering, Fulfillment, Notifications, Reporting, Admin) — don't mix unrelated business rules into one module just because they share a database
- **Entity vs. value object**: entities have identity and a lifecycle (User, Order); value objects are defined by their values and are replaceable (Address, Money, DateRange)
- **State modeling requirement**: any workflow with a lifecycle needs explicit states, who can transition them, required side effects, and audit needs
- **Modular monolith as default**: single deployable unit, business-capability-named modules, explicit interfaces, limited cross-module access — the right starting point for most solo/small-team projects
- **When to split services (five concrete triggers)**: independent scaling need, separate deployment lifecycle, strong data-ownership boundary, security isolation, real team-ownership boundary — absent one of these, stay monolith
- **Staged scaling path (Stage 1–4)**: clean queries/pagination/indexes → caching/jobs/CDN → vertical scaling/read replicas/queue workers → service extraction (last resort, not first move)
- **Performance budget**: an explicit target per critical flow is what determines which scaling stage actually applies — "fast" is not a budget
- **Explicit boundary**: this lesson covers the organizational/ownership decision of where boundaries live and when to split; the code-level implementation of DDD tactical patterns and the mechanics of extracting a running service are separate technical skills

## Example Code
```template
## Domain & Module Plan — Crew Scheduler

### Domain Glossary
- Job: a scheduled unit of field work with a customer, address, and time window
- Assignment: the link between a Job and a Technician
- ConflictWindow: a computed overlap between two Assignments for the same
  Technician
- Coordinator: the internal role that creates Jobs and resolves conflicts

### Bounded Contexts
- Scheduling (Job, Assignment, ConflictWindow)
- Notifications (SMS delivery, delivery status)
- Reporting (weekly job/technician summaries — read-only, derived data)

### Modules (Modular Monolith)
- Auth, Technicians, Jobs, Assignments, Notifications, Reports

### When-to-Split Analysis
Stay monolith: single-region pilot, shared-database transactions matter for
atomic conflict detection (Job + Assignment must be consistent in one
transaction), operational budget does not support running separate services.
Revisit only if: Notifications volume grows enough to need independent scaling
(a Stage 4 trigger), or a second product line needs to reuse the Technicians
module independently (a team-ownership trigger).

### Staged Scaling Path — Current Position
**Stage 1 (current):** Indexed queries on Job.date and Assignment.technicianId;
pagination on the coordinator's job list. Sufficient for current pilot volume
(~50 jobs/week).

**Performance budget:** Calendar view loads in under 1.5s for up to 500 jobs;
conflict check returns in under 300ms.

**Not yet needed:** Caching (Stage 2), read replicas (Stage 3), and service
extraction (Stage 4) — none of the triggers for these stages are present yet.
```

## When to Use
- Immediately after requirements-to-architecture translation (lesson 388), before schema or API design starts
- Whenever a team is tempted toward microservices for a product that hasn't yet validated product-market fit — check the five concrete split triggers explicitly instead of deciding by instinct
- When a performance complaint arrives — check which scaling stage actually applies before reaching for new infrastructure
- When naming a new module — test the name against the "business capability, not technical category" rule before it becomes a dumping ground

## Common Mistakes
- Starting database and API design before the domain glossary exists, which lets the same concept acquire multiple inconsistent names across modules
- Recommending microservices because they sound more sophisticated for a project whose actual risk is proving anyone wants the product at all
- Splitting modules by database table instead of by business capability, producing technically-named modules ("Data," "Managers") that hide business logic instead of exposing it
- Jumping to Stage 3 or Stage 4 scaling infrastructure without confirming Stage 1 fixes (indexes, pagination, query shape) have actually been exhausted first
- Treating a service split as reversible and low-cost when it is neither — extracting a service is a one-way door that should require a documented ADR (lesson 387)

## Further Reading
- Eric Evans — "Domain-Driven Design" (bounded contexts and the strategic-design half of DDD, distinct from tactical patterns)
- Sam Newman — "Building Microservices" (the concrete triggers for splitting, written by an author who is also candid about when not to)
- Martin Fowler — "MonolithFirst" (martinfowler.com — the case for defaulting to a monolith and splitting only once boundaries are proven)
