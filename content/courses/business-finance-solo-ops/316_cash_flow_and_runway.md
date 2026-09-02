# 316. Cash Flow and Runway: Why Profit Isn't Cash

## What It Is
> This lesson is general education, not financial or tax advice. Reserve percentages, runway targets, and payment norms vary by jurisdiction and business stage — confirm specifics with your own accountant.

Cash flow is the timing of money moving in and out of your business — not the total amount you've earned or spent, but when each amount actually clears your account. A project can be profitable on paper and still sink you, because a signed €15,000 contract with a "100% on delivery" payment term produces zero cash for the eight weeks you're building it, while your hosting bill, your accountant, and your own rent all come due on their own schedules regardless of when the client pays.

The core discipline is separating four numbers that freelancers habitually collapse into one: cash collected (money that has actually cleared), cash expected (invoiced or verbally agreed but not yet received), cash reserved (set aside for taxes and obligations, not available to spend), and cash spendable (what's genuinely free to use after the first three are accounted for). Most freelance financial stress comes from treating "cash expected" as if it were "cash spendable" — spending against a milestone payment that is two weeks late, or a client that quietly churns before paying a final invoice.

Runway is the answer to the question "how many months can I survive if no new client pays me starting today?" It's calculated as available business cash divided by average monthly required outflow — where required outflow includes fixed costs, subscriptions, accounting fees, and if the business supports your living costs, a minimum personal draw. Runway is not a pessimistic metric; it's the number that tells you whether you can afford to say no to a bad-fit client, negotiate from a position of strength, or take two weeks to find the right next project instead of the first available one.

```quiz
- q: "A €4,500 invoice went out last week on net-15 terms, and your accounting tool already counts it as revenue. How much of it is spendable today?"
  anchor: "Only collected cash is real for planning purposes."
  options:
    - text: "All of it — it is invoiced, so it is committed revenue"
      correct: false
      why: "Invoiced money is cash expected, not cash collected. Collapsing those two is the first distinction this lesson refuses to make."
    - text: "None of it — it stays cash expected until it clears the account"
      correct: true
      why: "Collected means cleared. Until then the payment can still be late, disputed, or lost to a client that churns before paying."
    - text: "All of it minus the tax reserve, since the reserve is the only unavailable part"
      correct: false
      why: "Reserving tax against money you have not received does not make the remainder real. The payment itself has not happened yet."

- q: "Two offers on the table: €10,000 paid 50/30/20 across milestones, or €12,000 paid 100% on delivery. Which one leaves you in the safer cash position?"
  anchor: "A €10,000 project paid 50/30/20 across milestones is safer than a €12,000 project paid 100% on delivery"
  options:
    - text: "The €12,000 one — a bigger total absorbs more delay"
      correct: false
      why: "The total is not what creates the risk; the timing is. A contract paying nothing for eight weeks funds none of those eight weeks, whatever its size."
    - text: "The €10,000 one — the money arrives while the costs are being incurred"
      correct: true
      why: "Requesting money before and during delivery is what converts cash flow from hope-based to funded."
    - text: "Neither — once the year closes they are just two revenue lines"
      correct: false
      why: "That is the mistake the lesson names directly: a strong annual total can hide a business that was insolvent in March."

- q: "Your runway calculation divides available cash by fixed costs and tool subscriptions. What is missing from the denominator?"
  anchor: "if the business supports your living costs, a minimum personal draw"
  options:
    - text: "Nothing — a personal draw is a personal expense, not a business outflow"
      correct: false
      why: "If the business funds your living costs, the draw is an outflow you cannot skip. Leaving it out inflates the runway number precisely when you need it to be honest."
    - text: "Accounting and legal fees, plus a minimum personal draw where the business funds living costs"
      correct: true
      why: "Required outflow is all four together: fixed costs, subscriptions, accounting/legal fees, and the draw."
    - text: "The invoiced-but-unpaid amount, added to available cash"
      correct: false
      why: "That changes the numerator in the wrong direction — it is the exact distortion the calc block on this page exists to put side by side with the honest figure."
```

## Key Concepts
- **Cash collected vs. cash expected**: Collected is money that has cleared your account. Expected is invoiced or promised. Only collected cash is real for planning purposes.
- **Runway formula**: Available business cash ÷ average monthly required outflow = months of runway. Required outflow includes fixed costs, tool subscriptions, accounting/legal fees, and personal draw if applicable.
- **Payment schedule beats payment size**: A €10,000 project paid 50/30/20 across milestones is safer than a €12,000 project paid 100% on delivery, even though the second number is larger — the first funds your delivery as you go.
- **Tax/obligation reserve**: A portion of every payment (set by your accountant, not guessed) that is moved out of the spendable pool immediately and treated as already spent.
- **Cash flow risk signals**: Multiple unpaid invoices, one client representing most of expected cash, a large subscription renewal coming due, an empty pipeline after the current project ends.
- **Spendable cash**: What remains after collected cash minus reserves minus committed fixed costs — the only number that should inform discretionary spending decisions.
- **Deposit and milestone structure**: Requesting money before and during delivery (not only after) converts your cash flow from "hope-based" to "funded."
- **The runway floor**: A minimum number of months of runway you refuse to go below without treating it as an emergency (commonly 3 months minimum, 6 months comfortable for a solo operator).

## Example Code
A simple monthly cash flow snapshot and 3-month rolling forecast, kept in a spreadsheet:

```
CASH FLOW SNAPSHOT — May 2026
Opening cash:                 €6,200
+ Collected this month:       €5,800  (Client A milestone 2, Client B retainer)
+ Expected, not yet paid:     €4,500  (Client C final invoice, net-15, due June 3)
- Fixed costs:                €650    (hosting, tools, accounting)
- Tax/obligation reserve:     €1,450  (25% of collected, per accountant)
= Spendable cash:              €9,900
Runway at current burn (€1,900/mo min. outflow): 5.2 months

3-MONTH ROLLING FORECAST
                     May       June      July
Opening balance      €6,200    €9,900    €7,300
+ Expected income     €5,800    €4,500    €8,000
- Fixed + variable    €650      €650      €650
- Tax reserve         €1,450    €6,450*   €2,000
= Closing balance     €9,900    €7,300    €12,650

* June includes a quarterly tax settlement of €5,800 — flagged two months
  ahead so it never arrives as a surprise.
```
The value isn't the spreadsheet — it's that the quarterly tax settlement in June was visible in April, giving time to make sure the reserve account actually holds €5,800 before it's due, rather than discovering the gap on the due date.

The runway formula in Key Concepts, with your own numbers. Pay attention to the
third line: it is the same arithmetic done the way most freelance financial
stress actually happens — counting an invoice that has not cleared as if it had.

```calc
inputs:
  - { id: cash,       label: "Cash actually cleared in the business account", type: number, default: 9000, min: 0, step: 500 }
  - { id: fixed,      label: "Fixed costs per month",           type: number, default: 400, min: 0 }
  - { id: subs,       label: "Tool subscriptions per month",    type: number, default: 180, min: 0 }
  - { id: fees,       label: "Accounting / legal per month",    type: number, default: 220, min: 0 }
  - { id: draw,       label: "Personal draw per month",         type: number, default: 2600, min: 0 }
  - { id: expected,   label: "Invoiced but not yet received",   type: number, default: 6000, min: 0 }
outputs:
  - { label: "Required monthly outflow", expr: "fixed + subs + fees + draw", format: usd }
  - { label: "Runway, months", expr: "cash / (fixed + subs + fees + draw)", format: number }
  - { label: "Runway if you counted the unpaid invoice as spendable", expr: "(cash + expected) / (fixed + subs + fees + draw)", format: number }
```

The gap between those last two lines is how many months of confidence a single
late payment can invent. It is also why the lesson separates collected from
expected before anything else.

## When to Use
- Every month, as a 15-minute standing review, not only when something feels wrong.
- Before accepting a new project — model when the money actually arrives, not just the total contract value.
- Before agreeing to a client's preferred payment terms — "net-60" sounds administrative but is a two-month interest-free loan you're extending them.
- When deciding whether you can afford to turn down a bad-fit lead — runway is what makes "no" financially possible.
- Immediately after any client goes quiet on an outstanding invoice — recalculate runway assuming that payment doesn't arrive.

## Common Mistakes
- **An invoice just went out, and spending decisions start assuming that money is already in hand** — Treating an issued invoice as if it were collected cash, and spending against it before it clears.
- **A tax settlement lands as a surprise, even though it was months away and predictable** — Skipping a dedicated tax reserve and getting surprised by a quarterly or annual settlement that should have been visible months in advance.
- **The default payment structure is "100% on completion"** — Accepting "100% on completion" as the default payment structure, which funds the client's risk with your cash flow instead of the reverse.
- **The year's total revenue looks strong, so the business is called financially healthy** — Judging financial health by revenue for the year instead of by monthly cash position — a strong annual total can hide a business that was insolvent in March.

## Further Reading
- *Profit First* — Mike Michalowicz: a percentage-based cash allocation system built specifically around separating spendable cash from tax and profit reserves.
- *Financial Intelligence* — Karen Berman and Joe Knight: a plain-language guide to the difference between profit, cash, and the assumptions behind financial statements, written for non-finance managers.

```recall
- q: "Name the four cash numbers this lesson refuses to collapse into one, and say what each means."
  must:
    - "cash collected — money that has actually cleared"
    - "cash expected — invoiced or agreed but not yet received"
    - "cash reserved — set aside for taxes and obligations, not available"
    - "cash spendable — what is genuinely free after the first three"

- q: "State the runway formula and everything that belongs in its denominator."
  must:
    - "available business cash ÷ average monthly required outflow"
    - "fixed costs and tool subscriptions"
    - "accounting and legal fees"
    - "a minimum personal draw if the business funds living costs"

- q: "Why does the lesson insist runway is not a pessimistic metric?"
  must:
    - "it is what makes turning down a bad-fit client financially possible"
    - "it is what lets you negotiate from strength"
    - "it buys time to find the right next project instead of the first available one"

- q: "The forecast showed a €5,800 quarterly tax settlement in June. Why was that a non-event rather than a crisis?"
  must:
    - "it was visible two months ahead in the rolling forecast"
    - "there was time to confirm the reserve account actually held it"
    - "the gap was not discovered on the due date"
```
