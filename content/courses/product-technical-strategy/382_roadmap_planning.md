# 382. Roadmap Planning — Sequencing MVP Through Scale

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `roadmap-planning.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Lesson 371 introduced the roadmap as the step that "protects relationships" by giving excluded features a future home instead of a flat rejection. This lesson is about actually building that roadmap well, because a bad roadmap does the opposite of protecting anything — it's a list of promises with no sequencing logic, and it collapses the first time someone asks "why is this feature in V2 and not V1." The standard phase buckets are MVP/Pilot, V1 Launch, V2 Growth, V3 Scale, and Backlog/Ideas, and each phase needs a stated goal, not just a list of features assigned to it. "V2: advanced analytics, loyalty program, AI recommendations" is not a roadmap phase, it's an unsorted pile with a label.

The dependency rule is what turns a feature pile into an actual sequence: advanced capabilities depend on foundational ones being in place first, and violating that order produces a roadmap that looks ambitious on a slide and falls apart in delivery. Advanced analytics depends on reliable event and order data existing first — build it before that data pipeline is stable and you get a dashboard reporting on garbage. Automated refunds depend on a stable payment integration and an actual refund policy — automate the workflow before the policy exists and you've automated a policy nobody agreed to. Multi-tenant permissions depend on a clear single-tenant role model; AI recommendations depend on enough clean behavioral data to recommend from. Each of these dependencies is a real technical or business precondition, not a scheduling preference.

The most common roadmap failure is the fake three-phase structure: "Phase 1: everything basic, Phase 2: everything advanced, Phase 3: AI." It reads as planning but contains no actual reasoning about what depends on what, or which phase proves which assumption. A real roadmap phase answers three questions on its own: what is this phase's goal, what does it include, and what does success in this phase look like — the same minimum/strong/failure discipline from lesson 381, applied per phase instead of just to the MVP.

## Key Concepts
- **Phase buckets**: MVP/Pilot, V1 Launch, V2 Growth, V3 Scale, Backlog/Ideas — each with a goal, not just a feature list
- **Phase definitions**: MVP tests the core assumption; V1 makes it ready for broader real use and reliability; V2 adds adoption/revenue/automation depth; V3 adds enterprise-grade permissions, analytics, integrations, and scale
- **Dependency rule**: advanced features never precede the foundational capability they depend on (clean data before analytics, stable payments before refund automation, a role model before multi-tenant permissions)
- **Roadmap table**: Phase, Goal, Features, Dependencies, Success metric — every phase gets all five columns filled
- **Forbidden fake structure**: "basic → advanced → AI" is not a roadmap, because it encodes no dependency reasoning or business priority
- **Backlog is not the same as out-of-scope**: an out-of-scope item (lesson 377) that has a plausible future home belongs on the roadmap's backlog, not nowhere
- **A roadmap is a sequencing tool, not a wishlist ranking**: the order should reflect dependencies and business priority, not just enthusiasm

## Example Code
```markdown
## Product Roadmap — Crew Scheduler

### MVP / Pilot
**Goal:** Prove a single shared schedule eliminates double-booking for one region.
**Includes:** Job creation, technician assignment with conflict detection, calendar view,
manual reassignment, SMS notification.
**Excludes:** Route optimization, customer notifications, multi-region support.
**Success:** Double-booking incidents drop to 0 across a 2-week pilot (see lesson 381).

### V1 Launch
**Goal:** Make the tool reliable enough for broader rollout across all company regions.
**Includes:** Multi-dispatcher support, audit log, offline-tolerant SMS retry.
**Dependencies:** Requires MVP's conflict-detection logic proven stable under real load.

### V2 Growth
**Goal:** Reduce coordinator manual effort further and improve technician-side visibility.
**Includes:** Route sequencing suggestions, technician mobile view of daily schedule.
**Dependencies:** Route sequencing depends on 3+ months of clean job/location data from V1.

### V3 Scale
**Goal:** Support enterprise clients with multiple regions and custom approval chains.
**Includes:** Multi-tenant permission model, cross-region reporting, SSO.
**Dependencies:** Requires the single-tenant role model from V1 to already be clean and stable.

### Backlog
- AI-suggested technician assignment (needs a full season of labeled reassignment data)
- Customer self-scheduling portal
```

## When to Use
- Whenever a product is being split into MVP, V1, V2, or later phases for a proposal or retainer relationship
- When a stakeholder pushes for an advanced feature before its dependency exists — the dependency rule gives a concrete reason to resequence, not just a gut feeling
- When presenting a roadmap externally — a goal-and-dependency structure survives scrutiny that a flat feature timeline doesn't
- Immediately after scope boundaries (lesson 377) are settled, to give every excluded item a stated future phase

## Common Mistakes
- Building a roadmap that's a feature-difficulty ranking ("basic first, advanced later, AI last") with no dependency reasoning behind the order
- Placing an advanced feature ahead of the foundational capability it silently depends on (analytics before clean data, refund automation before a refund policy)
- Writing phases as feature lists with no stated goal, so nobody can evaluate whether the phase actually succeeded
- Treating the roadmap as fixed once written, instead of revisiting it when a dependency resolves faster or slower than expected

## Further Reading
- C. Todd Lombardo, Bruce McCarthy, Evan Ryan, Michael Connors — "Product Roadmaps Relaunched" (on outcome-based, not feature-timeline, roadmaps)
- Janna Bastow (ProdPad) — writings on the "Now/Next/Later" roadmap format as an alternative to fixed-date timelines
- Melissa Perri — talks and writing on "the build trap" as it applies specifically to roadmap sequencing, not just MVP scope
