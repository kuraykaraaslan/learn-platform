# 256. Ownership, IP, and Source Code Handover

## What It Is
Ownership ambiguity is one of the quietest sources of conflict in freelance delivery, precisely because it rarely surfaces during the project — it surfaces months later, when the client wants to hire a new developer and discovers the repository is still in the original freelancer's personal account, or when the freelancer reuses a utility function from one client's project in another client's work and gets an uncomfortable question about it. Documenting ownership clearly at handover isn't legal paperwork for its own sake; it's the record that prevents both of those situations from becoming disputes. This documentation is operational guidance, not a substitute for an actual contract reviewed by a qualified professional — but it's what makes the contract's terms visible and checkable in practice.

Three categories need to be distinguished explicitly. Client-specific work — the custom business workflows, the client's own database schema, project-specific integrations and configuration — is usually transferred to the client per the contract. Freelancer reusable knowledge — general code patterns, boilerplates, utility functions, generic UI components, internal tooling — may remain the freelancer's to reuse across other projects unless the contract says otherwise. Third-party assets — npm packages, fonts, stock images, payment providers — belong to neither side and carry their own license obligations that both parties need to respect regardless of who "owns" the project.

The repository ownership question and the final-payment linkage deserve explicit, written handling. The preferred model is the client owning the repository from the start, with the freelancer invited as a collaborator; the acceptable alternative is the freelancer holding the repository during development and transferring it after final payment and signoff — but if that's the model, the handover documentation needs to say so plainly, including the exact final commit or tag being transferred, so there's no ambiguity about what version constitutes "the delivered product."

```quiz
- q: "A delivered project contains your own utility library and an MIT-licensed package. Who owns what?"
  anchor: "third-party assets (owned by neither side, licenses must be respected)"
  options:
    - text: "The client owns all of it — they paid for the delivery"
      correct: false
      why: "Third-party assets are owned by neither side, and reusable components may remain reusable unless contracted otherwise."
    - text: "Client-specific work transfers; your reusable components may stay reusable; third-party assets belong to neither of you"
      correct: true
      why: "The third category is the one people forget — its licenses have to be respected regardless of the contract between you."
    - text: "You own all of it until a contract says otherwise"
      correct: false
      why: "Client-specific work is usually transferred, and no contract makes an MIT package yours."

- q: "Who should own the repository during the project?"
  anchor: "freelancer invited as collaborator during development and support"
  options:
    - text: "The freelancer, transferring it at handover"
      correct: false
      why: "The preferred model is client-owned from the start, with the freelancer invited as a collaborator."
    - text: "The client, with the freelancer invited as a collaborator"
      correct: true
      why: "It removes the transfer step, and post-handover access becomes an explicit field instead of an oversight."
    - text: "Whichever is convenient — it only matters at handover"
      correct: false
      why: "A freelancer left as sole owner of a production repository with no agreement to that effect is a liability for both sides."

- q: "Your contract ties source code transfer to final payment. What does the handover document do about it?"
  anchor: "the handover documentation should say so factually, without ambiguity about when transfer actually completes"
  options:
    - text: "Stay silent — that is a contract matter, not a documentation one"
      correct: false
      why: "The documentation should state it factually, so nobody is unclear about when transfer actually completes."
    - text: "State it explicitly, with no ambiguity about when transfer completes"
      correct: true
      why: "Ambiguity here is what turns a payment conversation into an ownership dispute."
    - text: "Reproduce the full contractual clause verbatim"
      correct: false
      why: "The document clarifies what happens; the enforceable terms stay in the contract."
```

## Key Concepts
- **This is operational guidance, not legal advice**: it clarifies what handover documentation should say; the actual enforceable terms belong in a contract reviewed by a qualified professional
- **Three ownership categories**: client-specific work (usually transferred), freelancer reusable components (may remain reusable unless contracted otherwise), and third-party assets (owned by neither side, licenses must be respected)
- **The source code handover block is a fixed set of fields**: repository URL, production branch, final commit/tag, delivered date, client access level, and freelancer access status after handover
- **Preferred model is client-owned from the start**: freelancer invited as collaborator during development and support, rather than the freelancer holding the repository long-term by default
- **Final-payment-gated transfer must be stated explicitly**: if source code transfer is contractually tied to final payment, the handover documentation should say so factually, without ambiguity about when transfer actually completes
- **License documentation for serious projects**: major open-source packages, paid plugins or themes, font and icon licenses, and stock image ownership should be listed, without guaranteeing legal compliance that hasn't actually been verified
- **Never leave ownership vague or silently retain sole control**: a freelancer remaining the sole owner of a production repository with no agreement to that effect is a liability for both sides, not a convenience

## Example Code
```template
## Source Code — Order Management Admin Panel

**Repository URL:** github.com/meridianretail/order-admin
**Production branch:** main
**Final commit/tag:** v1.0.0 (commit a3f9d12)
**Delivered date:** 2026-09-10
**Client access:** Owner (organization admin)
**Freelancer access after handover:** Removed
**Build status:** Passing, verified on 2026-09-10

## IP Clarification

### Client-Specific Work (transferred to client)
- Order status workflow logic and state machine
- Meridian-specific dashboard layout and reporting queries
- Custom CSV import/export mapping for Meridian's data format

### Freelancer Reusable Components (not client-exclusive, per contract)
- Generic role-based access control middleware
- Shared UI component library (buttons, tables, form primitives)
- Internal project scaffolding template

### Third-Party Assets (licensed, owned by neither party)
- Next.js, Prisma, Tailwind CSS (open source, MIT-licensed)
- Lucide icon set (ISC license)
- No paid plugins or stock imagery used in this project

## Final Payment Rule
Final source code transfer (removal of freelancer's residual repository
access) is completed after final invoice payment and project signoff, per
the signed contract dated 2026-08-26.
```

## When to Use
- At project kickoff, to decide and document the repository ownership model before development starts rather than defaulting into ambiguity
- At final handover, without exception, to record the exact final commit or tag being delivered alongside the ownership statement
- Whenever a freelancer reuses a general-purpose component across multiple client projects, to keep that component clearly categorized as reusable rather than accidentally implying client exclusivity
- When a contract ties source code transfer to final payment, as the trigger to document that condition explicitly rather than leaving the timing implicit

## Common Mistakes
- **Nobody ever wrote down who owns the repository, and six months later the client wants to hire a new developer** — Leaving source code ownership vague, so a later disagreement has no written reference to resolve it against
- **The repo gets transferred to the client's org with no record of which commit was the actual delivered version** — Transferring a repository without recording the final commit or tag, making it unclear exactly what version was actually delivered
- **A reusable utility library built for internal use gets listed as belonging exclusively to this one client** — Claiming ownership of general-purpose freelancer components as though they were assigned to the client when the contract never said so
- **The project delivered a year ago, and the production repository is still sitting in the freelancer's personal account** — Remaining the sole owner of a production repository indefinitely with no agreement or stated reason, creating an unplanned dependency on one person

## Further Reading
- Creative Commons and SPDX license identifiers — a starting reference for understanding common open-source license obligations before documenting third-party dependencies: https://spdx.org/licenses/
- GitHub, "Transferring a repository" documentation — the practical mechanics of a clean repository ownership transfer: https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository
- American Bar Association or a local equivalent, general guidance on software work-for-hire and IP assignment clauses — for the legal detail this lesson's operational guidance intentionally does not replace

```recall
- q: "What is the scope of this guidance?"
  must:
    - "it is operational guidance, not legal advice"
    - "it clarifies what handover documentation should say"
    - "the enforceable terms belong in a contract reviewed by a qualified professional"

- q: "Name the fields in the source code handover block."
  must:
    - "repository URL, and production branch"
    - "final commit or tag, and delivered date"
    - "client access level, and freelancer access status after handover"

- q: "Which licenses get documented, and with what caveat?"
  must:
    - "major open-source packages, paid plugins or themes, font and icon licenses, and stock image ownership"
    - "without guaranteeing legal compliance that has not actually been verified"
```
