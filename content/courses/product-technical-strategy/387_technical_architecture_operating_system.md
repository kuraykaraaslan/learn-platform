# 387. Technical Architecture Operating System, Principles, and Decision Gates

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Technical_Architecture_Rules material (specifically `technical-architecture-master.md`, `architecture-principles.md`, `architecture-review-checklist.md`, and `architecture-decision-records.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Just as product strategy runs on a fixed sequence — problem, user, value proposition, MVP, scope, requirements, flows, metrics, roadmap, risk log, handoff (lesson 371) — technical architecture has its own operating system, and skipping it produces the same failure mode on the technical side: overbuilt systems, vague estimates, and architecture chosen from a stack preference instead of a business constraint. The sequence is business goal → users and actors → critical workflows → system boundary → domain model → data ownership → integration map → non-functional requirements → security and access model → deployment and operations model → risks and trade-offs → architecture decision record → implementation handoff. This course covers most of those stages as their own lessons (388 through 395); this lesson is the map showing how they connect, plus the gate that decides whether a project is even ready to enter the sequence.

Ten architecture principles act as the tie-breaker whenever two options are both technically valid. Business fit before technical preference means asking what business risk a choice reduces and what delivery risk it increases — not whether it's fashionable. Simple first, extensible where proven means defaulting to a well-structured modular monolith for most projects, with the explicit warning that simple must not mean careless: no domain boundaries, no validation, and no tests is not simplicity, it's negligence wearing simplicity's name. Design for the next real stage, not the fantasy end state, means avoiding both underbuilding that can't evolve past launch and overbuilding that spends months on infrastructure before the product idea is validated. And every external dependency must have a failure story — for each payment gateway, email provider, or queue, ask what happens if it's slow, down, sends duplicate events, or the credentials expire; a dependency with no answer to those questions hasn't actually been architecturally reviewed, regardless of how confidently it was chosen.

Readiness levels turn "is this ready to build" into a defensible answer instead of a gut feeling. Level 0 (Idea) has no defined users, workflows, data, or constraints — the correct action is not to estimate, but to move to discovery. Level 1 (Scope Sketch) has workflows and users known, but data, integrations, NFRs, and risks are incomplete — state assumptions explicitly and request confirmation before proceeding. Level 2 (Implementation Candidate) has boundaries, modules, data ownership, workflows, integrations, and NFRs all defined — this is where phase-by-phase estimation becomes credible. Level 3 (Production Architecture) has security, observability, deployment, backup/recovery, scalability, and support model all explicit — suitable for production-critical delivery. The architecture review checklist, covering business/scope, system boundary, domain/data, modules, security/access, NFRs, integrations, deployment, and a risk register, is what actually determines the level in practice, and it should always resolve to one of three verdicts: READY, READY WITH ASSUMPTIONS, or NOT READY — never a vague "looks good, let's build."

## Key Concepts
- **Technical architecture operating system**: business goal → actors → workflows → boundary → domain model → data ownership → integration map → NFRs → security/access → deployment/operations → risks → ADR → handoff
- **Ten architecture principles** (key ones): business fit before technical preference; simple first, extensible where proven; boundaries matter more than tools; design for the next real stage, not the fantasy end state; every external dependency needs a failure story; documentation is a delivery asset; a solo/small team should prefer maintainable leverage over distributed-systems complexity
- **Readiness levels 0–3**: Idea (don't estimate, go to discovery) → Scope Sketch (state assumptions, request confirmation) → Implementation Candidate (estimate by phase) → Production Architecture (ready for production-critical delivery)
- **Architecture review checklist categories (nine)**: business/scope, system boundary, domain/data, modules, security/access, non-functional requirements, integrations/async work, deployment/operations, risk register
- **Three-way verdict**: READY / READY WITH ASSUMPTIONS / NOT READY — the checklist must resolve to one of these, with critical gaps, assumptions, and next actions named explicitly
- **ADR governance trigger**: an architecture decision record is required for durable decisions — framework selection, database selection, auth/session model, monolith vs. microservices, multi-tenancy model, hosting platform, migration strategy — not for trivial implementation details; the ADR *document format itself* (context, options, decision, consequences) is a separate authoring skill covered in the Process & Soft Skills course, this is about recognizing *when* a decision is durable enough to require one
- **Decision rule**: when two options are both technically valid, prefer whichever is more understandable, testable, deployable, observable, and maintainable by the expected owner

## Example Code
```markdown
## Architecture Review Result — Crew Scheduler MVP

**Decision:** READY WITH ASSUMPTIONS

**Critical gaps:**
- Backup/restore process for job and assignment data not yet defined
- SMS provider failure behavior not yet documented (what happens if delivery fails silently)

**Key assumptions:**
- Single region, single coordinator for the pilot (multi-region is explicitly
  out of scope per the scope boundaries document)
- Daily automated backup is sufficient for pilot; no point-in-time recovery required yet

**Required next actions:**
- Define SMS failure fallback (retry once, then flag job as "notification unconfirmed"
  in the coordinator's view) before pilot start
- Confirm backup frequency and restore test with the hosting provider

**Risks to mention to client:**
- If SMS provider has an outage during pilot, technicians may not receive
  reassignment notices in real time; coordinator dashboard remains source of truth

**Decisions requiring an ADR:**
- Choice of PostgreSQL over a document store (durable, affects reporting and
  migration path)
- Decision to stay monolith rather than split notification handling into a
  separate service (durable, affects future scaling path — see lesson 389)
```

## When to Use
- Before any estimation, proposal, or implementation plan — to establish which readiness level the project is actually at, not the level everyone hopes it's at
- Whenever two architecture options are both technically defensible and a tie-breaker is needed — apply the decision rule (understandable, testable, deployable, observable, maintainable) rather than personal preference
- As the final gate before implementation begins, using the review checklist to produce an explicit READY / READY WITH ASSUMPTIONS / NOT READY verdict
- When deciding whether a choice is significant enough to warrant a recorded ADR versus being a routine implementation detail

## Common Mistakes
- Jumping straight to schema or stack selection before establishing which readiness level the project is at, which is the technical-side equivalent of skipping straight to screens from a one-sentence pitch
- Treating "it's just an MVP" as license to skip the sequence entirely rather than moving through it at appropriately reduced depth (the same mistake called out in MVP scoping, lesson 375)
- Applying the architecture principles as a checklist to be satisfied rather than a decision heuristic for resolving genuine trade-offs
- Producing a review verdict of "looks fine" instead of one of the three defined outcomes, which leaves the next phase without a clear go/no-go signal
- Writing an ADR for a trivial implementation detail while skipping one for a decision — like the monolith-vs-service-split call — that actually locks in future migration cost

## Further Reading
- Mark Richards & Neal Ford — "Fundamentals of Software Architecture" (trade-off analysis as the core architectural skill)
- Michael T. Nygard — the original "Documenting Architecture Decisions" post that defined the ADR practice
- Andrew Harmel-Law — "Facilitating Software Architecture" (on architecture as an ongoing decision-making process, not a single upfront document)
