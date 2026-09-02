# 324. The Monthly Financial Close

## What It Is
> This lesson is general education, not financial or tax advice. The monthly close described here is a management practice, not a substitute for formal bookkeeping or tax filing — coordinate its outputs with your accountant.

The monthly close is the process that turns a month of scattered invoices, payments, receipts, and half-remembered decisions into actual business intelligence. Without it, "how was this month?" gets answered with a feeling instead of a number, and problems that were visible in the data — an overdue invoice, a subscription nobody uses, a project quietly losing money — stay invisible until they become a crisis.

A proper close covers revenue issued versus revenue actually collected, the list of unpaid and overdue receivables, categorized expenses, an updated profit estimate, the state of the tax/obligation reserve, current cash runway, a subscription review, updated project profitability notes, pipeline risk, and a short list of priorities for next month. This is deliberately not a full bookkeeping exercise — it's a management review that happens to produce clean inputs for whoever does the actual bookkeeping or tax filing.

The discipline that makes this work is doing it every month without exception, including the busy ones. Skipping the close during a heavy delivery month is exactly when problems compound quietest — an overdue invoice from six weeks ago, a subscription renewal nobody questioned, a client relationship that's been unprofitable for two months running. The close is what surfaces these before they require a fire drill.

```quiz
- q: "It has been a busy month and there is no time for the close. Skip it?"
  anchor: "that is precisely when problems accumulate"
  options:
    - text: "Yes — the close is a review, and reviews can wait for a quiet month"
      correct: false
      why: "A busy month is precisely when problems accumulate. Deferring the close is a named forbidden pattern."
    - text: "No — a busy month is exactly when the close matters most"
      correct: true
      why: "The other forbidden pattern is reviewing revenue while skipping expenses; both hide the same kind of trouble."
    - text: "Do a revenue-only close, and catch up on expenses later"
      correct: false
      why: "Reviewing revenue while skipping expenses is itself the other named forbidden pattern."

- q: "Why does the monthly summary keep a fixed document structure?"
  anchor: "kept identically structured month to month so trends are easy to spot"
  options:
    - text: "So it can be handed to an accountant without rework"
      correct: false
      why: "Accountant notes are their own checklist item. The structure serves a different purpose."
    - text: "So trends are easy to spot across months"
      correct: true
      why: "Revenue, Expenses, Profitability, Cash and Reserve, Decisions — identical every month, so what changed is what stands out."
    - text: "Because a fixed template is faster to fill in"
      correct: false
      why: "It is, and speed is not why the lesson requires it."

- q: "The monthly review asks which project produced the best profit. What is the paired question?"
  anchor: "which project produced the best profit, which consumed too much unpaid time"
  options:
    - text: "Which project brought in the most revenue"
      correct: false
      why: "Revenue and profit is a distinction the question already makes. The pair is about time."
    - text: "Which project consumed too much unpaid time"
      correct: true
      why: "The best-revenue project can be the worst-profit one precisely because of unpaid time."
    - text: "Which project took longest to invoice"
      correct: false
      why: "Collection timing matters and belongs to receivables, not to this pairing."
```

## Key Concepts
- **What must be reviewed every month**: revenue issued, revenue collected, unpaid receivables, expenses by category, profit estimate, reserve status, cash runway, subscription register, active project profitability, and pipeline risk.
- **The close checklist**: update invoice statuses, reconcile payments, list overdue invoices, categorize expenses, save receipts and subscription invoices, export bank/payment data, update the cash-flow forecast, update reserve balances, review active project profitability, review subscriptions, write accountant notes, and record lessons plus next actions.
- **Monthly review questions**: which project produced the best profit, which consumed too much unpaid time, which client or payment looks risky, which expense or subscription should be cancelled, which pricing assumption was wrong, how much runway exists, and what acquisition action is needed for next month.
- **Standard summary format**: a short document with Revenue, Expenses, Profitability, Cash and Reserve, and Decisions sections — kept identically structured month to month so trends are easy to spot.
- **Forbidden pattern**: reviewing revenue while skipping expenses, or deferring the close because the business is "too busy" — that is precisely when problems accumulate.

## Example Code
A compact monthly close summary, in the standard recurring format:

```
# Monthly Close: 2026-07

## Revenue
Issued:      €11,200
Collected:   €9,600
Outstanding: €1,600 (Client D, net-15, due Aug 3)
Overdue:     €0

## Expenses
Fixed:          €480  (hosting, accounting software, insurance)
Variable:       €210  (one-off design asset license)
Subscriptions:  €165  (7 tools — see subscription register)
One-time:       €0

## Profitability
Estimated profit: €11,200 - €855 (costs) - €2,800 (25% tax reserve) = €7,545
Best project:    Client A retainer — stable, low support drag
Weakest project: Client E fixed-scope — 40% over estimated hours

## Cash and Reserve
Available cash: €14,300
Reserve:        €5,600 (tax + emergency, on track)
Runway:         5.8 months at current burn

## Decisions
Cancel:          unused design-tool subscription (€29/mo, last used 3 months ago)
Increase price:  next quote for Client-E-type scope, add 20% risk buffer
Follow up:       Client D invoice due Aug 3 — confirm receipt Aug 5 if silent
Prep accountant: Q3 folder assembled, VAT question flagged for July filing
```
Nothing here required more than twenty minutes once the invoice tracker and expense records were current — the close is fast precisely because the underlying records were kept clean all month.

## When to Use
- On a fixed date every month (last business day or first of the next) — never skipped, including busy months.
- Before any accountant handoff or tax filing deadline.
- When deciding financial priorities — pricing changes, subscription cuts, acquisition push — for the coming month.
- Immediately after noticing the business "feels" off financially, to replace the feeling with numbers.

## Common Mistakes
- **Delivery is busy this month, so the financial close gets skipped** — Skipping the close during busy delivery months, which is when overdue invoices and dying subscriptions are most likely to go unnoticed.
- **The monthly review looks at revenue only, expenses and subscriptions untouched** — Reviewing only revenue and ignoring the expense and subscription side entirely.
- **The monthly close happens a little differently each time, whatever feels right that month** — Treating the close as a one-off event instead of a recurring, identically-structured monthly ritual that makes month-over-month trends visible.
- **Records only get organized once a year, right before the accountant needs them** — Waiting until year-end or accountant deadline pressure to organize records that should have been closed monthly.

## Further Reading
- *Profit First* — Mike Michalowicz: pairs well with a monthly close by giving a concrete allocation system to act on what the close reveals.
- *Financial Intelligence* — Karen Berman and Joe Knight: useful background on reading your own numbers without a finance background.

```recall
- q: "What must be reviewed every month?"
  must:
    - "revenue issued and revenue collected"
    - "unpaid receivables, and expenses by category"
    - "profit estimate, reserve status and cash runway"
    - "the subscription register, active project profitability and pipeline risk"

- q: "Name the sections of the standard summary, and why they never change."
  must:
    - "Revenue, Expenses, Profitability, Cash and Reserve, and Decisions"
    - "kept identically structured month to month so trends are easy to spot"

- q: "Name the two forbidden patterns."
  must:
    - "reviewing revenue while skipping expenses"
    - "deferring the close because the business is too busy — which is precisely when problems accumulate"
```
