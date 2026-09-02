# 327. Building Financial Reserves and a Contingency Plan

## What It Is
> This lesson is general education, not financial or tax advice. Reserve sizing and tax-reserve percentages should be set with your own accountant based on your jurisdiction and actual obligations.

Freelance income is structurally uneven — a great quarter can be followed by a quiet one, a reliable client can suddenly go dark, and a laptop can fail at the worst possible moment. A professional solo business prepares for disruption before it happens, rather than treating every disruption as a surprise emergency. That preparation takes the concrete form of financial reserves, each with a distinct purpose, plus written contingency plans for the risks that are foreseeable even if their timing isn't.

Five reserve types cover most of the exposure: a tax/obligation reserve (money that was never really spendable), an emergency runway reserve (covers income gaps and fixed costs), an equipment reserve (replacing a failed work-critical device), a professional services reserve (accountant, lawyer, consultant support when something goes sideways), and an operations reserve (hosting, tools, and domain renewals that must never lapse). These are separate pools with separate purposes — raiding the tax reserve to cover a slow month just relocates the emergency to tax season.

Client concentration is the risk category most solo operators underestimate until it bites. If one client represents 40% or more of revenue, that's worth monitoring; past 60% it's a high-risk dependency; past 80% the business is effectively that client's employee without the benefits. The response isn't panic — it's deliberately building reserves and acquisition pipeline in proportion to how concentrated the revenue already is.

```quiz
- q: "One client is 65% of your revenue. Which band is that?"
  anchor: "40%+ of revenue from one client warrants monitoring, 60%+ is high risk, 80%+ is a critical dependency"
  options:
    - text: "Monitoring — 40% is where watching starts, and 65% is not yet double that"
      correct: false
      why: "40% starts monitoring; 60% is already the high-risk band, and 65% is past it."
    - text: "High risk — the high-risk band opens at 60%"
      correct: true
      why: "80%+ is the critical dependency demanding immediate acquisition and reserve-building action."
    - text: "Critical — anything past half your revenue is a critical dependency"
      correct: false
      why: "Critical begins at 80%. Overstating the band is not the same as reading it."

- q: "Equipment fails and the equipment reserve is short. Take the difference from the tax reserve?"
  anchor: "each with a distinct, non-interchangeable purpose"
  options:
    - text: "Yes — it is your money, and the tax bill is months away"
      correct: false
      why: "Spending the tax or obligation reserve for any other purpose is a named forbidden pattern."
    - text: "No — the five reserves have distinct, non-interchangeable purposes"
      correct: true
      why: "The tax reserve in particular holds money that was never yours to spend."
    - text: "Only if you repay it before the tax deadline"
      correct: false
      why: "That is the intention every time. The forbidden pattern is the withdrawal, not the failure to repay."

- q: "What does the late-payment contingency plan actually ask?"
  anchor: "what happens if the next payment is delayed 7 days, or 30 days; can work pause contractually"
  options:
    - text: "How likely each client is to pay late"
      correct: false
      why: "Likelihood is not the question. The plan assumes it happens and asks what follows."
    - text: "What happens at 7 days and at 30 days, whether work can pause contractually, whether final handover is protected, and whether another income source exists"
      correct: true
      why: "A set of concrete answers prepared before the delay, not an estimate of risk."
    - text: "How much of the emergency reserve covers one month"
      correct: false
      why: "Related, and the reserve is a separate item with its own distinct purpose."
```

## Key Concepts
- **Risk categories to track**: late client payment, project cancellation, scope dispute, equipment failure, health or capacity gap, cloud/tool outage, legal or accounting issue, data loss, pipeline gap, currency/fee volatility, client concentration.
- **Five reserve types**: tax/obligation reserve, emergency runway reserve, equipment reserve, professional services reserve, operations reserve — each with a distinct, non-interchangeable purpose.
- **Client concentration thresholds**: 40%+ of revenue from one client warrants monitoring, 60%+ is high risk, 80%+ is a critical dependency requiring immediate acquisition and reserve-building action.
- **Late-payment contingency questions**: what happens if the next payment is delayed 7 days, or 30 days; can work pause contractually; is final handover protected; is there another income source this month?
- **Equipment failure plan**: document the primary work machine, a backup machine or cloud-access option, critical software licenses, a backup location for records, a repair/replacement budget, and a client-communication plan for downtime.
- **Forbidden patterns**: spending the tax/obligation reserve for any other purpose, relying indefinitely on one client, and operating without a backup of business records.

## Example Code
A quarterly risk-and-reserve review, using the standard output template:

```
## Risk Review — Q3 2026

Risk: Client concentration (Client A = 52% of trailing 12-month revenue)
Likelihood: medium   Impact: high
Current protection: none beyond a signed contract
Reserve needed: n/a — this is an acquisition-mix problem, not a cash problem
Contingency action: allocate 2 outbound/referral actions per week until
  Client A drops below 40% of trailing revenue; do not decline other
  work to prioritize Client A further in the meantime
Owner: self   Review date: 2026-10-01

Risk: Equipment failure (primary laptop, 3 years old, no backup device)
Likelihood: low   Impact: high
Current protection: cloud backups of code (git), no backup hardware plan
Reserve needed: €1,200 equipment reserve (currently €400 — underfunded)
Contingency action: top up equipment reserve €200/month until funded;
  document GitHub Codespaces as the 24-hour fallback dev environment
Owner: self   Review date: 2026-10-01
```
Neither of these risks required an emergency to identify — both were visible in advance, which is exactly the point of the review.

## When to Use
- Quarterly, as a standing review alongside the monthly close, not only after something has already gone wrong.
- Immediately when a new client's revenue share starts approaching 40% of the trailing 12 months.
- When planning any large purchase or change that would draw down a reserve, to confirm which reserve it should actually come from.
- After any near-miss (a late payment, a scare with hardware) — capture the lesson while it's fresh.

## Common Mistakes
- **Revenue is down this month, and the tax reserve is the pool of cash that's sitting right there** — Treating the tax/obligation reserve as available spendable cash during a slow month.
- **One client now accounts for 65% of trailing revenue, and nothing about the pipeline has changed in response** — Letting one client's revenue share climb past 60% without any deliberate acquisition response.
- **The laptop that runs every client project has no backup device and no documented fallback plan** — Having no documented equipment-failure or backup-access plan until the failure actually happens.
- **Revenue has been strong for months, and none of it has gone toward a reserve** — Assuming every month's revenue will look like the current one, and building no reserve at all during good months.

## Further Reading
- *Profit First* — Mike Michalowicz: a concrete percentage-based system for building multiple reserves automatically rather than relying on discipline alone.
- *The Black Swan* — Nassim Nicholas Taleb: broader framing on preparing for foreseeable-but-unscheduled disruption rather than predicting exact timing.

```recall
- q: "Name the five reserve types."
  must:
    - "tax or obligation reserve"
    - "emergency runway reserve"
    - "equipment reserve"
    - "professional services reserve"
    - "operations reserve"
    - "each has a distinct, non-interchangeable purpose"

- q: "What does the equipment failure plan document?"
  must:
    - "the primary work machine, and a backup machine or cloud-access option"
    - "critical software licenses, and a backup location for records"
    - "a repair or replacement budget, and a client-communication plan for downtime"

- q: "Name the three forbidden patterns."
  must:
    - "spending the tax or obligation reserve for any other purpose"
    - "relying indefinitely on one client"
    - "operating without a backup of business records"
```
