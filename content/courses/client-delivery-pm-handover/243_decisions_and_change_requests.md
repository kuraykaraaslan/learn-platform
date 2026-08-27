# 243. Decisions and Change Requests: Keeping a Written Record

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Project_Management_Rules/decision-log.md and change-request-control.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Every project accumulates two kinds of moments that people misremember with total confidence: decisions and change requests. A decision is something that was settled — which payment provider, which authentication method, whether cancelled orders can be reopened — and if it only ever existed in a call, it will be relitigated the moment someone's memory of that call diverges from someone else's. A change request is a client ask that falls outside the agreed scope, and if it's handled by just saying yes because it "sounds small," it quietly becomes the mechanism by which scope creep destroys a fixed-price project one reasonable-sounding request at a time.

The fix for both is the same instinct: write it down at the moment it happens, in a format that survives the conversation that produced it. A decision log entry captures not just what was decided but why — the context, the alternatives considered, and the rationale — because "we decided X" without a rationale is exactly as vulnerable to later dispute as no record at all; someone will eventually ask "wait, why did we do it that way?" and the answer needs to exist in writing, not in someone's recollection of a Tuesday call. A change request entry captures the request, the reason, and the impact on scope, timeline, and cost — because the entire point of the process is to force a real look at impact before agreeing, not after implementing.

The two also interact: approving a change request is itself a decision, and it should be logged as one. The discipline that makes this whole system worth the overhead is refusing the shortcut in either direction — never implementing a change before impact is assessed and approved, and never letting an important decision live only in a call with no follow-up message confirming it in writing.

## Key Concepts
- **Decisions need rationale, not just outcome**: "we decided X" is incomplete; the log must also capture the context, alternatives considered, and why this option won, because that's what prevents the decision from being relitigated later
- **Change categories aren't binary**: a request is a clarification (already in scope), a minor adjustment (within agreed buffer), a change request (outside scope, needs approval), a future roadmap item, or rejected — treating every ask as either "yes" or "no" loses the useful middle ground
- **Never implement before approval**: a change request must be estimated for scope/timeline/cost impact and explicitly approved before any code is written against it, no matter how small it looks
- **The confirmation message closes the loop**: after any verbal decision, a short written message restating the decision and its impact — "unless you reply with corrections" — converts a conversation into a record
- **Micro-changes still get logged**: a change small enough to absorb for free must still be written down as a "one-time goodwill change, not a scope precedent," or it quietly becomes an expected free service
- **Scope trade-off framing**: when a client wants to add something without extending timeline or cost, the professional move is offering to swap it for an existing scope item — not silently absorbing it
- **Decisions that must always be logged**: MVP scope cuts, feature deferrals, architecture and integration choices, role/permission models, and production launch approval — these are the ones that cause real damage if forgotten

## Example Code
```md
# Decision DEC-004: Cancelled Orders Cannot Be Reopened

**Date:** 2026-08-29
**Approved by:** Tomas Reyes (COO)
**Category:** product

## Context
The order status transition UI needs to know whether a Cancelled order can
move back to an active status, or whether cancellation is permanent.

## Decision
Cancelled orders are permanently locked. Reopening requires creating a new
order referencing the original.

## Alternatives Considered
- Allow reopening within 24 hours (rejected — adds workflow complexity for
  a rare case)

## Rationale
Warehouse staff reported that "reopened" orders in the old spreadsheet
process caused duplicate picks. A hard lock removes that failure mode.

## Impact
No change to timeline. Simplifies the transition state machine (one fewer
edge case to build and test).

## Follow-up
- Update transition UI spec to remove Cancelled → Active path
```

```md
# Change Request: Add Accounting-Format CSV Export

**Requested by:** Elena Vance
**Date:** 2026-08-30
**Current scope reference:** Kickoff notes, Scope Summary — "CSV export for accounting"

## Request
Client's new accountant needs a second export format matching their
bookkeeping software's exact column order and date format.

## Reason
Switched accounting software mid-project; original export format was
built against the old tool's import spec.

## Impact
**Scope:** Adds a second export template alongside the existing one
**Timeline:** +2 days
**Cost:** +$400 (per rate card)
**Risk:** Low — isolated to export module

## Options
1. Include now with updated price/timeline
2. Defer to next phase
3. Replace another item to keep scope stable

## Approval
Approved
Approved by: Tomas Reyes
Date: 2026-08-31
```

## When to Use
- The moment any consequential decision is made in a call, chat, or meeting — send the written confirmation the same day, not "when there's time"
- Whenever a client requests anything not explicitly in the agreed scope, before writing a single line of code toward it, even if the request seems trivial
- When revisiting an old decision — log the reopening and the new rationale explicitly rather than letting the change happen silently
- At the end of any milestone review, to confirm in writing which decisions and approvals were reached during that session

## Common Mistakes
- Letting an important decision live only in a call, so that six weeks later two people confidently recall two different outcomes
- Saying yes to a client request immediately because it "seems small," then discovering it required new architecture, a new workflow, or new testing surface
- Calling a genuinely significant feature addition a "small change" to avoid the friction of the change request process
- Logging a change request but implementing it before the client has actually approved the cost and timeline impact in writing

## Further Reading
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Integrated Change Control process formalizes assessing impact before approving any change
- Ryan Singer, *Shape Up* (Basecamp) — on "circuit breakers" and how uncontrolled scope change derails otherwise well-planned work: https://basecamp.com/shapeup
- Tom DeMarco, *Slack: Getting Past Burnout, Busywork, and the Myth of Total Efficiency* — on why unmanaged small changes accumulate into large, invisible cost
