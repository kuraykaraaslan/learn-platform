# 384. Market and Competitive Positioning — Build, Buy, or Differentiate

## What It Is
Not every software idea deserves a custom build, and market and competitive positioning is the gate that decides whether to build, buy, integrate, or reframe before a single requirement gets written. It sits ahead of problem framing (lesson 372) in practice, even though it's easy to skip: a client who says "I want something like Ticketmaster" or "build me a Shopify for my industry" hasn't given you a problem statement, they've given you a competitor name, and jumping straight into architecture on that basis produces a project shaped like a shallow clone of someone else's platform instead of a solution to the client's actual gap.

The build-vs-buy matrix is the practical tool: a standard commodity need should be bought or run on existing SaaS, a unique workflow or data model justifies a custom build, an existing tool that mostly works but doesn't connect to internal systems calls for integration rather than replacement, and a request to clone a mature platform with no stated differentiation should be reframed or declined outright. The reframing question is always the same: which specific workflow do you need from that product, and what is different about your market, users, operations, or business model that a generic version of it doesn't serve? A regional field-service company asking for "something like ServiceTitan" usually isn't asking for ServiceTitan's full invoicing-and-payroll suite — they're asking for the calendar-first dispatch view, at a price and complexity level ServiceTitan doesn't offer a six-technician crew.

Once building is justified, differentiation has to be structural, not cosmetic — a nicer UI on top of the same workflow as three existing competitors is not a defensible product decision, it's a redesign with extra steps. Real differentiation types include a specific industry workflow, a local market or regulatory requirement, a custom approval process, integration with the client's existing internal systems, a genuinely different data model, better operational UX for a specific role the incumbents ignore, a different pricing model, or a service layer wrapped around the product. Naming which of these actually applies — and admitting when none of them do — is what separates a positioning decision from wishful thinking.

## Key Concepts
- **Build vs. buy matrix**: commodity need → buy/SaaS; unique workflow/data model → build; usable tool missing integration → integrate/automate; clone request with no differentiation → reframe or reject; regulated/internal process → custom with compliance awareness
- **The "clone X" anti-pattern**: accepting a competitor name as a product strategy instead of extracting the specific workflow and market difference behind the request
- **Reframing question**: which specific workflow is needed from that product, and what about this market/user/operations/business model is different?
- **Differentiation types (eight)**: industry workflow, local market/regulatory requirement, custom approval process, internal system integration, unique data model, underserved operational UX, pricing model, service layer
- **Competitive framing template fields**: current alternatives, why alternatives fail, what to copy conceptually, what not to copy, differentiation, build-vs-buy decision
- **Cosmetic vs. structural differentiation**: a better interface alone rarely justifies a full custom build against a mature, well-funded incumbent
- **Sequencing**: this gate runs before MVP scoping (lesson 375) — an MVP scoped against an unexamined "clone X" request inherits that request's shape by default

## Example Code
```template
## Competitive Context — Crew Scheduler

**Current alternatives:** ServiceTitan, Jobber, and a shared Google Sheet
(the client's actual current process).

**Why alternatives fail:**
- ServiceTitan is built for 50+ technician operations; per-seat pricing and
  onboarding complexity don't fit a 6-person crew.
- Jobber is closer in size but bundles invoicing/payroll the client doesn't
  need yet and doesn't support the client's preferred SMS carrier well.
- The spreadsheet has no conflict detection, which is the actual pain point.

**What we should copy conceptually:**
- Calendar-first dispatch view (this is the workflow the client actually wants
  from "something like ServiceTitan").
- Mobile-friendly technician notification.

**What we should not copy:**
- Full invoicing/payroll suite.
- Multi-department admin hierarchy the client doesn't have.
- Per-seat enterprise pricing model.

**Differentiation:** Dead-simple, SMS-first, conflict-free scheduling for small
regional crews who are priced out of or overwhelmed by enterprise field-service
platforms.

**Build-vs-buy decision:** Build a narrow MVP focused on scheduling and
conflict detection only. Do not attempt to rebuild ServiceTitan's feature
surface — recommend the client keep using accounting software they already
have rather than build that layer.
```

## When to Use
- The moment a client or stakeholder names a competitor product instead of describing a problem — before any scoping conversation continues
- Before quoting a price or timeline for a "build me something like X" request
- When evaluating whether a recurring feature request is actually a sign the product should integrate with an existing tool instead of rebuilding its functionality
- Periodically after launch, as competitors evolve and yesterday's differentiation becomes today's table stakes
- Before MVP scoping (lesson 375) starts, so the MVP is shaped by the client's real gap rather than by an unexamined reference product

## Common Mistakes
- **"Build me something like ServiceTitan" gets scoped as literally that, with nobody asking which specific workflow is actually needed** — Accepting "build me a clone of X" literally instead of extracting the specific workflow and market difference that makes a custom build justified
- **An existing tool almost does the job except for one missing integration, and the answer is to build a full custom replacement anyway** — Treating any feature gap in an existing tool as automatic justification to build a full custom replacement instead of considering integration
- **The pitch to the client is "same workflow as the incumbent, just a nicer interface"** — Presenting UI polish as differentiation against a mature, well-resourced competitor
- Skipping this gate for smaller projects, which often produces the most bloated MVPs — a small client asking for "something like X" absorbs the incumbent's entire feature shape by default if nobody reframes the request
- **The differentiation story from launch day is still being told two years later, even though every competitor has since caught up** — Never revisiting positioning after launch, so the differentiation that justified the build quietly stops being true as competitors catch up

## Further Reading
- Geoffrey A. Moore — "Crossing the Chasm" (positioning against a market category, not just a competitor)
- Peter Thiel — "Zero to One" (on differentiation as the alternative to head-on competition)
- Clayton Christensen — "Competing Against Luck" (on what a customer is actually "hiring" a product to do, which is what real differentiation has to serve)
