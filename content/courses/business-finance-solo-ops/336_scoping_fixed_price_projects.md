# 336. Scoping Fixed-Price Projects Without Scope Creep

## What It Is
> This lesson is general education, not financial or tax advice. Scope and change-request terms should be reflected in your written contract — consult a lawyer for significant fixed-price engagements.

Fixed-price projects are attractive to clients because the number never moves — which means all the risk of underestimation lands on you unless the scope is written with real precision. The discipline that prevents this isn't cleverness at pricing; it's discipline at defining, in writing, exactly what's included and exactly what isn't, before the contract is signed.

A well-scoped fixed-price package states its inclusions and exclusions side by side as a table, not as prose buried in a proposal — "up to 6 sections" next to "no e-commerce," "2 revision rounds" next to "no custom animations." It defines the phases and their approximate durations, so both sides know what "on track" looks like partway through. And critically, it names its own red flags in advance: the client wants "just like competitor X" with no content ready, there's no existing domain or hosting, the client has an unusual number of stakeholders, or they've already signaled they'll want changes after the included revision rounds are used up. Naming these in advance means they're handled by the process ("that's a change request") instead of becoming an argument in week three.

The size of the project changes what kind of scoping is needed. A landing page can be scoped from a short brief. An admin panel or anything with role-based permissions almost always needs a paid or explicitly time-boxed data-modeling workshop before a number can be quoted responsibly — quoting blind on undefined roles and entities is one of the most common sources of catastrophic scope creep in custom software work. When a project touches an unknown legacy codebase, the correct answer is never to guess; it's to sell a paid audit first and scope the fixed-price project only after the audit removes the biggest unknowns.

```quiz
- q: "A client wants a fixed price to extend an existing codebase you have never seen. What do you sell first?"
  anchor: "never quote a fixed price against a system you haven't actually inspected"
  options:
    - text: "The fixed price, with a generous risk buffer"
      correct: false
      why: "A buffer prices uncertainty you can size. You cannot size an unknown codebase from outside it."
    - text: "A paid audit — never quote fixed against an uninspected system"
      correct: true
      why: "The parallel rule is the paid discovery workshop, for undefined roles, permissions or entities."
    - text: "A time-and-materials contract, so the risk sits with the client"
      correct: false
      why: "Sometimes the right call, and not the rule this lesson states for the fixed-price case."

- q: "Why a side-by-side inclusion/exclusion table rather than scope described in the proposal text?"
  anchor: "not embedded in narrative proposal text — this is what a client actually reads before signing"
  options:
    - text: "It is shorter, and shorter proposals close faster"
      correct: false
      why: "Length is not the argument. What the client actually reads is."
    - text: "It is what the client actually reads before signing"
      correct: true
      why: "Scope buried in narrative text is scope that was never really agreed."
    - text: "The change request process cannot function without it"
      correct: false
      why: "The CR process does need a baseline, but the table's justification here is about what gets read."

- q: "The client asks for a fourth round of revisions on a three-round package. What is that?"
  anchor: "anything beyond that is a change request, not free rework"
  options:
    - text: "Free rework — revisions are part of delivery"
      correct: false
      why: "*Included* revisions are part of delivery. The fourth round is past what was included."
    - text: "A change request, not free rework"
      correct: true
      why: "Which is exactly why the number has to be specific and stated up front."
    - text: "A scope dispute requiring the whole contract to be renegotiated"
      correct: false
      why: "The change request process exists so this is a routine step rather than a renegotiation."
```

## Key Concepts
- **Inclusion/exclusion table**: state exactly what's in and out side by side, not embedded in narrative proposal text — this is what a client actually reads before signing.
- **Phased delivery structure**: break the fixed-price project into named phases with rough durations (brief/content collection, development, review, launch) so "on track" is observable mid-project.
- **Named red flags**: identify in advance the specific signals that predict scope trouble for this project type — missing content, no existing hosting, an undefined data model, a client history of "just one more small change."
- **Revision round limits**: define a specific number of included revision rounds; anything beyond that is a change request, not free rework.
- **Workshop-before-quote rule**: for anything involving undefined roles, permissions, or entities (most admin panels and internal tools), scope a paid discovery workshop before quoting the fixed price.
- **Audit-before-quote rule**: for any project touching an unknown existing codebase, sell a paid audit first — never quote a fixed price against a system you haven't actually inspected.
- **Change request process**: every fixed-price package needs an explicit path for "what happens when the client asks for something not in scope" — without this, every such request becomes a negotiation from scratch.

## Example Code
A scope table and change-request rule applied to a real fixed-price offer:

```md
## Admin Panel MVP — Scope Table

| Included                          | Excluded                         |
|-----------------------------------|-----------------------------------|
| Auth + 2-3 roles                  | Mobile app                        |
| Up to 5 core data entities (CRUD) | Complex reporting/BI              |
| Dashboard with key metrics        | Third-party integrations (add-on) |
| CSV/Excel data import             | Multi-tenant support              |
| Audit log                         | Ongoing feature development       |

Red flags (reprice or add a workshop if present):
- Client hasn't defined roles/permissions -> require data-modeling
  workshop before quoting a fixed number
- "We actually have 15 entity types" -> reprice or split into phases
- Existing data in inconsistent spreadsheet formats -> add a paid
  data-cleaning sprint

Phases: 1) Data modeling workshop (2d) 2) Backend (7d) 3) UI (8d)
4) UAT (4d) 5) Deploy + handover (2d)

Change request rule: any request outside the table above is scoped
and priced separately before starting, in writing, via a one-line
change order — never absorbed silently into the current phase.
```
The red-flag list did the real work here: "we actually have 15 entity types" is caught by the checklist before the quote goes out, not discovered mid-project when it's expensive to renegotiate.

## When to Use
- Before quoting any fixed-price project, especially one involving user roles, permissions, or multiple data entities.
- When a client's request pattern during discovery already resembles a listed red flag.
- Immediately when any request arrives that isn't in the written scope table — to route it through the change-request process rather than absorb it silently.
- When a project touches an existing codebase you haven't personally inspected — to insert a paid audit before any fixed number is quoted.

## Common Mistakes
- **The admin panel quote goes out before anyone's defined what the user roles or data entities actually are** — Quoting a fixed price against undefined data entities, roles, or permissions instead of scoping a workshop first.
- **The proposal says "revisions included" with no number attached** — Leaving revision rounds unlimited or vaguely defined, so every future request becomes a negotiation instead of a scoped change request.
- **A fixed price goes out for work on an existing codebase nobody's actually opened yet** — Quoting a fixed price on an unfamiliar existing codebase without an audit, absorbing the resulting surprises as unpaid rework.
- **The discovery call surfaced three warning signs, and none of them made it into the scope document** — Failing to write red flags into the scope document, so warning signs observed during discovery never actually change the quote.

## Further Reading
- *Managing Successful Projects with PRINCE2* (or any standard scope-management reference): the general discipline of defining boundaries before committing to a fixed number applies directly here.

```recall
- q: "What is the phased delivery structure for, and which phases does it name?"
  must:
    - "named phases with rough durations — brief and content collection, development, review, launch"
    - "so that \"on track\" is observable mid-project"

- q: "What are named red flags? Give examples."
  must:
    - "signals identified in advance that predict scope trouble for this project type"
    - "missing content, no existing hosting, an undefined data model, a client history of \"just one more small change\""

- q: "State the workshop-before-quote rule."
  must:
    - "for anything involving undefined roles, permissions or entities — most admin panels and internal tools"
    - "scope a paid discovery workshop before quoting the fixed price"
```
