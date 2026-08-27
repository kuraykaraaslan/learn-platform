# 252. Database, API, and Integration Handover Documentation

## What It Is
The database is usually the single most valuable asset in a delivered system, and it's also the part most commonly handed over as an undocumented black box. A future developer or the client's own technical hire needs to understand not just that a `User` table and an `Order` table exist, but what they mean in business terms, how they relate, how migrations are actually run, and — critically — whether backups genuinely exist and have ever been tested. A schema dump with no explanation is nearly useless; "`User` stores authenticated accounts, `Order` stores checkout records and belongs to a user, `Payment` stores provider transaction references and must be kept consistent with webhook status updates" is what someone can actually work from.

Backup documentation deserves special discipline because it's the one area where an unverified claim causes real damage: never write "backups exist" unless that's actually been confirmed, and never claim a restore path works unless it's been tested at least once. If there is no automated backup, the handover document should say so plainly and recommend one — a documented gap is a manageable risk; an undocumented false assumption is a disaster waiting for the first data loss event.

APIs and integrations carry a parallel version of the same problem. "Stripe is integrated" and "webhook works" are not operationally useful statements — they tell a future maintainer nothing about how authentication works, what the error format looks like, how retries and idempotency are handled, or what to do when a payment webhook silently stops arriving. Every meaningful integration needs its provider ownership, its failure behavior, and its manual recovery path written down, because integrations are exactly the part of a system most likely to fail quietly in production long after the original developer has moved on.

## Key Concepts
- **Explain business meaning, not just table names**: "`Order` stores checkout records and belongs to a user" beats "there is an Order table" because it tells a reader what the data represents, not just that it exists
- **Document exact migration commands, with explicit warnings**: run production migrations only after backup, never hand-edit an applied migration file, and always test on staging first
- **Never claim an unverified backup**: state the actual backup provider, frequency, retention, and — if known — the last verified restore date; if no backup exists, say so and recommend one rather than implying safety that isn't there
- **Sensitive data gets flagged by table**: personal data, financial data, uploaded files, and any logs containing user data need explicit callouts, along with soft-delete vs. hard-delete behavior
- **API docs need base URL, auth, endpoints, and error format together**: a single endpoint example with request, response, and error codes is worth more than a prose paragraph describing "the API"
- **Webhook documentation is its own checklist**: event names, signature verification, idempotency handling, retry behavior, expected payload, and — most importantly — the manual replay procedure for when something fails silently
- **Provider ownership must be explicit for every integration**: which account owns the Stripe/iyzico/SMTP relationship, whether it's sandbox or production, and where its credentials are stored

## Example Code
```md
# Database Documentation — Order Management Admin Panel

## Provider
PostgreSQL, hosted on Railway.

## Connection
Stored through `DATABASE_URL` in the hosting provider's environment settings.
Real value is never written in this document.

## Schema Overview
`User` stores authenticated staff/admin accounts. `Order` stores order
records created from imported or manually entered data, and belongs to a
user who last updated it. `OrderStatusHistory` logs every transition for
audit purposes and must never be deleted.

## Migration Workflow
```bash
npm run prisma:migrate:dev      # local development
npm run prisma:migrate:deploy   # production, run only after backup
npm run prisma:generate
```
Run production migrations only after a confirmed backup. Do not edit an
applied migration file manually — create a new migration instead.

## Backup Strategy
Railway automatic daily backups, 7-day retention. Last verified restore:
2026-08-15 (restored to a scratch environment, confirmed schema and row
counts matched). Manual backup: `pg_dump` via Railway CLI, documented in
`04-deployment-runbook.md`.

## Sensitive Data
`Order` contains customer names and addresses. `User` contains staff email
addresses. No payment card data is stored — payment status is a webhook
reference only.
```

```md
## Integration: Resend (Transactional Email)

**Purpose:** Order confirmation and status-change notifications
**Owner account:** Client (Meridian Retail Group)
**Environment:** Production
**Credentials stored in:** Railway environment variables
**Webhook URL:** N/A (outbound only)
**Failure behavior:** Send failure is logged; order processing continues
regardless (email is non-blocking)
**Retry behavior:** Resend retries transient failures automatically; no
custom retry logic on our side
**Manual recovery:** Re-trigger notification from Order detail page
"Resend confirmation" button
**Provider documentation:** https://resend.com/docs
```

## When to Use
- Before final handover on any project with a database, without exception — this is one of the "forbidden to skip" documents even on small projects
- Whenever a new third-party integration or webhook is added, as part of finishing that feature rather than as a separate documentation pass later
- Before making any claim to the client that backups exist or that data can be restored — verify it first, then document what was actually verified
- When a future developer or the client's internal hire is being onboarded to maintain the system, as the primary reference for how data and integrations actually work

## Common Mistakes
- Delivering a database-backed system with no migration instructions, leaving a future developer to reverse-engineer the schema change process
- Claiming "backups exist" without ever having verified a restore, which is discovered to be false at the worst possible moment
- Describing an integration only as "Stripe is integrated" or "webhook works," leaving no operationally useful detail for debugging a future failure
- Omitting the manual recovery or replay procedure for a webhook, so a silent failure has no documented path back to a correct state

## Further Reading
- Martin Kleppmann, *Designing Data-Intensive Applications* — foundational context on backup, replication, and why "backup exists" claims must be continuously verified
- Stripe, "Webhooks: best practices" — the canonical reference for idempotency, signature verification, and retry handling patterns: https://stripe.com/docs/webhooks/best-practices
- Postman, "API documentation best practices" — practical guidance on documenting endpoints, errors, and auth so a document is operationally usable: https://www.postman.com/api-documentation/
