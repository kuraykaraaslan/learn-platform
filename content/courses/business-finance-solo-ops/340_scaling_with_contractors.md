# 340. Scaling with Contractors Without Losing Quality

## What It Is
> This lesson is general education, not financial or tax advice. Contractor agreements, confidentiality terms, and worker-classification rules vary by jurisdiction — confirm with a lawyer before formalizing any ongoing contractor relationship.

Bringing in a contractor — a designer, a QA specialist, a second developer — can increase capacity, but it introduces quality, communication, margin, and reputation risk that a solo operator absorbs personally, because the freelancer remains accountable for final quality unless the client has directly and separately contracted that person. Delegation done carelessly doesn't multiply capacity; it multiplies risk under your own name.

The safest entry point is task delegation — a small, clearly defined piece of work like UI design for one specific flow, QA execution against a checklist, or content migration — rather than jumping straight to module or client-facing delegation, which carry meaningfully higher risk. A useful filter for what not to delegate: unclear architecture, unstable core business logic, security-critical work without review, a large undefined scope, or anything you genuinely cannot evaluate once it comes back. If you can't judge the quality of the output, you can't safely be accountable for it.

Every contractor engagement needs the same brief regardless of scale: role, scope, deliverable, quality standard, communication process, review process, confidentiality terms, client visibility, and payment terms. And every deliverable needs an actual review pass before it reaches the client — checking scope match, quality, security, performance, consistency, edge cases, documentation, and whether it meets what the client was told to expect. Pricing the engagement must leave real margin after accounting for your own management time, review time, client communication, a rework buffer, and profit — subcontracting at break-even removes the reason to delegate at all.

## Key Concepts
- **Accountability rule**: you remain responsible for final quality unless the client has directly contracted the person themselves — delegation doesn't transfer that responsibility by default.
- **Delegation levels by risk**: task delegation (low risk, start here), module delegation (medium), function delegation (high), client-facing delegation (high) — escalate only as trust is proven.
- **Poor delegation candidates**: unclear architecture, unstable core logic, security-critical work without review, large undefined scope, or anything you can't personally evaluate on return.
- **Contractor brief requirements**: project, task, context, inputs provided, expected output, acceptance criteria, constraints, deadline, communication channel, review process, confidentiality notes.
- **Mandatory review pass**: every contractor deliverable is checked for scope match, quality, security, performance, consistency, edge cases, documentation, and client expectation before it reaches the client.
- **Client transparency choice**: decide explicitly whether the contractor is an invisible subcontractor, a named specialist, or a co-delivery partner — and don't misrepresent the team structure if the client expects only you personally.
- **Margin discipline**: contractor cost must leave room for your management time, review time, client communication, rework buffer, and profit — never subcontract at break-even.

## Example Code
A contractor brief for a bounded, low-risk task-delegation engagement:

```md
## Contractor Brief

Project: Client H — Admin Panel MVP
Task: Build the 3 dashboard chart components against the approved
  Figma design; no backend or data-fetching logic.
Context: Next.js + Tailwind app; components must consume a documented
  mock data shape (provided as a TypeScript interface).
Inputs provided: Figma file, TS interface for chart props, brand
  color tokens.
Expected output: 3 React components, responsive, matching design
  within reasonable tolerance, unit-tested with the provided mock data.
Acceptance criteria: pixel-reasonable match to Figma, passes provided
  test file, no console errors, works at 3 breakpoints.
Deadline: 5 business days.
Communication channel: shared Slack channel, async updates daily.
Review process: I review the PR before merge; 1 revision round
  included in the agreed contractor fee.
Confidentiality: contractor signs standard NDA before repo access;
  client name not disclosed to contractor beyond "a business client."

Margin check: contractor fee $600 + my review/integration time (4h
  @ $70/hr = $280) = $880 total cost against $1,400 billed to client
  for this component of scope -> margin retained after delegation.
```
The brief is deliberately narrow — three components against a documented interface — which is exactly the kind of task-level delegation that's safe to hand off before ever considering module- or client-facing delegation.

## When to Use
- When client demand exceeds solo capacity and the work in question is bounded enough to define a clear brief and acceptance criteria for.
- When a specific skill gap (design, QA, copywriting) would otherwise become a bottleneck on a project.
- Before ever allowing a contractor direct client contact — to first prove quality and reliability through several task-level engagements.
- When pricing any project involving a contractor — to explicitly check that management and review time are actually covered in the price.

## Common Mistakes
- **The contractor's specialty is a security-critical area nobody in-house actually knows how to review** — Outsourcing work you cannot personally evaluate on return, removing your ability to actually be accountable for its quality.
- **A contractor hired last week is already handling an entire feature module and talking directly to the client** — Jumping straight to module- or client-facing delegation with an unproven contractor instead of starting at task-level.
- **The contractor got a two-line description of the task and started right away** — Skipping a written brief and acceptance criteria, leading to rework that erodes any margin the delegation was supposed to create.
- **The contractor's fee eats the entire margin on this piece of the project once review time is counted** — Pricing contractor engagements at break-even, leaving no room for the management, review, and rework time delegation actually requires.

## Further Reading
- *The E-Myth Revisited* — Michael E. Gerber: on building systems and delegation structures rather than staying the sole bottleneck indefinitely.
- *Traction* (EOS) — Gino Wickman: process and accountability structures that scale down well to a solo-plus-contractors model.
