# 265. Support Operations: Channels, SLAs, and Scope Boundaries

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Project_Management/Documentation_and_Handover/Customer_Success_and_Support/Client_Delivery_Playbooks material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Once a project is live and a warranty or maintenance arrangement is in place (see Lesson 258), someone still has to run support day to day — and without a deliberate operating structure, that day-to-day quietly turns chaotic. Requests arrive as WhatsApp messages, phone calls, half-finished screenshots, and comments buried in an old email thread, none of them tracked anywhere, none of them triaged consistently. Support operations is the fix: a defined channel hierarchy, a structured intake format, and an honest set of response expectations that the client knows about before they ever need to use them.

The channel hierarchy is simple by design: a primary channel (email or a support form) that creates a written record, a secondary channel (a project board or ticketing system) for anything that needs tracking across more than one message, and an emergency channel (phone or direct message) that only exists if it's been explicitly agreed and, ideally, priced. When a request arrives outside the agreed channel — a client texting a bug report — the right move isn't to ignore it or to quietly start working on it from the text; it's to acknowledge receipt and redirect: "I'll track this, but please send it through the support form with the affected page and steps so nothing gets lost." Redirecting isn't friction for its own sake — it's what makes triage, prioritization, and billing possible at all.

The other half of running support well is being honest about time. "Response" and "resolution" are not the same promise, and collapsing them is how freelancers back into commitments they can't keep: response is acknowledging and starting triage, resolution is when the thing is actually fixed, and resolution depends on severity, reproducibility, and how many third parties are involved. A severity table with realistic targets — same-day acknowledgment for a production-down issue, a few business days for a cosmetic one — replaces vague reassurance with something the client can actually plan around, and it protects against the single most common failure mode in solo support: promising availability that isn't priced, staffed, or sustainable.

## Key Concepts
- **Channel hierarchy, stated up front**: primary (email/support form) for the written record, secondary (board/ticket system) for tracked work, emergency (phone/DM) only if explicitly agreed
- **Structured intake beats casual reports**: every request should capture environment, affected user/account, page or workflow, steps to reproduce, expected vs. actual result, evidence (screenshot/video), timing, and business impact — the first reply to an incomplete report is a request for the missing pieces, not a guess
- **Response is not resolution**: response is acknowledgment and the start of triage; resolution depends on severity, reproducibility, and third-party dependencies, and the two must never be quoted as the same number
- **Severity drives response target, not the client's tone of urgency**: a defined S1–S4 table (production down, major workflow blocked, minor bug, cosmetic request) keeps prioritization consistent regardless of who is asking loudest
- **Multi-channel redirect, done politely but consistently**: acknowledge a message that arrives off-channel, but still require the structured version before real triage begins
- **Scope boundary is part of the operating system, not just the maintenance contract**: every reply implicitly classifies the request as included support, billable change, or third-party issue, and that classification should be stated, not silently absorbed
- **No SLA language without a priced, staffed emergency tier**: "response expectations" is the honest term for a solo operation; "SLA" implies contractual guarantees that require infrastructure and pricing behind them

## Example Code
```md
# Support Operations Policy — Order Management Admin Panel

## Channels
- Primary: support@meridianretail-dev.example (all requests start here)
- Secondary: shared board, for anything already logged and in progress
- Emergency: phone, only for confirmed production-down issues, business
  hours only unless a paid after-hours tier is active

## Intake Format (required for triage to begin)
- Environment: production / staging / local
- Affected user or account
- Page or workflow
- Steps to reproduce
- Expected result vs. actual result
- Screenshot or video
- Time of occurrence
- Business impact (who is blocked, and how badly)

## Severity and Response Targets
| Severity | Example | Response target |
|---|---|---|
| S1 Critical | Production down, order workflow unusable | Same business day |
| S2 High | Major workflow blocked, workaround exists | 1 business day |
| S3 Medium | Non-critical bug | 2–3 business days |
| S4 Low | Cosmetic or minor request | Scheduled/batched |

Response = acknowledgment and triage start. Resolution timing depends on
reproducibility and complexity and is communicated per-issue.

## Off-Channel Redirect (standard reply)
"Thanks, I saw this. To make sure I don't lose the details, please send it
through the support form with the affected page, steps, and a screenshot.
I'll track it and confirm severity from there."

## Scope Note
Support requests are classified as included (defect in delivered scope),
billable (new feature or changed requirement), or third-party (outside our
delivered scope) before work begins. See Lesson 258 for the warranty and
maintenance boundary definitions this classification depends on.
```

## When to Use
- When setting up the operating rhythm for support immediately after handover or at the start of a maintenance relationship, before the first request arrives
- When a client has started sending requests through multiple informal channels and nothing is being tracked consistently
- When a client pushes for faster or broader coverage than what's currently agreed, as the prompt to reset expectations with the response/resolution distinction rather than informally caving
- When defining what a paid emergency or after-hours tier actually includes, before ever agreeing to one in the moment

## Common Mistakes
- Treating every channel a client happens to use as equally valid, so nothing is tracked in one place and triage becomes guesswork
- Promising fast resolution instead of fast response, then being unable to honor it once a fix turns out to be more complex than expected
- Accepting a voice note or a bare screenshot as a complete report and starting to debug from it instead of requesting the missing reproduction details
- Using the word "SLA" casually for an unpriced, unstaffed solo operation, creating an expectation of guarantees that don't actually exist

## Further Reading
- Matthew Dixon, Nick Toman, Rick DeLisi, *The Effortless Experience* — on why reducing customer effort (clear channels, clear expectations) matters more than heroic individual responses
- Atlassian, ITSM and service desk guidance on ticket triage and severity classification: https://www.atlassian.com/itsm/service-desk
- AXELOS, ITIL Foundation guidance on service level definitions — the formal ancestor of the response/resolution distinction used in solo support operations: https://www.axelos.com/certifications/itil-service-management
