# 269. Scope Ladders: Included-by-Default vs. Priced Add-Ons

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Project_Management/Documentation_and_Handover/Customer_Success_and_Support/Client_Delivery_Playbooks material to build out the Client Delivery, PM & Handover course; no existing coverage data for your own practice.

## What It Is
Lesson 267 introduced the delivery playbook as the internal record of how a recurring project type gets discovered, scoped, priced, and delivered. The scope ladder is the pricing-facing half of that playbook, and it deserves its own attention because it's the tool that turns "can we also get X" from an improvised negotiation into an instant, consistent answer. A scope ladder is a two-tier list built for a specific project type: everything included by default in the base price, and everything commonly requested but excluded, each pre-priced as an add-on. When a client asks for something on the excluded list, the answer isn't a fresh estimate built from scratch under time pressure — it's a number you already decided, calmly, before this particular client ever asked.

Building the ladder well means drawing the default line in the right place. The included tier should hold what nearly every client of that project type genuinely needs — for an admin panel, that's authentication, role-based access up to a few roles, a handful of core entities with full CRUD, and a basic dashboard. Anything that only some clients need, or that materially raises delivery risk or complexity, belongs on the add-on menu with a real price range attached — a sixth or seventh data entity, an extra third-party integration, advanced reporting. The add-on price doesn't need to be renegotiated project to project once it's been priced accurately a couple of times; it needs to be looked up and quoted.

The ladder also does quiet risk management that a plain feature list can't. Some requests aren't add-ons at all — they're signals that the whole project is bigger than the playbook assumes, and the ladder should say so explicitly with a reprice trigger: "the client mentions fifteen entities" isn't a $2,000 add-on, it's a signal to stop and rescope or phase the whole engagement. Without that distinction written down in advance, a request that's actually three times the assumed scope can slip through as if it were routine, because in the moment it's easier to say yes to "one more thing" than to recognize that the thing changes the shape of the project. The ladder is an internal document — the client sees the resulting proposal, with add-ons framed as options, not the raw internal pricing table — but every "yes, that's available for $X" a client hears in a sales call or a change-request conversation should be traceable back to a ladder that was built calmly, in advance, rather than invented on the spot.

## Key Concepts
- **Two tiers, not a flat feature list**: "Included by Default" (bundled into the base price) and "Commonly Excluded — Offer as Add-Ons" (a pre-priced menu, each item with a price range) give every scope question a fast, consistent answer
- **The default line is drawn by frequency and risk, not by what's easy to build**: baseline scope covers what nearly every client of that project type needs; add-ons cover what only some clients need or what materially increases complexity
- **Add-ons are pre-priced, not re-negotiated per project**: once an add-on's price range has proven accurate across a couple of projects, it's looked up rather than re-estimated from scratch every time a new client asks for it
- **A reprice trigger is not the same as an add-on**: a request that changes the scale of the whole project (far more entities, a fundamentally different user base) should be flagged to stop and rescope, not quietly absorbed as "just one more line item"
- **The ladder is internal; the proposal is the client-facing translation**: the client sees clean scope language and clear options in a proposal, not the raw internal pricing table used to build it
- **Every scope change still goes through the written change-request process**: the ladder makes pricing an add-on request fast, but it doesn't replace documenting the change and getting written approval before doing the work
- **The ladder is the pricing-facing half of the playbook (Lesson 267)**: it's built and revised the same way — after a project type has recurred enough to trust the pattern, and updated whenever a recurring request or a scope-scale surprise reveals a gap

## Example Code
```md
# Scope Ladder — Admin / Operations Panel Projects

## Included by Default
- Authentication: email/password login, role-based access (up to 3 roles)
- Up to 5 core data entities with full CRUD
- Dashboard with key metrics summary
- One-time CSV/Excel data import
- Audit log (who changed what, when)
- Basic search and filtering on all list views

## Add-On Menu (pre-priced)
| Add-on | Price Range |
|---|---|
| Each additional complex entity beyond 5 | $2,000–$4,000 |
| Advanced reporting / charts | $3,000–$6,000 |
| Each third-party API integration | $3,000–$7,500 |
| Complex approval workflow | $2,000–$4,000 |
| Mobile companion app | See mobile app playbook |

## Reprice Triggers — Stop and Rescope, Do Not Add-On
- Client describes 10+ distinct entity types ("we track fifteen things")
- Roles and permissions are undefined or contested internally
- Multi-tenant requirement surfaces (multiple client organizations in one system)
- Requested timeline is incompatible with even the minimal tier

## How This Is Used
1. During discovery, use this ladder to answer "is that included" instantly.
2. In the proposal, translate add-ons the client actually wants into named,
   priced line items — never expose this raw table to the client.
3. Any add-on requested after signing still goes through a written change
   request referencing this ladder's price range, not a fresh estimate.
```

## When to Use
- When building or updating a delivery playbook (Lesson 267) for a project type that has recurred enough to trust the pattern
- During a live proposal or discovery conversation, to answer a client's "can you also add X" with a pre-decided answer instead of an improvised one
- When the same "extra" keeps getting manually re-priced from scratch on every project, as the signal to formalize it into the add-on menu once and for all
- When a request appears that matches a reprice trigger, as the prompt to pause and rescope the engagement rather than absorb it as a minor add-on

## Common Mistakes
- Re-negotiating the price of the same common add-on from scratch on every project instead of maintaining one consistent, defensible number
- Making the included-by-default baseline so generous that margin disappears on a typical project of that type
- Showing the raw internal scope ladder to a client instead of translating chosen add-ons into clean, specific proposal language
- Treating a scope-scale request (a reprice trigger) as if it were just a bigger add-on, absorbing three times the intended scope into the original price

## Further Reading
- Ronald J. Baker, *Implementing Value Pricing* — on structuring productized, pre-priced service offerings instead of custom-quoting every request from scratch
- Blair Enns, *Pricing Creativity: A Guide to Profit Beyond the Billable Hour* — on pricing options and add-ons in a way that protects margin without turning every conversation into a negotiation
- John Warrillow, *Built to Sell* — on productizing a service business into a repeatable, well-defined offering, the same discipline that makes a scope ladder possible in the first place
