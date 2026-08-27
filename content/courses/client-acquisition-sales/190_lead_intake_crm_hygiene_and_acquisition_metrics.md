# 190. Lead Intake, CRM Hygiene & Acquisition Metrics

## What It Is
The first reply to any inbound message is part of the sale, not a formality before it. The formula is fixed: acknowledge the message, state that you understand it at a high level, ask five to eight targeted questions (or send an intake form), and explain what happens after the answers come back. What that first reply must never do is quote a price, and it must never cross the free-consulting boundary — a safe answer describes categories of work in general terms ("this likely needs authentication, admin workflows, and deployment"), while an unsafe one hands over a full schema, stack decision, or step-by-step implementation plan before anyone has committed to anything. The exact wording flexes slightly by source — a LinkedIn inquiry, a referral, a vague "can you build this," and a message with an obvious low-budget signal each get a slightly different opening line — but the underlying structure never changes.

Every reply that isn't a clean disqualification needs somewhere to land, which is what a lightweight CRM is for even at a company of one. The part of that system genuinely worth separate attention beyond basic pipeline stages is the source taxonomy: a controlled, consistent list of values (`linkedin_post`, `referral`, `website_form`, `github`, `past_client`, and similar) rather than free-text notes, because a monthly source-quality review is only possible if the same source is spelled the same way every time it's logged. That taxonomy feeds a hygiene cadence that runs on two clocks. Weekly: review every open lead, update statuses, add any missing follow-up date, close dead leads, and identify the best source of the week. Monthly: review source quality, close rate by channel, and the recurring reasons leads get disqualified, then adjust the CTA or intake form if a pattern shows up.

The metrics layered on top of that hygiene exist to answer one question — which channels create qualified leads that turn into paid work, not just which channels create activity. Likes, profile views, and impressions are not leads, and treating them as a success metric is the single fastest way to keep funding a channel that produces nothing real. The weekly numbers that matter are new leads, qualified leads, discovery calls booked, and follow-ups actually sent; the monthly numbers are source quality, proposal-to-close rate, and average project value. When something in the pipeline stalls, the fix is diagnostic rather than a full rebuild: low lead volume means increase outbound or referral asks; low lead quality means tighten the ICP filter rather than loosen it; calls that don't turn into proposals point at qualification, not marketing; proposals that don't close point at pricing clarity and decision-maker involvement, not lead generation at all.

## Key Concepts
- **First-response formula**: acknowledge → high-level understanding → 5-8 targeted questions or an intake form → explain what happens next — never a price in this message.
- **The free-consulting boundary**: describe categories of needed work in general terms; never hand over a full schema, stack choice, or implementation roadmap before qualification.
- **Channel-specific opening lines** for LinkedIn inquiries, referrals, vague "can you build this" messages, and visible low-budget signals — same structure, different first sentence.
- **Controlled source taxonomy**: a fixed vocabulary of source values, because monthly source-quality review is only meaningful when the same source is logged the same way every time.
- **Two-clock hygiene cadence**: weekly (statuses, follow-up dates, dead-lead cleanup) vs. monthly (source quality, close rate by channel, disqualification patterns).
- **Weekly vs. monthly metrics**: new/qualified leads and calls booked weekly; source quality, proposal-to-close rate, and average project value monthly.
- **Vanity-metric trap**: likes, views, and impressions are not leads — reply rate and qualified-lead count are what actually predict revenue.
- **Diagnostic action rules**: low volume → more outbound/referral asks; low quality → tighter ICP, never looser; stalled calls → fix qualification; stalled proposals → fix pricing clarity and decision-maker involvement.

## Example Code

**First-response template (fill per channel):**

```markdown
Thanks for reaching out. I can help you evaluate this properly, but I don't want to
guess from a short description.

Could you share a bit more on:
1. <business problem question>
2. <who will use it>
3. <must-have features for v1>
4. <existing system, if any>
5. <target timeline>
6. <budget range, if allocated>
7. <who approves the project>

After that, I can suggest whether the right next step is a short intro call, a paid
discovery/audit, or a rough scope review.
```

**Weekly acquisition review:**

```markdown
## Weekly Review — <date>

New leads:              
Qualified leads:        
Best source this week:  
Follow-ups overdue:     
Dead leads closed:      
One change for next week:
```

## When to Use
- Replying to any new inbound message before a discovery call is even on the table.
- Setting up, or auditing, a CRM/spreadsheet's source field and pipeline statuses.
- Every Friday, reviewing the week's leads, follow-ups, and best-performing source.
- When a specific pipeline stage (leads, calls, proposals) has stalled and the cause is unclear.

## Common Mistakes
- Quoting a price or handing over a full architecture plan in the first reply to look competent or responsive.
- Leaving a lead in "contacted" status with no follow-up date, so it's either forgotten or messaged twice.
- Treating likes, profile visits, or impressions as evidence a channel is working.
- Rebuilding the entire acquisition strategy after one bad week instead of running the diagnostic table.
- Loosening the ICP filter to fix low lead quality instead of tightening it further.

## Further Reading
- *The E-Myth Revisited* — Michael Gerber: building systems into a one-person business so intake and follow-up survive busy weeks.
- *The Effective Executive* — Peter Drucker: measuring what is actually productive rather than what merely feels busy.
- *Traction* — Gabriel Weinberg & Justin Mares: channel measurement discipline directly applicable to a monthly source-quality review.
