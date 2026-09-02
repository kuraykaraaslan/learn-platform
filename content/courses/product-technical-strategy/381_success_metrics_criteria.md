# 381. Success Metrics and Criteria

## What It Is
MVP scoping (lesson 375) asks for a single success metric because an MVP needs one clear thing to prove. Once you're past MVP — evaluating a feature, a pilot, or a full release — one metric usually isn't enough, and "success" needs to be defined before delivery or it gets decided afterward by whoever is most invested in a particular answer. That's the core failure mode this lesson exists to prevent: a project is not successful because it was delivered, because the client liked the demo, or because "everything works." Those are not measurements, they're impressions, and impressions can be argued with equal confidence in either direction.

A complete metrics definition draws from six categories, using whichever are relevant to the thing being measured: business metrics (paid orders, conversion rate, manual hours saved), user behavior metrics (activation rate, first task completion, repeat usage, abandonment), operational metrics (approval time, processing time, reconciliation count), quality metrics (bug count, error rate, uptime, support volume after launch), learning metrics (was the core assumption validated or not), and delivery metrics (did the phase land on time and in scope). Picking metrics from only one category is how teams end up proving the wrong thing — a feature can hit every quality metric and still fail on the business metric it was actually built to move.

The three-part success criteria rule turns a metric into a real decision tool: minimum success (the bar below which the effort didn't pay off), strong success (the bar that justifies doubling down), and a failure signal (a specific, observable sign that the assumption was wrong, not just "it didn't feel great"). "Minimum success: 3 pilot organizers can publish events and sell tickets without manual order tracking. Strong success: 80% of attendees complete purchase without support. Failure signal: organizers still maintain a parallel spreadsheet because admin visibility is insufficient" gives you three different, actionable outcomes instead of one vague verdict. Without the failure signal in particular, teams tend to quietly redefine "success" after the fact to match whatever actually happened.

```quiz
- q: "The client liked the demo and everything works. Is the project a success?"
  anchor: "Those are not measurements, they're impressions"
  options:
    - text: "Yes — the deliverable works and the stakeholder is satisfied"
      correct: false
      why: "Delivery and satisfaction are impressions, and impressions can be argued with equal confidence in either direction."
    - text: "Unknowable as stated — none of those are measurements"
      correct: true
      why: "Success has to be defined before delivery, or it gets decided afterwards by whoever is most invested in a particular answer."
    - text: "Yes, as long as the quality metrics were met"
      correct: false
      why: "A feature can hit every quality metric and still fail on the business metric it was actually built to move."

- q: "Every metric you have listed for a pilot is a quality metric. What is the risk?"
  anchor: "Picking metrics from only one category is how teams end up proving the wrong thing"
  options:
    - text: "None — quality metrics are the most objective ones available"
      correct: false
      why: "Objectivity is not the issue. One category proves one kind of thing, and possibly not the thing the work existed to do."
    - text: "Proving the wrong thing — a feature can pass every quality bar and still miss the business metric it was built to move"
      correct: true
      why: "Which is why a complete definition draws from whichever of the six categories are relevant."
    - text: "Being unable to compare against the MVP's single metric"
      correct: false
      why: "The MVP's single metric belongs to an earlier stage. The problem here is category coverage, not comparability."

- q: "Which of the three parts stops a team quietly redefining success after the fact?"
  anchor: "teams tend to quietly redefine \"success\" after the fact to match whatever actually happened"
  options:
    - text: "Minimum success — the bar below which the effort did not pay off"
      correct: false
      why: "A floor is easy to argue was cleared. It is the signal named in advance that cannot be reinterpreted."
    - text: "The failure signal — a specific, observable sign that the assumption was wrong"
      correct: true
      why: "Not \"it didn't feel great\", but something like organizers still maintaining a parallel spreadsheet because admin visibility is insufficient."
    - text: "Strong success — the bar that justifies doubling down"
      correct: false
      why: "That defines the upside case, which is not the one anyone needs protecting from."
```

## Key Concepts
- **Six metric categories**: business, user behavior, operational, quality, learning, delivery — pick the ones relevant to what's being evaluated, not just one
- **Minimum / strong / failure signal triad**: every MVP, feature, pilot, or release needs all three defined before launch, not just a single target
- **Metrics defined before delivery, not after**: success measured retroactively tends to match whatever happened, which defeats the purpose of measuring
- **Forbidden success claims**: "project delivered," "client liked it," "design looks modern," "everything works" — none of these are metrics
- **A failure signal is a specific observable**, not a feeling — "organizers still keep a parallel spreadsheet" is falsifiable; "it didn't feel successful" is not
- **Learning metrics matter even on failure**: a pilot that fails its minimum success bar but produces a clear failure signal has still done its job
- **Metrics connect back to the problem statement** (lesson 372): a metric that doesn't map to the original pain being solved is measuring the wrong thing

## Example Code
```template
## Success Metrics — Crew Scheduler Pilot

**Primary product metric:** Double-booking incidents per week
**Business metric:** Hours of manual reconciliation saved per week
**User behavior metric:** % of reassignments completed by the coordinator without a phone call
**Operational metric:** Average time from conflict detection to resolved reassignment
**Quality metric:** SMS delivery failure rate

**Minimum success:** Double-booking incidents drop from current baseline (3-5/week) to 1 or fewer
across the 2-week pilot, with the coordinator using the tool as the sole schedule source.
**Strong success:** Zero double-booking incidents, and average reassignment time drops from
~20 minutes to under 2 minutes.
**Failure signal:** Coordinator reverts to checking the shared spreadsheet "just to be sure,"
indicating the tool hasn't earned enough trust to be the single source of truth.
```

## When to Use
- Before delivery of any MVP, feature, pilot, or release — never as a retroactive judgment call
- Whenever "it worked" is being claimed without a metric attached to back it up
- When scoping a pilot (ties directly into lesson 385's release strategy) — the pilot's go/no-go decision should reference these criteria
- When a stakeholder disagrees about whether something succeeded — the minimum/strong/failure triad settles the argument in advance instead of after

## Common Mistakes
- **"It shipped and the client liked the demo" is the entire case for calling the pilot a success** — Declaring success based on delivery or subjective impression instead of a predefined metric
- **Zero bugs and 100% uptime get reported as proof of success, with nobody checking whether the business metric it was meant to move actually moved** — Measuring only one category (usually quality or delivery) and ignoring whether the business or behavior outcome actually moved
- **The pilot has a target number, and no stated signal for what would count as it not working** — Defining a target with no failure signal, so a disappointing result gets quietly reframed as acceptable after the fact
- **The chosen metric requires a report nobody's actually going to run after launch** — Choosing metrics nobody will actually track after launch, which is the same as having no metric at all

## Further Reading
- John Doerr — "Measure What Matters" (on outcome-based goal setting, the OKR framing behind minimum/strong success)
- Avinash Kaushik — "Web Analytics 2.0" (on distinguishing actionable metrics from vanity metrics)
- Sean Ellis & Morgan Brown — "Hacking Growth" (on defining a single measurable "North Star" alongside supporting metrics)

```recall
- q: "Name the six metric categories with an example of each."
  must:
    - "business — paid orders, conversion rate, manual hours saved"
    - "user behaviour — activation rate, first task completion, repeat usage, abandonment"
    - "operational — approval time, processing time, reconciliation count"
    - "quality — bug count, error rate, uptime, support volume after launch"
    - "learning — was the core assumption validated or not"
    - "delivery — did the phase land on time and in scope"

- q: "Give the three-part success criteria rule and what each part is for."
  must:
    - "minimum success — the bar below which the effort did not pay off"
    - "strong success — the bar that justifies doubling down"
    - "a failure signal — a specific, observable sign the assumption was wrong, not \"it didn't feel great\""
    - "three different actionable outcomes instead of one vague verdict"

- q: "Why does this lesson exist separately from MVP scoping's single metric?"
  must:
    - "an MVP needs one clear thing to prove"
    - "past MVP — a feature, a pilot, a full release — one metric usually is not enough"
    - "success gets defined before delivery, or it is decided afterwards by whoever is most invested in an answer"
```
