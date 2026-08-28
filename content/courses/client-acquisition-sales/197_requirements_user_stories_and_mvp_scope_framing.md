# 197. Requirements, User Stories & MVP Scope Framing

## What It Is
Discovery notes are conversational and loose by nature; requirements have to be specific enough to estimate, prioritize, and eventually test, which means converting one into the other is its own discipline rather than a formatting exercise. The user-story shape — "as a \<role\>, I want to \<action\>, so that \<benefit\>" — forces every requirement to name who benefits and why, which immediately exposes vague requests: "modern dashboard," "secure login," and "good UI" can't actually be written as a real user story, because there's no role and no concrete action behind them, only an adjective. Acceptance criteria in "given/when/then" form does the same forcing function on testability: "given an admin is creating an event, when required fields are missing, then the system prevents publishing and shows field-level validation errors" is something that can be checked as true or false, where "the form should validate properly" can't be. Every serious requirement carries a role, an action, a business rule, acceptance criteria, a priority, and its own open questions — and a priority scheme with real teeth (P0 required for a usable first release, P1 important but not launch-blocking, P2 nice-to-have, P3 a future idea with no commitment) only works if P0 is actually rare. A requirement list where everything is P0 hasn't been prioritized at all; it's a wishlist wearing prioritization's clothes.

MVP framing is the layer above individual requirements, and it starts by refusing a common misconception: an MVP is not a cut-rate or unfinished version of the full product, it's the smallest version that is both professional and proves the core workflow actually works. What belongs in it — one core user role, the core workflow itself, minimum admin control, the required data model, basic security, deployment, and handover — is a much shorter list than what a client's initial ambition usually contains, and what gets explicitly excluded (advanced automation, a large reporting suite, multi-language, a mobile app, deep integrations) unless one of those is actually load-bearing for the core workflow is just as important to state out loud as what's included. Three buckets keep the conversation from collapsing everything into "phase one": Version 1 (must exist for launch), Phase 2 (valuable after launch), and Roadmap (future ideas with no commitment) — and every feature discussed during the call gets sorted into exactly one of the three before the call ends, not left floating as an unstated assumption that it's obviously included.

The bucket structure also supplies the answer to the single most predictable scope trap: the client who describes their idea by naming an existing platform — "like Airbnb," "like Uber for X." Responding by trying to scope a full clone at a fraction of what such a platform actually costs sets an expectation that can never be met; the correct response treats the reference as a direction, not a spec, and immediately moves the conversation to which specific workflows the client actually needs first. Locking language matters here too — "for proposal purposes, I will define version one around these workflows; anything outside that list is a future phase or change request" — stated plainly enough that everyone in the room understands the boundary is real, because scope that accumulates through a string of casually-agreed "small additions" during the call is scope that never gets written down and then reappears as a dispute during delivery.

## Key Concepts
- **The user story format forces specificity**: "as a \<role\>, I want to \<action\>, so that \<benefit\>" can't absorb vague requests — a requirement without a real role and action isn't a requirement yet.
- **Given/when/then acceptance criteria make requirements testable**: a criterion that can't be checked true or false isn't a criterion, it's a hope.
- **Requirement categories**: functional, business rule, data, integration, admin, security, reporting, non-functional — sorting requirements by type surfaces gaps a flat feature list hides.
- **A real priority scheme (P0-P3) only works if P0 stays rare**: everything marked required for launch means nothing has actually been prioritized.
- **MVP is the smallest professional version, not a cut-rate one**: it still needs real security, a real data model, and real deployment — just scoped to the one workflow that proves the concept.
- **The three-bucket scope split**: Version 1 (must exist) / Phase 2 (valuable after launch) / Roadmap (future idea, no commitment) — every discussed feature lands in exactly one bucket before the call ends.
- **The "like X platform" trap**: treat a named reference product as a direction, not a spec — scope the specific workflows needed, never a clone of the whole platform.
- **Scope-locking language stated out loud**: "anything outside this list is a future phase or change request" — said during discovery, not discovered as a dispute during delivery.

## Example Code

**Requirement record:**

```text
ID:            REQ-001
Priority:      P0 / P1 / P2 / P3
User role:     
Story:         As a <role>, I want to <action>, so that <benefit>.
Business rules:
  - 
Acceptance criteria:
  Given <context>, when <action>, then <expected result>.
Open questions:
  - 
```

**MVP scope buckets:**

```text
Version 1 (must exist for launch):
  - 
  - 
Phase 2 (valuable after launch):
  - 
  - 
Roadmap (future ideas, not committed):
  - 
  - 

Scope-lock statement:
"For proposal purposes, version one is defined around the workflows above.
Anything outside that list is a future phase or change request."
```

## When to Use
- Converting raw discovery notes into requirements that can actually be estimated, prioritized, and later tested.
- Any time a client's request is phrased as an adjective ("modern," "secure," "fast") instead of a role and an action.
- The moment a client describes their idea as "like \<existing platform\>" and a full-clone scope creep risk appears.
- Sorting every feature mentioned in a call into Version 1 / Phase 2 / Roadmap before the call ends, so nothing is left as an unstated assumption.

## Common Mistakes
- **A requirements doc lists feature names and adjectives like "fast search" and "modern UI"** — Writing requirements as feature names or adjectives instead of a role, an action, and a testable outcome.
- **Every requirement in the doc ends up marked P0** — Letting every requirement end up marked P0, which means nothing was actually prioritized.
- **A client says they want something "like Airbnb"** — Scoping a client's "like Airbnb" reference as a literal clone instead of extracting the specific workflows actually needed.
- **A client casually mentions three extra features during a call, none of them written down as scope decisions** — Letting casually-mentioned extra features accumulate as implied scope instead of sorting each one into a bucket on the spot.
- **The project is scoped as an MVP** — Treating MVP as an excuse to skip real security, deployment, or data-model quality rather than as a scope boundary.

## Further Reading
- *User Story Mapping* — Jeff Patton: organizing requirements around real user workflows instead of a flat, unordered feature backlog.
- *Inspired* — Marty Cagan: separating what a first version must prove from what can safely wait, from a product-management rather than an implementation angle.
- *The Lean Startup* — Eric Ries: the discipline behind building the smallest version that actually validates the core assumption, which is the same discipline MVP scope framing borrows from.
