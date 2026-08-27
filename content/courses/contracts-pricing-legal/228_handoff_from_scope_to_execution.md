# 228. From Signed Scope to Project Execution — the Handoff

## What It Is
A signed SOW is not yet a project plan, and the gap between the two is where a surprising number of well-negotiated contracts quietly lose their protections. The scope boundaries, exclusions, assumptions, and change-control rules that took real effort to negotiate need to survive the transition into day-to-day execution — backlog items, sprint plans, and task lists — or they become invisible the first time a task list disagrees with what was actually signed.

The handoff package is the artifact that carries scope forward intact: an approved scope summary, the milestone plan, a backlog derived directly from the SOW's deliverables, the client responsibilities and dependency list, the acceptance gates for each milestone, the change-request rule, the communication cadence, and a short risk register. None of this is new information — it's the same content from the SOW and this course's other lessons, restructured into a form a project board or task tracker can actually use. The translation step matters: each SOW deliverable becomes one or more concrete tasks ("admin can manage products" becomes a data model, an API, a list page, a form, validation, and an acceptance checklist), so that what gets built maps back to what was signed, deliverable by deliverable.

Kickoff is the last checkpoint before this translation happens, and it's worth treating as a formal step rather than a friendly call: confirm scope, milestones, the communication channel, the decision maker, client inputs and access, the first milestone, the change-request rule, and payment status, all in one sitting. The single most common failure at this stage isn't a missing document — it's starting a task backlog "from scratch" based on the freelancer's own mental model of the project instead of directly from the signed scope, quietly reintroducing all the ambiguity the SOW was written to eliminate, and building tasks for features that were explicitly marked excluded or deferred.

## Key Concepts
- **Handoff package**: approved scope summary, milestones, backlog, client responsibilities, dependencies, acceptance gates, change-request rule, communication cadence, and risk register — assembled once, before implementation starts.
- **Backlog translation rule**: every SOW deliverable becomes one or more concrete, assignable tasks, preserving the link between what was signed and what gets built.
- **Kickoff checklist**: scope, milestones, communication channel, decision maker, client inputs/access, first milestone, change-request rule, and payment status, confirmed together at the start of execution.
- **Exclusion carry-over**: exclusions and deferred/future-phase items from the SOW are preserved in the backlog as explicitly out-of-scope, not silently dropped or silently included.
- **Payment-gate visibility**: the handoff package keeps payment gates visible to execution tracking, so a milestone isn't marked "in progress" or "complete" independent of its payment status.

## Example Code
```markdown
# Project Handoff Package

## Approved Scope Summary
[Short summary carried directly from the SOW]

## Milestones
[Milestone list with payment gates]

## Backlog (derived from SOW deliverables)
SOW: "Admin can manage products."
Tasks:
- Design product data model
- Build product CRUD API
- Build product list page (search, pagination)
- Build create/edit form with validation
- Write acceptance test checklist

## Client Responsibilities
[Carried from client-responsibilities section]

## Dependencies
[Carried from assumptions/dependencies section]

## Acceptance Gates
[How each milestone closes — see deliverables/acceptance lesson]

## Change Request Rule
[Carried from change-request-control section]

## Communication Cadence
[Channels, meeting rhythm — see communication lesson]

## Risks
[Known risks and mitigation, e.g. unreviewed legacy codebase]
```

## When to Use
- Immediately after a SOW is signed and before the first line of implementation work begins.
- At project kickoff, as a structured agenda rather than an informal conversation.
- Whenever a project's task board seems to have drifted from what was actually signed.

## Common Mistakes
- Building a backlog from memory or a fresh conversation instead of directly from the signed SOW's deliverables.
- Losing exclusions and deferred items in the translation, so features explicitly marked out of scope quietly reappear as tasks.
- Treating kickoff as a purely social event instead of confirming the operational checklist (decision maker, access, payment status) in the same sitting.
- Letting the project board track "done" independent of whether the associated payment gate has actually been met.

## Further Reading
- Henrik Kniberg's writing on translating requirements into actionable backlogs in agile delivery.
- The PMBOK Guide's treatment of the transition from planning to execution as a formal analog to this handoff.
- Basecamp's "Shape Up" methodology for structuring scoped work into executable cycles.
