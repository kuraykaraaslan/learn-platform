# 216. Payment Gates and Milestone Enforcement

## What It Is
Choosing a pricing model tells the client what they'll pay; payment gates tell both sides when money actually moves and what happens if it doesn't. This is the enforcement layer underneath any pricing model: deposit before work starts, milestone payment before or upon each milestone's acceptance, final payment before production release or full source transfer, and any additional work funneled through an approved change request rather than absorbed for free. Skipping this layer is how a technically well-priced project still turns into unpaid work, because the freelancer ends up financing the client's entire build out of pocket until the very end.

The specific split scales with project size — a small project might run 50/50, a medium one 40/30/30 across deposit, core milestone, and final delivery, a larger one spread across four gates — but the shape is always the same: money follows visible progress, and the final gate (production deployment, full handover, source code transfer) never happens before the final invoice is paid. This isn't aggressive; it's the same logic a contractor uses on a home renovation, and framed calmly — "the next milestone begins after this payment is received, unless we've agreed otherwise in writing" — it reads as professional structure, not distrust.

Two categories of cost deserve explicit ownership before they become a fight: third-party costs (hosting, domain, payment processor fees, premium plugins, app store fees) default to the client unless the SOW says otherwise, and non-payment has a stated, calm consequence — the freelancer may pause work, delay delivery, or withhold production release and source transfer until payment is current. None of the specific numbers, interest rates, or "days to pay" figures below are legal advice for your jurisdiction; late-payment rules, consumer protection law, and what a court will actually enforce vary by country and by whether your client is a business or a consumer, so have your actual payment terms reviewed by a lawyer before you rely on them in a dispute.

## Key Concepts
- **Payment gate sequencing**: deposit → milestone payment(s) → final payment before production release/source transfer — additional work always priced as a separate change request.
- **Scaling the split by project size**: small (50/50), medium (40/30/30), larger (30/30/25/15) — the exact ratio matters less than the principle that no single payment finances the whole build.
- **Third-party cost default**: hosting, domain, SSL, payment processor fees, and premium licenses are the client's cost unless explicitly included in the SOW.
- **Non-payment consequence**: a stated, non-threatening right to pause work, delay delivery, or withhold production release and source code transfer until payment is received.
- **Retainer variant**: monthly prepaid, defined scope or hours, an explicit unused-hours policy, and emergency work priced separately unless specifically included.

## Example Code
```markdown
## Payment Terms

**Total project fee:** [amount]

| Milestone | Trigger | Payment |
|---|---|---|
| 1. Kickoff | SOW approved, access collected | 40% deposit |
| 2. Core build | Working staging build, demo delivered | 30% |
| 3. Final delivery | Production release, handover docs delivered | 30% |

Work begins after the deposit is received and this SOW is approved in
writing. Each subsequent milestone begins after the prior milestone's
payment is received, unless otherwise agreed in writing. Production
deployment and final source code transfer occur after final payment
is received in full.

**Third-party costs** (hosting, domain, payment processor fees, premium
plugins/themes) are billed to the client unless explicitly included above.

**Late payment:** If a milestone payment is more than [X] days overdue,
work may be paused and the timeline adjusted accordingly until payment
is received.
```

## When to Use
- Whenever drafting the payment section of a proposal, SOW, or contract, regardless of pricing model.
- Before starting work on any milestone where the previous payment hasn't cleared.
- When a client requests source code or production access ahead of the payment schedule "just to move faster."

## Common Mistakes
- Accepting 100% payment after full completion, which finances the entire project out of pocket with no leverage if something goes wrong.
- Releasing source code or production deployment before final payment clears, removing the single strongest incentive for on-time payment.
- Leaving third-party costs unassigned, so hosting or API fees quietly become the freelancer's problem.
- Using aggressive or threatening language for a late-payment notice instead of calm, pre-agreed, matter-of-fact language.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — on payment structure as a professional boundary, not an act of distrust.
- The Freelancers Union's guides on payment terms and late-payment protections for independent contractors.
- Blair Enns, *Pricing Creativity* — on tying payment cadence to delivered value rather than elapsed time.
