# 267. Delivery Playbooks: Codifying Repeatable Project Types

## What It Is
Every earlier lesson in this course — kickoff, scope breakdown, risk logs, handover — describes a single topic applied across every kind of project. A delivery playbook inverts that: it's every topic applied to a single, recurring kind of project. If you've now delivered three admin panels, or three e-commerce MVPs, the fourth one shouldn't require re-deriving the discovery questions, the default technical stack, the pricing tiers, and the risk register from scratch. A playbook is the written record of what you already learned from doing it before, organized so the next instance of the same project type can move faster and with fewer surprises.

A useful playbook has a consistent shape regardless of project type: an ideal client profile (who this project type actually fits), red flags that mean disqualify or reprice, a fixed set of discovery questions tuned to this specific kind of build, a scope definition split into what's included by default versus what's commonly excluded and sold as an add-on (the subject of Lesson 269), a default technical stack, pricing tiers, a phase-by-phase timeline with client responsibilities called out, a risk register specific to that project type, acceptance criteria, a handover checklist, and a list of upsell opportunities tied to specific moments in the project. None of this is shown to the client — the playbook is an internal GPS used to prepare for discovery and to build the proposal quickly and consistently. The client only ever sees the resulting proposal.

The discipline that keeps playbooks useful instead of stale is timing: a playbook should be written after a project type has recurred at least three times, not speculatively before the pattern is proven. Writing one too early bakes in guesses instead of lessons; never writing one at all means every recurrence of the same project type re-pays the same discovery, scoping, and pricing cost in time and risk. A playbook is also not immutable — when a new instance of the project type reveals something the playbook didn't anticipate (a red flag that wasn't listed, an add-on that keeps getting requested outside the price list), the playbook is the place that learning goes, so the next instance benefits from it too.

## Key Concepts
- **Playbook vs. ruleset**: a ruleset (like each rule file this course draws from) covers one topic across every project; a playbook covers one recurring project type across every topic — discovery, scope, stack, pricing, risk, acceptance, and handover
- **Fixed playbook shape**: ideal client profile, red flags/disqualifiers, discovery questions, scope definition (included by default vs. priced add-ons), default technical stack, pricing tiers, phased timeline with client responsibilities, risk register, acceptance criteria, handover checklist, upsell opportunities
- **Internal tool, never client-facing**: the playbook prepares the discovery call and shapes the proposal; the client only ever sees the resulting proposal, not the internal playbook
- **A decision tree routes incoming inquiries to the right playbook**: matching a new inquiry against known project types (does the client have an existing system? is it consumer-facing? is it an internal tool?) before defaulting to custom scoping
- **Codify after three, not before one**: a playbook is retrospective — written once a project type has recurred enough to trust the pattern, not drafted speculatively for a project type that's only happened once
- **Universal patterns sit above any single playbook**: deposit before work starts, signed contract before kickoff, weekly status updates, staging before any client demo, written change requests for scope changes, retainer offered at close — these apply regardless of which specific playbook is in use
- **A playbook is a living document**: a red flag or a recurring add-on request discovered on the fourth instance of a project type gets written back into the playbook so the fifth instance benefits from it

## Example Code
```md
# New Playbook Template — [Project Type Name]

## Ideal Client Profile
- ...

## Red Flags — Disqualify or Reprice
- "[Client statement]" → [what it signals, and what to do about it]

## Discovery Questions
1. ...

## Scope Definition
### Included by Default
- ...
### Commonly Excluded — Offer as Add-Ons
- [Item] (+$X–$Y)

## Technical Stack
| Layer | Default Choice |
|-------|-----------------|

## Pricing Range & Tiers
| Tier | Price | Scope |
|------|-------|-------|

## Project Phases
| Phase | Duration | Deliverables | Client Action |
|-------|----------|---------------|-----------------|

## Risk Register
| Risk | Likelihood | Mitigation |
|------|------------|------------|

## Acceptance Criteria
- [ ] ...

## Client Handover Checklist
- [ ] ...

## Upsell Opportunities
- At kickoff: ...
- At handover: ...
- Post-launch: ...

---
Codification trigger: this playbook was written after the 3rd instance of
[project type] — see prior instances: [Project A], [Project B], [Project C].
```

## When to Use
- After delivering the same kind of project three or more times, as the trigger to sit down and write the pattern into a reusable playbook
- Before running discovery on a new inquiry that matches a known project type, to prepare questions and expectations instead of improvising
- When scoping a proposal, to pull the included/excluded scope, pricing tiers, and technical stack from a proven starting point instead of estimating from zero
- When onboarding a subcontractor or new team member, so they inherit the same scoping discipline instead of learning it project by project

## Common Mistakes
- **The internal admin-panel playbook, red flags and pricing notes included, gets forwarded straight to a prospect as the proposal** — Showing the internal playbook document directly to a client instead of translating it into clean proposal language
- **The first e-commerce MVP just wrapped, and a playbook gets written from that single project's numbers** — Writing a playbook after a single project instead of waiting for the pattern to repeat, which bakes a one-off guess in as if it were a proven default
- **The fourth admin panel hits a red flag the playbook never mentioned, and nothing gets added back to it afterward** — Treating a playbook as fixed once written, instead of feeding new red flags or recurring add-on requests back into it as they're discovered
- **A client pattern that caused trouble on two past projects shows up again, unflagged, because the playbook never had a red flags section** — Skipping the red flags section, so the same problematic client pattern gets missed and repeated on every new instance of that project type

## Further Reading
- Michael E. Gerber, *The E-Myth Revisited* — on systemizing a service business by documenting the repeatable process instead of relying on tribal knowledge for each new engagement
- Atul Gawande, *The Checklist Manifesto* — on why a written, structured checklist outperforms expert memory even for experienced practitioners doing familiar work
- Ronald J. Baker, *Implementing Value Pricing* — on productizing recurring service offerings into defined scope and pricing tiers rather than re-quoting from scratch each time
