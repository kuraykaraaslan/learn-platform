# 239. Stakeholder Mapping and the Decision-Maker Problem

## What It Is
Many client projects don't fail on technical grounds — they fail because the person giving feedback throughout the project was never the person who could actually approve it. A friendly, responsive daily contact feels like progress; a milestone that gets rebuilt after "internal review" three weeks later is the real cost of never having identified who held approval power in the first place. Stakeholder mapping is the deliberate exercise of naming, before real work starts, who is the primary contact, who is the final decision maker, who controls the budget, who reviews technical detail, and who the actual end users are — because these are frequently five different people, and treating them as one creates hidden risk that surfaces at the worst possible moment.

The decision-maker problem compounds when the real approver is absent from key reviews. If the person who can say "yes, ship it" only sees the work after it's supposedly finished, you should treat the project as higher risk than the scope alone suggests, because a late reversal after a missed review point is now a live possibility. The professional move isn't to silently hope this doesn't happen — it's to say so directly: recommending the decision maker join key review points, framed as protecting the timeline rather than as a demand.

The other half of this discipline is feedback consolidation. When five people on the client side each send separate, sometimes-contradictory comments through different channels, you are not managing feedback — you're managing chaos with software attached. The fix is structural, not a personality fix: the client designates one person to collect and consolidate internal feedback into a single list before it reaches you. This one habit, established at kickoff, prevents an entire category of miscommunication that otherwise recurs at every milestone review.


```quiz
- q: "Your daily contact is responsive, engaged and gives feedback on everything. What risk does the lesson say this can hide?"
  anchor: "these are frequently five different people"
  options:
    - text: "None \u2014 an engaged contact is the strongest signal a project is healthy"
      correct: false
      why: "Engagement feels like progress, which is exactly what makes this dangerous. The question is not how responsive they are but what they can approve."
    - text: "They may not be the approver, so the work can be reversed after an internal review"
      correct: true
      why: "Primary contact, decision maker, budget holder, technical reviewer and end user are frequently five different people; collapsing them into one hides the reversal risk."
    - text: "They will slow delivery by asking for too many changes"
      correct: false
      why: "That is a scope-control problem. The lesson's concern is authority, which surfaces later and costs more."

- q: "The real approver will not attend review points. What does the lesson recommend?"
  anchor: "framed as protecting the timeline rather than as a demand"
  options:
    - text: "Proceed and get sign-off in writing at the end instead"
      correct: false
      why: "That defers the reversal rather than removing it \u2014 the late no still costs the rebuild."
    - text: "Say so directly and recommend they join, framed as protecting the timeline"
      correct: true
      why: "Naming it is the professional move; the framing keeps it a risk mitigation rather than a demand on someone's calendar."
    - text: "Raise your estimate to absorb the likely rework"
      correct: false
      why: "Pricing in a foreseeable failure is not the same as preventing it, and the client never learns the risk exists."
```

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
- **Elena replies fastest and approves everything asked of her, so she's treated as the final word on scope** — Assuming the first or most responsive contact is also the final decision maker, without confirming it explicitly
- **Three different people on the client side send three different sets of comments on the same demo, through three different channels** — Accepting conflicting feedback from multiple client-side people without asking for a single consolidated list first
- **The warehouse staff who'll actually use the system see it for the first time at final delivery** — Waiting until final delivery to involve actual end users, discovering workflow objections only after the system is "done"
- **The COO shows up after everything's been approved by the ops manager and asks why it doesn't work the way he expected** — Letting a hidden senior stakeholder appear only at the end, after a lower-authority contact has already approved the direction

## Further Reading
- R. Edward Freeman, *Strategic Management: A Stakeholder Approach* — the foundational text on stakeholder theory and mapping influence versus interest
- Allan R. Cohen and David L. Bradford, *Influence Without Authority* — relevant when the freelancer must manage a decision maker they have no formal authority over
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Stakeholder Management knowledge area covers identification, analysis, and engagement planning

```recall
- q: "Name the roles stakeholder mapping separates, and why collapsing them is risky."
  must:
    - "primary contact"
    - "final decision maker"
    - "budget holder"
    - "technical reviewer"
    - "the actual end users"
    - "treating them as one person hides a late-reversal risk"

- q: "What do you do when the approver will not attend reviews?"
  must:
    - "say it directly rather than hoping"
    - "recommend they join key review points"
    - "frame it as protecting the timeline, not as a demand"
    - "treat the project as higher risk than scope alone suggests"

- q: "Why is a responsive daily contact a weak signal of project health?"
  must:
    - "responsiveness is not approval authority"
    - "the feedback loop can be with someone who cannot say ship it"
    - "the cost appears weeks later as a rebuild after internal review"
```
