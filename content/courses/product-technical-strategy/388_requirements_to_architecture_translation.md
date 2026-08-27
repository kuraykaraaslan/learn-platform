# 388. Requirements-to-Architecture Translation and System Context Mapping

## What It Is
Architecture must be derived from requirements, not guessed from a stack preference — before a single table or route exists, business requirements have to pass through a translation step that turns "users can manage events" into something an architecture can actually be built against: "Admin users can create events, assign venues, configure sections, define ticket price tiers, publish events, and view ticket sales. Regular users can browse published events and purchase tickets." The requirement translation table is the mechanical version of this discipline: multiple user roles maps to an RBAC/permission model, an approval workflow maps to a state machine plus audit log plus notifications, payments map to provider integration with idempotency and webhook validation, reporting maps to a query model with indexing and exports, multi-company use maps to tenant isolation and explicit data ownership, and offline/field use maps to a sync model with conflict handling. Each row converts a business sentence into an architectural consequence.

Once requirements are extracted, the system context map draws the boundary around what the system owns versus what it depends on. Every architecture needs an explicit answer to a short set of boundary questions: is this system the source of truth for this data, who creates it, who updates it, who deletes it, who's allowed to view it, does another system already own this responsibility, and what happens if that external system becomes unavailable. The output is a concrete map: primary users and their goals, internal actors (admin, support, operations), external systems (payment provider, email/SMS provider, storage provider, identity provider), what the system owns versus explicitly does not own, and which data is owned locally versus owned elsewhere and merely mirrored.

Trust boundaries are where this translation earns its keep operationally, not just on paper — mark every point where trust changes: browser to application server, public API to authenticated API, application to third-party API, webhook provider to webhook endpoint, admin user to privileged operation. Each boundary drives a different validation, rate-limiting, authentication, and logging decision downstream, and treating them as uniform is how a webhook endpoint ends up with the same trust level as an authenticated internal admin route. And when a requirement is missing rather than merely vague, the discipline mirrors problem framing on the product side (lesson 372): state the assumption, name the risk if it's wrong, and pose the open question — never invent certainty just to keep the document looking complete.

## Key Concepts
- **Required requirement categories**: business goal, user roles, critical workflows, data objects, external systems, security/access needs, reporting needs, performance/availability expectations, compliance/privacy constraints, deployment/support expectations, budget/timeline constraints
- **Requirement translation table**: maps a stated requirement (multiple roles, approval workflow, payments, reporting, multi-company use, file uploads, high traffic, offline use, legal/privacy data, third-party APIs) directly to its architecture impact
- **Architecture input template**: business goal, users/actors, critical workflows, core data objects, external systems, NFRs, security/access requirements, operational requirements, constraints, assumptions, open questions
- **System context map fields**: primary users and goals, internal actors, external systems, what the system owns vs. does not own, data owned locally vs. owned elsewhere
- **Boundary questions**: source of truth, who creates/updates/deletes, who can view, does another system already own this, what happens on external unavailability
- **External dependency map fields**: system name, purpose, data exchanged, sync or async, failure impact, retry/fallback behavior, credential owner, cost owner
- **Trust boundary marking**: browser → app server, public API → authenticated API, application → third-party API, webhook provider → endpoint, admin → privileged operation — each drives different validation/logging requirements
- **Missing-requirement handling**: assumption / risk / question format, the technical-side mirror of problem framing's handling of vague requests (lesson 372)

## Example Code
```template
# Architecture Inputs — Crew Scheduler

## Business Goal
Eliminate double-booking incidents for a small field-service crew through a
shared, conflict-aware scheduling view.

## Users / Actors
- Dispatch coordinator (primary): creates jobs, assigns technicians, reassigns
- Technician: receives assignment notifications via SMS
- Admin (same person as coordinator in MVP): manages technician roster

## Critical Workflows
Job creation → technician assignment with conflict check → SMS notification →
manual reassignment on conflict or cancellation.

## Core Data Objects
Job, Assignment, Technician, ConflictWindow.

## External Systems
SMS provider (Twilio-equivalent) — outbound notifications only, no inbound
data owned by this system.

## System Context

**Primary Users**
- Dispatch coordinator: needs a conflict-free schedule they can trust

**External Systems**
- SMS provider: purpose = technician notification; data exchanged = job time/
  address one-way; sync = async (fire and forget with delivery status webhook);
  failure impact = technician doesn't get notified in real time; credential
  owner = client's SMS account, managed by dev team during pilot

**System Owns**
- Job, Assignment, Technician records; conflict-detection logic

**System Does Not Own**
- SMS delivery infrastructure; technician's phone/device reachability

## Trust Boundaries
- Coordinator browser → application server (authenticated session)
- SMS provider → webhook endpoint (delivery status callback, signature-verified)

## Assumptions
- Technicians carry SMS-capable phones with reliable field reception

## Open Questions
- Will the client need a second coordinator role before pilot ends?
```

## When to Use
- Immediately after product strategy handoff (lesson 371's handoff summary), before any schema, API, or module design begins
- Whenever a client requirement reads as a feature name ("event management") rather than a testable, role-specific behavior
- When deciding which third-party dependencies need a documented ownership, failure-impact, and credential-owner entry before they're wired in
- Before quoting an estimate — the architecture input template is what should actually be estimated against, not an unexamined feature list

## Common Mistakes
- Designing database tables or API routes directly from a one-sentence product pitch, skipping the translation step entirely
- Assuming a third-party system is always available and building no fallback behavior for the case where it isn't
- Treating "the client will provide clean data" as a certainty instead of stating it explicitly as an assumption with a named risk
- Drawing the system context map after implementation has already started, once boundary decisions are already baked into the code
- Applying uniform trust and validation logic across all boundaries instead of treating public, authenticated, and privileged boundaries differently

## Further Reading
- Eric Evans — "Domain-Driven Design" (the origin of context mapping as a technique)
- Simon Brown — the C4 model (System Context diagrams as a practical mapping tool)
- Matthew Skelton & Manuel Pais — "Team Topologies" (on ownership boundaries as an organizational, not just technical, decision)
