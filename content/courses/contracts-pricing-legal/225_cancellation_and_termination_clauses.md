# 225. Cancellation and Termination Clauses

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — knowing what a clause is for and where the risk sits, not carrying responsibility for drafting or judging one. What actually holds differs by jurisdiction: TR, US, UK, UAE, EU and JP do not treat IP transfer, contractor classification, consumer protection or liability limits the same way, so have anything you sign reviewed where you and your client actually operate.

Not every project finishes the way it started, and the projects that end badly are exactly the ones where nobody wrote down what "ending badly" actually means in advance. Termination clauses aren't a pessimistic addition to a contract — they're the part of the document that protects both sides precisely when goodwill is running lowest and clear terms matter most. Without one, a canceled project turns into an argument about what's owed, whether a deposit is refundable, and whether source code gets released despite an unpaid invoice, decided in the moment, under stress, with neither side's interests well served.

A complete termination section separates several scenarios that feel similar in the heat of the moment but have different fair outcomes: the client canceling after work has started (completed and in-progress work generally remains payable; deposits are typically non-refundable), the freelancer pausing work when required client inputs are missing (with the timeline shifting on resumption rather than staying fixed), and non-payment (which can justify suspending work and withholding delivery, production release, and source transfer after written notice). Mutual termination — both sides agreeing the engagement isn't working — is the cleanest outcome and deserves its own short, calm script: settle completed work, unpaid invoices, access removal, and confidentiality obligations in writing, and move on.

The same structure applies in reverse when a freelancer is the one hiring — a subcontractor relationship needs the same clarity, split into mutual agreement, termination for convenience (either side ends it without needing a reason, paying only for accepted work, with access revoked same-day), and termination for cause (a material breach, documented in writing, that can justify immediate termination and withholding payment for undelivered work). None of the specific consequences described here — what's refundable, what "for cause" actually permits, how enforceable a reactivation fee is — are guaranteed to hold up in every jurisdiction or every court; this is the shape a termination clause should have, and the actual wording deserves a lawyer's review, especially for higher-value engagements.

```quiz
- q: "A project pauses six weeks because approvals never arrived. On resumption, what happens to the delivery date?"
  anchor: "with the timeline resetting rather than staying fixed upon resumption"
  options:
    - text: "It holds — the original date was committed"
      correct: false
      why: "The timeline resets on resumption rather than staying fixed."
    - text: "It resets — a pause moves the timeline"
      correct: true
      why: "And a pause beyond a stated period may need re-planning, an updated timeline, or a reactivation fee."
    - text: "It slips by exactly six weeks"
      correct: false
      why: "Resuming is not the reverse of pausing: re-planning may be needed, and your own calendar has moved on."

- q: "A client ends the engagement and gives no reason. Which termination type, and what is payable?"
  anchor: "for convenience (either side ends without needing a reason, pays for accepted work only)"
  options:
    - text: "For cause — ending without a reason is itself a breach"
      correct: false
      why: "For cause requires a documented material breach. Giving no reason is not one."
    - text: "For convenience — accepted work only is payable"
      correct: true
      why: "Mutual agreement is the cleanest type; for cause needs a documented material breach."
    - text: "Mutual agreement, since neither side is disputing it"
      correct: false
      why: "Mutual agreement means both sides agreed to end it, not that one side did not object."

- q: "An invoice is overdue. What does the clause allow, and what has to come first?"
  anchor: "overdue payment after written notice can justify suspending or terminating work and withholding delivery, production release, or source transfer"
  options:
    - text: "Immediate suspension — overdue is overdue"
      correct: false
      why: "Written notice comes first. The clause turns on payment overdue *after* that notice."
    - text: "After written notice: suspend or terminate, and withhold delivery, production release or source transfer"
      correct: true
      why: "The notice is what makes withholding defensible rather than retaliatory."
    - text: "Withholding source code only, since delivery already happened"
      correct: false
      why: "Delivery, production release and source transfer are all listed."
```

## Key Concepts
- **Cancellation clause**: work completed, reserved time, and approved milestones remain payable if a client cancels after work starts; deposits are typically non-refundable unless otherwise agreed.
- **Pause clause**: missing client inputs, approvals, access, or payments justify pausing work, with the timeline resetting rather than staying fixed upon resumption.
- **Non-payment termination**: overdue payment after written notice can justify suspending or terminating work and withholding delivery, production release, or source transfer.
- **Termination types (hiring direction)**: mutual agreement (cleanest), for convenience (either side ends without needing a reason, pays for accepted work only), and for cause (documented material breach, can justify immediate termination and withheld payment for undelivered work).
- **Reactivation rule**: a project paused beyond a stated period may require re-planning, an updated timeline, or a reactivation fee rather than resuming automatically on the old terms.

## Example Code
```markdown
## Cancellation and Termination (illustrative)

If Client cancels after work has started, payment for completed work,
reserved time, and approved milestones remains due. Deposits are
non-refundable unless otherwise agreed in writing.

If required client inputs, approvals, access, or payments are delayed,
Contractor may pause work. Timeline and availability may change upon
resumption.

If payment remains overdue after written notice, Contractor may suspend
or terminate work and withhold delivery, production release, and source
transfer until outstanding amounts are resolved.

Either party may propose mutual termination if continuing is not
practical. In that case, completed work, unpaid invoices, access removal,
and confidentiality obligations will be settled in writing.

Projects paused for more than [30] days may require re-planning, an
updated timeline, and a reactivation fee before work resumes.
```

## When to Use
- In every contract, before either side needs it — never introduced for the first time mid-dispute.
- When a project has gone quiet and a decision is needed about pausing, reactivating, or formally ending it.
- When hiring a subcontractor, to define your own termination-for-convenience and termination-for-cause terms toward them.

## Common Mistakes
- **The client cancels three weeks in, and a full refund gets promised on the spot, work already done included** — Promising a full refund after work has already started, removing any protection for time already invested.
- **The invoice has been overdue for six weeks, and work continues anyway rather than pausing per the contract** — Continuing unpaid work indefinitely rather than invoking the pause or termination clause once payment is genuinely overdue.
- **A project paused for four months resumes on the exact same timeline and price quoted a year ago** — Resuming a long-paused project on the original timeline and price as if nothing had changed.
- **The termination notice reads like an angry email instead of the calm, factual language the contract actually called for** — Using threatening or aggressive language in a termination notice instead of calm, pre-agreed, factual language.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — on ending client relationships professionally when they aren't working.
- The American Bar Association's public guides on contract termination clauses as a general orientation.
- The Freelancers Union's resources on cancellation policies and non-payment recourse for independent contractors.

```recall
- q: "What stays payable if a client cancels after work starts?"
  must:
    - "work completed, reserved time, and approved milestones"
    - "deposits are typically non-refundable unless otherwise agreed"

- q: "What justifies pausing work?"
  must:
    - "missing client inputs, approvals, access, or payments"

- q: "State the reactivation rule."
  must:
    - "a project paused beyond a stated period may require re-planning, an updated timeline, or a reactivation fee"
    - "rather than resuming automatically on the old terms"
```
