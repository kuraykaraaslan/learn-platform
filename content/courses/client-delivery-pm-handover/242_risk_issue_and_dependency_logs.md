# 242. Risk, Issue, and Dependency Logs

## What It Is
A risk is a possible future problem. An issue is a problem that is already happening. A dependency is something the project needs from outside the developer's own control — a client asset, an approval, a third-party account — before work can proceed. All three share the same failure mode when left untracked: they live in someone's memory or in a scattered chat thread, and by the time they actually bite, nobody can reconstruct when they were first noticed or whose job it was to act on them. A log converts each of these from a vague feeling of unease into a dated, owned, trackable line item.

The discipline only works if every entry carries the same minimum fields. A risk without a probability and an impact is just a worry. An issue without an owner is nobody's job. A dependency without a "needed by" date will get requested once, forgotten, and rediscovered as a blocker three weeks later — at which point it reads as a schedule failure instead of what it actually was, an unmanaged input. The categories matter too: knowing that a risk is scope-related versus technical versus a client dependency changes who needs to see it and what kind of mitigation applies.

The escalation rule is what separates a log from decoration. Many freelancers keep a risk register that nobody ever looks at again after the kickoff call — updated once, referenced never. A log earns its keep only when specific trigger conditions (a milestone date now at risk, an overdue client dependency, expanding scope, a failing integration) automatically produce a written flag to the client, before the deadline arrives rather than after it's missed. Waiting until a risk becomes an issue, and an issue becomes a missed date, is the exact sequence a log exists to interrupt.

## Key Concepts
- **Risk vs. issue vs. dependency**: a risk is a possible future problem, an issue is a problem already happening, a dependency is an external input the project needs before work can proceed — each gets its own log because each needs different handling
- **Minimum viable entry**: every risk/issue needs description, category, probability, impact, owner, mitigation, status, and a next review date; every dependency needs what's needed, owner, needed-by date, reason, and impact if delayed
- **Categories drive routing**: scope, schedule, technical, integration, client dependency, content/data, approval, budget/payment, security/compliance, quality, and communication risks each imply a different mitigation path
- **Response types, not just tracking**: every logged risk gets one explicit response — avoid, reduce, transfer, or accept — rather than sitting in the log unaddressed
- **Escalation is trigger-based, not vibes-based**: an overdue client dependency, an at-risk milestone, or a failing integration triggers a written flag to the client immediately, not at the next scheduled status update
- **The missing-dependency sequence**: mark the task blocked, notify the client in writing, explain the impact, suggest a workaround if one exists, and update the timeline if necessary — in that order, every time
- **Visibility protects both sides**: a risk raised early reads as competence; a risk raised only after the deadline is missed reads as an excuse, even when the underlying cause is identical

## Example Code
```md
## Risk Log — Order Management Admin Panel

| ID | Risk | Category | Probability | Impact | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|---|
| R-001 | Order status list may change after transition UI is built | Scope | Medium | High | Elena | Confirm final list before starting transition logic (accept + monitor) | Open |
| R-002 | Carrier API integration requested mid-project | Client dependency | Low | Medium | Developer | Treat as change request, not scope absorption (transfer) | Open |

## Issue Log

| ID | Issue | Impact | Owner | Action | Due Date | Status |
|---|---|---|---|---|---|---|
| I-001 | Staging CSV import silently drops rows with blank SKU | Data integrity risk before Milestone 2 demo | Developer | Add validation + reject-with-reason on import | 2026-08-31 | Open |

## Dependency Log

| ID | Dependency | Owner | Needed By | Why Needed | Impact If Delayed | Status |
|---|---|---|---|---|---|---|
| D-001 | Cleaned 90-day order CSV export | Elena | 2026-09-02 | Required to test import + validate reporting | Milestone 2 demo slips by days equal to delay | Open |
| D-002 | Confirmed order status transition list | Tomas | 2026-08-29 | Blocks transition UI logic | Cannot finalize Milestone 2 scope | Open |

## Escalation sent 2026-08-28
I want to flag this early. The order status transition list (D-002) is still
outstanding as of today, one day before the agreed date. This is now affecting
the Milestone 2 demo (Sep 2). The recommended action is a 15-minute call today
to lock the list. If we do not resolve it by Friday, the likely impact is a
2–3 day slip on the demo date.
```

## When to Use
- From kickoff onward, for the life of any project with more than a trivial number of moving parts — start the logs on day one, not when the first thing goes wrong
- Whenever a client asset, approval, credential, or third-party account is required before a task can start, so the dependency is visible before it becomes a silent blocker
- The moment a risk is identified in a planning conversation, even if it seems unlikely, so it has an owner and a review date instead of living only in someone's memory
- When a milestone date starts to look shaky, as the trigger to escalate in writing rather than waiting for the date to actually slip

## Common Mistakes
- **The risk register got filled out at kickoff and hasn't been opened since** — Keeping a risk register that gets filled in once at kickoff and never opened again, so it stops reflecting reality within the first two weeks
- **"Confirmed status list from client" sits in the dependency log with no date attached** — Logging a dependency without a needed-by date, which guarantees it will be rediscovered as an active blocker instead of caught in advance
- **The milestone slips, and only then does the status update mention the client data that never arrived** — Waiting until a milestone is missed to mention the client dependency that caused it, which reads as blaming the client after the fact instead of managing risk in real time
- **A blocked task gets marked "blocked" on the board, and that's the entire response** — Treating "mark it blocked" as the whole missing-dependency response instead of also notifying the client in writing, explaining impact, and offering a workaround

## Further Reading
- Tom DeMarco and Timothy Lister, *Waltzing with Bears: Managing Risk on Software Projects* — the foundational case for why visible risk management outperforms optimistic silence
- PMI, *A Guide to the Project Management Body of Knowledge (PMBOK Guide)* — the Risk Management knowledge area formalizes probability/impact scoring and response strategy categories
- Atlassian, "How to write a risk register" — practical templates for lightweight risk and issue tracking on small teams: https://www.atlassian.com/agile/project-management/risk-register
