# 199. Risk Logs, Meeting Recaps & the Discovery-to-Proposal Handoff

## What It Is
A discovery call generates more understanding than any one person's memory should be trusted to carry forward, and three artifacts exist specifically to move that understanding out of memory and into something both sides can check: the risk and assumption log, the written recap, and the handoff brief. The log separates two things that get blurred constantly — an assumption is a fact being taken as given for planning purposes ("version one includes only an admin and a customer role"), while a risk is something that could change the outcome ("third-party API documentation isn't available yet") — and each gets its own record with an owner and, for risks, a mitigation and a probability. The habit this protects against is specific and common: a critical risk that never got written down doesn't disappear, it just resurfaces later as a dispute about whether it was ever discussed at all, at which point there's no record to settle it either way.

The recap is what actually closes that gap, and it has to go out the same business day whenever possible, covering business goal, current problem, users, must-have workflows, out-of-scope items, constraints, open questions, risks, and the next step — sent as an email the client can simply reply to and confirm, using calibrated language ("based on today's discussion, my understanding is...") rather than committing language ("I promise," "this will definitely include"), because nothing in a recap is final until the client has actually confirmed it in writing. Anything mentioned casually during the call that isn't meant to be locked into version one gets placed explicitly under "potential later phase" or "roadmap item" in the recap itself — silence on a casually-mentioned feature is what lets it quietly become an assumed inclusion, and the recap is the one place that silence gets closed before it turns into a dispute. Internal risk notes that aren't appropriate to share directly with the client — doubts about whether they actually control the API access they claimed to have, for instance — stay separate from the client-facing version rather than being either exposed or left unrecorded entirely.

Before any of this becomes a proposal, a next-step decision has to actually be made rather than defaulted into: proposal, paid discovery, a request for missing information, MVP reframing, nurture, or a polite disqualification, chosen from a decision matrix that cross-references clarity, budget, authority, and risk rather than from how the call simply felt. A proposal only gets prepared when most of a defined readiness checklist is actually satisfied — business goal, version-one scope, user roles, must-have workflows, known integrations, timeline, budget signal, decision maker, client responsibilities, and major assumptions — and three or more gaps in that list means the next move is a request for the missing pieces, not a proposal built around guesses. Once proposal is genuinely the right next step, the handoff brief is what prevents `Proposal_and_Pricing_Rules`-equivalent work from having to reconstruct the sales call from scratch: client context, the business problem, version-one scope with explicit exclusions, every risk and assumption transferred into a form the proposal can actually use (an assumption becomes a stated proposal condition; a risk becomes an assumption, a paid-discovery item, an optional phase, a client responsibility, or an explicit exclusion), and pricing-relevant factors like role count, integration count, and compliance needs, so the proposal is assembled from validated discovery output instead of being invented from memory days after the call ended.

## Key Concepts
- **Assumptions vs. risks are distinct records**: an assumption is a fact taken as given for planning; a risk is something that could still change the outcome — each needs its own owner, and risks need a mitigation.
- **Same-business-day recap discipline**: business goal, current problem, users, must-have workflows, out-of-scope items, constraints, open questions, risks, and next step — sent while the conversation is still fresh enough to correct.
- **Calibrated language, not committing language**: "my understanding is..." rather than "I promise" or "this will definitely include" — nothing is final until the client confirms it in writing.
- **Casually-mentioned features get explicitly bucketed**: "potential later phase" or "roadmap item," stated in the recap itself, so silence never becomes an assumed inclusion.
- **Internal vs. client-facing notes stay separate**: private doubts (e.g., about whether the client actually controls the access they claimed) are recorded, not exposed and not lost.
- **The next-step decision matrix**: clarity + budget + authority + risk together determine proposal / paid discovery / request-more-info / MVP reframe / nurture / disqualify — never defaulted to proposal by habit.
- **The proposal readiness checklist has a real threshold**: three or more missing fields (scope, roles, integrations, timeline, budget, decision maker, assumptions) means request information first, not a proposal built on guesses.
- **The handoff brief transfers, it doesn't summarize**: every risk and assumption becomes a specific proposal element (condition, paid-discovery item, exclusion, client responsibility) rather than staying an informal note.

## Example Code

**Risk and assumption log entries:**

```text
Assumption ID: A-001
Assumption:      The first release includes one admin role and one customer role.
Why it matters:  Additional roles affect authorization, UI, and testing scope.
Validation needed: Confirm stakeholder list before proposal.

Risk ID:    R-001
Risk:       Third-party API documentation is not yet available.
Impact:     Integration effort and timeline may change.
Probability: Medium
Owner:      Client
Mitigation: Review documentation before final proposal, or scope integration
            as a separate phase.
Status:     Open
```

**Recap email skeleton:**

```markdown
Hi <Name>,

Thanks for the call today. Below is my recap to make sure I understood everything.

Business goal:            <summary>
Current situation:        <summary>
Potential first-version scope:
  - <workflow 1>
  - <workflow 2>
Later phase / not first release:
  - <item>
Open questions / dependencies:
  - <question>
Recommended next step:    <proposal / paid discovery / follow-up / no fit>

Please confirm this matches your understanding, and I'll prepare the next step.
```

**Next-step decision matrix:**

```text
Clear problem + clear scope + budget signal + decision maker  -> Prepare proposal
Clear problem + unclear technical risk                        -> Paid discovery/audit
Clear problem + oversized scope                                -> MVP reframe, then proposal
Vague problem + serious client                                 -> Paid discovery or workshop
No budget + no urgency                                          -> Nurture or disqualify
No authority on the call                                        -> Request decision-maker involvement
3+ readiness fields missing                                     -> Request information first
```

## When to Use
- Immediately after every discovery call, while the details are still fresh enough to write an accurate recap.
- Any time a critical risk or assumption surfaces during a call, so it becomes a written record instead of a memory.
- At the end of discovery, before defaulting to "I'll just write a proposal," to actually run the next-step decision.
- Assembling a handoff brief before proposal or pricing work starts, so nothing has to be reconstructed from memory later.

## Common Mistakes
- Relying on memory instead of sending a same-day written recap, especially for anything that felt "obviously understood."
- Using committing language ("I promise," "this will definitely include") in a recap that hasn't been confirmed yet.
- Letting a casually-mentioned feature go unmentioned in the recap, where silence quietly turns it into assumed scope.
- Defaulting to "prepare a proposal" without running the readiness checklist or the next-step decision matrix.
- Writing a proposal from memory days after the call instead of from the risk log, recap, and handoff brief.

## Further Reading
- *The Pyramid Principle* — Barbara Minto: leading with the conclusion and the next step before the supporting detail, exactly what a recap and handoff brief need to do.
- *The Checklist Manifesto* — Atul Gawande: turning a risk and assumption log from something held in memory into a written, repeatable check.
- *Getting Things Done* — David Allen: capturing every open commitment and next action in writing so nothing survives only in someone's memory.
