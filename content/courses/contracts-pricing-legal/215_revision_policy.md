# 215. Revision Policy — Bounding Feedback Without Killing Goodwill

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Proposal_and_Pricing/Contract_and_Scope/Legal_and_Contractor material to build out the Proposals, Contracts & Pricing course; no existing coverage data for your own practice.

## What It Is
Revisions and change requests are often confused, but they answer different questions. A change request asks "should this new thing be added?" A revision asks "does this already-scoped thing match what we agreed?" A revision is a correction or adjustment to a deliverable that already exists in scope — a copy fix, a spacing tweak, a validation message clarification, a bug fix against the acceptance criteria. It is not a new page, a new module, a new integration, a changed business rule, or a major redesign after a direction was already approved. Confusing the two is how "unlimited revisions until you're happy" quietly becomes unlimited unpaid feature work.

A workable revision policy states, before the project starts, how many consolidated rounds are included per milestone, what counts as a revision, what doesn't, and the deadline for feedback. For UI-heavy work it's common to allow more rounds during the design phase — where cheap iteration matters most — and fewer once implementation has started and each round has a real engineering cost. The word "consolidated" is doing real work here: feedback that trickles in as separate messages from different stakeholders over two weeks is a different, more expensive thing than one written list with priorities and a single decision-maker's sign-off, and the policy should require the latter.

The response templates matter as much as the policy itself, because the moment of friction is when a request arrives that doesn't fit. "This fits within the included revision round, so I'll apply it before the next update" costs nothing and builds trust. "This changes the approved workflow, so it's not a standard revision — I can prepare a change request, replace a scoped item, or move it to the next phase" holds the line without sounding punitive. Whatever specific revision language you put in a signed contract, especially language that limits a client's ability to request further changes, is worth a lawyer's review if the engagement is large enough that the clause would actually be contested.

## Key Concepts
- **Revision vs. new work**: a revision adjusts something already in scope; anything that changes direction, adds a workflow, or reworks accepted output is not a revision.
- **Revision round count**: a stated number of consolidated feedback rounds per milestone (or per design phase), agreed before work starts — never "until you're happy."
- **Consolidated feedback requirement**: one written list from the named decision-maker, not scattered messages from multiple stakeholders across multiple channels.
- **Included vs. not-a-revision examples**: minor copy/spacing/validation fixes and bug fixes against acceptance criteria are included; new pages, new integrations, changed business logic, and late-content-driven layout changes are not.
- **Forbidden phrases**: "unlimited revisions," "small changes anytime," "we'll keep working until it's perfect" — commercially dangerous regardless of how reassuring they sound to a prospect.

## Example Code
```markdown
## Revision Policy

Each milestone includes up to [2] consolidated revision rounds for scoped
adjustments. Feedback must be submitted in writing, from the named decision
maker, within the agreed feedback window.

**Included as a revision:**
- Copy corrections in client-provided text
- Minor spacing/alignment adjustments within the approved layout
- Bug fixes against the milestone's written acceptance criteria

**Not included as a revision (handled as a change request):**
- New pages, modules, or integrations
- Changes to business logic or workflow after approval
- Redesign of a screen after its direction was approved

## Response Templates
In-scope: "This fits within the included revision round, so I'll apply it
before the next milestone update."

Out-of-scope: "This changes the approved workflow, so it isn't a standard
revision. I can prepare a change request, replace a scoped item, or move
it to the next phase — your call."
```

## When to Use
- Before quoting any project with a design or iterative-feedback phase.
- Whenever feedback arrives piecemeal from multiple stakeholders instead of as one consolidated list.
- The moment a "small" request turns out to touch a workflow or business rule, not just a visual detail.

## Common Mistakes
- Advertising "unlimited revisions" as a selling point without realizing it removes your ability to ever call a milestone finished.
- Accepting feedback from whoever happens to message first instead of requiring one consolidated, decision-maker-approved list.
- Treating a bug fix and a new feature request identically because both arrived in the same feedback email.
- Letting a design phase's generous revision allowance quietly carry over into the implementation phase, where each round costs far more.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — on structuring feedback rounds that protect both craft and margin.
- Peldi Guilizzoni (Balsamiq founder) on structured client feedback processes in design-heavy freelance work.
- Jonathan Stark's writing on scoped, fixed-price engagements and why unbounded iteration undermines them.
