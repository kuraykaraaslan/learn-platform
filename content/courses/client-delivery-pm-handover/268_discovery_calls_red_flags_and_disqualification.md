# 268. Discovery Calls, Red Flags, and Disqualification

## What It Is
This course otherwise starts at kickoff — the moment a signed deal becomes an active project (Lesson 236). This lesson looks one step earlier, at the discovery call that produced that deal, because the quality of discovery determines the quality of everything a PM inherits at kickoff. A discovery call that skipped budget, skipped the decision maker, or waved away a serious risk doesn't just create a sales problem — it hands the delivery side a project built on gaps that surface as scope disputes, missed dependencies, or a client who turns out not to be the person who can actually approve anything. The person who runs delivery has a direct stake in whether discovery was done well, even when they weren't the one on the call.

A well-run discovery call follows a fixed sequence — frame, diagnose the business problem, map the current workflow, separate must-haves from later ideas, surface constraints, and end with an explicit next step — precisely so that its output can be handed off cleanly. That output is a handoff brief: business problem, version-one scope, excluded items, assumptions, risks, client responsibilities, and pricing factors. This brief is the direct ancestor of the kickoff notes described in Lesson 236 — a kickoff that starts from a thin or missing handoff brief is really doing the discovery work over again, under time pressure, after the contract is already signed. The delivery-side habit worth building is treating "where's the handoff brief" as a real question before accepting a project into active delivery, not an assumption that sales already handled it.

The other half of discovery that matters downstream is disqualification — recognizing when the honest next step isn't a proposal at all. Red flags include a prospect who rejects a written scope or a deposit, demands detailed free architecture work, pressures for an impossible timeline, is disrespectful toward process, or keeps steering the conversation around agreed boundaries. These aren't abstract sales concerns; they are the earliest possible signal of exactly the behavior that turns into scope creep, payment friction, and conflict once a project is underway. A PM who understands what a red-flag prospect looks like is better equipped to recognize the pattern if it resurfaces mid-project — and to notice, uncomfortably often, when a client who should have been disqualified got sold anyway because a deal felt too good to walk away from.

## Key Concepts
- **Discovery's output is a handoff brief, not just a good conversation**: business problem, version-one scope, excluded items, assumptions, risks, client responsibilities, and pricing factors — the direct input the kickoff (Lesson 236) should be built from
- **A thin handoff brief means kickoff re-does discovery under worse conditions**: after signature, under time pressure, with the client already expecting implementation to start
- **Red flags predict delivery pain, not just sales risk**: rejecting written scope or a deposit, demanding unpaid detailed architecture, pressuring for an impossible timeline, disrespect toward process, or persistent boundary-testing all forecast the exact behavior that causes mid-project conflict
- **The next-step decision applies a matrix, not a reflex toward "always propose"**: proposal, paid discovery/audit, request missing information, MVP reframing, nurture, or disqualify — chosen based on how much of the minimum discovery output (goal, scope, users, budget signal, decision maker, assumptions) is actually clear
- **Every risk surfaced at discovery must become something trackable**: a proposal assumption, a paid discovery item, a separate phase, a client responsibility, an explicit exclusion, or a defined change-request trigger — never a risk that's simply forgotten once the contract is signed
- **Disqualification is a legitimate, professional outcome**: saying no to a mismatched or risky opportunity protects the eventual delivery experience for both sides more than accepting it and hoping the red flags don't materialize
- **A PM's pre-kickoff quality gate**: before accepting a signed deal into active delivery, verify the handoff brief exists, red flags were considered, the next-step decision was sound, and every major risk has an owner and a trackable status

## Example Code
```template
# Discovery Quality Gate — Pre-Kickoff Check
**Project:** [Name]
**Discovery run by:** [Name]
**Reviewed by (delivery/PM):** [Name]
**Date:** [Date]

## Handoff Brief Present?
- [ ] Business problem and desired outcome stated
- [ ] Version-one scope and excluded items defined
- [ ] Target users and decision maker identified
- [ ] Budget signal and timeline expectation captured
- [ ] Client responsibilities listed

## Red Flags Considered?
- [ ] Client accepted a written scope and deposit without resistance
- [ ] No pressure for an impossible timeline
- [ ] No demand for unpaid detailed architecture before signing
- [ ] Process (contract, milestones, change requests) was respected, not fought

## Risk and Assumption Transfer
| Risk / Assumption from discovery | Converted to (assumption / dependency / exclusion / CR trigger) | Owner |
|---|---|---|
| ... | ... | ... |

## Next-Step Decision Was
- [ ] Proposal (discovery output was sufficiently clear)
- [ ] Paid discovery/audit (used because of named uncertainty)
- [ ] Other — explain

## Gate Result
- [ ] Clear to proceed to kickoff as-is
- [ ] Proceed, but log the following open items into kickoff notes: ...
- [ ] Escalate before kickoff — missing handoff brief / unresolved red flag
```

## When to Use
- Before formally accepting a signed deal into active delivery, as a sanity check on what discovery actually produced
- When a PM or technical lead is looped into a discovery call for a large, risky, or unusually technical opportunity
- When tracing a mid-project conflict back to its origin, to check whether the underlying issue was actually visible — and ignored — at discovery
- When a project shows warning signs that match known red flags, as the prompt to escalate the risk to whoever owns the client relationship rather than absorbing it silently

## Common Mistakes
- **The deal is signed, so kickoff starts on the assumption that discovery covered everything it needed to** — Accepting a project into kickoff with no written handoff brief, assuming discovery covered everything because a deal was signed
- **The client pushes back on the written scope in week one, the exact same way they resisted it during the discovery call** — Treating red flags that surface in week one of delivery as a surprise, when the same behavior was visible and unaddressed during discovery
- **The prospect balked at a deposit and demanded free architecture work during discovery, and the deal got sold anyway with no flag raised to delivery** — Letting a prospect who showed clear disqualifying behavior get sold anyway without flagging the risk to whoever will actually run the delivery
- **A risk flagged during discovery lives in a salesperson's private notes, not anywhere the delivery team will ever see it** — Leaving a discovery-stage risk as an informal note instead of converting it into a tracked assumption, dependency, or exclusion before work begins

## Further Reading
- Rob Fitzpatrick, *The Mom Test* — on running discovery conversations that surface real signal instead of comfortable, misleading answers
- Neil Rackham, *SPIN Selling* — the research basis for diagnostic, need-first questioning during discovery rather than premature solutioning
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Initiating process group's treatment of chartering and stakeholder identification, which depends directly on what discovery actually produced: https://www.pmi.org/pmbok-guide-standards
