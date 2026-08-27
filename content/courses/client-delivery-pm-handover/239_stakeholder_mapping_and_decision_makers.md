# 239. Stakeholder Mapping and the Decision-Maker Problem

## What It Is
Many client projects don't fail on technical grounds — they fail because the person giving feedback throughout the project was never the person who could actually approve it. A friendly, responsive daily contact feels like progress; a milestone that gets rebuilt after "internal review" three weeks later is the real cost of never having identified who held approval power in the first place. Stakeholder mapping is the deliberate exercise of naming, before real work starts, who is the primary contact, who is the final decision maker, who controls the budget, who reviews technical detail, and who the actual end users are — because these are frequently five different people, and treating them as one creates hidden risk that surfaces at the worst possible moment.

The decision-maker problem compounds when the real approver is absent from key reviews. If the person who can say "yes, ship it" only sees the work after it's supposedly finished, you should treat the project as higher risk than the scope alone suggests, because a late reversal after a missed review point is now a live possibility. The professional move isn't to silently hope this doesn't happen — it's to say so directly: recommending the decision maker join key review points, framed as protecting the timeline rather than as a demand.

The other half of this discipline is feedback consolidation. When five people on the client side each send separate, sometimes-contradictory comments through different channels, you are not managing feedback — you're managing chaos with software attached. The fix is structural, not a personality fix: the client designates one person to collect and consolidate internal feedback into a single list before it reaches you. This one habit, established at kickoff, prevents an entire category of miscommunication that otherwise recurs at every milestone review.

## Key Concepts
- **Role separation, not role assumption**: primary contact, decision maker, budget owner, technical contact, and end user are treated as distinct roles until proven to be the same person
- **Decision-maker absence as a risk signal**: a key approver who skips review points is a project risk to name explicitly, not a scheduling inconvenience to work around quietly
- **Feedback consolidation ownership**: the client designates one person to merge internal comments into a single list before sending — the alternative is five uncoordinated voices
- **Approval power gradient**: not every stakeholder's feedback carries equal weight; the stakeholder map records who can actually override whom
- **End-user involvement, not just management sign-off**: for operational software, at least one real daily user should review the workflow before final approval, since managers and users often notice different things
- **The stakeholder map as a living document**: named at kickoff, revisited if the client-side team changes mid-project
- **Hidden stakeholder risk**: a decision maker who appears only at the very end, after the project has already been approved by someone with less authority, is the single most common cause of late-stage scope reversal

## Example Code
```md
## Stakeholder Map

| Role | Name | Responsibility | Approval Power | Notes |
|---|---|---|---|---|
| Primary contact | Elena Vance | Daily coordination, content, UAT scheduling | Medium | Fast responder; not final approver |
| Decision maker | Tomas Reyes | Final scope and payment approval | High | Only available for milestone demos, not daily Qs |
| Budget owner | Tomas Reyes | Payment approval | High | Same as decision maker on this project |
| Technical contact | Marco Diaz (client IT) | DNS, hosting account access | Medium | Response time is slow — flagged as schedule risk |
| Reviewer | Priya Nair (Warehouse Lead) | Workflow feedback during UAT | Low/Medium | Daily user — most likely to catch real workflow issues |
| End user | Warehouse staff (4) | Daily usage after launch | Low | Represented by Priya during UAT |

**Decision maker involvement note:** Tomas has confirmed attendance at all 3 milestone
demos. If he cannot attend a demo, approval is deferred until his written sign-off —
Elena's approval alone does not close the milestone.

**Feedback consolidation rule:** All UAT feedback routes through Elena as one
consolidated list, categorized before it reaches the developer.
```

## When to Use
- At kickoff, before the first milestone is built, so the review cadence can be built around the decision maker's actual availability
- When feedback starts arriving from multiple client-side people through different channels without coordination
- When a milestone gets unexpectedly reopened after "internal review" — a sign the real approver wasn't in the loop earlier
- For operational or internal-tool projects, before final UAT, to confirm a real daily user has reviewed the workflow rather than only a manager

## Common Mistakes
- Assuming the first or most responsive contact is also the final decision maker, without confirming it explicitly
- Accepting conflicting feedback from multiple client-side people without asking for a single consolidated list first
- Waiting until final delivery to involve actual end users, discovering workflow objections only after the system is "done"
- Letting a hidden senior stakeholder appear only at the end, after a lower-authority contact has already approved the direction

## Further Reading
- R. Edward Freeman, *Strategic Management: A Stakeholder Approach* — the foundational text on stakeholder theory and mapping influence versus interest
- Allan R. Cohen and David L. Bradford, *Influence Without Authority* — relevant when the freelancer must manage a decision maker they have no formal authority over
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Stakeholder Management knowledge area covers identification, analysis, and engagement planning
