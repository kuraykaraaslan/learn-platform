# 79. Blameless Post-Mortem — Writing and Running One

## What It Is
A post-mortem (also called an incident review or retrospective) is a structured written analysis of a production incident or significant failure. It answers four questions: what happened, why it happened, what was the impact, and what will prevent it from happening again. The word "blameless" is not about excusing poor work — it is about recognizing that systemic failures are almost never caused by a single person's mistake. They are caused by systems, processes, tools, and incentives that made the mistake easy to make and hard to catch.

The blameless model, popularized by Google's Site Reliability Engineering team and refined at companies like Etsy, rests on a specific insight: when people fear being blamed, they stop reporting problems early, stop admitting uncertainty during incidents, and stop sharing information that could implicate them. The result is slower incident response and zero learning. A blameless culture flips this by treating every engineer as someone who "made the best decisions they could with the information available at the time" — the goal is to change the information and the system, not the person.

For a solo developer running a SaaS product, a blameless post-mortem is just a disciplined way of learning from your own mistakes and documenting them for future reference. There is no one to blame but yourself, so the challenge is different: it is about resisting the urge to close the incident ticket with "fixed" and move on without capturing what actually happened and why. The five-minute temptation to skip writing it is paid back in hours when the same issue recurs six months later and you have no notes.


```quiz
- q: "What is the practical, non-moral argument for blamelessness in the lesson?"
  anchor: "when people fear being blamed, they stop reporting problems early"
  options:
    - text: "It keeps morale high, which makes people more productive over time"
      correct: false
      why: "Morale is a real effect but not the argument made here. The claim is about information, and it is concrete."
    - text: "Fear suppresses early reporting and honest uncertainty, which slows response and kills learning"
      correct: true
      why: "That is the mechanism: blame changes what people are willing to say during an incident, and the response degrades."
    - text: "It shields engineers from consequences so they take more risks"
      correct: false
      why: "The lesson is explicit that blameless is not about excusing poor work. Nothing here is about removing accountability."

- q: "How does a blameless review frame the person who took the action that triggered an incident?"
  anchor: "made the best decisions they could with the information available at the time"
  options:
    - text: "As having made a mistake that training will prevent next time"
      correct: false
      why: "That still locates the fault in the person. The lesson's target is the information and the system around them."
    - text: "As having acted reasonably on the information they had \u2014 so the fix is the information and the system"
      correct: true
      why: "That framing is what redirects the review toward what made the mistake easy to make and hard to catch."
    - text: "As irrelevant, since only the technical root cause matters"
      correct: false
      why: "The human context is exactly what reveals which signals were missing. Dropping it loses the useful part of the review."
```

## Key Concepts
- **Timeline reconstruction**: Precise chronological sequence of events (detection, diagnosis, mitigation, resolution) — the foundation everything else is built on
- **Contributing factors, not root cause**: Real incidents rarely have a single root cause; "five whys" is a starting point, not a complete method — list all contributing factors
- **Impact quantification**: Users affected, minutes of downtime, revenue at risk, SLA breach — specific numbers, not vague descriptions
- **Action items with owners and due dates**: A post-mortem without committed action items is a postcard — interesting but forgettable
- **Detection gap**: How long between the incident starting and it being detected? A long detection gap is itself a separate systemic problem to fix
- **Near-miss post-mortems**: Writing post-mortems for close calls (issues caught before they caused user impact) is more valuable than waiting for a real incident
- **Time-boxed writing**: Write the draft within 48 hours of resolution while memory is fresh; publish within 5 business days
- **Sharing and indexing**: Post-mortems only create value if they are findable — store them in a searchable location with consistent naming

## Example Code or Template

```template
# Post-Mortem: [Short Title] — [YYYY-MM-DD]

**Severity**: P0 (complete outage) | P1 (major degradation) | P2 (minor degradation)
**Status**: Draft | In Review | Published
**Incident Duration**: HH:MM (from first user impact to full resolution)
**Detection Method**: Monitoring alert | User report | Internal discovery

---

## Summary
One paragraph. What broke, how it was detected, how it was fixed, and what the
impact was. Write this so someone can understand the full story in 60 seconds.

---

## Impact
- **Users affected**: ~[N] users / [X]% of active users
- **Duration**: [Start time UTC] → [End time UTC] = [N] minutes
- **Affected features**: [List the specific features or endpoints]
- **Revenue impact**: [$ amount or "unknown" — estimate if needed]
- **SLA breach**: Yes / No — [if yes, which SLA and by how much]

---

## Timeline (all times in UTC)

| Time  | Event |
|-------|-------|
| HH:MM | Deployment of version X.Y.Z completed |
| HH:MM | First error spike detected in [monitoring tool] |
| HH:MM | First user report received via [channel] |
| HH:MM | On-call engineer began investigation |
| HH:MM | Root contributing factor identified: [description] |
| HH:MM | Mitigation applied: [rollback / hotfix / config change] |
| HH:MM | Error rate returned to baseline |
| HH:MM | Full resolution confirmed |

**Detection gap**: [Time between incident start and detection]
**Time to mitigate**: [Time between detection and mitigation]
**Time to resolve**: [Time between detection and full resolution]

---

## Contributing Factors
(Not root causes — list all factors that allowed this to happen)

1. **[Factor 1]**: [Description of how this contributed]
2. **[Factor 2]**: [Description of how this contributed]
3. **[Factor 3]**: [Description of how this contributed]

**Five Whys analysis** (applied to the primary contributing factor):
- Why did X happen? → Because Y
- Why did Y happen? → Because Z
- Why did Z happen? → Because [deeper system issue]

---

## What Went Well
- [Thing that worked — fast detection, good runbook, clear communication]
- [Another thing that worked]

## What Did Not Go Well
- [Thing that slowed response — missing alert, unclear logs, no rollback plan]
- [Another thing that slowed response]

---

## Action Items

| # | Action | Owner | Due Date | Status |
|---|--------|-------|----------|--------|
| 1 | [Specific, actionable change — not "improve monitoring"] | [Name] | YYYY-MM-DD | Open |
| 2 | [Add integration test for this failure mode] | [Name] | YYYY-MM-DD | Open |
| 3 | [Update runbook with new diagnostic step] | [Name] | YYYY-MM-DD | Open |

---

## Lessons Learned
[2–3 sentences on the insight that generalizes beyond this specific incident]
```

## When to Use
- After any production incident that affected users for more than 5 minutes, regardless of severity
- After a near-miss — an issue caught in staging or caught by you before users noticed — these are the highest-value post-mortems because they cost nothing
- When onboarding a contractor who caused or responded to an incident — the post-mortem process is the best way to align on standards without assigning blame
- After a deployment that had to be rolled back — even if users were not affected, rollbacks indicate a process gap worth examining
- Quarterly, to review all post-mortems from the past 90 days and identify systemic patterns across incidents

## Common Mistakes
- **Writing it more than 48 hours after resolution**: Memory degrades fast, especially for the exact timeline; the draft needs to be written while the incident is still fresh
- **Action items without owners or dates**: "We should add more monitoring" is not an action item; "Add latency alert for /api/payment/webhook endpoint by 2025-06-15 — owner: me" is
- **Treating the first "why" as the root cause**: A deploy caused an outage — but why did the deploy reach production without catching this? Why was there no circuit breaker? Five whys often takes you to a process or tooling gap, not a code bug
- **Never reading past post-mortems**: The entire value of writing post-mortems is destroyed if you never reference them; review them before major deploys and quarterly for pattern analysis

## Further Reading
- [**"Site Reliability Engineering" — Google](https://sre.google/sre-book)** — Chapter 15 covers the blameless post-mortem philosophy in depth; freely available online
- **"Each Failure is a Gift" — John Allspaw (Etsy engineering blog)** — The essay that popularized blameless post-mortems in the product engineering world; still the clearest articulation of why blame is counterproductive
- [**"Debriefing Facilitation Guide" — Etsy](https://github.com/etsy/DebriefingFacilitationGuide)** — Open-source guide for facilitating post-mortem discussions; useful even if you are running a solo post-mortem as a thinking exercise

```recall
- q: "What four questions does a post-mortem answer?"
  must:
    - "what happened"
    - "why it happened"
    - "what the impact was"
    - "what will prevent it from happening again"

- q: "Make the case for blamelessness without appealing to kindness."
  must:
    - "fear stops people reporting problems early"
    - "it stops them admitting uncertainty during an incident"
    - "information that could implicate someone goes unshared"
    - "response gets slower and the organisation learns nothing"

- q: "What separates a useful action item from post-mortem theatre?"
  must:
    - "it changes a system, tool or process \u2014 not how carefully someone promises to work"
    - "it has a named owner and a date"
    - "someone can verify afterwards that it actually landed"
```
