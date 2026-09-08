# Capstone — The Proposal You Would Not Send

## Brief
> This exercise is general business education, not legal advice. It is about
> commercial readiness — whether a proposal is complete enough to send — and
> not about whether any clause would be enforceable anywhere. That question
> belongs to a qualified lawyer in the relevant jurisdiction, and nothing you
> write here should be read as an answer to it.

A colleague is about to send this proposal. They ask you to look at it first,
because the client is a good one and they do not want to lose the deal.

**The proposal, in full**

> **Project:** Customer portal rebuild for Harlow & Co.
>
> **Summary:** We will rebuild the existing customer portal with a modern
> stack, improving performance and usability. The new portal will handle
> customer accounts, orders and support tickets, and will integrate with the
> systems Harlow already uses.
>
> **Price:** £24,000 fixed, invoiced on completion.
>
> **Timeline:** 8 weeks from signature.
>
> **What's included:** Design, build, testing, deployment, and unlimited
> revisions until you're happy.
>
> **Milestones:**
> 1. Designs — week 2
> 2. Build complete — week 6
> 3. Launch — week 8
>
> **Next steps:** Sign below and we'll get started Monday.

**What your colleague also tells you, verbally**

- The existing portal is a PHP application nobody on your side has opened.
- Harlow's marketing lead, operations manager and IT contractor have all been
  in the calls; nobody has said who signs off.
- Harlow will supply product copy and brand assets "soon".
- The integration is with a system Harlow's IT contractor maintains; no one
  has seen its API.
- No deposit was discussed. Your colleague says asking now "would look
  desperate this late".

## Deliverable
A review of the proposal, written for your colleague, before it is sent.

It is done when it contains:

1. **The answer to what they asked**: would you send this? Say so in the first
   line.
2. **What you would not send it without**, ranked by what it costs if it goes
   as written. Each item names the sentence in the proposal it applies to, or
   the sentence that is missing.
3. **What has to be established before a price can be defended at all** — some
   of what is missing here is not a wording problem, and pretending otherwise
   is the more expensive mistake.
4. **What this review does not cover.** It is a commercial readiness review.
   It says nothing about whether any term would hold up, which is a different
   question for a different professional, and your colleague should know that
   before treating your notes as clearance.

## Rubric
Score yourself honestly against each row. Every one is a mistake this course
already documents, quoted from the lesson beside it — and every one of those
lessons is verified, so the rubric measures only what the corpus stands behind.

```rubric
rows:
  - lead: "The scope is still a vision statement, and a fixed price goes out anyway rather than risk losing the lead"
    lesson: 204
    looks_like: "You read \"rebuild with a modern stack, improving performance and usability\" as a description of an intention rather than of a deliverable, and connected it to the £24,000 fixed price that sits under it."
  - lead: "The quote goes out against a legacy codebase nobody's actually opened, with no risk buffer built in"
    lesson: 204
    looks_like: "You raised the unopened PHP application as a pricing problem rather than a scheduling one. A fixed price against an unexamined codebase is a bet, and the proposal contains no buffer and no discovery step."
  - lead: "The assumptions list lives in a private notes doc, and the client-facing proposal has none of it"
    lesson: 212
    looks_like: "Everything your colleague told you verbally — the unseen API, the late assets, the unopened codebase — appears nowhere in the document the client will sign."
  - lead: "The deliverable for Milestone 2 reads \"the app will work great,\" with nothing testable behind it"
    lesson: 213
    looks_like: "You noticed that \"Build complete — week 6\" is a date and not an acceptance criterion. Nothing in the proposal says how anyone establishes that a milestone was met."
  - lead: "\"Unlimited revisions\" is right there on the pricing page as a selling point"
    lesson: 215
    looks_like: "You flagged the words \"unlimited revisions until you're happy\" against the fixed price and the eight-week timeline, which together make the sentence the most expensive one in the document."
  - lead: "No deposit and a vague scope both show up in the first call, and the deal still feels too good to walk away from"
    lesson: 227
    looks_like: "You treated the two together rather than separately, and did not accept \"it would look desperate\" as a reason — the deposit conversation is a normal commercial term, and its absence beside a vague scope is the pattern this lesson names."
```

## Reference Walkthrough
One competent review. Read it after scoring yourself.

**Would I send it? No — and not because of the wording.** Three of the
problems here cannot be fixed by editing this document, because the
information they depend on does not exist yet. Sending a corrected version of
the same proposal would preserve the expensive parts.

**What cannot be priced yet.** The portal is a PHP application nobody has
opened, and the integration is with an API nobody has seen. A fixed £24,000
against those two unknowns is not a price, it is a bet whose size nobody has
measured. The change to propose is not a bigger number: it is a small, paid
discovery step that ends with a scope both sides recognise, after which a
fixed price becomes defensible. That reframes the conversation from "we cannot
commit" to "here is the first thing we will do".

**The sentence that costs the most.** "Unlimited revisions until you're happy"
sits directly above a fixed price and an eight-week timeline. It reads as
generosity and functions as an open-ended commitment held by whoever is least
decisive on the client's side. Replace it with a stated number of revision
rounds per phase, and say what happens after them — not because the client is
adversarial, but because the sentence as written has no end state.

**The milestones are dates, not deliverables.** "Build complete — week 6" says
when someone intends to be finished, not how anyone will agree that they are.
Each milestone needs something checkable beside it, and the last one needs the
step that is missing entirely: what constitutes acceptance, and what happens if
nobody responds. A milestone with no acceptance criterion and no response
deadline can stay open forever, and often does.

**The assumptions exist and are not in the document.** Everything your
colleague told you verbally is an assumption the price depends on: the legacy
code is workable, the API is usable, the assets arrive in time. None appears in
what the client signs. Moving them into the proposal is not defensive
paperwork; it is the difference between a delay being a shared fact and being
an argument.

**Who signs off is unknown.** Three people are in the calls and none has been
named as the decision-maker. That question is cheap to ask now and expensive
to discover at milestone two, when three sets of feedback arrive and
reconciling them is unpaid work.

**The deposit.** Ask. "It would look desperate" is a story about how the
request will land, and the request is an ordinary commercial term. The pattern
worth naming to your colleague is not the missing deposit on its own — it is a
vague scope and no deposit appearing together, which this course lists among
its red flags.

**What this review did not do.** It read a document and a set of verbal notes.
It formed no view on whether any term here would be enforceable, in any
jurisdiction, against any counterparty — that is a lawyer's question and this
review is not a substitute for one. It did not see the existing portal, the
API, Harlow's procurement process, or what your colleague's other commitments
look like over the next eight weeks. A review that does not say this implies a
clearance it cannot give.
