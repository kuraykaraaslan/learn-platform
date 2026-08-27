# 322. Time Tracking and Your Real Effective Hourly Rate

## What It Is
Time is the actual capacity constraint of a solo operator — not money, not tools, not even client demand. If time isn't tracked with any rigor, every pricing decision and every "can I take this on" decision becomes a guess dressed up as intuition. Time tracking here is not about surveillance or maximizing every billable minute; it's about knowing, with real numbers, where the week actually goes.

The trap most solo operators fall into is tracking only coding time, which makes every project and every week look more profitable and more available than it is. A week that feels "mostly client work" often turns out to be 55% delivery, 15% communication, 10% admin, and the rest split between sales and firefighting — none of which shows up if the only thing being logged is git commits. The categories matter more than the tool: date, project, category, duration, a short note, and a billable yes/no is enough to run every calculation in this lesson.

Utilization — the share of total work time that is billable delivery — should never be pushed toward 100%. A healthy solo target is roughly 50–70% billable delivery, with the rest split across sales and marketing, admin and finance, and learning or internal improvement, plus a buffer for the unplanned. A freelancer running at 95% billable utilization for months is not "crushing it" — they are one bad month away from an empty pipeline, because there was never time left to sell the next project.

## Key Concepts
- **Time categories**: billable delivery, project management, client communication, QA/testing, deployment/handover, support/maintenance, sales/discovery, proposal/pricing, marketing/content, admin/finance, learning/research, internal product, unplanned firefighting.
- **Healthy utilization band**: roughly 50–70% billable delivery, 10–20% sales/marketing, 5–15% admin/finance, 5–15% learning/internal improvement, with a buffer for support and surprises — not a fixed ratio, but a range to notice drift from.
- **Minimum tracking granularity**: date, project/client, category, duration, short note, billable yes/no — anything more elaborate tends to get abandoned within a month.
- **Estimate-improvement loop**: after every project, compare estimated vs. actual hours for delivery, communication, and QA/deployment separately, plus unplanned support hours — feed the gap into the next quote.
- **Warning signals**: too much unpaid communication, too much unplanned support, admin ballooning because records are messy, constant context switching, and marketing quietly stopping every time a delivery project ramps up.
- **Effective hourly rate**: the same metric from project accounting, but computed on a weekly or monthly basis across all client work — it exposes whether the whole practice, not just one project, is underpriced.

## Example Code
A one-week time log rolled up into a utilization snapshot:

```
WEEK OF 2026-08-17 — TIME LOG SUMMARY

Category                Hours   % of week
Billable delivery         24.5      54%
Client communication       6.0      13%
Admin/finance               4.0       9%
Sales/proposal work          3.5       8%
Unplanned support             4.0       9%
Learning/internal              3.0       7%
-----------------------------------------
Total logged                45.0     100%

Billable utilization: 24.5 / 45.0 = 54%  → within healthy 50-70% band
Flag: unplanned support (9%) is above the usual 3-5% baseline —
      check which client generated it before quoting them again.
```
The number that matters isn't the 54% in isolation — it's noticing that "unplanned support" nearly doubled its normal share, which is the kind of drift a gut-feel week review never catches.

## When to Use
- Every week, as a five-minute rollup — not only when a project feels like it's dragging.
- Before quoting a new project, to check whether last quarter's estimates were realistic.
- When deciding whether to accept urgent or rush work — check actual current capacity, not how the week feels.
- When a specific project or client consistently produces "unplanned firefighting" hours — the log is the evidence for a pricing or boundary conversation.

## Common Mistakes
- Logging only coding time, which hides communication, QA, and admin load entirely.
- Treating every non-billable hour as waste, which discourages tracking the sales and learning time that keeps the business alive.
- Accepting new urgent work without checking the current week's actual capacity first.
- Continuing to price future projects from optimistic estimates instead of the actual hours similar past projects consumed.

## Further Reading
- *Getting Things Done* — David Allen: not time-tracking specific, but the underlying discipline of capturing everything rather than trusting memory applies directly here.
- A plain spreadsheet or a lightweight timer app (Toggl, Clockify) is sufficient — the value is in the weekly five-minute rollup habit, not the software.
- This lesson is general education, not financial or tax advice. Time-tracking data is a management tool for your own pricing and capacity decisions, not a substitute for any client-facing timesheet requirements your contracts may specify.
