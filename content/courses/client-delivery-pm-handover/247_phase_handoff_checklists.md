# 247. Phase Handoff Checklists

## What It Is
A project that moves through discovery, planning, development, QA, staging, production, and handover has six transition points, and each one is an opportunity for something to quietly fall through the crack between phases. A phase handoff checklist exists to make each transition an explicit, summarized moment instead of a blur — because "we're basically done with planning, let's just start building" skips the exact step where a forgotten open item, an unconfirmed risk, or a dependency nobody assigned gets carried invisibly into the next phase, where it's much more expensive to discover.

Each handoff answers the same six questions regardless of which two phases it connects: what was completed, what was approved, what remains open, what risks or issues exist, what the next phase depends on, and what the next milestone is. The specific content changes — a kickoff-to-planning handoff needs a scope summary and initial risks, while a staging-to-production handoff needs client approval and a rollback plan — but the discipline of writing the answers down, every time, at every transition, is what prevents "I thought someone else was tracking that" from being a viable excuse three phases later.

The rule that gives this teeth is refusing to advance a phase with unresolved critical risk, or treating an intermediate approval as if it were the final one. Staging approval is not production approval. A client saying "looks good" on a demo call is not the same as a written signoff that unlocks the next milestone's billing or the next phase's start date. Collapsing these distinctions is how a project's actual state becomes disconnected from what everyone believes about it.

## Key Concepts
- **Six fixed questions per handoff**: completed, approved, open items, risks/issues, dependencies for the next phase, and the next milestone — every transition answers all six, not a subset chosen for convenience
- **Phase-specific required content**: kickoff→planning needs scope and stakeholders; planning→development needs work breakdown and first sprint tasks; development→QA needs known limitations and acceptance criteria; QA→staging needs client review instructions; staging→production needs approval and a rollback plan; production→handover needs access transfer and a support boundary
- **No phase advances with an unresolved critical risk**: a clean-looking handoff document that omits a known critical issue is worse than an honest one that names it and blocks advancement until it's addressed
- **Intermediate approval is not final approval**: a staging "looks good" does not substitute for the written production launch approval, and treating it as equivalent is how unauthorized production deploys happen
- **Approval must be recorded, not inferred**: "the client seemed happy on the call" is not the same claim as "the client approved this phase in writing," and only the second one should gate the next phase
- **Open items travel forward explicitly**: an item unresolved at handoff doesn't disappear — it's listed in the next phase's dependencies so it stays visible instead of getting lost in the transition
- **The next milestone is always named**: a handoff that doesn't state what happens next leaves the next phase without a clear target to plan against

## Example Code
```md
# Phase Handoff: Staging → Production
**Project:** Order Management Admin Panel
**Date:** 2026-09-10

## Completed
- Full order workflow (create, status transitions, export) tested on staging
- Role-based access verified for Admin and Staff
- Mobile responsive layout fixed for screens down to 320px

## Approved
- Written production launch approval received from Tomas Reyes, 2026-09-09
- Final acceptance checklist signed off by Elena Vance

## Open Items
- Accounting-format CSV export (CR-002) scheduled for post-launch week 1,
  by mutual agreement — does not block launch

## Risks / Issues
- No critical risks outstanding. Non-critical: large CSV exports (>5,000 rows)
  take ~8 seconds; acceptable per client, flagged for future optimization.

## Dependencies for Next Phase
- Production database credentials confirmed in hosting provider environment
- DNS cutover window confirmed for 2026-09-11, 6 AM (low-traffic period)
- Rollback plan: redeploy previous Vercel deployment; no schema migrations
  are backward-incompatible

## Next Milestone
- Production launch and go-live smoke test, 2026-09-11

## Decision Needed
- None — proceed as planned
```

## When to Use
- At every transition between discovery, planning, development, QA, staging, production, and handover — not only at the ones that feel significant
- Before starting implementation work on a phase whose predecessor hasn't produced a written handoff, as the forcing function to go back and close that gap first
- When a project's actual state feels uncertain to the team itself, as a way to reconstruct and confirm what's really been completed and approved
- When handing a phase-tracked project to a different developer or agent mid-stream, so the incoming owner inherits an accurate picture rather than an optimistic one

## Common Mistakes
- **Development starts on the next phase before the written planning sign-off has actually come back** — Moving to the next phase without the required written approval, when the plan called for approval to gate that move
- **An open item from QA never made it onto the staging phase's dependency list, and nobody's tracking it anymore** — Forgetting an open issue from the previous phase because it wasn't explicitly carried forward into the new phase's dependency list
- **The client said "looks good" on the staging call, and that gets treated as the production go-ahead** — Treating a positive-sounding staging review as equivalent to final production handoff approval
- **Staging worked fine, so production goes out without running the pre-production checklist** — Deploying to production without walking through the full pre-production handoff checklist, because the staging deploy "already worked fine"

## Further Reading
- Robert G. Cooper, *Winning at New Products* — the stage-gate model that phase handoffs operationalize at project-management scale
- Basecamp, *Shape Up* — on cycle boundaries and why a clean, explicit transition between chunks of work protects against scope bleed: https://basecamp.com/shapeup
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the process groups (Initiating, Planning, Executing, Monitoring, Closing) formalize the same transition logic at a larger scale
