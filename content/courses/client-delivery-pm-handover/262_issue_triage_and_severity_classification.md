# 262. Issue Triage and Severity Classification

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Customer_Success_and_Support_Rules/issue-triage-and-severity.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Not every reported problem deserves the same response speed, and triage exists to make that judgment explicitly instead of reacting to whichever message arrived most recently or sounded most urgent in tone. A minor cosmetic issue reported in a panicked message and a genuine production outage reported calmly both need to go through the same classification step before anyone starts fixing anything — because starting to code before triage, unless the system is obviously down, risks solving the wrong problem first while something more severe waits unaddressed.

The classification covers more ground than just "how bad is it." Severity (is production down, or is this cosmetic) sits alongside business impact, reproducibility, which environment it's happening in, how many users are affected, who actually owns the fix, and whether it's included in existing scope or billable as new work. The severity levels themselves map directly to response urgency: Severity 1 means a core business process is blocked and gets immediate stabilization; Severity 2 means an important workflow is broken but a workaround exists, triaged same business day; Severity 3 is scheduled normally; Severity 4 gets logged and batched, or reclassified as a change request if it's not actually a defect.

Reproducibility deserves its own discipline because fixing what you can't actually observe is guesswork dressed up as engineering. Before attempting a fix, the goal is exact steps, an affected account, a timestamp, a screenshot or video, and the expected versus actual behavior — and when that information isn't available, the honest answer is "I cannot confirm the root cause yet, please send X, Y, Z" rather than either refusing to engage or guessing at a fix for a problem that hasn't been confirmed to exist in the form described. Ownership, meanwhile, is provisional until investigated — a report that sounds like a developer defect might turn out to be a client configuration issue or a third-party outage, and the classification should be willing to move as the investigation reveals more.

## Key Concepts
- **Triage before fixing, unless the system is clearly down**: classifying first prevents solving the wrong problem or over-reacting to tone instead of actual severity
- **Seven classification dimensions**: severity, business impact, reproducibility, environment, affected users, ownership, and whether it's included or billable
- **Four severity levels with matched actions**: S1 critical (stabilize immediately), S2 high (same-business-day triage with workaround communicated), S3 medium (scheduled normally), S4 low (logged, batched, or reclassified as a change request)
- **Reproducibility is a prerequisite, not a nicety**: exact steps, affected account, timestamp, screenshot/video, and expected-vs-actual behavior should be gathered before attempting a fix
- **"I cannot confirm this yet" is a legitimate, professional response**: better than guessing at a fix for an unreproduced issue or ignoring a report that lacks detail
- **Ownership is provisional and can shift**: developer defect, client configuration, client data issue, third-party provider, hosting/infrastructure, user misunderstanding, or new requirement — investigation may move an issue between these categories
- **Emergency stabilization has a fixed sequence**: acknowledge, stop risky deployments, check recent changes, check hosting/third-party status, roll back or mitigate if safer, communicate the next update, then fix root cause — in that order

## Example Code
```md
## Issue Triage

**Summary:** Multiple staff report order status changes silently failing
to save since ~14:15 today
**Severity:** S1 — Critical
**Environment:** Production
**Affected users:** All 4 warehouse staff attempting status changes
**Business impact:** Order fulfillment tracking is stalled; staff reverting
to a paper log as a temporary workaround
**Reproducible:** Yes — confirmed on 3 separate accounts
**Ownership:** Developer defect (traced to 14:15 deployment)
**Included or billable:** Included — defect in delivered scope, within
warranty period
**Immediate action:** Roll back deployment; verify write path restored
**Next update:** 15 minutes or upon rollback completion
```

```text
Insufficient detail response:

I cannot confirm the root cause yet. Please send the exact steps you took,
the affected order ID, the approximate time this happened, and a
screenshot if possible. I'll keep this open as monitoring until I can
reproduce it or find it in the logs.
```

## When to Use
- Every time a client reports a bug, outage, broken workflow, or unexpected behavior — as the first response, before any fix attempt
- When multiple issues arrive at once, to decide which gets immediate attention and which can be scheduled normally
- Whenever a report lacks enough detail to reproduce, as the trigger to request specific missing information rather than guessing
- When an issue's apparent cause shifts during investigation — from what looked like a defect to a client configuration problem, for instance — as the moment to update its ownership classification rather than leaving the original guess in place

## Common Mistakes
- Treating every client message as equally critical regardless of actual severity, burning urgency on cosmetic issues while a real production problem waits
- Attempting a fix before understanding scope or confirming reproducibility, risking a change that doesn't actually address the reported problem
- Blaming the user or the client's data before investigation has actually confirmed where the fault lies
- Skipping the post-incident note for a critical issue once it's fixed, losing the record of what happened and why

## Further Reading
- Google SRE Book, "Managing Incidents" — the severity-based triage model this lesson's classification structure is adapted from: https://sre.google/sre-book/managing-incidents/
- Atlassian, "Incident severity levels" — practical reference for defining and communicating severity tiers: https://www.atlassian.com/incident-management/kpis/severity-levels
- Steve Krug, *Don't Make Me Think* — indirectly relevant: on why some "bugs" are actually usability or training issues in disguise, worth ruling out before committing to a fix
