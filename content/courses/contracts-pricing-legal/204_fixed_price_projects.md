# 204. Fixed-Price Projects — Eligibility and Guardrails

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — knowing what a clause is for and where the risk sits, not carrying responsibility for drafting or judging one. What actually holds differs by jurisdiction: TR, US, UK, UAE, EU and JP do not treat IP transfer, contractor classification, consumer protection or liability limits the same way, so have anything you sign reviewed where you and your client actually operate.

Fixed price is the pricing model clients like best, because it converts an uncertain purchase into a single predictable number. It is also the model that punishes the freelancer hardest when scope isn't actually fixed, because every hour of underestimated work comes directly out of your margin instead of being billed. Fixed price is only a safe model when a specific set of conditions is true — not a default you reach for because it feels more professional than hourly.

The eligibility bar is concrete: written scope, listed deliverables, clear exclusions, defined client responsibilities, testable acceptance criteria, payment milestones, and a change-request process must all exist before you commit to a number. If the client refuses a written scope, if the work is exploratory, if an existing codebase hasn't been reviewed, or if integrations are undocumented, fixed price is the wrong tool — not because the client is being difficult, but because nobody, including a senior developer, can accurately estimate work they can't yet see.

Even with clear scope, fixed-price proposals need three specific guardrails: a bounded number of revision rounds (so feedback doesn't become an unlimited iteration loop), a milestone-based payment schedule (so cash flow doesn't depend on financing the client's entire project out of pocket), and an explicit risk buffer for known sources of ambiguity like third-party approvals or legacy data. None of these guardrails are exotic — they are the standard shape of a professional software engagement, and their absence is one of the clearest predictors of a project going over budget and turning adversarial.

This is educational material, not a substitute for legal review — any fixed-price contract language you actually use with a client should be checked by a lawyer familiar with your jurisdiction, especially around cancellation and non-payment consequences.


```quiz
- q: "Why does underestimating hurt more under fixed price than under hourly?"
  anchor: "every hour of underestimated work comes directly out of your margin"
  options:
    - text: "Fixed-price clients tend to request more revisions"
      correct: false
      why: "They often do, but that is a scope-control issue. The asymmetry here exists even with a perfectly behaved client."
    - text: "The extra hours are unbilled, so they come straight out of margin instead of being invoiced"
      correct: true
      why: "Under hourly the estimate being wrong shifts the invoice; under fixed price it shifts your profit."
    - text: "Fixed-price contracts usually carry late-delivery penalties"
      correct: false
      why: "They may, but that is a separate clause. The lesson's point holds for a fixed-price contract with no penalty at all."

- q: "A client wants a fixed price for work on an existing codebase you have not been given access to. What does the lesson say?"
  anchor: "nobody, including a senior developer, can accurately estimate work they can't yet see"
  options:
    - text: "Quote fixed price with a large risk buffer to cover the unknown"
      correct: false
      why: "A buffer prices uncertainty you still cannot size. It either loses the deal or fails to cover the real range."
    - text: "Fixed price is the wrong tool here \u2014 the eligibility bar is not met"
      correct: true
      why: "An unreviewed existing codebase is on the lesson's own disqualifying list, alongside exploratory work and undocumented integrations."
    - text: "Quote fixed price but add a clause allowing renegotiation"
      correct: false
      why: "That is an hourly arrangement wearing a fixed-price label, and it gives the client the predictability they were promised only until it does not."
```

## Key Concepts
- **Eligibility checklist**: written scope, listed deliverables, exclusions, client responsibilities, acceptance criteria, payment milestones, and a change-request process must all exist before quoting fixed price.
- **Revision limits**: a stated number of consolidated review rounds per milestone, distinguishing minor adjustment from new work.
- **Acceptance criteria**: a milestone is "done" when specific, testable conditions are met — not when it merely "looks finished."
- **Payment milestone structure**: deposit before start, one or more milestone payments during the build, final payment before production handover — never 100% after completion.
- **Risk buffer**: pricing in a margin for known unknowns (unclear assets, third-party approvals, integration risk) rather than absorbing them silently.
- **Disqualifying conditions**: client refuses written scope, wants unlimited revisions, insists on payment only after delivery, or the codebase/integration is unreviewed and undocumented.

## Example Code
```markdown
## Fixed-Price Proposal Skeleton

### Project Summary
[One paragraph: business outcome, not feature list]

### Included Scope
- Module 1, Module 2, Module 3 (see scope-to-price map)

### Excluded Scope
- [Explicit list — no "etc."]

### Milestones & Payment
| Milestone | Deliverable | Payment |
|---|---|---|
| 1. Kickoff | SOW approved, access collected | 40% deposit |
| 2. Core build | Working staging build, demo | 30% |
| 3. Final delivery | Production release, handover docs | 30% |

### Revisions
Up to 2 consolidated review rounds per milestone for scoped adjustments.
New features, structural changes, or integrations are handled as change requests.

### Acceptance Criteria
A milestone is accepted when the agreed workflows function in the staging
environment and no blocking issue prevents the scoped user flow from completing.

### Support Period
[X] days of bug-fix warranty after final delivery (see warranty lesson).

### Validity
This proposal is valid for 14 calendar days from the date above.
```

## When to Use
- When scope, deliverables, and acceptance criteria can all be written down concretely before work starts.
- When the client can commit to a single decision-maker and a defined feedback window.
- When the codebase (if any) has already been reviewed, or the project is greenfield.
- When you can price in a specific risk buffer for the known unknowns rather than guessing them away.

## Common Mistakes
- **The scope is still a vision statement, and a fixed price goes out anyway rather than risk losing the lead** — Agreeing to fixed price on a description that's still a vision, not a spec, to avoid losing the lead.
- **"Unlimited revisions until you're happy" makes it into the proposal because it sounds like great service** — Allowing "unlimited revisions until you're happy" into the proposal because it sounds generous.
- **The whole project is priced as one invoice, due after the final handover** — Structuring payment as a single invoice due after full completion, financing the entire build yourself.
- **The quote goes out against a legacy codebase nobody's actually opened, with no risk buffer built in** — Skipping the risk buffer on integrations or legacy systems you haven't actually inspected.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — practical, opinionated guidance on scoping and pricing fixed-fee client work.
- Blair Enns, *Pricing Creativity: A Guide to Profit Beyond the Billable Hour*.

```recall
- q: "List the conditions that must all be true before quoting fixed price."
  must:
    - "a written scope"
    - "listed deliverables and clear exclusions"
    - "defined client responsibilities"
    - "testable acceptance criteria"
    - "payment milestones and a change-request process"

- q: "Name the situations where fixed price is the wrong tool, and say why."
  must:
    - "the client refuses a written scope"
    - "the work is exploratory"
    - "an existing codebase has not been reviewed"
    - "integrations are undocumented"
    - "in each case the work cannot be seen yet, so it cannot be estimated"

- q: "Why is a change-request process part of the eligibility bar, not a nice-to-have?"
  must:
    - "fixed price only holds while the scope is actually fixed"
    - "without a process, every change quietly comes out of margin"
    - "it is the mechanism that turns a scope change into a price change"
```
