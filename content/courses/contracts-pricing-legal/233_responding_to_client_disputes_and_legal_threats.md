# 233. Responding to Client Disputes and Legal Threats

## What It Is
Every other lesson in this course is about preventing disputes — clear scope, written acceptance, bounded revisions, a change-request process. This one is about what happens when prevention didn't fully work and a client sends a message that changes register: a refund demand, "I'll take this to my lawyer," a threat to post publicly, or a flat claim that the software doesn't work. The instinct in that moment is almost always wrong — reply immediately, over-explain, apologize broadly to de-escalate, or offer money back to make the discomfort stop. Each of those moves trades a short-term feeling of resolution for a materially weaker position if the dispute continues.

The first useful move is to do nothing publicly for a few hours: document every message and screenshot to a location outside the regular inbox, delete nothing (even messages that look bad — deletion during a dispute reads worse than the original message), and pause informal channels so nothing further gets said over a call or a voice note that can't be produced later as a clear record. Then classify what's actually being disputed, because the right response differs by type. A scope dispute ("you didn't deliver what we agreed") gets resolved by pulling the signed SOW and deliverables list and comparing it to what was actually shipped. A quality dispute ("it doesn't work") gets resolved by demanding specific, reproducible reports rather than accepting "nothing works," then checking any confirmed bug against the warranty/support boundary already defined in the contract. A refund demand gets checked against the contract's actual refund terms — most professional agreements have none for delivered, accepted work — and is never granted reflexively under pressure, since an immediate refund reads as an admission that something was wrong even when nothing was. A legal threat gets a calm, brief written acknowledgment and a pause on substantive response until it's been reviewed by a lawyer, because self-representing in writing against a lawyer's letter routinely makes things worse.

What actually wins a dispute is decided months earlier, not during the dispute itself: a signed contract with clear scope and payment terms, written milestone acceptance ("proceed to next phase" in an email counts), evidence of delivery (commit history, deploy logs, demo recordings), a paper trail of change requests that were priced, declined, or approved, and communication records showing feedback was addressed. Whoever has these wins regardless of what actually happened during the project; whoever doesn't is arguing from a weak position no matter how justified their side actually is. None of the specific consequences here — what a refund clause actually forces, whether a given liability cap holds up, what a "legal threat" actually exposes you to — are the same across jurisdictions, and this lesson is not a substitute for engaging a lawyer once a dispute crosses from annoying to actually consequential; it describes the operating discipline that keeps you in a defensible position until that point.

## Key Concepts
- **The first-hours discipline**: don't respond immediately, document everything outside the normal inbox, delete nothing, and move all further substantive communication to a written channel before saying anything else.
- **Dispute classification**: scope dispute, quality dispute, refund demand, legal threat, and public/reputational threat each call for a different specific response — treating all disputes the same way wastes the leverage a correct classification provides.
- **Non-admission language**: acknowledging a client's frustration ("I understand this is frustrating") without conceding fault in writing ("we failed to deliver X") — the distinction matters if the dispute escalates and the message becomes evidence.
- **What actually wins disputes**: a signed contract, written milestone acceptance, delivery evidence, a change-request paper trail, and communication records — built during the project, not assembled after a dispute starts.
- **Communication channel discipline**: keep substantive exchange in writing (email); treat unrecorded voice/video calls as risk, not resolution, during an active dispute.
- **Escalation ladder**: direct negotiation first, then a neutral third-party mediation step, then formal arbitration or court only as a last resort — with a lawyer engaged before any step that involves a formal legal letter, a high-value claim, or a threat that goes beyond a civil disagreement.

## Example Code
```markdown
## Dispute Response Log (illustrative)

**Date opened:** [date]
**Classification:** Scope / Quality / Refund demand / Legal threat / Public threat
**Client claim (verbatim):** [quote the actual message]

**Evidence pulled:**
- [ ] Signed SOW / contract
- [ ] Written milestone acceptances
- [ ] Delivery evidence (commits, deploy logs, demo recordings)
- [ ] Change request records (approved / declined / priced)
- [ ] Relevant communication thread

**Response draft (reviewed before sending):**
[factual, non-emotional, no unscoped admissions of fault]

**Escalation status:** Direct negotiation / Mediation / Lawyer engaged / Formal proceeding

---

## Response Scripts (illustrative)

**Refund demand for delivered, accepted work:**
"I've reviewed the signed scope and the milestone approvals on this
project. The work in question was delivered and approved on [date], so
I'm not able to offer a refund for it. I'm glad to look into [specific
issue] if there's a reproducible problem within the warranty terms."

**Legal threat / lawyer letter received:**
"Thank you for your message. I'm reviewing this with counsel and will
respond in writing within [X] business days."

**Public / social threat:**
[Do not respond in the same channel in the moment. Prepare one factual,
non-emotional written statement, reviewed before posting, if a public
response is warranted at all.]
```

## When to Use
- The moment a client's message shifts from a complaint into a refund demand, a legal threat, or a public escalation threat.
- Before responding to any "this doesn't work" claim, to classify it correctly instead of reacting to its tone.
- When deciding whether a situation has crossed the line from "handle it yourself" to "get a lawyer involved before writing anything else."
- After any dispute closes, to review whether it exposed a gap in your contract template, acceptance process, or documentation habits.

## Common Mistakes
- Responding within minutes, in an emotional register, before reviewing the contract and gathering evidence.
- Apologizing in a way that admits fault ("we failed to deliver X") instead of acknowledging frustration without conceding the underlying claim.
- Issuing a refund or discount immediately under pressure, which reads as an admission and invites the same pressure on the next disagreement.
- Continuing a dispute over voice calls or informal chat instead of moving it to a written channel that produces a record.

## Further Reading
- Roger Fisher and William Ury, *Getting to Yes* — the negotiation framework this lesson's de-escalation and classification approach draws from.
- The New York Convention's arbitration-enforcement model, as one widely-used illustration of why an arbitration clause is often easier to enforce across borders than a domestic court judgment — check applicability with local counsel.
- Your own jurisdiction's small-claims or commercial-mediation process (many jurisdictions require or favor mediation before litigation for commercial disputes) — worth knowing before a dispute happens, not during one.
