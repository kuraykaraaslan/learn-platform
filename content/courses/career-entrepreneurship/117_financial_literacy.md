# 117. Financial Literacy for Freelancers

## What It Is
Most developers think about revenue but not profit, and about profit but not cash flow. Revenue is what clients pay you. Profit is what's left after expenses. Cash flow is whether you have money in your account when you need it — and these three numbers can tell completely different stories in the same month.

A solo software company in Turkey billing international clients faces specific challenges: currency risk (invoicing in EUR/USD but paying expenses in TRY), VAT/KDV handling on international invoices (generally zero-rated, but documentation matters), and quarterly tax obligations that arrive as a surprise if you haven't reserved for them.

The goal of financial literacy isn't to become an accountant — it's to not be surprised by money problems that are predictable with basic planning.

```quiz
- q: "Revenue, profit and cash flow for the same month. Can they disagree?"
  anchor: "these three numbers can tell completely different stories in the same month"
  options:
    - text: "No — profit is revenue minus expenses, so they move together"
      correct: false
      why: "Profit does follow that arithmetic. Cash flow is about when money arrives against when obligations fall due."
    - text: "Yes — they can tell completely different stories in the same month"
      correct: true
      why: "Revenue is what clients pay, profit is what is left, cash flow is whether the money is in the account when you need it."
    - text: "Only when a client pays late"
      correct: false
      why: "Late payment is one cause. Expense timing and tax obligations produce the same divergence."

- q: "What does the lesson name as the most common freelancer financial mistake?"
  anchor: "Not doing this is the most common freelancer financial mistake"
  options:
    - text: "Underpricing the work"
      correct: false
      why: "A real problem, and not the one named here."
    - text: "Not setting aside 20-30% of every payment for tax, immediately"
      correct: true
      why: "Quarterly obligations otherwise arrive as a surprise."
    - text: "Failing to track billable hours"
      correct: false
      why: "Tracking matters for the effective rate, but it is not the mistake this lesson names."

- q: "Your stated rate is €80/hour. Why is the effective rate lower?"
  anchor: "Total revenue ÷ total hours worked (including admin, sales, unpaid revisions)"
  options:
    - text: "Because clients negotiate the rate down"
      correct: false
      why: "Negotiation moves the stated rate. The effective rate falls for a different reason."
    - text: "It divides revenue by every hour worked — admin, sales and unpaid revisions included"
      correct: true
      why: "Which is usually much lower than the stated rate."
    - text: "Because of currency conversion losses"
      correct: false
      why: "Currency exposure is its own concept, and it moves in either direction."
```

## Key Concepts
- **Revenue vs profit vs cash flow**: Revenue = total billed. Profit = revenue - expenses. Cash flow = when money actually arrives vs when you must pay obligations.
- **Accounts receivable aging**: How long clients take to pay. Net-30 terms mean a €10K invoice may not be cash for 45 days. This creates cash flow gaps.
- **Tax reserve**: Setting aside 20–30% of every payment immediately for tax obligations. Not doing this is the most common freelancer financial mistake.
- **KDV (VAT) on international invoices**: Services exported from Turkey to foreign clients are generally KDV-exempt (0%). You must still issue an invoice and document the export nature. Consult a Turkish accountant for your specific situation.
- **Currency exposure**: If you invoice in EUR but have TRY expenses, TRY depreciation increases your effective margin. EUR/USD appreciation in 2021–2023 significantly benefited Turkish freelancers. The reverse also happens.
- **Effective hourly rate**: Total revenue ÷ total hours worked (including admin, sales, unpaid revisions). This is usually much lower than your stated rate.
- **Runway**: How many months of expenses you can cover with current savings. Minimum 3 months; 6 months is comfortable.
- **Separate business account**: Business income and expenses tracked separately from personal finances. Essential for tax accuracy and psychological clarity.

## Example / Template

**Monthly P&L template:**

```markdown
## Monthly P&L — [Month Year]

### Revenue
| Client | Project | Invoice Date | Due Date | Amount (EUR) | Status |
|---|---|---|---|---|---|
| Client A | SaaS MVP Phase 1 | May 1 | May 31 | 4,800 | Paid |
| Client B | Retainer | May 1 | May 15 | 1,500 | Outstanding |
| **Total Revenue** | | | | **6,300** | |

### Expenses
| Category | Amount (TRY) | Amount (EUR equiv.) |
|---|---|---|
| Hosting (Vercel, AWS, etc.) | 1,200 | 35 |
| Software subscriptions | 800 | 23 |
| Accounting | 500 | 15 |
| Professional development | 400 | 12 |
| **Total Expenses** | **2,900** | **85** |

### Summary
- **Gross Profit:** €6,300 - €85 = €6,215
- **Tax Reserve (25%):** €1,554 → move to savings account immediately
- **Net Available:** €4,661

---
## 3-Month Rolling Cash Flow Forecast

| | May | June | July |
|---|---|---|---|
| Opening balance | €3,200 | €5,400 | €4,100 |
| Expected income | €6,300 | €3,000 | €8,000 |
| Expected expenses | €500 | €500 | €500 |
| Tax payment | €0 | €3,800 (Q1 settlement) | €0 |
| Closing balance | **€9,000** | **€4,100** | **€11,600** |

→ June dip is manageable. No cash flow crisis.
```

**Pricing for profit (not revenue):**
```
Target net income: €4,000/month
Tax rate: 25% → need €5,333 gross profit
Expenses: €200/month
Target revenue: €5,533/month

Billable hours realistically: 80/month (not 160 — admin, sales, learning)
Required effective rate: €5,533 ÷ 80 = €69/hour minimum

If you charge €50/hour, you're working for less than target.
If you charge fixed-price €12,000 for an 8-week project:
  Effective rate = €12,000 ÷ 80 hours = €150/hour → much better.
```

## When to Use / Apply
- First week of each month: update P&L and cash flow forecast
- Every payment received: immediately transfer 25% to a dedicated tax savings account
- Before accepting a new project: model the cash flow impact (when will you actually receive payment?)
- Annually: review effective hourly rate and adjust pricing

## Common Mistakes
- Treating outstanding invoices as income before they're paid
- No tax reserve — quarterly tax bills arrive as emergencies
- Underpricing to win projects without calculating effective rate
- Mixing business and personal finances — impossible to track profitability
- No currency hedging on large EUR/USD contracts when TRY is volatile

## Further Reading
- *Profit First* — Mike Michalowicz: simple cash management system that forces tax and profit reservations
- Intuit's freelancer tax guide — even as a non-US freelancer, the framework for self-employment tax planning applies
- [Turkish Revenue Administration](https://gib.gov.tr) — source of truth for KDV on exported services; find a Turkish tax accountant who works with international freelancers

```recall
- q: "Define revenue, profit and cash flow."
  must:
    - "revenue — total billed"
    - "profit — revenue minus expenses"
    - "cash flow — when money actually arrives against when obligations must be paid"

- q: "What is accounts receivable aging, and what does it create?"
  must:
    - "how long clients take to pay"
    - "net-30 terms can mean a €10K invoice is not cash for 45 days"
    - "that gap is the cash flow problem"

- q: "How does currency exposure cut both ways?"
  must:
    - "invoicing in EUR while paying expenses in TRY"
    - "TRY depreciation increases the effective margin"
    - "EUR/USD appreciation in 2021-2023 benefited Turkish freelancers"
    - "the reverse also happens"

- q: "What does the lesson hand to a professional, and what is the runway floor?"
  must:
    - "KDV on services exported from Turkey is generally zero-rated"
    - "the invoice and its export documentation still matter"
    - "consult a Turkish accountant for your specific situation"
    - "runway minimum 3 months, 6 months comfortable"
```
