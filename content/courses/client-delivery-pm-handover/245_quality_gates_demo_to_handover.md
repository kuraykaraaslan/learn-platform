# 245. Quality Gates: From Demo-Ready to Handover-Ready

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Project_Management_Rules/quality-gates.md and acceptance-criteria-and-signoff.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
"Ready" means something different at every stage of a project, and treating it as one undifferentiated state is how unfinished work reaches a client, or client-facing work reaches production, without anyone deciding that it should. A quality gate is a named checkpoint — pre-demo, pre-staging, pre-production, pre-handover — with its own specific checklist, that work must pass before moving to the next stage. The gates exist because "looks finished" is not the same claim as "meets the bar for this specific audience," and the bar rises sharply between showing a client a working core flow and putting real customer payment data through a production deploy.

Each gate asks a different question. Pre-demo asks: does the core flow work, are incomplete areas clearly flagged, and is there no risk of exposing secrets or broken UI mid-call? Pre-staging asks a stricter question: does authentication actually work, do role permissions hold, do forms validate real errors? Pre-production is stricter still: is there a rollback plan, is SSL configured, are live payment credentials actually verified rather than assumed? Pre-handover asks a final, different kind of question entirely: is the admin usage documented, are credentials transferred safely, is the support boundary defined? Skipping straight from "it compiles" to "client sees it" collapses four distinct checks into zero.

A gate can produce a conditional pass — proceeding with a known, non-critical issue — but only when the client is informed, the risk is documented, and someone owns the fix. What a gate must never produce silently is a "clean pass" label on work that actually has an unresolved issue; that gap between the label and the reality is exactly what erodes trust when the client discovers it themselves, usually at the worst possible moment.

## Key Concepts
- **Four gates, four different bars**: pre-demo, pre-staging, pre-production, and pre-handover each have a distinct checklist — passing an earlier gate says nothing about readiness for the next one
- **Acceptance criteria must exist before "done" is claimed**: observable, specific, testable statements connected to scope — "admin can create, edit, and archive an event" — not a feeling that something looks finished
- **Given/When/Then or simple checklist format**: acceptance criteria should be written in a form the client can actually verify themselves, not just the developer
- **Conditional pass has three conditions**: the issue must be non-critical, the client must be informed, and a fix owner must be assigned — skipping any one of these turns a conditional pass into a hidden defect
- **Signoff has levels, not just "done" and "not done"**: internal done, ready for client review, approved with fixes, approved, and final signoff are distinct states that should be labeled explicitly
- **The silent-approval clause, used correctly**: a deemed-acceptance window ("if no blocking issue is reported by X, this is considered accepted") is only legitimate if it was agreed to in advance, not invoked retroactively to pressure a slow reviewer
- **Never demo, stage, or deploy broken flows without warning**: a known issue disclosed before the client hits it is professionalism; a known issue discovered by the client mid-demo is a trust cost

## Example Code
```md
# Quality Gate: Pre-Staging

**Project:** Order Management Admin Panel
**Date:** 2026-08-30
**Status:** Conditional Pass

## Checklist
| Item | Status | Notes |
|---|---|---|
| Authentication works | Pass | |
| Critical workflows work | Pass | Order create/update/status transition verified |
| Role permissions checked | Pass | Staff cannot access admin-only export |
| Forms validate errors | Pass | |
| Basic responsive behavior checked | Conditional | Table view cramped below 375px width — non-blocking |
| Environment variables configured | Pass | |
| Known bugs listed | Pass | See Known Issues below |
| Client review instructions prepared | Pass | |

## Known Issues
- Order table is visually cramped on screens narrower than 375px. Usable but
  not ideal. Fix scheduled before pre-production gate.

## Decision
Proceed with notes. Client informed of the mobile-width issue before staging
link is shared. Fix owner: Developer, due before next gate.
```

```md
## Acceptance Checklist: Order Status Transition Workflow

| Criteria | Status | Notes |
|---|---|---|
| Admin can move order Received → Packed → Shipped → Delivered | Pass | |
| Cancelled orders cannot be reopened (per DEC-004) | Pass | |
| Invalid transitions are blocked with a clear error | Pass | |
| Staff role sees status but cannot change it | Pass | |

**Client review result:** Approved with fixes
**Approved by:** Elena Vance
**Date:** 2026-09-01
```

## When to Use
- Before every client-facing exposure of work in progress — a live demo, a staging link, a training session — regardless of how confident the build feels
- Before any production deployment, without exception, even for a change that seems too small to warrant the full pre-production checklist
- Before final handover, as the last gate that confirms documentation, access transfer, and known limitations are actually complete rather than assumed
- Whenever the team is tempted to skip a gate because of time pressure — that pressure is precisely the condition the gate exists to resist

## Common Mistakes
- Demoing a flow with a known broken path without warning the client in advance, turning a manageable known issue into a surprise mid-call
- Sending a staging link with no review instructions, leaving the client unsure what they're even supposed to be testing
- Deploying to production without explicit client approval, even when the deploy itself is technically ready
- Labeling a conditional pass as a clean pass to avoid an uncomfortable status conversation, hiding exactly the information a gate exists to surface

## Further Reading
- Robert G. Cooper, *Winning at New Products* — the stage-gate model this checkpoint structure is adapted from
- Atlassian, "Definition of done vs. acceptance criteria" — on why observable, testable criteria beat a subjective sense of completeness: https://www.atlassian.com/agile/product-management/acceptance-criteria
- Gerald M. Weinberg, *Quality Software Management, Vol. 1: Systems Thinking* — on the organizational discipline required to make quality gates real rather than ceremonial
