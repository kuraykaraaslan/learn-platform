# 330. Pricing for Margin, Not Just Revenue

## What It Is
> This lesson is general education, not financial or tax advice. Margin targets and rate benchmarks vary heavily by market and specialization — validate your own numbers against actual project-close data, not assumptions.

Price protects the business, or it doesn't — and a project that looks profitable at the proposal stage frequently becomes unprofitable once revisions, meetings, deployment, support, and opportunity cost are counted honestly. The single biggest pricing mistake a solo operator makes is pricing only by estimated coding hours, which ignores everything else a project actually costs: analysis and planning, communication, QA and revision cycles, deployment and handover, a support buffer, technical and client risk, opportunity cost, the tax/reserve impact, tool costs, and the profit margin that's supposed to be the point of doing this at all.

A useful mental model for the minimum acceptable price is additive: base effort cost, plus a risk buffer, plus project-management and admin cost, plus QA/deployment/handover cost, plus a support buffer, plus direct expenses, plus the desired profit margin. That minimum is then compared against the value the work creates for the client and the market's willingness to pay — the two numbers rarely land at the same place, and the higher one usually wins the negotiation, not the lower one.

Discounting deserves its own discipline: a discount is only legitimate in exchange for something — reduced scope, faster or upfront payment, real portfolio value, a genuine strategic relationship, timeline flexibility, or the client handling content/design/testing themselves. "The client asked strongly," "I'm afraid to lose the deal," "there's no other work this month," and "it feels like a small task" are not valid reasons — they are pressure, not value exchange, and every unearned discount trains a client to expect more of them.

## Key Concepts
- **Full cost inputs to any price**: estimated delivery effort, analysis/planning, communication and meetings, QA and revisions, deployment and handover, support buffer, technical risk, client risk, opportunity cost, tax/reserve impact, tool costs, desired profit margin.
- **Minimum acceptable price formula**: base effort cost + risk buffer + PM/admin cost + QA/deployment/handover cost + support buffer + direct expenses + profit margin — then compared against client value and market positioning.
- **Risk buffer triggers**: unclear requirements, many stakeholders, an unknown existing codebase, an unstable third-party API, weak payment terms, an aggressive deadline, high compliance/security expectations, or a client history of many revisions.
- **Valid discount exchanges**: reduced scope, faster/upfront payment, high portfolio value, a genuine strategic relationship, flexible timeline, client-handled content/design/testing — never granted simply because the client asked or the pipeline is thin.
- **Structured pricing questions**: before naming a number, clarify scope, complexity, timeline, client type, risk level, support obligation, payment terms, and strategic value — a confident number produced without this structure is a guess.
- **Forbidden patterns**: pricing by page count or tech stack alone, fixed price against undefined scope, unlimited revisions, full payment on completion only, and lowering price without lowering scope.

## Example Code
A minimum-acceptable-price build-up for a mid-size fixed-scope project:

```
PRICING BUILD — Admin Panel Project

Base effort cost (est. 90h @ target €70/hr blended rate):    €6,300
Risk buffer (+15% — client has 3 stakeholders, unclear roles): €945
PM/admin cost (10h @ €70/hr):                                  €700
QA/deployment/handover (8h @ €70/hr):                          €560
Support buffer (2 weeks post-launch, capped 4h):               €280
Direct expenses (hosting setup, one paid library):             €120
Profit margin (20% on top of the above):                     €1,781

Minimum acceptable price:                                    €10,686
Quoted price (rounded, client-facing):                        €11,000

Discount request from client: "Can you do €9,000?"
Response offered: reduce to 2 user roles instead of 3 and remove the
  audit-log feature to phase two — new price €9,200. Margin protected;
  scope reduced to match, not the reverse.
```
The client's counteroffer was answered with a scope trade, not a margin cut — the €9,200 price still clears the minimum acceptable price for the reduced scope.

The additive minimum-price model from Key Concepts, made arithmetic. Overhead
here groups three of the lesson's line items — PM/admin, QA/deployment/handover,
and the support buffer — because they scale with the same base effort.

```calc
inputs:
  - { id: base_hours, label: "Estimated delivery hours",            type: number, default: 40, min: 0 }
  - { id: rate,       label: "Your hourly cost basis (USD)",        type: number, default: 90, min: 0, step: 5 }
  - { id: risk,       label: "Risk buffer (%)",                     type: number, default: 15, min: 0 }
  - { id: overhead,   label: "PM + QA + support overhead (%)",      type: number, default: 30, min: 0 }
  - { id: expenses,   label: "Direct expenses (USD)",               type: number, default: 200, min: 0 }
  - { id: margin,     label: "Desired profit margin (%)",           type: number, default: 20, min: 0 }
outputs:
  - { label: "Base effort cost", expr: "base_hours * rate", format: usd }
  - { label: "Cost before margin", expr: "base_hours * rate * (1 + risk / 100 + overhead / 100) + expenses", format: usd }
  - { label: "Minimum acceptable price", expr: "(base_hours * rate * (1 + risk / 100 + overhead / 100) + expenses) * (1 + margin / 100)", format: usd }
  - { label: "Implied rate per delivery hour", expr: "(base_hours * rate * (1 + risk / 100 + overhead / 100) + expenses) * (1 + margin / 100) / base_hours", format: usd }
```

That last figure is the one worth sitting with. It is what an hour of delivery
has to be worth for the project to clear its own costs — and it is a long way
above the hourly number most people quote. The lesson's point is that the gap is
not greed; it is everything pricing-by-coding-hours leaves out.

## When to Use
- Before quoting any new project, especially one that doesn't closely resemble recent, well-tracked past work.
- Whenever a client requests a discount — to structure the scope-trade response instead of a straight price cut.
- When reviewing whether a completed project's actual margin matched what was priced, to correct the next quote.
- When deciding whether to accept a high-risk or high-uncertainty project at all.

## Common Mistakes
- **The quote covers exactly the hours the feature is estimated to take to code** — Pricing purely by estimated coding hours while leaving out communication, QA, deployment, and support time entirely.
- **The fixed price is locked in, and "scope" is still whatever the client says it is that week** — Quoting a fixed price against an undefined scope, which removes any protection when the client's requests expand.
- **The client pushed back on price, and the number came down with nothing else changing** — Granting a discount with nothing given up in return, which sets the expectation for every future negotiation with that client.
- **The pipeline is thin this month, so the quote for this project comes in lower than usual** — Reflexively lowering a price under pipeline pressure instead of first checking whether the project should be turned down entirely.

## Further Reading
- *Value-Based Fees* — Alan Weiss: a thorough case for pricing on client value and outcomes rather than time or scope alone.
- *Pricing Creativity: A Guide to Profit Beyond the Billable Hour* — Blair Enns: short, sharp guidance on holding price and trading scope instead of discounting.
