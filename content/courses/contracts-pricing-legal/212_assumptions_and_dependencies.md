# 212. Assumptions and Dependencies in Contracts and Estimates

## What It Is
Every estimate is a bet on conditions the freelancer doesn't fully control: that the client will provide content on time, that a third-party API behaves as documented, that an existing codebase isn't a mess underneath the surface. Assumptions and dependencies are the mechanism for making that bet explicit instead of silent. An unstated assumption doesn't protect anyone — when it turns out to be wrong, the client experiences it as the freelancer's failure to estimate correctly, even though the real cause was a condition nobody wrote down.

The fix is a habit of language: "this estimate assumes that...," "the timeline depends on...," "the client is responsible for...," "third-party delays may affect...." Applied consistently, these phrases turn every estimate into a conditional statement rather than a guarantee. Assumptions cluster into four predictable categories worth checking every time: client input (content, assets, feedback, approvals), access (domain, hosting, repository, payment provider credentials), technical (existing API documentation, codebase condition, third-party feature availability), and scope (that only the listed modules are included, that new roles or reports are not).

Dependencies deserve their own table, not just prose, because a table forces you to assign an owner and a consequence to each one — a dependency with no owner is really just a hope. Equally important is the discipline of naming known unknowns instead of quietly absorbing them: "existing database quality has not been reviewed, so data migration is excluded until source data is inspected" protects the freelancer far better than saying nothing and discovering the mess mid-project. None of this replaces having your contract's liability and dependency language reviewed by a lawyer — it's the habit of surfacing risk in plain language before you ever get to the point of needing one.

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
- Writing a timeline as an unconditional promise instead of naming what it depends on.
- Listing assumptions once in an internal notebook but never putting them in the client-facing document.
- Treating "known unknowns" as something to quietly absorb rather than name and price around.
- Assuming a dependency has an owner because it's "obviously" the client's job, without writing it down.

## Further Reading
- Steve McConnell, *Software Estimation: Demystifying the Black Art* — on the relationship between estimate accuracy and stated assumptions.
- Tom DeMarco, *Waltzing with Bears: Managing Risk on Software Projects* — on treating unstated risk as a business decision, not an accident.
- PMI's *Practice Standard for Project Risk Management* — a formal framework for dependency and assumption tracking.
