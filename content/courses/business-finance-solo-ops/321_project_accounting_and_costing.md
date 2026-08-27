# 321. Project-Level Accounting: Is This Client Actually Profitable?

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Business_Growth/Sales_Growth/Finance_and_Operations/Analytics_and_Growth_Experiments/Business_Continuity/Offer_Library material to build out the Business Growth & Finance course; no existing coverage data for your own practice.

## What It Is
Project-level accounting is the discipline of closing every project financially, not just technically. A project can be "done" the moment code is deployed, but it is not financially closed until every invoice is issued, every payment is reconciled, every direct cost is recorded, and actual hours are compared against the estimate. Most freelancers skip this step — they ship, get paid eventually, and move on without ever learning whether the project actually made money.

The core diagnostic is the effective hourly rate: net project revenue divided by total actual hours. Total actual hours must include everything, not just development — unpaid discovery calls, planning, every email thread, QA, deployment, handover, and any support given after delivery. A €8,000 project that looks great on the invoice can quietly produce a €22/hour effective rate once forty hours of "quick calls" and "small fixes" are counted honestly. This is not an argument for pricing everything hourly — it is a diagnostic that tells you whether your fixed-price estimates and client-selection instincts are actually working.

Client profitability is not only about the contract value. The same nominal price can represent a great client or a terrible one depending on how much communication, rework, delayed approval, and scope-boundary pressure they generate. A rigorous project close captures both the numbers and the behavior pattern, because next quarter's pricing and next year's client-selection decisions depend on both.

## Key Concepts
- **Project financial record**: For every project, track client, contracted value, currency, payment structure, invoice list, amount collected, amount outstanding, direct costs, estimated vs. actual hours, support hours, revision count, and a profit estimate.
- **Cost categories**: Direct project costs include tools bought specifically for this client, hosting/domain, third-party API fees, stock assets, subcontractor pay, transaction fees, travel, and post-delivery support — all of these erode the headline contract value.
- **Effective hourly rate**: `net project revenue ÷ total actual hours`, where actual hours include unpaid sales/discovery, planning, development, communication, QA, deployment, handover, and rework.
- **The close checklist**: A project is not closed until all invoices are issued, payment status is documented, direct costs are recorded, actual time is reviewed, the support obligation is written down, and a profitability rating is assigned.
- **Client behavior as a cost**: Excessive communication, repeated rework, delayed approvals and payments, ignored scope boundaries, and a stream of small unpaid "quick fixes" are real costs — they must enter the profitability review, not just the invoice total.
- **Profitability rating**: Rate every closed project good / acceptable / weak / loss based on effective hourly rate and stress level, not contract value alone.
- **Forbidden pattern**: Never mark a project complete because the code is live while payment is still outstanding — deployment and financial close are two separate milestones.

## Example Code
A side-by-side close for two projects with the identical €9,000 contract value:

```
## Project Financial Close — Client A (Admin Panel)
Contracted value:     €9,000        Collected: €9,000
Direct costs:         €180 (hosting, one paid plugin)
Estimated hours:      90            Actual hours: 96
  (delivery 78h, communication 10h, QA/deploy 6h, support 2h)
Effective hourly rate: (9000 - 180) / 96 = €91.9/hr
Profitability: GOOD — matched estimate, low support drag, no stress notes.

## Project Financial Close — Client B (Booking System)
Contracted value:     €9,000        Collected: €9,000
Direct costs:         €210 (hosting, SMS API credits)
Estimated hours:      90            Actual hours: 168
  (delivery 80h, communication 41h, QA/rework 31h, support 16h)
Effective hourly rate: (9000 - 210) / 168 = €52.3/hr
Profitability: WEAK — same price, nearly double the real hours.
Lessons for next quote: client re-opened "finished" screens 6 times after
sign-off; require written milestone approval before starting the next phase.
```
Same contract value, wildly different real return — the difference is entirely in the hours the invoice never shows.

## When to Use
- At the close of every project, as a standing step before archiving it — not only for large or troubled ones.
- Before quoting a repeat client for new work — check their historical effective rate first.
- Mid-project, at any major milestone, if the relationship feels heavier than the price justifies.
- When deciding whether to keep, renegotiate, or exit a recurring client relationship.

## Common Mistakes
- Treating "deployed" as equivalent to "financially closed" and skipping the review entirely.
- Excluding communication and revision time from the hours total, which flatters every project's apparent profitability.
- Ignoring small unpaid "quick fixes" that, summed over a project, quietly erase the margin.
- Repricing the next project from the quoted estimate instead of the actual hours a similar past project consumed.

## Further Reading
- *Pricing Creativity: A Guide to Profit Beyond the Billable Hour* — Blair Enns: a sharp argument for pricing on value while still knowing your real numbers underneath.
- *Getting to Yes* is not needed here, but a simple recurring spreadsheet or Notion database with the fields above is enough — the discipline matters more than the tool.
- This lesson is general education, not financial or tax advice. Treat effective hourly rate as an internal management metric, not a formal accounting figure — confirm bookkeeping treatment of costs with your accountant.
