# 215. Revision Policy — Bounding Feedback Without Killing Goodwill

## What It Is
Revisions and change requests are often confused, but they answer different questions. A change request asks "should this new thing be added?" A revision asks "does this already-scoped thing match what we agreed?" A revision is a correction or adjustment to a deliverable that already exists in scope — a copy fix, a spacing tweak, a validation message clarification, a bug fix against the acceptance criteria. It is not a new page, a new module, a new integration, a changed business rule, or a major redesign after a direction was already approved. Confusing the two is how "unlimited revisions until you're happy" quietly becomes unlimited unpaid feature work.

A workable revision policy states, before the project starts, how many consolidated rounds are included per milestone, what counts as a revision, what doesn't, and the deadline for feedback. For UI-heavy work it's common to allow more rounds during the design phase — where cheap iteration matters most — and fewer once implementation has started and each round has a real engineering cost. The word "consolidated" is doing real work here: feedback that trickles in as separate messages from different stakeholders over two weeks is a different, more expensive thing than one written list with priorities and a single decision-maker's sign-off, and the policy should require the latter.

The response templates matter as much as the policy itself, because the moment of friction is when a request arrives that doesn't fit. "This fits within the included revision round, so I'll apply it before the next update" costs nothing and builds trust. "This changes the approved workflow, so it's not a standard revision — I can prepare a change request, replace a scoped item, or move it to the next phase" holds the line without sounding punitive. Whatever specific revision language you put in a signed contract, especially language that limits a client's ability to request further changes, is worth a lawyer's review if the engagement is large enough that the clause would actually be contested.

```quiz
- q: "The client wants the already-accepted dashboard reworked around a different workflow. Is that a revision?"
  anchor: "anything that changes direction, adds a workflow, or reworks accepted output is not a revision"
  options:
    - text: "Yes — nothing new is added, it is only rearranged"
      correct: false
      why: "It changes direction and reworks accepted output. Either one alone disqualifies it."
    - text: "No — a revision adjusts something already in scope"
      correct: true
      why: "Changing direction, adding a workflow, or reworking accepted output all fall outside that."
    - text: "Yes, provided it fits inside the remaining revision rounds"
      correct: false
      why: "Rounds apply to revisions. Whether this *is* a revision gets decided first."

- q: "Feedback arrives as six Slack messages from three people. Is that a revision round?"
  anchor: "one written list from the named decision-maker, not scattered messages from multiple stakeholders across multiple channels"
  options:
    - text: "Yes — feedback is feedback however it arrives"
      correct: false
      why: "A round is one written list from the named decision-maker."
    - text: "No — a round is one written list from the named decision-maker"
      correct: true
      why: "Scattered messages from multiple stakeholders across multiple channels is exactly what the requirement excludes."
    - text: "Yes, and you consolidate it into one round yourself"
      correct: false
      why: "Then you are also arbitrating between three stakeholders' contradictions, unpaid."

- q: "\"Unlimited revisions\" closes deals. Why is it ruled out?"
  anchor: "commercially dangerous regardless of how reassuring they sound to a prospect"
  options:
    - text: "It is not ruled out — it is fine on small projects"
      correct: false
      why: "It is named commercially dangerous regardless of how reassuring it sounds."
    - text: "It is commercially dangerous however reassuring it sounds"
      correct: true
      why: "\"Small changes anytime\" and \"we'll keep working until it's perfect\" sit on the same list."
    - text: "Because clients never really believe it anyway"
      correct: false
      why: "They do believe it, which is precisely the problem."
```

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
- **"Unlimited revisions" is right there on the pricing page as a selling point** — Advertising "unlimited revisions" as a selling point without realizing it removes your ability to ever call a milestone finished.
- **Whoever messages first gets their feedback actioned, ahead of the decision-maker's consolidated list** — Accepting feedback from whoever happens to message first instead of requiring one consolidated, decision-maker-approved list.
- **A broken checkout button and a request for a whole new reporting page arrive in the same email, and both get treated as revisions** — Treating a bug fix and a new feature request identically because both arrived in the same feedback email.
- **The generous design-phase revision count is still being honored two months into implementation** — Letting a design phase's generous revision allowance quietly carry over into the implementation phase, where each round costs far more.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — on structuring feedback rounds that protect both craft and margin.
- Peldi Guilizzoni (Balsamiq founder) on structured client feedback processes in design-heavy freelance work.
- Jonathan Stark's writing on scoped, fixed-price engagements and why unbounded iteration undermines them.

```recall
- q: "What is the revision round count, and what is it never?"
  must:
    - "a stated number of consolidated feedback rounds per milestone, or per design phase"
    - "agreed before work starts"
    - "never \"until you're happy\""

- q: "Give examples of what is included and what is not a revision."
  must:
    - "included: minor copy, spacing and validation fixes, plus bug fixes against acceptance criteria"
    - "not a revision: new pages, new integrations, changed business logic, and late-content-driven layout changes"

- q: "Name the forbidden phrases."
  must:
    - "\"unlimited revisions\""
    - "\"small changes anytime\""
    - "\"we'll keep working until it's perfect\""
```
