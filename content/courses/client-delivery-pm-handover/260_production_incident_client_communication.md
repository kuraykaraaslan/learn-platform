# 260. Production Incident Client Communication

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Customer_Success_and_Support_Rules/production-incident-client-communication.md and incident-and-escalation.md material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
The core fact that shapes every incident message is this: the client doesn't need a technical explanation in the first message, they need to know that you know, you're on it, and you'll update them. Panic-driven over-explanation — trying to describe root cause before it's even confirmed — is the most common communication mistake during an incident, and it's driven by the developer's own anxiety more than the client's actual need. The right posture is the opposite: say less, act faster, update predictably. A short, calm first message sent within minutes does more for confidence than a longer, more technical one sent later.

Severity classification sets the rhythm for everything that follows. A P0 (full outage, payment down, data at risk) needs acknowledgment within 15 minutes and an update every 30; a P1 (major feature broken for many users) needs acknowledgment within an hour; P2 and P3 scale down from there. The update cadence matters even when there's no real news — sending a status update at the T+15 to T+30 mark "regardless of progress" exists specifically because silence during an unresolved incident is the worst signal a client can receive, worse than an honest "still investigating."

Specific scenarios call for specific calibration. A bad deployment gets rolled back with a factual description, saved apologies for the postmortem rather than the first message. A third-party outage gets described factually, without over-blaming a provider before confirming the incident on their status page. Client-caused issues get investigated with careful, non-accusatory questions first, and only stated factually once confirmed — never as blame. And there's a fixed list of phrases that never belong in incident communication regardless of scenario: "this has never happened before," "it should be working," "I guarantee this won't happen again" — each one either sounds defensive, gets contradicted by facts you don't have yet, or promises something no one can actually promise.

## Key Concepts
- **The client needs three things immediately, not a diagnosis**: you know, you're on it, and you'll update them — technical explanation belongs later, in the postmortem
- **Severity sets response timing, not urgency of feeling**: P0 (15 min ack, 30 min updates), P1 (1 hour ack), P2 (same business day), P3 (48 hours) — these are fixed targets, not vibes
- **Send an update even with no progress**: the T+15 to T+30 status update happens regardless of whether anything has actually changed, because silence during an incident reads worse than "still investigating"
- **Save accountability language for the postmortem, not the first message**: "I'm rolling back to the previous version now" beats "I'm sorry, this was my fault" in the moment — one clear acknowledgment belongs later, in the full incident note
- **Scenario-specific calibration matters**: a third-party outage is described factually with the provider's status page cited; a client-caused issue is investigated with neutral questions before any factual (never blaming) statement is made
- **A fixed list of forbidden phrases**: "this has never happened before," "it should be working," "this is fully fixed" (before verification), and "I guarantee this won't happen again" — each undermines credibility or promises something unverifiable
- **Never use personal or informal channels for incident updates**: the agreed professional support channel is used every time, even under pressure, and a documented attempt to reach an unresponsive client during a P0 protects both sides

## Example Code
```text
T+0 — First acknowledgement (within 15 min of detection)

I've detected a production issue affecting order status updates.

I'm investigating now. First update in 30 minutes or sooner if resolved.

I'll let you know what to avoid in the meantime.
```

```text
T+20 — Status update

Status update — 14:50

What's confirmed: Order status changes are not saving for some users.
Order creation and browsing work normally.

What I'm doing: Checking recent deployment logs and the database
connection pool — this started shortly after the 14:15 deploy.

What to avoid: Please ask staff to hold off retrying status changes
multiple times until I confirm the cause.

Next update: I'll update you when the rollback is complete, approximately
15 minutes.
```

```text
Resolved — 15:20

The issue has been fixed and verified. Here is the summary:

What happened: A deployment at 14:15 introduced a database connection
configuration error.
Who was affected: Users attempting to change order status between 14:15
and 15:10.
Duration: 55 minutes.
How it was fixed: Rolled back to the previous deployment; connection
issue confirmed resolved.
Data impact: None — no status changes were lost, they simply failed to
save and can be retried now.

Your team can resume normal operations.

I'm preparing a full incident note and will send it within 24 hours. It
will include what caused this and what I'm changing to prevent recurrence.
```

## When to Use
- The moment a production issue is detected or reported, before root cause is understood — acknowledgment does not wait for diagnosis
- On the fixed severity-based cadence for the duration of any unresolved incident, including updates that only say "still investigating"
- Whenever the cause might involve the client's own actions, as the trigger to ask neutral diagnostic questions first rather than assuming or accusing
- Immediately after resolution, to send the short stability-confirmation message that bridges to the full postmortem

## Common Mistakes
- Over-explaining technical root cause in the very first message, before it's even confirmed, out of a need to seem in control
- Going silent during an unresolved incident because there's genuinely no update yet, instead of sending a "still investigating" message on schedule
- Saying "this is fully fixed" before actual verification, then having to walk it back if the fix doesn't hold
- Using a personal chat account or informal channel to send incident updates instead of the agreed professional support channel

## Further Reading
- Google SRE Book, "Managing Incidents" — the operational foundation for severity-based response timing and communication rhythm: https://sre.google/sre-book/managing-incidents/
- PagerDuty, "Incident Response Documentation" — practical scripts and escalation structure for client- and stakeholder-facing incident communication: https://response.pagerduty.com/
- Michael Nygard, *Release It!: Design and Deploy Production-Ready Software* — on designing systems and communication for the incidents that will inevitably happen
