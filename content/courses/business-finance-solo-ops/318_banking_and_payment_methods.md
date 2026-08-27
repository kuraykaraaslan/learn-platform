# 318. Banking, Payment Methods, and Currency Reconciliation

## What It Is
> This lesson is general education, not accounting advice. Currency conversion treatment, fee deductibility, and required reconciliation records vary by jurisdiction — confirm specifics with your own accountant.

Every payment method you accept — bank transfer, Wise, Payoneer, Stripe, PayPal — has a different fee structure, settlement speed, currency behavior, and paper trail. A freelancer who accepts "whatever's convenient for the client" without standardizing on a small set of methods ends up reconciling five different systems, each with its own fee deduction and exchange-rate quirk, and eventually loses track of which invoice a given incoming transfer actually corresponds to.

The fix is to pick a small number of supported payment methods, document exactly how each one works (currency, fees, settlement time, what instructions the client needs), and require every incoming payment to be matched against an invoice before it's marked paid — not assumed paid because the client said they sent it. For cross-border work this matters even more: a €4,800 invoice might arrive as €4,762 after wire fees, or convert to a different local-currency amount depending on the exchange rate on the day it lands versus the day it was invoiced. If you don't record which rate applied and when, your own books stop matching what your accountant sees in the bank statement.

The discipline here isn't about picking the "best" payment processor — it's about consistency and reconciliation. A client who has to guess your bank details from an old email, or who sends a transfer with no invoice reference in the memo line, creates a debugging problem for you every single time. Standardized payment instructions and disciplined reconciliation convert "did that transfer arrive, and for which invoice?" from a research task into a lookup.

## Key Concepts
- **Method-specific profile**: For each payment method you accept, document currency support, fees, typical settlement time, and what instructions the client needs to send it correctly.
- **Payment instruction template**: A standard block — invoice number, amount, currency, due date, method, recipient name, and reference note — sent with every invoice so there's no ambiguity for the client.
- **Reconciliation, not assumption**: An invoice moves to "paid" only when the money is confirmed received in your account, never because the client said "I sent it."
- **Reference discipline**: Ask every client to include the invoice number or project name in their transfer memo — this is the single easiest way to avoid "which invoice was this for?" confusion.
- **Currency exposure tracking**: For foreign-currency invoices, record the invoiced amount, the amount actually received, any fees deducted, and the exchange rate that applied — your accountant needs all four, not just the final number.
- **Fee absorption decision**: Decide upfront who absorbs wire/transfer fees (you or the client) and state it in the payment instructions, rather than discovering a shortfall when the money lands.
- **No mixing personal and business flows**: Client payments go into a business account tracked separately from personal transfers, even if you're a sole proprietor with no formal corporate structure.

## Example Code
A payment record kept alongside the invoice tracker — one entry per actual transfer received, matched to its invoice:

```
PAYMENT RECORD

Invoice no:        0042
Client:            Acme Co
Expected amount:   €4,800.00
Received amount:   €4,762.30
Currency:          EUR (client's wire), settled to TRY at day-of rate
Fees:              €37.70 (outgoing wire fee, absorbed per contract — client pays)
Date received:     2026-05-29
Payment method:    Bank transfer (SWIFT)
Reference note:    "INV-0042 Acme" — present in transfer memo, matched cleanly
Reconciled:        yes
Accounting note:   Rate on 2026-05-29 applied per accountant's FX policy;
                   flagged for quarterly review, not treated as a loss.
```

Payment instructions sent with every invoice, so the client never has to ask:

```
Payment for: Admin Panel — Milestone 1
Invoice no: 0042
Amount: €4,800.00
Due date: 2026-05-27
Payment method: Bank transfer (SWIFT) — details below
Recipient name: [Legal business/person name as registered]
Reference/note: Please include "INV-0042" in the transfer memo.
```

## When to Use
- Before sending the very first invoice to a new client — send payment instructions once, standardized, rather than improvising per client.
- Every time a payment lands in your account — reconcile it against an open invoice within the same day, while the details are fresh.
- When a client asks to pay by an unfamiliar method — evaluate it against your standard criteria (fees, settlement speed, reconciliation quality) before agreeing, rather than accepting by default.
- At month-end close, to confirm every "sent" invoice either has a matching confirmed payment or an explicit overdue status — no invoice should be in limbo.

## Common Mistakes
- Marking an invoice paid based on a screenshot or a verbal "it's on its way" instead of a confirmed transaction.
- Accepting transfers with no reference to an invoice number, then spending time later guessing which payment belongs to which client and project.
- Ignoring transfer fees and exchange-rate differences, so the amount that lands never quite matches the amount invoiced and nobody notices the drift.
- Mixing client payments with personal transfers in the same account, which makes it impossible to hand clean records to an accountant at tax time.

## Further Reading
- [Wise's guide to receiving international payments as a freelancer](https://wise.com/gb/blog) — practical detail on fees, settlement times, and multi-currency accounts for independent contractors.
- *Profit First* — Mike Michalowicz: while focused on allocation rather than banking mechanics, its account-separation model (separate accounts for tax, profit, operating expenses) pairs directly with the "don't mix flows" principle here.
