# 317. Invoicing and Payment Tracking Systems

## What It Is
> This lesson is general education, not legal or accounting advice. Invoice numbering rules, required fields, and tax treatment vary by jurisdiction — confirm specifics with your own accountant.

An invoice is not a formality you send after the fact — it's a delivery control mechanism. When invoicing is treated as an administrative afterthought, freelancers lose money in entirely predictable ways: milestones get delivered without a corresponding invoice going out, invoices get sent but never followed up when they go unpaid, and "the client said they'd pay soon" quietly becomes a permanent unresolved balance because nobody wrote down when "soon" was supposed to be.

The fix is treating every invoice as a tracked object with a lifecycle, the same way you'd track a bug or a ticket. Each invoice needs a number, a status that changes over time (draft → issued → sent → paid, with partially_paid and overdue as real states, not exceptions), a due date, and a next action if that due date passes. This turns "did the client pay?" from a question you have to reconstruct from memory or chat history into a fact you can look up in five seconds.

The other half of the discipline is the follow-up cadence. A polite check-in two days before the due date, a payment confirmation request the day after, a formal reminder at day seven, and a real consequence (pausing non-critical work) at day fourteen — decided in advance, not improvised in the moment when you're already annoyed. Deciding the cadence ahead of time also removes the emotional friction of chasing a client for money, because you're just following the process rather than making an awkward judgment call every time.

## Key Concepts
- **Invoice status lifecycle**: draft → issued → sent → partially_paid / paid / overdue / cancelled / credited. Every invoice should have exactly one current status at all times.
- **Milestone-to-invoice mapping**: Every payment milestone in a contract (deposit, mid-project, final, retainer period) should map to exactly one invoice — never bundle multiple milestones into one ambiguous invoice unless intentionally agreed.
- **Follow-up cadence**: A pre-decided schedule (e.g., due date −2 days, +1 day, +7 days, +14 days) removes the need to decide, in the moment, how hard to push.
- **Confirmed vs. claimed payment**: "I sent it" is a claim; a cleared transaction in your account is a confirmation. Only confirmation changes an invoice's status to paid.
- **The handover-payment link**: Final source code, credentials, or production ownership transfer by default only happens after final payment clears — not before, regardless of how the relationship feels.
- **Invoice fields that matter**: invoice number, client, project, issue date, due date, amount, currency, payment method, related milestone, status, and payment-received date.
- **Overdue reminder tone**: Professional and factual escalates faster and preserves the relationship better than passive-aggressive or over-apologetic language.

## Example Code
A minimal invoice tracker (one row per invoice) that answers "what's outstanding right now?" in one glance:

```
| Inv# | Client   | Project        | Milestone | Issued  | Due     | Amount | Status      | Paid On |
|------|----------|----------------|-----------|---------|---------|--------|-------------|---------|
| 0041 | Acme Co  | Admin Panel    | Deposit   | May 01  | May 08  | €4,800 | paid        | May 06  |
| 0042 | Acme Co  | Admin Panel    | Milestone1| May 20  | May 27  | €4,800 | overdue     | —       |
| 0043 | Nimbus   | Retainer (Jun) | Retainer  | Jun 01  | Jun 06  | €1,500 | paid        | Jun 03  |
| 0044 | Delta SME| Audit          | Full      | Jun 10  | Jun 10  | €2,500 | sent        | —       |
```

Overdue reminder, sent the day the cadence rule fires (invoice 0042, due date +1 day):

```
Subject: Following up — invoice 0042

Hi [Name],

Following up on invoice 0042 for the Admin Panel milestone 1, due May 27.
Could you confirm the expected payment date? Once this clears I'll continue
with the next milestone as scheduled.
```

If it reaches day +14 with no resolution, the pre-agreed consequence fires automatically, not as a fresh decision: "As noted in our payment terms, work on the next milestone pauses until the overdue balance is resolved."

## When to Use
- Immediately when any deliverable or milestone is completed — issue the invoice the same day, not "when you get a chance."
- Weekly, as part of a standing review, to check every open invoice against its due date and cadence stage.
- Before any final handover, deployment, or credential transfer — confirm the corresponding invoice shows paid, not sent.
- When a client proposes an unusual payment structure (e.g., "pay you after our own client pays us") — this is the moment to require standard terms in writing, not after work has started.

## Common Mistakes
- Letting an invoice exist only as a mention in a chat thread instead of a recorded, numbered document with a status.
- Accepting "I'll pay soon" without pinning it to a specific date and writing that date down as the new follow-up trigger.
- Delivering final files, source access, or production credentials before the corresponding invoice is confirmed paid.
- Bundling several unrelated milestones or projects into one invoice, which makes partial payments and disputes impossible to track cleanly.

## Further Reading
- Stripe's guide to invoicing and payment terms for freelancers and small businesses (stripe.com/resources) — practical, vendor-neutral coverage of milestone billing and payment terms.
- *Company of One* — Paul Jarvis: makes the case for tight, boring, repeatable financial administration as a competitive advantage for solo businesses, not a chore to minimize.
