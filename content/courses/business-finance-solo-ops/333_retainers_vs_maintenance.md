# 333. Retainers vs. Maintenance: Designing Recurring Revenue Tiers

## What It Is
> This lesson is general education, not financial or tax advice. Cancellation and rollover terms should be reflected in a written agreement, ideally reviewed against your local contract norms.

"Retainer" and "maintenance" get used interchangeably in casual conversation, but they should be structurally different products. Maintenance means keeping a delivered system stable and current — dependency updates, minor bug fixes, hosting checks, backup verification, a monthly health report — and explicitly excludes new modules, redesigns, or major integrations. A retainer, by contrast, is ongoing development, improvement, or advisory capacity — ​new features within a monthly hour budget, UX refinements, roadmap review — priced and scoped as continuing work, not just upkeep.

Both product types share the same non-negotiable structural requirement: a defined purpose, a defined monthly scope, a stated response time, an explicit list of what's included and excluded, a rule for unused capacity (it typically doesn't roll over, or rolls over only partially and non-cumulatively), a communication channel, billing terms, and cancellation terms. "Unlimited support" should never appear in either product — it converts a bounded offer into an open-ended liability that erodes margin the moment a client learns the boundary doesn't actually exist.

The right moment to introduce either offer is not "whenever it comes up" — it's structured into the relationship at three points: during the original proposal as an optional post-launch add-on, again just before final handover when anxiety about going live is highest, and again roughly 30 days after delivery if no plan was selected. Capacity discipline matters just as much as the pitch: total retainer and maintenance commitments across all clients should stay in the 30–50% range of available working time, leaving the rest for new project work and growth.

```quiz
- q: "A delivered client wants dependency updates, hosting checks, backup verification and a monthly health report — nothing new built. Which product is that?"
  anchor: "Maintenance means keeping a delivered system stable and current"
  options:
    - text: "A retainer — it is recurring monthly work"
      correct: false
      why: "Recurring is a billing shape, not a product. A retainer buys ongoing development, improvement or advisory capacity; this list is pure upkeep."
    - text: "Maintenance — upkeep of a delivered system, explicitly excluding new modules"
      correct: true
      why: "Updates, minor fixes, hosting checks, backup verification and a health report are exactly the maintenance scope, with new modules, redesigns and major integrations excluded."
    - text: "Either label works — the distinction is mostly cosmetic"
      correct: false
      why: "Conflating them is what produces the scope dispute the first time the client asks for a new reporting page under a maintenance fee."

- q: "When is a maintenance or retainer plan first offered?"
  anchor: "during the original proposal as an optional post-launch add-on"
  options:
    - text: "In the original proposal, as an optional post-launch add-on"
      correct: true
      why: "Then again just before final handover when anxiety about going live peaks, and again about 30 days after delivery if nothing was selected."
    - text: "At handover only — offering earlier reads as upselling before the work is proven"
      correct: false
      why: "Handover is the second of three moments. Skipping the proposal means post-launch support was never framed as a normal part of the engagement."
    - text: "When something breaks, since that is when the value is undeniable"
      correct: false
      why: "Never wait until something breaks. By then the conversation is about the failure and your part in it, not about a plan."

- q: "Your recurring commitments across all clients now occupy about 70% of working capacity. What does that mean?"
  anchor: "total recurring commitments should occupy roughly 30–50% of working capacity"
  options:
    - text: "It is healthy — recurring revenue is the most stable kind there is"
      correct: false
      why: "Stability is why there is a floor. The ceiling exists because recurring work crowds out the project and growth work that has to fit in the other half."
    - text: "It is over the ceiling — the guidance leaves the remaining 50-70% for project and growth work"
      correct: true
      why: "The range is 30-50% of available working time, and the reason is what the rest of the time is for."
    - text: "The ceiling applies to retainers only, not to maintenance plans"
      correct: false
      why: "It is a ceiling on total recurring commitments across all clients — both product types count against it."
```

## Key Concepts
- **Maintenance vs. retainer distinction**: maintenance keeps a system stable (updates, fixes, monitoring); a retainer buys ongoing development, improvement, or advisory capacity — conflating the two creates scope disputes.
- **Four retainer types**: maintenance retainer (stability), improvement retainer (continuous small improvements), advisory retainer (decision support without delivery), priority support retainer (guaranteed response window).
- **Required fields for every tier**: purpose, monthly scope, response time, included work, excluded work, unused-capacity rule, communication channel, billing terms, cancellation terms.
- **Introduction timing**: pitch as an optional add-on in the original proposal, again before final handover, and again 30 days post-delivery if nothing was selected — never wait until something breaks.
- **Capacity ceiling**: total recurring commitments should occupy roughly 30–50% of working capacity, leaving 50–70% for project and growth work.
- **Forbidden patterns**: selling "unlimited" anything, vague "I'll help when I can" arrangements, and unpaid ongoing support drifting on informally after a project's official handover.

```tradeoff
question: "Maintenance agreement, or retainer?"
sides:
  - name: "Maintenance"
    wins_when:
      - signal: "write down what the client actually asked for: if every item is dependency updates, bug fixes, hosting checks and backups, it is upkeep"
      - signal: "the system is delivered and stable \u2014 there is no roadmap waiting, only the need to keep what exists working"
      - signal: "you can state the exclusions in one line (no new modules, no redesigns, no major integrations) and the client agrees without negotiating"
  - name: "Retainer"
    wins_when:
      - signal: "the client keeps describing things that are not yet built \u2014 new features, refinements, roadmap questions"
      - signal: "you can name a monthly hour budget and both sides can say what happens to unused hours; if you cannot, the product is not scoped yet"
      - signal: "the value is your continuing capacity and judgement, not the absence of breakage"
```

## Example Code
A three-tier structure distinguishing maintenance from retainer, priced and bounded:

```md
## Hosting & Uptime — Maintenance ($600/mo, 3-month min.)
Included: uptime monitoring, SSL renewal, monthly backup verification,
  dependency vulnerability scan, incident notification.
Excluded: any code changes, bug fixes, content updates.
Exit rule: infrastructure changes become a separate project quote.

## Growth Support — Retainer ($3,000/mo, 15h included)
Included: bug fixes + minor feature additions, monthly 30-min review
  call, performance monitoring, dependency updates, priority email.
Excluded: full new pages/modules (priced as a separate project).
Rollover: max 5 unused hours roll over, non-cumulative.
Overrun: billed at $100/hr with prior approval.

## Advisory Retainer ($1,800/mo, 2h included)
Included: monthly strategy call, architecture review, vendor
  evaluation, roadmap prioritization.
Excluded: any hands-on development work.
```
A client asking "can you also add a new reporting page?" under the Hosting & Uptime maintenance plan has a clear, pre-written answer: that's a new project quote, not a maintenance item — the boundary was set before the question was ever asked.

## When to Use
- At project handover, when client satisfaction and anxiety about post-launch stability are both at their highest.
- 30 days after any delivery where no recurring plan was selected.
- When a client's ad hoc requests are consistently exceeding what a one-off "quick fix" relationship can sustainably absorb.
- When reviewing total recurring commitments against the 30–50% capacity ceiling before adding a new client to any tier.

## Common Mistakes
- **The maintenance plan is pitched as "unlimited support, whatever you need"** — Selling "unlimited support" or "unlimited revisions" under either a maintenance or retainer label.
- **A maintenance client keeps asking for small new features, and each one gets folded into the same monthly fee** — Letting a maintenance client's requests quietly grow into development work without renegotiating into a retainer tier.
- **The retainer agreement never says what happens to hours a client doesn't use that month** — Leaving the unused-hours rollover policy undefined, which creates disputes the first month a client under-uses their hours.
- **A project delivered three months ago, and no maintenance or retainer offer has been mentioned since** — Waiting for something to break before ever offering a maintenance or retainer plan to a delivered client.

## Further Reading
- *Recurring Revenue* — Roman Stanek and John Warrillow (concepts drawn from *The Automatic Customer*): the broader business case for recurring revenue structures.

```recall
- q: "State the structural difference between maintenance and a retainer."
  must:
    - "maintenance keeps a delivered system stable and current"
    - "it excludes new modules, redesigns and major integrations"
    - "a retainer buys ongoing development, improvement or advisory capacity"
    - "the retainer is scoped and priced as continuing work, not upkeep"

- q: "Name the fields every tier must define, whichever of the two products it is."
  must:
    - "purpose and monthly scope"
    - "response time"
    - "included and excluded work"
    - "the unused-capacity rule"
    - "communication channel and billing terms"
    - "cancellation terms"

- q: "Name the four retainer types and what each one sells."
  must:
    - "maintenance retainer — stability"
    - "improvement retainer — continuous small improvements"
    - "advisory retainer — decision support without delivery"
    - "priority support retainer — a guaranteed response window"

- q: "Why should \"unlimited support\" never appear in either product?"
  must:
    - "it converts a bounded offer into an open-ended liability"
    - "margin erodes the moment a client learns the boundary is not real"
```
