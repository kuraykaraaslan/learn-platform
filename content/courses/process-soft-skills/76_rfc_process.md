# 76. RFC (Request for Comments) Process Management

## What It Is
An RFC (Request for Comments) is a structured written proposal for a significant technical or process change. It is not a ticket, not a Slack message, and not a PR description. It is a self-contained document that explains the problem, the proposed solution, the alternatives considered, and the open questions — written before a single line of code is committed to a significant design choice.

The RFC process was popularized by the IETF (Internet Engineering Task Force) for defining internet protocols, but it has been adapted by engineering teams at Rust, React, Ember, and many product companies for internal architecture decisions. The core value is not the document itself — it is the async thinking it forces. Writing an RFC makes you articulate assumptions you would otherwise carry silently, and it creates a searchable record of *why* a decision was made, not just *what* was decided.

For a solo developer running a SaaS product, an RFC is most useful in three situations: when a decision is hard to reverse (switching ORMs, changing your auth model, redesigning tenant isolation), when you need to bring a client or contractor into a technical decision without a meeting, and when you want to capture your own thinking before starting a week-long feature. A "solo RFC" sounds odd, but writing one to yourself — even a short one — is one of the fastest ways to surface the flaw in a plan you haven't fully stress-tested.

## Key Concepts
- **RFC vs. ADR (Architecture Decision Record)**: An RFC is a *proposal* (before the decision); an ADR is a *record* (after the decision is made and implemented)
- **Author and sponsor**: The author writes the RFC; the sponsor (often the same person solo) has the authority to approve or reject it
- **Open questions section**: Explicitly list what you don't know yet — this is often the most valuable section for catching unknown unknowns
- **Alternatives considered**: Documenting rejected alternatives prevents the same ideas from being re-proposed six months later
- **RFC lifecycle**: Draft → Comment Period → Accepted/Rejected/Withdrawn → (if accepted) Superseded when a newer RFC replaces it
- **Lightweight vs. heavyweight**: A one-page RFC template works for most changes; reserve multi-page formats for foundational decisions
- **Comment period**: Even solo, give yourself 24–48 hours before accepting your own RFC — sleeping on a proposal reveals gaps
- **RFC numbering**: Flat sequential numbering (RFC-001, RFC-002) scales better than categorized numbering systems

## Example Code or Template

```template
# RFC-[NUMBER]: [Short Title]

**Status**: Draft | Comment Period | Accepted | Rejected | Superseded by RFC-XXX
**Author**: [Your name]
**Created**: YYYY-MM-DD
**Last Updated**: YYYY-MM-DD
**Decision By**: YYYY-MM-DD (leave blank if open-ended)

---

## Summary
One paragraph. What are you proposing and why does it matter?

## Problem / Motivation
What is the current situation? What pain, risk, or limitation does it create?
Be specific — link to incidents, support tickets, or code if relevant.

## Proposed Solution
Describe the change in enough detail that someone unfamiliar with the codebase
could understand and critique it. Include diagrams or pseudocode if they help.

## Alternatives Considered
### Alternative A: [Name]
Description. Why was it rejected?

### Alternative B: [Name]
Description. Why was it rejected?

## Impact and Tradeoffs
- **Breaking changes**: Yes / No — describe if yes
- **Migration effort**: [Hours / Days / Weeks estimate]
- **Performance impact**: Expected change in latency, throughput, or resource use
- **Security implications**: Any new attack surface or reduced security
- **Operational impact**: New things to monitor, deploy, or maintain

## Open Questions
- [ ] Have we benchmarked [X] under the expected load?
- [ ] Does this RFC conflict with the planned [Y] feature?
- [ ] What is the rollback plan if [Z] assumption proves false?

## Implementation Plan
1. Step one
2. Step two
3. Step three

## References
- Link to relevant PRs, tickets, or prior RFCs
```

## When to Use
- Before switching any foundational dependency (ORM, auth provider, queue system, hosting platform)
- Before designing a new public-facing API that clients or third-party integrators will depend on
- When a client asks "why did you choose X over Y?" — point them to the RFC instead of explaining it in real time
- When onboarding a first contractor — ask them to write a short RFC for any non-trivial change they plan to make
- Before architectural changes to multi-tenant isolation logic, since mistakes there affect every tenant simultaneously

## Common Mistakes
- **Writing the RFC after the decision is already made**: This turns the RFC into theater, not thinking — it eliminates the ability to course-correct based on feedback
- **Making the RFC too long before opening it for comments**: A three-page draft that invites comments is more useful than a ten-page document that discourages them; write enough to be concrete, then share early
- **No explicit rejection of alternatives**: Future collaborators (including yourself) will re-propose the same rejected alternatives if you do not document why they were discarded
- **No lifecycle tracking**: RFCs that are accepted but never marked "superseded" when things change become a source of confusion — keep the status field current

## Further Reading
- **"A Toolbox for Scaling Engineering Decisions" — Gergely Orosz (Pragmatic Engineer)** — Practical breakdown of RFC, ADR, and design doc formats used at Uber, Stripe, and others
- [**Rust RFC process documentation](https://github.com/rust-lang/rfcs)** — The most well-documented public RFC process for a software project; the README explains the lifecycle clearly
- **"Design Docs at Google" — Eugene Yan** — Google's internal equivalent of RFCs; explains how to write them concisely and what reviewers actually look for
