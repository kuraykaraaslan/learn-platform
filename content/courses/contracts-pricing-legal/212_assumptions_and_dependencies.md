# 212. Assumptions and Dependencies in Contracts and Estimates

## What It Is
Every estimate is a bet on conditions the freelancer doesn't fully control: that the client will provide content on time, that a third-party API behaves as documented, that an existing codebase isn't a mess underneath the surface. Assumptions and dependencies are the mechanism for making that bet explicit instead of silent. An unstated assumption doesn't protect anyone — when it turns out to be wrong, the client experiences it as the freelancer's failure to estimate correctly, even though the real cause was a condition nobody wrote down.

The fix is a habit of language: "this estimate assumes that...," "the timeline depends on...," "the client is responsible for...," "third-party delays may affect...." Applied consistently, these phrases turn every estimate into a conditional statement rather than a guarantee. Assumptions cluster into four predictable categories worth checking every time: client input (content, assets, feedback, approvals), access (domain, hosting, repository, payment provider credentials), technical (existing API documentation, codebase condition, third-party feature availability), and scope (that only the listed modules are included, that new roles or reports are not).

Dependencies deserve their own table, not just prose, because a table forces you to assign an owner and a consequence to each one — a dependency with no owner is really just a hope. Equally important is the discipline of naming known unknowns instead of quietly absorbing them: "existing database quality has not been reviewed, so data migration is excluded until source data is inspected" protects the freelancer far better than saying nothing and discovering the mess mid-project. None of this replaces having your contract's liability and dependency language reviewed by a lawyer — it's the habit of surfacing risk in plain language before you ever get to the point of needing one.

```quiz
- q: "An assumption you stated in the SOW turns out to be false. What was already agreed?"
  anchor: "if a stated assumption turns out to be false, scope, timeline, or cost may change — stated upfront, not negotiated for the first time mid-dispute"
  options:
    - text: "Nothing — an assumption is not a commitment either way"
      correct: false
      why: "The assumption-change rule is itself an agreed term: a false assumption may change scope, timeline or cost."
    - text: "That scope, timeline or cost may change — agreed upfront, not mid-dispute"
      correct: true
      why: "Stating it early is what stops this conversation happening for the first time under pressure."
    - text: "That you absorb the difference, since you wrote the assumption"
      correct: false
      why: "Writing it down is what protects you. Absorbing it would make the whole exercise pointless."

- q: "You have not seen the client's data quality and it could go either way. What do you do?"
  anchor: "rather than pricing them in silently or ignoring them"
  options:
    - text: "Price in a quiet buffer — the client does not need that detail"
      correct: false
      why: "Pricing them in silently is one of the two handling failures this rules out."
    - text: "Name it as a known unknown in the document"
      correct: true
      why: "The alternatives are pricing it in silently or ignoring it, and both defer the conversation to a worse moment."
    - text: "Leave it out until you have actually inspected it"
      correct: false
      why: "That is the ignoring option, and the inspection may not happen before you are committed."

- q: "What does each dependency row carry?"
  anchor: "dependency, owner, needed-by date, and impact-if-delayed, in one visible table inside the SOW"
  options:
    - text: "Dependency, owner, and current status"
      correct: false
      why: "Status is a tracking field. The row needs a needed-by date and the impact if it slips."
    - text: "Dependency, owner, needed-by date, and impact-if-delayed"
      correct: true
      why: "In one visible table inside the SOW, rather than scattered through the narrative."
    - text: "Dependency and its mitigation plan"
      correct: false
      why: "Mitigation belongs to a risk log. A dependency states who owes what, by when."
```

## Key Concepts
- **Conditional estimate language**: every estimate/timeline states what it assumes and what it depends on, rather than reading as an unconditional promise.
- **Four assumption categories**: client input, access, technical, and scope assumptions — each has a default set of statements worth including by default.
- **Dependency table**: dependency, owner, needed-by date, and impact-if-delayed, in one visible table inside the SOW.
- **Known unknowns**: explicitly naming what hasn't been inspected yet (data quality, API rate limits, third-party approval timelines) rather than pricing them in silently or ignoring them.
- **Assumption-change rule**: if a stated assumption turns out to be false, scope, timeline, or cost may change — stated upfront, not negotiated for the first time mid-dispute.

## Example Code
```markdown
## Assumptions
This estimate assumes that:
- Client will provide brand assets, product content, and legal copy before
  the UI implementation phase begins.
- Client feedback will be consolidated and sent by the named decision maker.
- Existing third-party APIs are documented and accessible as described.
- Production credentials will be shared through a managed vault, not chat.

## Dependency Table
| Dependency | Owner | Needed by | Impact if delayed |
|---|---|---|---|
| Domain DNS access | Client | Deployment phase | Launch date shifts |
| Payment provider account | Client | Checkout integration | Feature cannot be tested |
| Product content | Client | UI/content entry phase | Pages remain placeholder |
| API documentation | Third party | Integration build | Estimate may change |

## Known Unknowns
- Existing database quality has not been reviewed. Data migration is
  excluded until source data is inspected.
- Payment provider approval timeline is unknown; launch may shift if
  approval is delayed.
```

## When to Use
- Whenever you write an estimate, timeline, or proposal number based on incomplete information about the client's systems or content readiness.
- Before quoting fixed price on a project that touches an existing, unreviewed codebase.
- Any time a client says "don't worry, we'll send that later" about content, access, or approvals.

## Common Mistakes
- **The timeline says "6 weeks," full stop, with nothing about what that assumes has to go right** — Writing a timeline as an unconditional promise instead of naming what it depends on.
- **The assumptions list lives in a private notes doc, and the client-facing proposal has none of it** — Listing assumptions once in an internal notebook but never putting them in the client-facing document.
- **Nobody's reviewed the legacy database yet, and the estimate just quietly prices in "should be fine"** — Treating "known unknowns" as something to quietly absorb rather than name and price around.
- **The domain access is "obviously" the client's responsibility, and that assumption never made it into the dependency table** — Assuming a dependency has an owner because it's "obviously" the client's job, without writing it down.

## Further Reading
- Steve McConnell, *Software Estimation: Demystifying the Black Art* — on the relationship between estimate accuracy and stated assumptions.
- Tom DeMarco, *Waltzing with Bears: Managing Risk on Software Projects* — on treating unstated risk as a business decision, not an accident.
- PMI's *Practice Standard for Project Risk Management* — a formal framework for dependency and assumption tracking.

```recall
- q: "What does conditional estimate language do?"
  must:
    - "every estimate or timeline states what it assumes and what it depends on"
    - "rather than reading as an unconditional promise"

- q: "Name the four assumption categories."
  must:
    - "client input"
    - "access"
    - "technical"
    - "scope assumptions"
    - "each has a default set of statements worth including by default"

- q: "What are known unknowns, and what are the two wrong ways to handle them?"
  must:
    - "explicitly naming what has not been inspected yet — data quality, API rate limits, third-party approval timelines"
    - "rather than pricing them in silently, or ignoring them"
```
