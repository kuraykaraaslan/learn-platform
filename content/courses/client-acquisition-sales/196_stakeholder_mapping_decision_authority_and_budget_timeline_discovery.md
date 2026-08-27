# 196. Stakeholder Mapping, Decision Authority & Budget/Timeline Discovery

## What It Is
A project can have a perfectly clear technical scope and still fail, because scope clarity says nothing about whether the right people are actually in the room. Every opportunity needs four stakeholder roles identified explicitly — economic buyer, primary user, technical/operational contact, and final approver — even when one person holds two or three of them, because naming the roles is what prevents a proposal from being written for the wrong audience. Authority has a legible signal pattern on both sides: a founder joining the call, an openly discussed budget range, a known decision date, and a named approver are strong signals; "I need to ask my boss," "no budget yet," "just collecting prices," and a decision-maker who won't join discovery are weak ones. When more than one stakeholder actually affects the decision, their priorities usually diverge — a founder wants launch speed, an operations manager wants fewer manual tasks, finance wants cost control, IT wants maintainability — and a proposal that only speaks to the loudest voice's feature requests while ignoring the others' priorities is a proposal that stalls in internal review for reasons that were visible in discovery and simply weren't captured. When the person on the call clearly isn't the one who approves spending, the correct move isn't to proceed as if authority doesn't matter — it's a direct, non-awkward ask to include the actual decision-maker, or an offer to prepare a shareable internal summary instead.

Budget and timeline sit right next to authority as the two topics people instinctively avoid raising, treating them as impolite rather than as what they actually are: feasibility constraints that determine whether a proposal is even possible to write responsibly. The reframe that makes asking about budget feel professional instead of awkward is explaining why the question exists — "the same business problem can be solved as a lean MVP, a phased build, or a business-critical platform, and without a range I might design the wrong level of solution" — which shifts the ask from "how much can I get out of you" to "help me not waste your time recommending the wrong thing." Timeline gets the same treatment: a date is only useful once its driver is known, so "do you have a target launch date" is immediately followed by "what drives that date," because a deadline tied to a live external event is a very different constraint than a deadline that's really just an unfounded assumption that software ships fast. A budget-timeline-scope matrix turns the combination of signals into a concrete recommendation rather than a gut call: high budget with a clear timeline moves toward proposal, high budget with unclear scope points to paid discovery, low budget with high scope means reducing the MVP or disqualifying, and a client who insists on fixed scope, a fixed near-term deadline, and a low budget simultaneously is a high-risk combination worth declining or renegotiating rather than accepting all three constraints at once and hoping delivery finds a way.

## Key Concepts
- **Four stakeholder roles, always named**: economic buyer, project owner/primary user, technical/operational contact, final approver — even when one person fills several roles.
- **Strong vs. weak authority signals**: a founder on the call, an open budget range, a known decision date, and a named approver are strong; "I need to ask my boss" and an absent decision-maker are weak.
- **Multi-stakeholder priority capture**: when priorities diverge across roles (speed vs. fewer manual tasks vs. cost control vs. maintainability), the proposal has to speak to all of them, not just the loudest feature request.
- **The missing-decision-maker response**: ask directly to include the real approver, or offer a shareable internal summary — never proceed as though the gap doesn't matter.
- **Budget framing as a service, not an intrusion**: "without a range I might design the wrong level of solution" reframes the question around avoiding wasted effort, not extracting a number.
- **Timeline needs its driver, not just a date**: "what drives that date" separates a real external deadline from an arbitrary one, which changes how much pressure it should actually apply.
- **The budget/timeline/scope matrix**: the combination of signals — not any one alone — determines whether the next step is proposal, paid discovery, MVP reduction, or decline.
- **The impossible-combination flag**: fixed scope + fixed near-term deadline + low budget together is a risk pattern, not three separate negotiable points.

## Example Code

**Stakeholder identification table:**

```text
Role                    | Name | Clarified? | Notes
------------------------|------|------------|------------------------------
Economic buyer          |      |  Y / N     | approves budget/payment
Project owner           |      |  Y / N     | owns outcome, gives direction
Primary user(s)         |      |  Y / N     | uses system daily
Technical contact       |      |  Y / N     | access, API docs, hosting
Final approver          |      |  Y / N     | signs off delivery as complete
```

**Budget/timeline/scope decision matrix:**

```text
High budget  + clear timeline    -> Move toward proposal after scope confirmation
High budget  + unclear scope     -> Paid discovery / architecture phase
Low budget   + high scope        -> Reduce MVP, or disqualify
No budget    + serious problem   -> Ask for a range, or offer a paid audit
Fixed deadline + flexible scope  -> Phase the project
Fixed scope + fixed deadline + low budget -> High risk; decline or redefine
```

## When to Use
- During every discovery call, to explicitly name who buys, who uses, who provides access, and who signs off — never assumed from a single conversation.
- The moment a call's only participant is clearly not the budget or final approver.
- Before quoting any budget range or committing to a timeline, to confirm both the number and what's actually driving it.
- When multiple people at the client's company have visibly different priorities that a single feature-focused proposal would miss.

## Common Mistakes
- Preparing a serious proposal for a contact who has no real influence over the decision.
- Treating "we'll decide later" as acceptable without ever clarifying who "we" actually is.
- Apologizing for asking about budget instead of explaining why the question changes the recommendation.
- Accepting "ASAP" as a real timeline without asking what's actually driving the date.
- Agreeing to fixed scope, a fixed near-term deadline, and a low budget simultaneously instead of naming the conflict out loud.

## Further Reading
- *Flawless Consulting* — Peter Block: contracting clearly with the real decision-makers before any diagnostic work begins.
- *The Challenger Customer* — Brent Adamson, Matthew Dixon, Pat Spenner & Nick Toman: mobilizing and aligning multiple stakeholders inside one complex B2B decision.
- *Managing the Professional Service Firm* — David Maister: the economics of client relationships, authority, and trust that sit underneath every budget and stakeholder conversation.
