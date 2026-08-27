# 210. Scope Definition and Boundaries

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Proposal_and_Pricing/Contract_and_Scope/Legal_and_Contractor material to build out the Proposals, Contracts & Pricing course; no existing coverage data for your own practice.

## What It Is
Almost every freelance project dispute traces back to the same root cause: the client and the developer used the same words to imagine two different products. "Admin panel," "full integration," and "modern design" all sound like agreements in a sales conversation, but none of them describe anything a court, a client, or a future you could actually verify. Scope definition is the discipline of converting those phrases into a list of modules, workflows, screens, and exclusions specific enough that anyone reading it would build the same thing.

Scope has two halves, and both are mandatory. The included half lists exactly what workflows, screens, roles, integrations, and environments are being built, with a stated business purpose for each module. The excluded half is just as important — it names, explicitly, the things a reasonable client might assume are included but are not: native mobile apps, advanced analytics, multi-language content, data migration from an unreviewed source. Exclusions should never read as apologetic; a professional scope document states them as plainly as the inclusions.

Scope also needs a boundary between now and later. The MVP boundary rule splits every idea into must-have for first usable launch, should-have after validation, could-have eventually, and explicitly not included. A document that calls everything "must-have" has not actually scoped anything — it has just relabeled a wishlist. Anything too vague to estimate — an undocumented integration, an unreviewed legacy codebase, a feature described only by comparison to a famous app — does not belong in fixed scope at all. It becomes a stated assumption, a paid discovery item, or a future phase, never a silent gap that gets absorbed later.

This lesson produces the raw material other contract documents depend on: the Statement of Work is built from this scope, acceptance criteria are tested against it, and change requests are judged by comparison to it. Get the boundary fuzzy here and every downstream document inherits the fuzziness. None of the language below is a substitute for having your actual contract template reviewed by a lawyer in your jurisdiction — this lesson teaches how to think about scope, not a filed legal instrument.

## Key Concepts
- **Included vs. excluded scope**: every module needs a stated purpose, included workflows/screens/API behavior, and testable acceptance criteria; exclusions are listed by name, not implied by silence.
- **Boundary categories**: functional (features, roles, workflows), technical (architecture, environments, integrations), content (copy, translations, legal text), design (UI, responsive behavior, brand assets), and operational (training, handover, support) — each needs its own included/excluded pass.
- **MVP boundary rule**: must-have for launch / should-have after validation / could-have later / not included — four buckets, not two.
- **Ambiguity rule**: forbidden filler phrases ("etc.," "and more," "full admin panel," "basic SEO," "small changes included") must be rewritten as specific, countable deliverables before a scope document is considered ready.
- **Undefinable-scope rule**: anything too vague to estimate becomes an assumption, a paid discovery item, or a future phase — never silently absorbed into fixed scope.

## Example Code
```markdown
## Included Scope

### Module: Order Management
**Purpose:** Let staff track customer orders from creation to fulfillment.
**Included workflows:**
- Create order, edit order line items, cancel order, mark order fulfilled
**Included screens:**
- Order list (search, filter, pagination), order detail, order edit form
**Included backend/API behavior:**
- Order CRUD endpoints, status transition validation, audit log entry per change
**Acceptance criteria:**
- Staff user can create an order, change its status through the defined states,
  and see the change reflected in the order list without a page reload.

## Excluded Scope
The following are not included unless added through a written change request:
- Native iOS/Android order management apps
- Multi-warehouse inventory sync
- Automated fraud scoring on orders
- Data migration from the client's legacy spreadsheet system

## MVP Boundary
| Item | Bucket |
|---|---|
| Order create/edit/cancel | Must-have |
| Order status history timeline | Should-have (v1.1) |
| Bulk order import | Could-have |
| Multi-warehouse sync | Not included |
```

## When to Use
- Before writing a Statement of Work, proposal, or estimate for any custom project.
- Whenever a feature request is described in terms of an existing product ("like X but for Y") rather than concrete workflows.
- When separating an MVP from the client's full long-term vision.
- Any time you notice yourself reaching for a vague, comfortable phrase like "full" or "complete" instead of a specific list.

## Common Mistakes
- Writing an inclusions list without a matching exclusions list, leaving unstated assumptions for both sides to fill in differently.
- Calling something MVP while quietly including every feature the client has ever mentioned.
- Letting a feature stay in fixed scope because it "shouldn't be too hard," without actually being able to describe it.
- Treating boundary categories unevenly — nailing down functional scope while leaving content, design, or operational scope completely undefined.

## Further Reading
- Mike Monteiro, *You're My Favorite Client* — on writing scope that protects both the studio and the client relationship.
- Blair Enns, *Pricing Creativity: A Guide to Profit Beyond the Billable Hour* — on why undefined scope precedes every failed pricing model.
- The Project Management Institute's *Practice Standard for Work Breakdown Structures* — a formal treatment of decomposing vague goals into verifiable deliverables.
