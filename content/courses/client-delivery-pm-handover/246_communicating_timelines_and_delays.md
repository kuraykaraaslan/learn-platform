# 246. Communicating Timelines and Delays to Clients

## What It Is
A timeline is a planning tool built on assumptions, not a promise carved in stone — and the gap between those two framings is where most client trust gets damaged. A single hard date, delivered with false confidence and no stated assumptions, sets up a specific kind of failure: the moment reality diverges from the unstated assumption (the client was slow to provide content, a third-party integration turned out to be more complex than expected), the client experiences it as a broken promise rather than a normal risk that was simply never surfaced. Giving a range, with explicit assumptions and dependencies attached, changes what a delay later means — it becomes an anticipated risk materializing, not a surprise failure.

Good estimation also resists fake precision. Sizing work in bands — a few hours, a few days, up to two weeks, or "too big, split it further" — is more honest than a specific day count for work that hasn't been analyzed yet, because the day count implies a confidence that doesn't exist. Estimation also has to include everything around the code: analysis, review cycles, client feedback turnaround, testing, deployment, documentation, handover, and buffer. Estimating only coding time and treating everything else as free is a reliable way to blow a "realistic" estimate without ever writing worse code than planned.

When a delay does happen — and on any project of real size, some delay eventually will — the response that preserves trust follows a fixed shape: name the blocker, name what it affects and why, name the next action and who owns it, name the date by which resolution keeps the impact limited, and if that date passes, say so and update the plan. The instinct to delay this message until the deadline has already visibly slipped is the single most damaging habit in this whole area, because it converts an ordinary schedule risk into a credibility problem.

```quiz
- q: "\"Six weeks\" against \"4-6 weeks, assuming content and review feedback arrive on time.\" Which carries more information?"
  anchor: "Range plus assumptions beats a single date"
  options:
    - text: "The single date — a commitment rather than a hedge"
      correct: false
      why: "A commitment made with false confidence, and it hides the assumptions the date depends on."
    - text: "The range with its assumptions stated"
      correct: true
      why: "The assumption becomes part of the commitment instead of an excuse invoked later."
    - text: "Neither — both are estimates, and estimates are not information"
      correct: false
      why: "An estimate with its assumptions stated is precisely how the information gets transferred."

- q: "A backlog item comes out XL. What does the band system say to do?"
  anchor: "an XL item estimated as a single number is a red flag, not a plan"
  options:
    - text: "Estimate it carefully and add a large buffer"
      correct: false
      why: "An XL item estimated as a single number is a red flag, not a plan."
    - text: "Split it — XL means it must be broken down"
      correct: true
      why: "The bands run XS half a day to a day, S one to three days, M three to seven, L one to two weeks, and XL is the split signal."
    - text: "Move it to a later phase where there is more slack"
      correct: false
      why: "Deferring an unsized item does not size it."

- q: "The client sat on review feedback for two weeks and the milestone slipped. How do you report it?"
  anchor: "without blame, and without absorbing responsibility that isn't the developer's"
  options:
    - text: "Absorb it — naming the client's delay damages the relationship"
      correct: false
      why: "Absorbing responsibility that is not yours is exactly what this rules out."
    - text: "State it factually, without blame and without absorbing it"
      correct: true
      why: "Which is also why that dependency belonged inside the estimate from the start."
    - text: "Report the slip without stating any cause"
      correct: false
      why: "A cause-free slip reads as your delay by default."
```

## Key Concepts
- **Range plus assumptions beats a single date**: "4–6 weeks, assuming content and review feedback arrive on time" carries more real information than "6 weeks" stated with false confidence
- **Estimate bands over false precision**: XS (half a day to a day), S (one to three days), M (three to seven days), L (one to two weeks), XL (must be split) — an XL item estimated as a single number is a red flag, not a plan
- **Full-lifecycle estimation**: analysis, architecture, UI, backend, database, integration, testing, bug fixing, client review, deployment, documentation, handover, and buffer all take real time — coding is one line item among many, not the whole estimate
- **State client dependencies inside the estimate itself**: "this timeline assumes credentials and final copy arrive before the integration milestone" makes the dependency part of the commitment, not an excuse invoked later
- **Delay communication has a fixed shape**: blocker, affected milestone and why, next action and owner, date by which impact stays limited, and an explicit plan update if that date passes
- **Early flags protect the relationship**: surfacing a timeline risk while there's still time to act on it reads as competence; surfacing it only once the date has passed reads as an excuse regardless of the actual cause
- **Client delays are not freelancer delays**: when the client is the source of a schedule slip, the timeline communication should say so factually, without blame, and without absorbing responsibility that isn't the developer's

## Example Code
```template
## Timeline Estimate — Order Management Admin Panel, Milestone 2

**Estimated range:** 2026-09-08 to 2026-09-12
**Assumptions:**
- Confirmed order status transition list received by 2026-08-29
- One round of client review feedback returned within 2 business days

**Client dependencies:**
- Order status transition list (Tomas) — needed by 2026-08-29
- Cleaned 90-day order CSV (Elena) — needed by 2026-09-02

**Main risks:**
- If the status list slips past 2026-08-29, transition logic build shifts by
  the same number of days

**Review windows:** 2 business days built into the estimate
**Buffer:** 1 day
**Notes:** Estimate assumes no new integration requests before Milestone 2 close.
```

```text
Delay notice — sent 2026-09-01

I want to flag a timeline risk early. The current blocker is the confirmed
order status transition list, which was due 2026-08-29 and is still
outstanding. This affects the Milestone 2 demo date (2026-09-05) because the
transition UI cannot be finalized without it.

To keep the project moving, the next action is a short call today to lock the
list, owned by Tomas. If resolved by end of day today, the impact should stay
limited to the demo slipping by 1 business day. If not resolved by tomorrow,
I recommend we update the milestone plan and I'll send a revised date.
```

## When to Use
- Any time a client asks "how long will this take," before analysis has actually happened on that specific piece of work
- When building any estimate, to explicitly separate coding time from review, testing, deployment, and buffer instead of quoting code time alone
- The moment a timeline risk becomes visible — an overdue dependency, an underestimated integration — rather than waiting to see if it resolves on its own
- Whenever a single task looks "extra-large" during planning, as the signal to split it into smaller estimable pieces rather than guessing at a big number

## Common Mistakes
- **"That should be simple, maybe a day" gets said on the call before anyone's actually looked at the integration** — Saying "this is simple" before any real analysis has happened, then having to walk the estimate back once the actual scope becomes clear
- **"Six weeks" goes out as the answer, with no assumptions or dependencies attached to it** — Providing a single hard date with no stated assumptions, which turns any deviation into an apparent broken promise instead of a visible, anticipated risk
- **The estimate covers coding time only, with testing and review folded in as "should be quick"** — Compressing testing, review, and deployment time to zero in the estimate, so the plan only works if literally everything goes right
- **The demo date has already come and gone, and that's when the client first hears it's going to slip** — Waiting until a milestone date has already passed to tell the client it's going to slip, instead of flagging the risk while there's still time to act on it

## Further Reading
- Steve McConnell, *Software Estimation: Demystifying the Black Art* — the standard reference on estimation uncertainty and cone-of-uncertainty thinking
- Tom DeMarco and Timothy Lister, *Waltzing with Bears: Managing Risk on Software Projects* — on communicating schedule risk honestly rather than smoothing it over
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Schedule Management knowledge area covers estimation technique and baseline communication

```recall
- q: "What does full-lifecycle estimation include?"
  must:
    - "analysis, architecture, UI, backend, database, integration"
    - "testing, bug fixing, client review, deployment, documentation, handover and buffer"
    - "coding is one line item among many, not the whole estimate"

- q: "Give the fixed shape of a delay communication."
  must:
    - "the blocker"
    - "the affected milestone, and why"
    - "the next action and its owner"
    - "the date by which impact stays limited"
    - "an explicit plan update if that date passes"

- q: "Why state client dependencies inside the estimate itself?"
  must:
    - "\"this timeline assumes credentials and final copy arrive before the integration milestone\""
    - "it makes the dependency part of the commitment, rather than an excuse invoked later"
```
