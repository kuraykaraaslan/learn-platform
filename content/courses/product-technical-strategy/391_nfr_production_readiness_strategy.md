# 391. Non-Functional Requirements and Production Readiness Strategy

## What It Is
Non-functional requirements decide how well a system must behave, and a project without them stated explicitly isn't ready for serious estimation no matter how clear the feature list is. The required categories are performance, availability, scalability, security, privacy/compliance, reliability, maintainability, observability, backup/recovery, accessibility, data retention, and support expectations. The whole discipline is turning "fast," "secure," and "scalable" into numbers and named threats: "dashboard loads in under 2 seconds for up to 10,000 records" is architecture-ready, while "fast" is a placeholder that will be reinterpreted by whoever is unhappy with the delivered system.

Three of those categories — reliability, observability, and deployment topology — are where NFRs stop being a table and become an actual operating decision, because they're the ones nobody notices are missing until the system is already in production and something breaks. Reliability means naming a failure mode for each critical component (what happens when the database is unavailable, when the email provider is down, when a webhook arrives twice) and designing graceful degradation instead of total failure: if the AI provider fails, show a fallback response; if analytics fails, don't block checkout; if payment status is uncertain, mark the order pending review rather than guessing. It also means setting an actual RTO and RPO with a backup policy — even a simple daily-backup policy is better than an unstated hope that "the platform probably backs things up."

Observability means deciding, at architecture time, how the system will be understood when something goes wrong: structured logs for business events and errors, a small set of metrics that actually indicate health (error rate, job failure rate, webhook status), audit logs for privileged actions kept distinct from debug logs, and health checks that reflect real dependencies (database, queue, storage) instead of returning "OK" unconditionally. Deployment topology closes the loop: an environment strategy (at minimum local plus production; add staging once the project is serious enough to justify it), a documented choice between serverless/managed hosting and a VPS based on actual operational fit rather than habit, clear secrets ownership and rotation, and a rollback plan agreed before the first production release rather than improvised during the first incident. (Setting up the tracing pipeline, defining formal SLO/SLI targets, and running the CI/CD deployment mechanics are deeper technical skills covered elsewhere — this lesson is about deciding, upfront, what must be true before an architecture is considered production-ready at all.)

```quiz
- q: "The requirement says the dashboard should be \"fast\". What is wrong with that?"
  anchor: "will be reinterpreted by whoever is unhappy with the delivered system"
  options:
    - text: "Nothing — it is a reasonable starting point to sharpen later"
      correct: false
      why: "It is a placeholder, and the sharpening gets done after delivery by whoever is unhappy with the result."
    - text: "It is not architecture-ready — \"loads in under 2 seconds for up to 10,000 records\" is"
      correct: true
      why: "The whole discipline is turning fast, secure and scalable into numbers and named threats."
    - text: "It belongs under scalability rather than performance"
      correct: false
      why: "The category is fine. What is missing is a number."

- q: "A payment provider returns an uncertain status. What does graceful degradation look like here?"
  anchor: "if payment status is uncertain, mark the order pending review rather than guessing"
  options:
    - text: "Retry until a definite answer comes back, then proceed"
      correct: false
      why: "That is not a design for the failure mode, it is a hope that the failure resolves itself."
    - text: "Mark the order pending review rather than guessing"
      correct: true
      why: "Same shape as the other examples: a fallback response if the AI provider fails, and analytics failing without blocking checkout."
    - text: "Fail the order, so nothing incorrect is ever recorded"
      correct: false
      why: "Total failure is exactly what graceful degradation is defined against."

- q: "Which health check is actually doing its job?"
  anchor: "health checks that reflect real dependencies (database, queue, storage) instead of returning \"OK\" unconditionally"
  options:
    - text: "Returns 200 whenever the process is running"
      correct: false
      why: "That is the unconditional OK the lesson names — it reports that the process is alive and nothing else."
    - text: "Checks database, queue and storage before answering"
      correct: true
      why: "A health check should reflect the real dependencies the system needs in order to work."
    - text: "Returns the most recent error from the debug log"
      correct: false
      why: "Debug logs are kept distinct from audit logs and are not a health signal in either case."
```

## Key Concepts
- **NFR categories (twelve)**: performance, availability, scalability, security, privacy/compliance, reliability, maintainability, observability, backup/recovery, accessibility, data retention, support expectations
- **NFR table template**: category, requirement, target, risk if ignored, architecture impact — the mechanism for turning "fast" and "secure" into numbers and named controls
- **Failure mode template**: component, failure, impact, detection, recovery — named per critical component, not assumed away
- **Graceful degradation examples**: queue a failed notification instead of blocking the user flow; mark uncertain payment status as pending review instead of guessing; never let a non-critical dependency (analytics, AI provider) block a critical one (checkout)
- **RTO/RPO and backup policy**: an explicit decision, even a simple one, is required — "we'll restore from backup" with no tested process is not a policy
- **Critical-path rule**: business-critical flows (login, checkout, booking, admin operations) get stronger error handling, logging, and recovery investment than low-risk flows
- **Observability layers**: logs (business events, errors, security-relevant actions), metrics (the few numbers that indicate health), audit logs (privileged actions, distinct from debug logs), health checks (reflecting real dependencies)
- **Deployment topology decision**: environment count matched to project risk, serverless-vs-VPS fit criteria (variable traffic and low ops burden favor serverless; long-running processes and full control favor VPS), secrets ownership/rotation, and a rollback plan defined before first release
- **Explicit boundary**: SLO/SLI target-setting, distributed tracing implementation, and CI/CD deployment mechanics are deeper technical skills covered elsewhere; this lesson is the upfront requirements-and-decision layer that determines what those systems need to satisfy

## Example Code
```template
## Production Readiness Plan — Crew Scheduler

### NFR Table
| Category | Requirement | Target | Risk if ignored | Architecture impact |
|---|---|---:|---|---|
| Performance | Calendar view load | <1.5s for 500 jobs | Coordinator frustration during peak hours | Indexing on Job.date, pagination |
| Availability | Business-hours uptime | 99%+ during business hours | Missed assignments during outage | Health checks, hosting provider SLA review |
| Reliability | SMS delivery failure | Retry once, then flag | Technician never notified silently | Delivery-status webhook + coordinator "unconfirmed" flag |
| Backup | Job/Assignment data | Daily backup, 24h RPO | Data loss on provider incident | Managed hosting automated backup, monthly restore test |

### Failure Mode Table
| Component | Failure | Impact | Detection | Recovery |
|---|---|---|---|---|
| SMS provider | Delivery fails silently | Technician unaware of assignment | Delivery-status webhook timeout | Flag job "unconfirmed" in coordinator view; manual call fallback |
| Database | Temporarily unavailable | App cannot read/write | Health check failure, error logs | Hosting provider auto-recovery; coordinator sees maintenance banner |

### Deployment Topology
**Environments:** local, production (staging added once a second developer joins).
**Hosting:** Managed platform (serverless-style) — variable, low pilot traffic;
no long-running background workers needed yet.
**Secrets:** Stored in hosting provider's environment variable store, not in
the repository; SMS provider credentials rotated by the dev team.
**Rollback:** Previous deployment redeployable within minutes via hosting
platform's built-in rollback; no destructive migration planned for pilot.
```

## When to Use
- During requirements-to-architecture translation (lesson 388), as the point where vague quality expectations get converted into explicit, numbered targets
- Before any estimate or proposal — an unstated NFR is an unpriced risk
- Whenever a "the system should be reliable/secure/fast" statement appears without a number or named threat attached to it
- Before the first production release — the deployment topology and rollback plan must exist before go-live, not be improvised during the first incident
- When a critical-path flow (checkout, login, booking) is being designed — apply stronger recovery and observability investment there than elsewhere

## Common Mistakes
- **A requirements doc says the system must be "scalable" and "highly available," no numbers attached** — Saying "scalable," "secure," or "highly available" without defining what scale, which threats, or what uptime number is actually meant
- **The design covers the happy path; failure modes never got their own analysis pass** — Designing only for the happy path and treating failure-mode analysis as optional because "it probably won't happen"
- **The analytics service goes down, and checkout goes down with it** — Letting a non-critical dependency (analytics, a recommendation engine) block a critical user flow like checkout when it fails
- **Backups are assumed to be handled by the hosting platform, with no one having actually tested a restore** — Leaving backup and restore as an assumed platform feature instead of a stated, tested policy with an owner
- **Serverless or VPS gets picked because it's the one you know, not because it matches the traffic pattern** — Deciding on serverless or VPS hosting by habit or familiarity rather than by matching the project's actual traffic pattern and operational capacity

## Further Reading
- Betsy Beyer, Chris Jones, Jennifer Petoff, Niall Richard Murphy (eds.) — "Site Reliability Engineering" (Google's SRE book — the origin of much of the reliability/observability framing here)
- Michael T. Nygard — "Release It!" (stability patterns and graceful degradation, written specifically for production systems that must survive real failure)
- Niall Richard Murphy et al. — "The Site Reliability Workbook" (practical exercises for turning reliability principles into an actual operating decision)
- [The Twelve-Factor App](https://12factor.net/) — the checklist most production-readiness requirements are a restatement of

```recall
- q: "Name the NFR categories a project states before it is ready for serious estimation."
  must:
    - "performance, availability, scalability"
    - "security, privacy/compliance"
    - "reliability, maintainability, observability"
    - "backup/recovery, accessibility"
    - "data retention and support expectations"

- q: "What does reliability mean concretely here?"
  must:
    - "naming a failure mode for each critical component — database unavailable, email provider down, a webhook arriving twice"
    - "designing graceful degradation instead of total failure"
    - "setting an actual RTO and RPO with a backup policy"
    - "even a simple daily-backup policy beats an unstated hope that the platform probably backs things up"

- q: "What does observability mean at architecture time?"
  must:
    - "structured logs for business events and errors"
    - "a small set of metrics that actually indicate health — error rate, job failure rate, webhook status"
    - "audit logs for privileged actions kept distinct from debug logs"
    - "health checks reflecting real dependencies rather than an unconditional OK"

- q: "What does deployment topology have to settle before the first production release?"
  must:
    - "an environment strategy — at minimum local plus production, staging once the project justifies it"
    - "a documented choice between serverless/managed hosting and a VPS, on operational fit rather than habit"
    - "clear secrets ownership and rotation"
    - "a rollback plan agreed in advance rather than improvised during the first incident"
```
