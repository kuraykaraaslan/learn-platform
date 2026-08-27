# 336. Scoping Fixed-Price Projects Without Scope Creep

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Business_Growth/Sales_Growth/Finance_and_Operations/Analytics_and_Growth_Experiments/Business_Continuity/Offer_Library material to build out the Business Growth & Finance course; no existing coverage data for your own practice.

## What It Is
Fixed-price projects are attractive to clients because the number never moves — which means all the risk of underestimation lands on you unless the scope is written with real precision. The discipline that prevents this isn't cleverness at pricing; it's discipline at defining, in writing, exactly what's included and exactly what isn't, before the contract is signed.

A well-scoped fixed-price package states its inclusions and exclusions side by side as a table, not as prose buried in a proposal — "up to 6 sections" next to "no e-commerce," "2 revision rounds" next to "no custom animations." It defines the phases and their approximate durations, so both sides know what "on track" looks like partway through. And critically, it names its own red flags in advance: the client wants "just like competitor X" with no content ready, there's no existing domain or hosting, the client has an unusual number of stakeholders, or they've already signaled they'll want changes after the included revision rounds are used up. Naming these in advance means they're handled by the process ("that's a change request") instead of becoming an argument in week three.

The size of the project changes what kind of scoping is needed. A landing page can be scoped from a short brief. An admin panel or anything with role-based permissions almost always needs a paid or explicitly time-boxed data-modeling workshop before a number can be quoted responsibly — quoting blind on undefined roles and entities is one of the most common sources of catastrophic scope creep in custom software work. When a project touches an unknown legacy codebase, the correct answer is never to guess; it's to sell a paid audit first and scope the fixed-price project only after the audit removes the biggest unknowns.

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
- Quoting a fixed price against undefined data entities, roles, or permissions instead of scoping a workshop first.
- Leaving revision rounds unlimited or vaguely defined, so every future request becomes a negotiation instead of a scoped change request.
- Quoting a fixed price on an unfamiliar existing codebase without an audit, absorbing the resulting surprises as unpaid rework.
- Failing to write red flags into the scope document, so warning signs observed during discovery never actually change the quote.

## Further Reading
- *Managing Successful Projects with PRINCE2* (or any standard scope-management reference): the general discipline of defining boundaries before committing to a fixed number applies directly here.
- The Offer_Library fixed-price-packages examples show fully worked inclusion/exclusion tables and phase breakdowns worth adapting directly.
- This lesson is general education, not financial or tax advice. Scope and change-request terms should be reflected in your written contract — consult a lawyer for significant fixed-price engagements.
