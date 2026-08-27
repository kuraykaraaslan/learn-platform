# 266. Customer Success Metrics and Health Reporting

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Project_Management/Documentation_and_Handover/Customer_Success_and_Support/Client_Delivery_Playbooks material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Once a system is live and support is running, the question shifts from "did we deliver correctly" to "is the client actually succeeding with what we delivered" — and that question needs evidence, not a general sense that things seem fine. Customer success metrics are the lightweight instrumentation that answers it: a handful of numbers and observations across adoption, support load, system health, satisfaction, and commercial opportunity, tracked consistently enough to notice a trend before it becomes a crisis. The operative word is lightweight — a solo delivery operation that builds a metrics dashboard heavier than the client's actual system has inverted the priorities of the engagement.

The five categories cover different failure modes on purpose. Adoption metrics (active users, workflow completion, manual workaround count) catch the client who paid for a system but never fully switched over to it. Support metrics (request volume, severity mix, recurring questions) catch documentation or training gaps before they become expensive repeated tickets. System health (error logs, failed jobs, backup status) catches technical decay quietly building up under a stable-looking surface. Satisfaction (feedback, complaints, renewal risk) catches relationship problems that pure usage data would miss entirely. Commercial metrics (renewal probability, expansion opportunity, support profitability) tie all of the above back to whether the relationship is still viable for both sides.

A simple red/yellow/green health score turns those metrics into something a non-technical stakeholder — and a busy freelancer — can act on without re-deriving the analysis every time. Green means the system is stable, core workflows are adopted, support volume is low, and feedback is positive. Yellow means something is drifting: minor recurring confusion, a persistent manual workaround, rising support volume, an unclear internal owner on the client side. Red means a workflow was never adopted, a critical issue sits unresolved, the client is unhappy, or there's a scope or payment conflict — and red should trigger a direct clarification conversation, not a wait-and-see approach. The report that carries this information should always pair what was observed with what should happen next; a report of pure activity with no recommendation has told the client nothing useful.

## Key Concepts
- **Five metric categories, each catching a different failure mode**: adoption (is it being used), support load (is it generating too much friction), system health (is it decaying quietly), satisfaction (is the relationship healthy), commercial (is the arrangement still viable)
- **Lightweight by design**: tracking should never require more overhead than the delivered system itself — a handful of numbers reviewed on a fixed cadence, not a full analytics build
- **Red/Yellow/Green health scoring**: a simple, shared vocabulary that turns raw metrics into a status a non-technical client can understand at a glance
- **Review cadence matches the relationship**: weekly internal review and a monthly client report during active maintenance; an optional 60–90 day check-in when there's no ongoing maintenance agreement
- **Every signal maps to an action**: high support volume → improve documentation or offer training; low adoption → run a usage review; strong expansion signal → prepare a roadmap recommendation (see Lesson 264); red health → schedule a clarification call and reset expectations
- **The monthly report is the artifact, not the spreadsheet**: summary, work completed, issues resolved, open items, usage notes, risks, and recommendations — written for the client to read, not for the freelancer's own reference
- **Metrics inform expansion but don't replace it**: a strong adoption or commercial signal is evidence to bring into a renewal or upsell conversation, not a substitute for having one

## Example Code
```md
# Monthly Support / Success Report — Order Management Admin Panel
**Client:** Meridian Retail Group
**Period:** October 2026
**Health:** Yellow

## Summary
System is stable and in daily use. Support volume increased slightly this
month, concentrated around the CSV export feature.

## Work Completed
- 3 minor bug fixes (all within Growth Care maintenance hours)
- Monthly review call held 2026-10-30

## Issues Resolved
- Export timeout on large date ranges (fixed, deployed 2026-10-14)

## Open Items
- Two support requests this month asked how to filter the CSV export by
  warehouse — likely a documentation gap, not a defect

## Usage / Adoption Notes
- All 4 warehouse staff active daily
- Management backlog export still done manually every Monday (candidate
  for the automation proposal under review — see Lesson 264)

## Risks
- Recurring export questions suggest the admin guide needs a short update;
  low risk today, worth fixing before it becomes a support pattern

## Recommendations
- Add a short "Filtering Exports" section to the admin guide
- Revisit the automated backlog email proposal at next review

## Next Month Priorities
1. Ship admin guide update
2. Monitor export-related ticket volume for improvement
```

## When to Use
- On a fixed monthly cadence for any client under an active maintenance or support agreement, regardless of whether anything dramatic happened
- Before a renewal conversation, to bring evidence rather than impressions into the discussion
- When support ticket volume feels like it's creeping up, to confirm the trend with data before deciding whether it's a documentation, training, or product gap
- When deciding whether an expansion or upsell recommendation (Lesson 264) is actually justified by usage, rather than just convenient timing

## Common Mistakes
- Measuring only technical uptime and ignoring client sentiment, which misses relationship risk that pure system metrics can't see
- Letting a recurring support theme go unnoticed because each individual ticket looked minor in isolation
- Sending a report that lists completed activity with no risks or recommendations, leaving the client to draw their own conclusions
- Waiting until a renewal conversation to surface a health risk that had been visible for months in the data

## Further Reading
- Nick Mehta, Dan Steinman, Lincoln Murphy, *Customer Success: How Innovative Companies Are Reducing Churn and Growing Recurring Revenue* — the source of the adoption/health-score framing used across customer success practice
- John Doerr, *Measure What Matters* — on keeping metrics tied to a small number of things that actually drive a decision, rather than measurement for its own sake
- Atlassian, ITSM reporting and service health guidance, on turning operational data into a status stakeholders can act on: https://www.atlassian.com/itsm/service-desk
