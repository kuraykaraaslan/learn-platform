# 325. Building a Finance Dashboard: Core KPIs for Solo Businesses

## What It Is
> This lesson is general education, not financial or tax advice. These KPIs are a management dashboard, not a formal financial statement — treat them as a decision aid alongside, not instead of, your accountant's records.

A solo business doesn't need enterprise-grade finance analytics — it needs a small, reliable set of numbers that can be checked in under five minutes and trusted completely. A dashboard with forty metrics that nobody updates is worse than no dashboard at all; the goal here is the smallest set of numbers that would actually change a decision.

The essential set covers monthly revenue issued and collected, outstanding and overdue receivables, monthly expenses, estimated profit, cash runway, average project value, effective hourly rate by project, billable utilization, subscription cost ratio, recurring revenue, and pipeline value. A few of these deserve precise definitions to stay useful: estimated profit is collected revenue minus expenses minus direct project costs minus reserve allocations (a management estimate, not a formal accounting statement); the subscription cost ratio is monthly subscription cost divided by monthly collected revenue, and a rising trend means tools are quietly eating margin.

The dashboard should organize into a handful of sections — Cash, Revenue, Receivables, Expenses, Subscriptions, Projects, Time, Pipeline, and Risks — each carrying a simple status color: green for healthy, yellow for watch, red for action required, and unknown for missing data. Missing data should never be hidden as if it were zero; an "unknown" status is itself useful information about where record-keeping has a gap.

## Key Concepts
- **Core KPI set**: revenue issued, revenue collected, outstanding receivables, overdue receivables, monthly expenses, estimated profit, cash runway, average project value, effective hourly rate, billable utilization, subscription cost ratio, recurring revenue, pipeline value.
- **Estimated profit formula**: `collected revenue − expenses − direct project costs − reserve allocations`, explicitly a management estimate rather than an accounting figure.
- **Subscription cost ratio**: `monthly subscription cost ÷ monthly collected revenue` — a rising ratio is an early signal that tool spend is outpacing the business supporting it.
- **Billable utilization**: `billable delivery hours ÷ total work hours` — used for capacity insight, never as a self-punishment metric.
- **Dashboard sections**: Cash, Revenue, Receivables, Expenses, Subscriptions, Projects, Time, Pipeline, Risks.
- **Status indicators**: green (healthy), yellow (watch), red (action required), unknown (missing data) — with concrete triggers, e.g. any overdue invoice moves receivables to yellow or red depending on amount, and an empty pipeline for next month is always red.
- **Forbidden pattern**: mixing expected revenue with collected cash on the same line, or building a dashboard with so many metrics it stops being maintained after month two.

## Example Code
A minimal dashboard snapshot with status flags applied:

```
## Finance Dashboard Snapshot — August 2026

Cash            : €14,300 available           [green]
Revenue issued  : €11,200                      [green]
Revenue collected: €9,600                      [green]
Outstanding     : €1,600 (1 invoice, due Aug 3) [yellow]
Overdue         : €0                           [green]
Expenses        : €855                         [green]
Estimated profit: €7,545                       [green]
Runway          : 5.8 months                   [green]
Subscription ratio: €165 / €9,600 = 1.7%       [green]
Avg project value: €7,400 (trailing 6 months)  [green]
Billable utilization: 54%                      [green]
Pipeline (next month): €4,200 confirmed only   [red]

Top action: pipeline for September is thin — confirmed revenue covers
  fixed costs but nothing else. Prioritize 2 warm proposals this week.
```
Every other number is green — the dashboard's entire value this month is the one red line, which a monthly revenue total alone would never have surfaced this early.

Three of the dashboard's KPIs, computed from one month. The profit line is
explicitly a management estimate, not an accounting figure — the reserve
allocation is subtracted because that money is already committed, even though
it is still sitting in the account.

```calc
inputs:
  - { id: collected,     label: "Revenue collected this month (USD)", type: number, default: 14000, min: 0, step: 500 }
  - { id: expenses,      label: "Monthly expenses (USD)",             type: number, default: 2100, min: 0 }
  - { id: direct_costs,  label: "Direct project costs (USD)",         type: number, default: 1600, min: 0 }
  - { id: reserves,      label: "Reserve allocations (USD)",          type: number, default: 3500, min: 0 }
  - { id: subscriptions, label: "Monthly subscription cost (USD)",    type: number, default: 420, min: 0 }
outputs:
  - { label: "Estimated profit", expr: "collected - expenses - direct_costs - reserves", format: usd }
  - { label: "Profit as a share of collected revenue", expr: "(collected - expenses - direct_costs - reserves) / collected * 100", format: percent }
  - { label: "Subscription cost ratio", expr: "subscriptions / collected * 100", format: percent }
```

Watch the third line across several months rather than judging it once. A rising
subscription ratio is the early signal the lesson names: tool spend growing
faster than the business paying for it, which is invisible in any single month's
absolute number.

## When to Use
- Weekly or monthly, as a fixed check-in, not only when something already feels wrong.
- Alongside the monthly financial close, as the compressed one-screen version of it.
- Before making a hiring, subscription, or pricing decision — check the relevant status color first.
- When explaining business health quickly to an accountant, partner, or your own future self three months from now.

## Common Mistakes
- **The dashboard has grown to forty tracked metrics, and most haven't been touched since month two** — Building a dashboard with too many metrics to realistically maintain, so it gets abandoned within a couple of months.
- **The year's total revenue number looks strong, and that's the one figure getting reported as "how the business is doing"** — Relying on vanity metrics (total revenue for the year) instead of the numbers that actually predict trouble.
- **This month's revenue line combines what's been invoiced with what's actually landed in the bank** — Mixing "expected" revenue with "collected" cash on the same line, which quietly overstates financial health.
- **The overdue invoice and a couple of record-keeping gaps just don't show up on this month's dashboard** — Hiding or omitting overdue invoices and missing data instead of flagging them clearly.

## Further Reading
- *Financial Intelligence* — Karen Berman and Joe Knight: useful grounding in what each of these numbers actually means and where they can mislead.
- A simple spreadsheet, Notion database, or lightweight admin panel is sufficient — the discipline of updating it weekly matters far more than the tool.
