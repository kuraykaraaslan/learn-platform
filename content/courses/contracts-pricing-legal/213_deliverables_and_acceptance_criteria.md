# 213. Deliverables and Acceptance Criteria

## What It Is
"The admin panel works well" is not a deliverable — it's an opinion waiting to happen. A deliverable is a concrete output with a name, a format, a purpose, and criteria specific enough that both sides can independently check whether it's done: a staging link, a repository, a document, a demo recording. Acceptance criteria are what turn "done" from a feeling into a fact. Without them, "done" is decided by whoever is more persistent in the disagreement, and that is rarely a position a freelancer wants to be in.

Good acceptance criteria are observable, not aesthetic. "The design is modern" cannot be tested by anyone; "the layout adapts to the desktop and mobile widths defined in scope" can be. The discipline is to describe a specific user-visible behavior — logging in, creating a record, completing a checkout in test mode — rather than a subjective quality judgment. This same discipline produces the single most useful classification tool in client work: the difference between a blocking issue (something that prevents the deliverable from meeting its written acceptance criteria — login doesn't work, checkout can't complete) and a non-blocking issue (a new report not in scope, a preference for a different animation, a request to support a browser that was never listed). Blocking issues must be fixed before a milestone is accepted; non-blocking issues get triaged as revisions, change requests, or future-phase items.

Every deliverable also needs a feedback window — a stated number of business days for the client to respond with consolidated written feedback — paired with a silence rule: no blocking issue reported inside that window may be treated as acceptance for scheduling and payment purposes. Stating this before the project starts, not after a client goes quiet for three weeks, is what makes it usable. As with every clause in this course, the specific enforceability of a silence-based acceptance clause depends on your jurisdiction and contract type — treat the language here as a starting point for a document your lawyer signs off on, not a finished legal instrument.

## Key Concepts
- **Deliverable definition**: name, purpose, format, included items, acceptance criteria, review method, and feedback window — all seven, every time.
- **Observable acceptance criteria**: testable user-visible behavior ("user can create a product and see it in the list") instead of subjective quality claims ("the design is modern," "the site is fast").
- **Blocking vs. non-blocking issues**: a blocking issue prevents the deliverable from meeting its own written acceptance criteria; a non-blocking issue is cosmetic, preference-based, or simply new — the classification decides whether it must be fixed before payment or routed elsewhere.
- **Feedback window + silence rule**: a stated number of business days for consolidated written feedback, with an explicit statement of what happens if no blocking issue is reported in that window.
- **Final acceptance bundle**: all scoped deliverables submitted, blocking bugs fixed, handover material received, and final invoice paid or scheduled, together, not any one of these alone.

## Example Code
```template
### Deliverable: Admin Product Management

**Purpose:** Let staff manage the product catalog without engineering support.
**Format:** Staging URL + demo walkthrough video.
**Included:**
- Product list (search, pagination), create/edit/archive product forms
**Acceptance criteria:**
- Admin user can log in, create a product, edit a product, archive a
  product, and see the change reflected in the product list.
- Layout adapts correctly to the desktop and mobile widths defined in scope.
**Review method:** Client reviews via staging link, sends one consolidated
written feedback list.
**Feedback window:** 3 business days.

### Blocking vs. Non-Blocking Examples
| Reported issue | Classification |
|---|---|
| "Product form doesn't save" | Blocking |
| "Can we add a bulk CSV export?" | Non-blocking — change request |
| "Checkout fails on test card" | Blocking |
| "Can the button be a different shade of blue?" | Non-blocking — revision |
```

## When to Use
- When defining what "done" means for any milestone before work on it begins.
- Whenever a client feedback message arrives and needs to be triaged before you respond.
- Before final delivery, to confirm the full acceptance bundle is actually complete.

## Common Mistakes
- **The deliverable for Milestone 2 reads "the app will work great," with nothing testable behind it** — Writing deliverables as vague outcomes ("the app will work great") instead of testable, inspectable outputs.
- **A request for a different shade of blue and a report that checkout is broken land in the same inbox and get the same priority** — Treating every piece of feedback as equally urgent instead of classifying it as blocking or non-blocking first.
- **Milestone 2 has been sitting "pending client review" for two months, with no stated deadline that would ever close it** — Never stating a feedback window, so milestones stay technically "pending" for months with no consequence.
- Releasing final source code or production access before the full acceptance bundle — including payment — is actually complete.

## Further Reading
- Karl Wiegers, *Software Requirements* — the classic reference on writing testable, verifiable requirements.
- Mike Cohn, *User Stories Applied* — on writing acceptance criteria that both technical and non-technical stakeholders can verify.
- Alistair Cockburn's writing on "definition of done" in agile software delivery.
