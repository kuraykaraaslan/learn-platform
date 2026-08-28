# 342. Managing Account Health: Green, Yellow, Red

## What It Is
> This lesson is general education, not financial or tax advice. Refund, credit, and termination decisions should also be checked against your written contract terms before being offered.

Account health is a simple three-state classification — green, yellow, red — that tells you whether an existing client relationship is safe to grow, needs attention, or needs recovery before anything else happens. Green means the client is responsive, payments are current, there are no unresolved issues, and sentiment is positive or neutral. Yellow means something has slipped: slow responses over 72 hours, a mild complaint, an unresolved scope question, a slightly late payment, or reduced engagement. Red means the relationship is in active trouble: no response in over a week, a formal complaint, an overdue payment, negative sentiment, or an outright dispute. The value of naming these states explicitly is that it removes guesswork about what you're allowed to do next with the account.

The governing rule is that expansion is blocked on yellow or red. No upsell emails, no retainer proposals, no referral asks, no roadmap reviews — until health is restored to green. This isn't just politeness; pitching an unhappy or disengaged client damages trust faster than staying silent does, and it wastes effort on an account that isn't ready to buy anything. Recovery instead follows a defined path: diagnose what changed, reach out directly and without over-engineering the message, listen first without defending your work, resolve the specific issue with clear next steps, and confirm recovery in writing before touching the health status again.

Structured check-ins at 30, 60, and 90 days after delivery double as the mechanism for catching health changes early, since silence is not the same as satisfaction. A 30-day call surfaces early friction while it's cheap to fix; a 60-day call tests whether adoption is deepening and, only if health is green, opens the door to a low-pressure expansion conversation; a 90-day call closes the initial engagement cycle and is the natural point to discuss a retainer or make a referral ask. Skipping these calls and waiting for the client to raise problems unprompted is how yellow accounts quietly become red ones.

## Key Concepts
- **Health status definitions**: Green (responsive, current, no unresolved issues, positive/neutral sentiment); Yellow (slow responses >72h, mild complaint, unresolved scope question, slightly late payment, reduced engagement); Red (no response >7 days, formal complaint, overdue payment, negative sentiment, escalation or dispute).
- **Expansion-blocked rule**: no upsell, retainer proposal, referral ask, or roadmap review is permitted while an account is yellow or red — recovery comes first, unconditionally.
- **Yellow recovery process**: diagnose the likely cause within 48 hours, send a direct non-defensive outreach message, listen fully on the call before explaining anything, resolve with a specific committed action, then confirm the agreement in writing and hold status at "yellow-recovering" until the client confirms.
- **Red recovery process**: assess severity (high/medium/low) within 24 hours, contact directly with a factual and non-defensive message, choose a recovery option (no-charge fix, partial refund, scope reduction, clean termination, or mediated resolution) matched to severity, and document every communication in writing.
- **Signals of a recovering account**: normal response times return, tone is positive or neutral, payment is current, no open complaints exist, and at least one successful interaction has happened since resolution — all five must be present before moving back to green.
- **Structured review cadence**: 30-day calls catch early friction, 60-day calls test adoption and open expansion only if health is green, 90-day calls close the cycle and are the natural point for a retainer or referral conversation.

## Example Code
A worked account health log tracking a client through a yellow-to-green recovery cycle:

```md
## Account Health Log — Client D (Retail Ops Platform)

Week 1: Status GREEN. Payment on time, quick replies, no issues.
Week 5: Status YELLOW. Cause: two messages went unanswered for 5
  days; last reply mentioned "we're slammed with a product launch."

Diagnosis: Not dissatisfaction — client-side bandwidth problem.
Action (within 48h): Sent direct check-in:
  "Noticed it's been quiet — wanted to make sure everything's still
   working well. Anything that needs attention on my side?"
Client response: "All good, just buried. The reporting export has
  been a bit slow though."
Resolution offered: Investigate export performance, fix within 5
  business days, confirm with a short before/after note.
Written confirmation sent: "To confirm — I'll have the export
  performance issue resolved by [date] and will follow up to verify."

Week 6: Export fix delivered on schedule. Client replied same-day
  with thanks. Payment received on time.
Signals check: response time normal (yes), tone positive (yes),
  payment current (yes), no open complaints (yes), one successful
  interaction since resolution (yes) -> ALL FIVE MET.

Status updated: GREEN.
Expansion note: Client mentioned wanting better reporting during
  the fix conversation — logged as an expansion signal for the
  next 60-day review, not acted on immediately.
```
No expansion conversation happened until every recovery signal was independently confirmed — the reporting comment was logged for later, not pitched in the moment.

## When to Use
- Continuously, as a standing label on every active client account, updated after every meaningful interaction — not just during scheduled reviews.
- Before sending any upsell, retainer, or referral message, as a hard gate: check status first.
- Immediately when a client goes quiet, misses a payment date, or sends a message with a negative or frustrated tone.
- During every 30/60/90-day account review, as one of the standing checklist items to update before closing the call.

## Common Mistakes
- Treating a quiet, unresponsive client as green by default — silence is not satisfaction and should trigger a status check, not an assumption.
- **The account has been yellow for two weeks, and a retainer proposal goes out anyway because "things seem fine otherwise"** — Pitching an upsell or retainer to a yellow account because the relationship "seems fine otherwise," which reads as tone-deaf and can push yellow to red.
- **One friendly reply comes in after a rocky patch, and the account gets marked green the same day** — Moving status back to green immediately after a single positive reply, before all five recovery signals are actually present.
- **A client raises a complaint, and the first thing said back is a full explanation of why the work was actually done correctly** — Defending the quality of the work before listening fully to what the client experienced, which shuts down the information needed to actually resolve the issue.

## Further Reading
- *The Trusted Advisor* — David Maister, Charles Green, and Robert Galford: on building the kind of credibility and trust that keeps accounts in green territory in the first place.
- *Never Lose a Customer Again* — Joey Coleman: a structured approach to the early client relationship stages where most yellow-status drift actually begins.
