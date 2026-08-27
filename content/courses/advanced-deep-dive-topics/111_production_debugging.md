# 111. Production Debugging Methodology

## What It Is
Production debugging is different from local debugging. You can't attach a debugger, you can't reproduce the exact state, and the pressure to fix it fast is real. Developers who debug by intuition ("I think it might be the cache...") thrash for hours. Developers with a method eliminate the problem space systematically and find the root cause in minutes.

The core principle is binary search applied to causality: every step you take should eliminate at least half of your remaining hypotheses. If you take an action that doesn't reduce the hypothesis space, you're not debugging — you're guessing. The binary search principle is why experienced engineers can diagnose production incidents they've never seen before faster than junior engineers can diagnose problems they have seen before.

For a solo operator running a multi-tenant SaaS, production debugging is a single-player game under live pressure. A documented methodology is what separates a 20-minute resolution from a 4-hour panic. You already have the logging infrastructure. This is about using it with discipline.

## Key Concepts
- **Binary search principle** — Every diagnostic action should eliminate at least half the remaining hypothesis space. Random poking does not count as debugging.
- **"What changed?" is always the first question** — The vast majority of production incidents are caused by something that changed: a deploy, a config update, a traffic spike, a 3rd-party API change, a certificate expiry, a cron job that ran for the first time.
- **Hypothesis → Test → Eliminate loop** — Form a specific, falsifiable hypothesis. Design a test that would prove it wrong. Run the test. Eliminate or confirm. Never skip the "eliminate" step.
- **Read stack traces backwards** — The bottom of a stack trace is where execution started; the top is where it crashed. The actionable code is usually in the middle, just before the framework/library frames.
- **Correlation IDs** — Every request should carry a unique ID that flows through all log entries. This lets you reconstruct the full lifecycle of a failing request from your logs.
- **Blast radius assessment** — Before touching anything in production, assess: how many tenants/users are affected? Is it total outage or partial? Is it getting worse or stable?
- **Timeline reconstruction** — Build a chronological sequence of events from logs before forming hypotheses. Pattern recognition only works when you have the full picture.
- **Never debug in production under pressure without a rollback plan** — Know how to revert your change before you make it.

## Example / Template

### Production Incident Response Checklist

```
STEP 1 — STABILIZE (0–5 min)
─────────────────────────────────────────────────────────────
[ ] What is the blast radius? (1 user / 1 tenant / all users / full outage)
[ ] Is the system degrading, stable, or recovering?
[ ] Can I roll back the last deploy immediately? (if yes, consider it first)
[ ] Is there a customer-facing status page to update?
[ ] Alert anyone who needs to know (client, co-worker — even as a solo, log it)

STEP 2 — ASK "WHAT CHANGED?" (5–10 min)
─────────────────────────────────────────────────────────────
[ ] Last deploy: `git log --oneline -10` — what shipped in the last 24 hours?
[ ] Config changes: env vars, feature flags, secrets rotation?
[ ] Infrastructure: DB migration ran? New index? Connection pool change?
[ ] External: did a 3rd-party API (Stripe, SendGrid, OAuth provider) change?
[ ] Traffic: is this a volume spike? Check request rate graphs.
[ ] Time-based: is this triggered by a cron job, a certificate expiry, a billing cycle?

STEP 3 — RECONSTRUCT THE TIMELINE (10–20 min)
─────────────────────────────────────────────────────────────
[ ] Pull logs for the time window of first occurrence
[ ] Filter by: error level, affected endpoint, affected tenant ID
[ ] Command: grep by correlation ID to trace one bad request end-to-end
[ ] Note: exact first occurrence timestamp, frequency, any pattern
[ ] Identify: is this affecting specific tenants? Specific endpoints? Specific data?

Example Winston query pattern:
  grep '"level":"error"' app.log | grep '"requestId":"abc-123"'
  grep '"tenantId":"t_xyz"' app.log | tail -50

STEP 4 — FORM HYPOTHESES (20–30 min)
─────────────────────────────────────────────────────────────
[ ] Write down your top 3 hypotheses, ordered by probability
[ ] For each: what evidence would DISPROVE it? (not prove — disprove)
[ ] Hypothesis format: "IF [condition] THEN [symptom] BECAUSE [mechanism]"
  Example: "IF the DB connection pool is exhausted THEN requests hang at
           the query layer BECAUSE no connections are available to acquire"

STEP 5 — TEST AND ELIMINATE (30–60 min)
─────────────────────────────────────────────────────────────
[ ] Test hypothesis 1 with the most targeted diagnostic available
[ ] Did it fail to disprove? → Confirmed. Move to root cause.
[ ] Did it disprove? → Cross off, move to hypothesis 2.
[ ] Never test two hypotheses simultaneously — you won't know which caused the result
[ ] Check DB: slow query log, connection count, lock waits
[ ] Check app: memory usage, response time percentiles, error rate by endpoint

STEP 6 — FIX + VERIFY (60–90 min)
─────────────────────────────────────────────────────────────
[ ] Fix the smallest possible change that addresses root cause
[ ] Deploy with a clear rollback path identified before deploying
[ ] Watch logs in real time for 5 minutes post-deploy
[ ] Confirm: error rate returning to baseline?
[ ] Write a 3-line post-mortem note immediately (what broke, why, fix applied)

READING STACK TRACES — QUICK GUIDE
─────────────────────────────────────────────────────────────
Error: Cannot read properties of undefined (reading 'id')
    at UserService.getProfile (user.service.ts:47:23)    ← YOUR CODE (read this)
    at AuthMiddleware.verify (auth.middleware.ts:31:10)   ← YOUR CODE (check this)
    at Layer.handle (express/lib/router/layer.js:95:5)   ← FRAMEWORK (skip)
    at next (express/lib/router/route.js:137:13)         ← FRAMEWORK (skip)

Rule: Find the first frame that is YOUR code. That is where to start.
```

## When to Use / Apply
- A tenant reports their dashboard is broken and you have no alerts fired — you need to reconstruct what happened
- A deploy caused a spike in 500 errors and you need to identify whether to roll back or hotfix
- A background job is silently failing and records are in an inconsistent state
- A client escalates: "it was working yesterday" — the dreaded regression with no obvious cause
- A billing webhook is failing intermittently and you need to trace which specific events are dropping

## Common Mistakes
- **Debugging by intuition** — "It's probably the cache" without evidence is not a hypothesis; it's a guess. Guesses in production under pressure are expensive.
- **Testing multiple variables at once** — Changing two things simultaneously means you can never know which one fixed it, and you may introduce a new bug while fixing the old one.
- **Not reading the full stack trace** — Fixating on the error message and ignoring the call stack. The message tells you what failed; the stack tells you why.
- **Skipping the post-mortem note** — Fixing the issue and moving on without documenting root cause and fix means you will debug the same issue again in 6 months at 3am for a different tenant.

## Further Reading
- *Site Reliability Engineering* — Google (chapters on incident management and postmortems; free online at sre.google/books)
- *Debugging: The 9 Indispensable Rules for Finding Even the Most Elusive Software and Hardware Problems* — David Agans
- Winston documentation on structured logging and correlation IDs — `github.com/winstonjs/winston`
