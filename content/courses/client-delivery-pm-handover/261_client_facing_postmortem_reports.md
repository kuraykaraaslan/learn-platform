# 261. Client-Facing Postmortem Reports

## What It Is
By the time an incident is resolved, the technical fire is out but a different question is now open in the client's mind: can I still trust this person to run my system? The postmortem is the document that answers that question, and it is not a punishment, not a full technical root-cause analysis with stack traces, not a defensive attempt to minimize what happened, and not an excessive apology letter. It's a professional summary written for a business audience, and a well-written one after a genuinely bad incident can strengthen a relationship — while a missing or vague one after the same incident can end it.

The delivery deadline is fixed and non-negotiable: every P0 gets a postmortem within 24 hours, every P1 within 48, sent proactively without waiting to be asked. The structure inside it is equally fixed — incident summary with precise duration and quantified scope, root cause in one or two plain sentences with no jargon, what was done to resolve it as a specific timestamped sequence, prevention measures that are concrete and dated rather than vague promises, and an honest list of any open items. "I will be more careful in the future" is not a prevention measure; "I've added disk usage monitoring with an alert at 80% capacity, completed today" is.

The tone calibration changes with who caused the incident, but the discipline underneath stays the same in every case: quantify precisely, state root cause in plain language, don't minimize duration or scope, don't over-apologize beyond one clear acknowledgment, and never include a technical detail that would need a footnote to understand — that detail belongs in the internal RCA, not the client-facing document. Even when the client's own action caused the incident, the postmortem stays factual and forward-looking rather than becoming a blame document; it states what happened, what was done, and what safeguard is being added to prevent that class of action from causing the same impact again.

## Key Concepts
- **A postmortem is not an internal RCA**: no stack traces, no log dumps, no legal admissions of liability — a professional summary aimed at a business reader
- **Fixed delivery deadlines, sent proactively**: 24 hours for P0, 48 hours for P1, never delivered only because the client asked for it
- **Five fixed sections**: incident summary (quantified), root cause (one or two plain sentences), resolution steps (timestamped), prevention measures (specific and dated), and open items (honestly stated, including "none" when true)
- **Quantify impact precisely**: "some users were affected" is not acceptable; state the real scope — all users, a percentage, a specific feature, an estimated count
- **Prevention measures must be specific and dated, not aspirational**: "added a disk usage alert at 80% threshold, completed [date]" is a prevention measure; "I will be more careful" is not
- **One acknowledgment of accountability is enough**: repeated apology reads as panic and shifts the client's attention to the relationship instead of the resolution
- **Stay factual even when the client caused it**: state what happened technically without blame, what was done, and what safeguard is being added — never write "this was caused by your team" as an accusation

## Example Code
```text
Subject: Incident Report — Order Management Admin Panel — 2026-09-20

Dear Tomas,

I'm sending this incident report following the production issue on
September 20 affecting order status updates.

INCIDENT SUMMARY
Date: 2026-09-20
Time: 14:15 – 15:10 (local time)
Duration: 55 minutes
Severity: P1

What was affected: Staff were unable to save order status changes between
14:15 and 15:10. Order creation and browsing were not affected. No status
change was partially saved — each either completed or failed cleanly and
can be retried.

Who was affected: All staff attempting to update order status during the
window — approximately 12 attempted changes.

Data impact: No data was lost or corrupted. All 12 status changes were
retried successfully after the fix.

ROOT CAUSE
A deployment at 14:15 introduced a database connection configuration
error that prevented write operations from completing.

WHAT WAS DONE TO RESOLVE IT
- 14:18 — Issue detected via error monitoring.
- 14:25 — Root cause identified as the 14:15 deployment's connection config.
- 14:35 — Rollback to previous deployment initiated.
- 15:10 — Service confirmed restored after end-to-end verification.

PREVENTION MEASURES
- Added a pre-deploy database connection health check that blocks
  deployment if it fails — completed 2026-09-21.
- Added alerting on write-operation error rate spikes — completed 2026-09-21.

OPEN ITEMS
There are no open items. All actions have been completed.

I take this incident seriously and understand the impact on your
operations. If you'd like to discuss this further, I'm available for a
call this week.

[Developer]
```

## When to Use
- Within 24 hours of resolving any P0 incident, and within 48 hours for any P1 — sent proactively, without waiting for the client to request it
- When an incident's cause traces back to a third-party provider, using the factual variant that cites the provider's own status page and states what fallback measures are being added
- When an incident was caused by the client's own action, using the neutral variant that states facts and safeguards without assigning blame
- Any time an SLA or expected response time was breached during the incident, as the required moment to acknowledge that directly and state the concrete fix

## Common Mistakes
- Sending a postmortem full of technical jargon and stack traces that a business stakeholder can't actually use to judge whether the issue is really resolved
- Writing vague prevention measures like "I will be more careful" instead of specific, dated actions already taken
- Rounding down the actual duration or user impact to make the incident look smaller than it was
- Turning a client-caused incident into a blame document instead of a factual account paired with a forward-looking safeguard

## Further Reading
- Google SRE Workbook, "Postmortem Culture: Learning from Failure" — the foundational case for blameless, specific, and proactive postmortems: https://sre.google/workbook/postmortem-culture/
- Etsy, "Debriefing Facilitation Guide" — practical guidance on writing incident reviews that build trust rather than assign blame: https://extfiles.etsy.com/DebriefingFacilitationGuide.pdf
- John Allspaw, "Blameless PostMortems and a Just Culture" — the widely cited essay establishing the norms this lesson's client-facing adaptation is built on: https://www.etsy.com/codeascraft/blameless-postmortems/
