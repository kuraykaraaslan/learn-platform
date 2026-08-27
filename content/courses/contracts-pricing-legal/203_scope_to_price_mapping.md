# 203. Scope-to-Price Mapping — Turning Requirements into a Priced Breakdown

## What It Is
A price that isn't traceable back to specific scope is just a number the client has to take on faith — and numbers taken on faith get argued about the moment reality diverges from expectation. Scope-to-price mapping is the practice of breaking a project into discrete modules (discovery, UI, frontend, backend, database, auth, admin, integrations, notifications, reporting, testing, deployment, documentation, training) and explicitly marking each one as included, excluded, optional, future-phase, or a client responsibility before a single total is presented.

This does two things at once. First, it makes the price defensible: if a client asks "why does this cost what it does," you can point at the module table instead of restating a vague sense of effort. Second, it makes scope negotiation concrete — when budget is tight, the conversation becomes "which modules do we cut or defer" instead of "can you just do it cheaper," which is a completely different and much healthier negotiation.

The other half of this discipline is recognizing complexity signals that should raise the price even when the feature list looks similar on paper: multiple user roles, complex permissions, payments, real-time behavior, multi-tenancy, third-party integrations, legacy code, data migration, and unclear business rules. Two projects that both say "admin panel with user management" can differ by a factor of five in effort depending on how many of these signals are present — the module breakdown is where that difference becomes visible and priceable, rather than being absorbed silently into an underestimated flat number.

## Key Concepts
- **Module breakdown**: decomposing a project into standard software delivery categories rather than pricing off a paragraph of prose.
- **Inclusion status per module**: included / excluded / optional / future phase / client responsibility — every module gets one of these labels, with none left implicit.
- **Complexity signals**: multiple roles, payments, real-time features, integrations, legacy code, and migration are reliable predictors that a module costs more than its name suggests.
- **Tiered scope options**: presenting Lean / Standard / Standard+Maintenance as options that differ by scope, not simply by a discount on the same feature list.
- **Traceable pricing**: every dollar in the final number should be explainable by pointing at specific included modules, not defended by asserting "it's a fair price for the effort."
- **Unknowns as a category**: modules marked "unknown" are flagged for discovery or paid investigation, not silently priced as if fully understood.

## Example Code
```markdown
## Scope-to-Price Map — [Project Name]

| Module | Included? | Notes | Complexity signal |
|---|---|---|---|
| Discovery & planning | Yes | 2-day kickoff | — |
| Auth & roles | Yes | Email/password, 2 roles | Multiple roles |
| Admin panel | Yes | CRUD, search, filters | — |
| Payments | Yes | Stripe, single currency | Payment integration |
| Reporting/export | Optional | CSV export only | — |
| Data migration | Unknown | Source DB not yet reviewed | Legacy code risk |
| Mobile app | Excluded | Future phase | — |
| Deployment & handover | Yes | Staging + production | — |

**Assumptions:** existing data has not been reviewed; migration scope pending inspection.
**Exclusions:** native mobile app, advanced analytics, multi-language content.
**Recommended pricing model:** Phased fixed price (Phase 1 above; migration scoped separately after review).
```

## When to Use
- Any time you're preparing a fixed-price or phased-fixed-price proposal.
- When a client pushes back on total price and you need to show what specifically the number buys.
- When comparing your own quote against a competitor's — line up modules, not just totals.
- When deciding what to cut to fit a smaller budget, rather than discounting the same scope.

## Common Mistakes
- Pricing by page count or screen count while ignoring backend, database, and deployment effort entirely.
- Leaving integrations as a vague inclusion ("third-party integrations included") instead of naming which ones and what happens if more appear.
- Letting "small extra features" slip in without being logged as their own module and change request.
- Building three pricing tiers that differ only by price, not by which modules are actually included — clients see through this immediately.

## Further Reading
- Blair Enns, *Pricing Creativity: A Guide to Profit Beyond the Billable Hour* — on structuring options around scope rather than discounting.
- Jason Fried & DHH, *It Doesn't Have to Be Crazy at Work* / Basecamp's public writing on fixed-price, fixed-scope project structuring (signalvnoise.com archives).
