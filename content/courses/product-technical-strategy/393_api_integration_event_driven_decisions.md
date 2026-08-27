# 393. API, Integration, and Event-Driven Architecture Decisions

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Technical_Architecture_Rules material (specifically `api-and-integration-architecture.md` and `event-driven-and-async-architecture.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Every integration and every async workflow is a decision, not a default, and the decision that matters most upfront is picking the right type for the job: a REST call for something that needs an immediate answer, a webhook for something a provider needs to tell you about, a queue or background job for slow or retryable work, a scheduled sync for periodic reconciliation, or a file import/export for exchange with legacy tools. Getting the type wrong is usually what turns an integration into a production incident — a payment confirmation that should have arrived asynchronously via webhook, but instead gets polled synchronously inside the checkout request, times out the user's browser instead of failing safely in the background.

The sync-versus-async decision has a simple test underneath the type table: synchronous when the user genuinely needs an immediate answer, asynchronous when the operation is slow, the external provider is unreliable, the side effect can happen later, or retry logic is needed. Whenever a workflow is genuinely asynchronous, the interface has to say so honestly — "your ticket is being generated, you'll receive an email shortly" — instead of showing false completion and letting the user discover the gap on their own. Every domain event fired into that async pipeline should describe a business fact that has already happened — OrderPaid, TicketIssued, AppointmentCancelled — rather than a technical command like ProcessData or RunFunction; the naming discipline is what keeps an event log readable by someone who wasn't the original author six months later.

Because integrations are a common failure point almost by definition — they depend on someone else's uptime, someone else's API stability, and someone else's pricing — each one needs an entry in an integration risk register before it ships to production: purpose, data exchanged, failure impact, rate limits, retry behavior, fallback, credential owner, cost owner, and, often the one that gets skipped, an exit strategy if the provider ever has to be replaced. (The implementation mechanics of idempotency-key deduplication, webhook signature verification code, and queue-library configuration are separate, deeper technical skills covered elsewhere; this lesson is about deciding which integration pattern fits the business need and registering the dependency risk that decision creates, before it becomes a surprise during an incident.)

## Key Concepts
- **Integration type selection**: REST (immediate request/response), webhook (provider-initiated event notification), queue/job (slow, retryable, or background work), scheduled sync (periodic reconciliation), file import/export (legacy exchange) — matched to the actual need, not chosen by habit
- **Sync vs. async decision test**: synchronous when the user needs an immediate answer; asynchronous when the operation is slow, the provider is unreliable, the side effect can be deferred, or retry is required
- **Eventual-consistency UX rule**: if a workflow is asynchronous, the interface must say so ("processing," "you'll receive an email shortly") rather than showing false completion
- **Domain event naming discipline**: name events as business facts that already happened (OrderPaid, TicketIssued) rather than technical commands (ProcessData, RunFunction)
- **Transaction-boundary ordering**: complete the database transaction first, then persist the event/job request, then let a worker process the side effect, then update processing status — avoid sending external emails or payments from inside an open database transaction
- **Integration risk register fields**: purpose, data exchanged, failure impact, rate limit, retry behavior, fallback, credential owner, cost owner, exit strategy
- **Explicit boundary**: idempotency-key implementation, webhook signature-verification code, and queue-library mechanics (retry/backoff configuration, dead-letter handling) are separate technical skills covered elsewhere; this lesson is the upstream pattern-selection and risk-registration decision

## Example Code
```markdown
## Integration Risk Register — Crew Scheduler

### SMS Provider
**Purpose:** Notify technicians of new/changed assignments
**Data exchanged:** Job time, address, technician phone number (one-way out);
delivery status (inbound, via webhook)
**Failure impact:** Technician doesn't learn of assignment change in real time;
coordinator dashboard remains authoritative
**Rate limit:** 100 messages/minute on current plan — well above pilot volume
**Retry behavior:** One automatic retry on delivery failure, then flagged
"unconfirmed" in coordinator view
**Fallback:** Coordinator calls technician directly if flagged unconfirmed
**Credential owner:** Dev team, using client's SMS account
**Cost owner:** Client, billed per message
**Exit strategy:** SMS is abstracted behind a single notification-sending
function; switching providers means changing one module, not every call site

### Sync vs. Async Decisions
| Operation | Type | Reasoning |
|---|---|---|
| Technician conflict check | Sync (REST, in-process) | Coordinator needs immediate yes/no before confirming assignment |
| SMS notification send | Async (queued job) | Provider latency shouldn't block the coordinator's UI; retryable |
| SMS delivery status | Webhook (inbound) | Provider-initiated event, not something this system can poll efficiently |

### Domain Events
- `AssignmentCreated` — fired after successful conflict-checked assignment
- `AssignmentCancelled` — fired on coordinator cancellation
- `NotificationDeliveryFailed` — fired when SMS retry is exhausted, triggers
  the "unconfirmed" UI flag

### Transaction Boundary
1. Commit Assignment record in a single transaction with conflict check
2. Enqueue `AssignmentCreated` event / SMS job (outside the transaction)
3. Worker sends SMS, updates delivery status on webhook callback
4. UI reflects "notification sent" only after step 3 confirms
```

## When to Use
- During requirements-to-architecture translation (lesson 388), as soon as any external system or provider is identified as a dependency
- Whenever a workflow's response time depends on a third party — apply the sync/async test explicitly rather than defaulting to synchronous because it's simpler to write
- Before any integration ships to production — the risk register entry, including the often-skipped exit strategy, should exist before the first real customer depends on it
- When naming a new event or job — check it against the business-fact naming discipline before it enters the codebase as a vague technical command

## Common Mistakes
- Calling a slow or unreliable third-party API synchronously inside a critical user flow like checkout, turning a provider hiccup into a user-facing failure
- Showing "success" in the UI for a workflow that is actually still processing asynchronously, then leaving the user to discover the gap through a support ticket
- Naming events and jobs after technical actions (ProcessData, RunTask) instead of business facts, making the event log unreadable to anyone but the original author
- Treating every third-party dependency as always available and skipping the fallback/failure-impact fields in the risk register
- Skipping the exit strategy field because switching providers feels hypothetical — until pricing changes or the provider shuts down and there's no abstraction in place

## Further Reading
- Gregor Hohpe & Bobby Woolf — "Enterprise Integration Patterns" (the canonical reference for choosing an integration pattern deliberately)
- Martin Fowler — "What do you mean by 'Event-Driven'?" (martinfowler.com — on distinguishing event notification, event-carried state transfer, and event sourcing before picking one)
- Adam Bellemare — "Building Event-Driven Microservices" (a deeper technical follow-up once the pattern-selection decision has been made)
