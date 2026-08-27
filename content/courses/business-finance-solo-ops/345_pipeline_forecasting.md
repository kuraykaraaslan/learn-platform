# 345. Pipeline Forecasting for Solo Operators

## What It Is
Pipeline forecasting is how a solo operator avoids discovering, too late, that next month has no confirmed revenue. It works by assigning every open opportunity a stage and a realistic probability, rather than treating every lead in the pipeline as equally likely to close. A typical weighted ladder runs from a new lead at 10% probability, through qualified (25%), discovery completed (40%), proposal sent (60%), verbal yes (80%), up to contract and deposit received at 100% — and revenue should never be counted as real, for planning purposes, until it hits that 100% stage. Multiplying each opportunity's value by its stage probability produces a weighted forecast that is far more honest than simply summing every quoted number in the pipeline.

Forecasting only matters if it feeds a real decision, so the monthly view separates confirmed revenue (signed projects and retainers), likely revenue (proposals with a strong buying signal), and possible revenue (qualified leads not yet proposed) — and every one of those numbers needs a matching capacity check. Revenue and time are the same forecast viewed from two sides: project delivery days, meeting load, support obligations, admin time, business development time, and a buffer all draw from the same finite week, so a healthy-looking revenue forecast that ignores capacity is not actually a plan, it's a wish.

The forecast's real job is to surface warning signals early enough to act on them: no confirmed revenue for next month, one client representing too large a share of the pipeline, a pipeline that's full of activity but low quality, proposals sent with no follow-up, or cash flow that depends on a late final payment. A weekly cadence keeps stages and follow-ups current; a monthly cadence compares what was expected against what actually happened, reviews source quality and close rate, and checks for a widening cash gap before it becomes urgent.

## Key Concepts
- **Weighted pipeline stages**: new lead (10%), qualified (25%), discovery completed (40%), proposal sent (60%), verbal yes (80%), contract/deposit received (100%). Only the 100% stage counts as real revenue for spending decisions.
- **Forecast fields per opportunity**: client, source, offer, estimated value, stage, weighted value, expected decision date, expected start date, payment structure, risk, and next action.
- **Three-tier monthly forecast**: confirmed (signed projects and retainers), likely (proposals with a strong buying signal), possible (qualified leads not yet proposed) — kept visually separate so optimism doesn't blur into planning.
- **Capacity forecast**: project delivery days, meetings, support obligations, admin/finance time, business development time, and buffer — revenue should never be forecast beyond what delivery capacity can actually absorb.
- **Warning signals**: no confirmed revenue for next month, one client representing too much of the total, a full-but-low-quality pipeline, unfollowed-up proposals, and cash flow dependent on a late final payment.
- **Review cadence**: weekly — update stages, send follow-ups, check decision dates, review next month's capacity; monthly — compare expected vs. actual revenue, review source quality and close rate, review cash gap risk.

## Example Code
A weighted monthly pipeline forecast with a capacity cross-check for a solo operator:

```
PIPELINE FORECAST — September 2026

OPPORTUNITIES
Client   Stage                Est. Value   Prob.   Weighted
A        Contract/deposit     €9,000       100%    €9,000
B        Verbal yes           €6,000        80%    €4,800
C        Proposal sent        €4,500        60%    €2,700
D        Discovery completed  €3,000        40%    €1,200
E        Qualified            €2,000        25%    €500
F        New lead             €5,000        10%    €500
                                             Total: €18,700 weighted

MONTHLY SUMMARY
Confirmed (Client A):              €9,000
Likely (Client B, strong signal):  €4,800
Possible (C, D, E, F):             €4,900
                                   -------
Weighted total:                   €18,700

CAPACITY CHECK
Client A delivery:        3 days/week (confirmed)
Client B (if it closes):  2 days/week starting mid-month
Admin/finance/BD:         1 day/week
Buffer:                   0.5 day/week
Total committed if B closes: 6.5 of 5 available days -> OVER CAPACITY

WARNING SIGNALS RAISED
- Client A is 48% of confirmed pipeline value -> concentration flag.
- If Client B closes as expected, capacity is over 100% -> either
  delay Client B's start date by 2 weeks or pause new outbound.
- Client C's proposal was sent 9 days ago with no follow-up logged
  -> follow-up overdue, schedule this week.
```
The forecast didn't just total the numbers — it caught a capacity conflict and an overdue follow-up before either became a delivery problem.

## When to Use
- Weekly, as a short standing review to update opportunity stages, catch overdue follow-ups, and check upcoming decision dates.
- Monthly, to compare what the forecast predicted against what actually closed, and to reassess channel quality and close rate.
- Before accepting any new opportunity, to check whether the current pipeline plus the new work would exceed real delivery capacity.
- Whenever one client's weighted value starts to dominate the pipeline, as an early trigger to diversify acquisition effort.

## Common Mistakes
- Counting a verbal "yes" or strong interest as guaranteed revenue instead of applying its actual stage probability.
- Forecasting revenue without checking it against delivery capacity, leading to overcommitment the moment more than one deal closes at once.
- Sending a proposal and letting it sit for over a week with no scheduled follow-up, then being surprised when it goes cold.
- Relying on one large potential deal to make the monthly forecast look healthy, rather than diversifying across several smaller ones.

## Further Reading
- *Predictable Revenue* — Aaron Ross and Marylou Tyler: on building a disciplined, stage-based approach to pipeline instead of relying on sporadic effort.
- *Sales Management. Simplified.* — Mike Weinberg: practical discipline around pipeline reviews and forecasting accuracy, scaled down for a one-person operation.
- This lesson is general education, not financial or tax advice. Weighted forecasts are planning tools, not guarantees — treat unclosed revenue as provisional until a contract and deposit are in hand.
