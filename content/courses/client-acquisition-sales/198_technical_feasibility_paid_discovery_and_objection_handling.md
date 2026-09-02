# 198. Technical Feasibility, Paid Discovery & Objection Handling

## What It Is
Every technical unknown left unresolved at proposal time becomes someone's problem during delivery, and it's never the client's. A feasibility check exists to sort each unknown honestly into one of six buckets — known and simple, known but complex, unknown but researchable, unknown requiring paid discovery, external dependency, or not recommended — across ten recurring risk areas: the existing system, data migration, integrations, auth, payments, hosting, performance, security, compliance, and ongoing maintenance. The single rule that prevents the most damage is refusing to treat a claimed integration as easy just because the client says "they have an API" — an API existing says nothing about its documentation quality, its authentication method, its rate limits, whether a sandbox exists, or whether the provider even responds to support requests, and any of those being unverified means the integration goes into the proposal as an assumption, not a commitment. The same discipline applies harder to an existing codebase: a client asking for changes to something already built can't be scoped from a description alone, because "existing-system work often depends more on code quality than feature size" — the repository, the deployment setup, the schema, and the open issue list all have to actually be reviewed before timeline or scope gets committed to.

When feasibility work surfaces enough real unknowns — unclear integration feasibility, unknown existing-code quality, significant data migration, security or compliance risk, stakeholders who disagree, or a scope too complex for one call to responsibly resolve — the honest next step is paid discovery rather than a fixed-price guess dressed up as confidence. Paid discovery converts uncertainty into a defined, priced deliverable: a business problem summary, a workflow map, a feature priority list, feasibility notes, a risk and assumption log, and a phase-one scope, all handed to the client as something valuable on its own even if implementation never follows. It's priced below full implementation but high enough to be taken seriously, and it explicitly excludes production coding, full UI design, or a complete implementation unless that's separately packaged and priced — the moment paid discovery quietly turns into free scoping just because a fixed fee makes the client uncomfortable, the entire justification for charging for it disappears.

Recommending paid discovery, holding a scope boundary, or declining premature price pressure all land as objections in the moment, and objections aren't attacks — they're signals of uncertainty, budget limits, or unearned trust, and the response pattern that works stays the same regardless of which one is behind a given pushback: acknowledge, clarify, reframe, explain the process, set the boundary, offer the next step. "Can you just give me a quick price" gets answered with why a number without clarified scope would be a guess, not a discount or a rushed estimate; "another developer said it's easy" gets redirected toward whether the workflow's edge cases and acceptance criteria are actually clear rather than an argument about the code itself; "can we pay after everything is done" gets a calm, standing boundary — milestone payments and a deposit protect both sides' schedule, and that isn't relitigated per client. What separates a professional boundary from a rationalized excuse is that walking away has a real trigger list: a client who rejects a written scope, rejects a deposit, demands unpaid detailed architecture, pushes an impossible timeline, or asks for anything illegal or deceptive isn't a hard negotiation to win — they're a lead to disqualify, and continuing anyway to avoid an awkward conversation is how objections that should have ended a lead instead start a bad project.

```quiz
- q: "The client says the system you have to integrate with \"has an API\". What has that established?"
  anchor: "an API existing says nothing about its documentation quality, its authentication method, its rate limits, whether a sandbox exists, or whether the provider even responds to support requests"
  options:
    - text: "That the integration is feasible and can be scoped normally"
      correct: false
      why: "Existence is the one thing it establishes, and it is not what determines the effort."
    - text: "Almost nothing — and while unverified, the integration enters the proposal as an assumption, not a commitment"
      correct: true
      why: "Documentation quality, auth method, rate limits, sandbox availability and support responsiveness are all still unknown."
    - text: "That the risk now sits with the provider rather than with you"
      correct: false
      why: "Every unresolved technical unknown becomes someone's problem during delivery, and it is never the client's."

- q: "A client wants changes to a codebase that already exists. Can you scope that from their description?"
  anchor: "existing-system work often depends more on code quality than feature size"
  options:
    - text: "Yes, if their description of the features is detailed enough"
      correct: false
      why: "Feature size is not the driver here, and a description cannot convey code quality."
    - text: "No — the repository, deployment setup, schema and open issue list all have to be reviewed first"
      correct: true
      why: "Before any timeline or scope is committed to."
    - text: "Yes, with a padded estimate to absorb the unknowns"
      correct: false
      why: "Padding prices the uncertainty without reducing it. The discipline is to look before committing."

- q: "The fixed fee makes the client uncomfortable, so paid discovery quietly loses it. What has happened?"
  anchor: "the entire justification for charging for it disappears"
  options:
    - text: "A reasonable concession that keeps the deal warm"
      correct: false
      why: "It removes the thing that made discovery a defined deliverable rather than unpaid scoping."
    - text: "The entire justification for charging for it has disappeared"
      correct: true
      why: "Discovery is priced below full implementation but high enough to be taken seriously — that is the whole structure."
    - text: "Nothing, as long as the deliverables list stays the same"
      correct: false
      why: "The deliverables were what the fee bought. Free scoping produces the same documents with no basis for the boundary."
```

## Key Concepts
- **Six-way feasibility classification**: known-simple, known-complex, unknown-researchable, unknown-requiring-paid-discovery, external dependency, not recommended — applied across the system, data, integrations, auth, payments, hosting, performance, security, compliance, and maintenance.
- **"They have an API" is not verification**: documentation, auth method, rate limits, sandbox availability, and support responsiveness all have to be checked before an integration is treated as simple.
- **Existing-codebase work needs a real review, not a description**: repository, deployment setup, schema, and open issues — code quality drives timeline more than feature size does.
- **Paid discovery triggers**: unclear scope, unverified integrations, unaudited existing code, significant migration, security/compliance risk, stakeholder disagreement, or complexity beyond one call.
- **Paid discovery is a real, priced deliverable**: a workflow map, feasibility notes, a risk log, and a phase-one scope — not free scoping wearing a fee to look more serious.
- **The objection response pattern**: acknowledge → clarify → reframe → explain process → set boundary → offer next step, regardless of which specific objection is raised.
- **Common objections have standing, non-improvised answers**: premature price requests, "another developer said it's easy," pay-after-delivery requests — each has a calm, repeatable response rather than a defensive one.
- **A concrete walk-away trigger list**: rejecting written scope, rejecting a deposit, demanding free detailed architecture, impossible timelines, or anything illegal — these disqualify, they don't get negotiated harder.

## Example Code

**Feasibility area classification:**

```text
Area           | Classification                          | Notes / assumption if unverified
---------------|------------------------------------------|----------------------------------
Existing system|                                          |
Data migration |                                          |
Integrations   |                                          |
Auth           |                                          |
Payments       |                                          |
Hosting        |                                          |
Performance    |                                          |
Security       |                                          |
Compliance     |                                          |
Maintenance    |                                          |

Classifications: known-simple / known-complex / unknown-researchable /
                 unknown-needs-paid-discovery / external-dependency / not-recommended
```

**Objection response skeleton:**

```text
Objection:        "<what the client said>"
Acknowledge:       That's a fair question / concern.
Clarify:           Here's what actually determines the answer...
Reframe:           The real question is <X>, not <Y>.
Boundary:          I don't <do the thing being asked for> without <the standing requirement>.
Next step:         Here's what happens once <the missing piece> is in place.
```

## When to Use
- Whenever a project involves integrations, an existing codebase, data migration, payments, or anything security- or compliance-sensitive.
- Before quoting a fixed price on anything where multiple feasibility areas are still unverified.
- The moment a client pressures for an instant number, compares you unfavorably to a cheaper developer, or wants a detailed plan for free.
- Deciding whether to keep negotiating with a difficult prospect or treat their behavior as a disqualifying signal.

## Common Mistakes
- **A prospect says "they have an API," and that's taken as proof the integration will be simple** — Treating "they have an API" as proof an integration will be simple to build.
- **A timeline gets committed for existing-system work before anyone has looked at the actual repository** — Committing to timeline or scope for existing-system work without ever reviewing the actual repository.
- **A prospect objects to the price, and the estimate gets discounted on the spot to move past it** — Discounting or rushing an estimate just to make an uncomfortable price objection go away.
- **A prospect hasn't committed to anything, and you're already drafting a full architecture for free to "prove value"** — Preparing detailed free architecture or a full implementation plan to "prove value" before any commitment exists.
- **A prospect already rejected written scope and a deposit, and the negotiation keeps going** — Continuing to negotiate with a prospect who has already rejected written scope, a deposit, or reasonable boundaries.

## Further Reading
- *Million Dollar Consulting* — Alan Weiss: positioning paid discovery and audit work as a real, valuable deliverable rather than free pre-sales effort.
- *Exactly What to Say* — Phil M. Jones: short, non-defensive scripted language for exactly the kind of pressure objections create.
- *Waltzing with Bears* — Tom DeMarco & Timothy Lister: surfacing and pricing technical and schedule risk honestly before it turns into a broken commitment.

```recall
- q: "Name the six feasibility buckets."
  must:
    - "known and simple"
    - "known but complex"
    - "unknown but researchable"
    - "unknown requiring paid discovery"
    - "external dependency"
    - "not recommended"

- q: "Name the ten recurring risk areas a feasibility check sorts across."
  must:
    - "the existing system, data migration, integrations"
    - "auth, payments, hosting"
    - "performance, security"
    - "compliance"
    - "ongoing maintenance"

- q: "What triggers paid discovery instead of a fixed-price proposal?"
  must:
    - "unclear integration feasibility"
    - "unknown existing-code quality"
    - "significant data migration"
    - "security or compliance risk"
    - "stakeholders who disagree"
    - "a scope too complex for one call to responsibly resolve"

- q: "What does paid discovery deliver, and what does it explicitly exclude?"
  must:
    - "a business problem summary, a workflow map, a feature priority list"
    - "feasibility notes, a risk and assumption log, a phase-one scope"
    - "valuable on its own even if implementation never follows"
    - "excludes production coding, full UI design, and complete implementation unless separately packaged and priced"
```
