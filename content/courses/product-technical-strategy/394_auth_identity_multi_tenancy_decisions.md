# 394. Auth, Identity, and Multi-Tenancy Architecture Decisions

## What It Is
This lesson sits upstream of RBAC/ABAC implementation and session-token mechanics, which are covered elsewhere in this curriculum's security material. Here, the decisions are: who owns identity, which authentication model actually fits the project, and whether the system needs tenant isolation at all — before any of that gets implemented. The identity questions come first: can users self-register or is invitation required, is social login or SSO actually required by the client's environment or just aesthetically appealing, who owns the identity data, and what happens operationally when a user leaves the organization. For most SME and internal systems, email/password or invitation-based login is genuinely enough — SSO and social login are additions justified by a specific, stated requirement, not defaults reached for because they seem more professional.

Multi-tenancy is a major architecture decision, not a casual one, because it touches the data model, authorization, billing, support, analytics, backups, and security all at once. The trigger question is "do multiple companies or organizations actually need isolated data and roles," not "should we add a tenantId column just in case it's useful later." Once the answer is genuinely yes, the isolation model sits on a spectrum: shared database with shared schema and strict tenantId enforcement, shared database with a separate schema per tenant, or a fully separate database per tenant. The default for an early SaaS MVP is the cheapest end of that spectrum — shared schema with strict, server-side tenant filtering on every query — reserving heavier isolation for when compliance requirements, enterprise contracts, or genuine per-tenant operational needs actually demand it. Every tenant-scoped query has to enforce that scope server-side; frontend filtering is not isolation.

Cross-jurisdiction tenancy raises the isolation bar independent of technical preference. When tenants in different legal jurisdictions — a GDPR-covered EU company and a KVKK-covered Turkish company, for instance — share the same shared-schema infrastructure, a most-restrictive-law-wins rule applies to whatever they share: if personal data flows through shared audit logs or shared analytics, GDPR's stricter standard effectively governs the whole shared surface. The practical response is not to lift every tenant to the highest common burden, but to isolate the stricter tenants at the schema or database level instead. This has a concrete architectural consequence: a GDPR erasure request must be fulfillable per tenant, including from backups — which means a backup-purge flag scoped per tenant is a real architecture requirement, not a legal footnote to handle later.

```quiz
- q: "A client asks for SSO. What decides whether it goes in?"
  anchor: "SSO and social login are additions justified by a specific, stated requirement, not defaults reached for because they seem more professional"
  options:
    - text: "Whether it is technically feasible in the chosen stack"
      correct: false
      why: "Feasibility is not the question. The question is whether a specific stated requirement calls for it."
    - text: "Whether the client's environment actually requires it, rather than it simply seeming more professional"
      correct: true
      why: "For most SME and internal systems, email/password or invitation-based login is genuinely enough."
    - text: "Whether the system is multi-tenant, since the two decisions travel together"
      correct: false
      why: "They are separate decisions, and tenancy has its own trigger question."

- q: "What is the trigger question for multi-tenancy?"
  anchor: "do multiple companies or organizations actually need isolated data and roles"
  options:
    - text: "Should we add a tenantId column now, in case it is useful later"
      correct: false
      why: "Named explicitly as the wrong question — tenancy touches the data model, authorization, billing, support, analytics, backups and security all at once."
    - text: "Do multiple companies or organizations actually need isolated data and roles"
      correct: true
      why: "A major architecture decision needs a real yes, not a hedge."
    - text: "Will the product eventually be sold to more than one customer"
      correct: false
      why: "Having many customers is not the same as needing isolated data and roles between them."

- q: "A GDPR-covered EU tenant and a KVKK-covered Turkish tenant share the same shared-schema infrastructure. What follows?"
  anchor: "a most-restrictive-law-wins rule applies to whatever they share"
  options:
    - text: "Each tenant stays governed by its own law, since rows are filtered by tenantId"
      correct: false
      why: "Not for what they share — if personal data flows through shared audit logs or shared analytics, the stricter standard effectively governs that whole surface."
    - text: "The stricter standard governs the shared surface, so the practical answer is isolating the stricter tenant at schema or database level"
      correct: true
      why: "Rather than lifting every tenant to the highest common burden."
    - text: "Every tenant must be raised to the stricter standard"
      correct: false
      why: "That is the response the lesson explicitly does not recommend."
```

## Key Concepts
- **Identity questions checklist**: self-registration vs. invitation-only, SSO/social login actually required vs. aesthetically desired, identity data ownership, offboarding behavior when a user leaves
- **Authentication model selection**: email/password, magic link, OAuth/social login, enterprise SSO, API keys/service tokens — chosen by actual requirement, not maximal capability
- **Multi-tenancy trigger question**: "do multiple orgs need isolated data and roles" (a real requirement) vs. "add tenantId just in case" (premature complexity)
- **Tenancy model spectrum**: shared schema + tenantId (cheapest, default for early SaaS) → separate schema per tenant (stronger separation, more migration overhead) → separate database per tenant (strongest isolation, highest operational cost)
- **Required tenancy design fields**: tenant entity, membership model, roles per tenant, tenant-scoped vs. global resources, tenant settings, billing/quota model, tenant audit logs, tenant data export/deletion
- **Server-side tenant enforcement**: every tenant-scoped query must filter by tenant server-side; frontend-only filtering is not isolation
- **Cross-jurisdiction rule**: most-restrictive-law-wins for shared infrastructure components; isolate the stricter tenants rather than raising every tenant's burden; per-tenant backup-purge flag needed to satisfy erasure requests from backups
- **Explicit boundary**: RBAC/ABAC implementation details and JWT/session mechanics are covered in this curriculum's security material; this lesson is the upstream "do we need this, and at what isolation level" decision

## Example Code
```template
## Identity & Tenancy Decision — Crew Scheduler

### Identity Model (Pilot)
- **Registration:** Invitation-only — coordinator account created by the dev
  team during onboarding, no public self-registration
- **SSO/social login:** Not required — client has no existing identity provider
- **Identity ownership:** This system owns coordinator and technician contact
  records; no external identity provider involved
- **Offboarding:** Coordinator can deactivate a technician record; deactivated
  technicians cannot be assigned new jobs but historical assignments remain

### Multi-Tenancy Trigger Assessment
**Current state:** Single client, single region — no multi-tenancy required
for pilot.
**Trigger for reassessment:** Client signs a second regional crew, or the
product is sold to a second company — at that point the isolation model below
applies.

### Isolation Model (When Triggered)
**Default:** Shared database, shared schema, strict `tenant_id` enforcement
on every query — matches the SaaS-MVP default, appropriate for the client
profile (general commercial SaaS, no regulated-data requirement yet).

**Escalation trigger:** If a future enterprise client requires contractual
data isolation, that specific tenant moves to a separate schema — not the
whole system, just the tenant requiring it.

### Required Tenancy Fields (Pre-Built for Future Use)
- `Organization` entity (tenant), `Membership` (user-to-org with role)
- Tenant-scoped: Job, Assignment, Technician
- Global: none currently (no shared catalog across tenants)
- Audit: reassignments and cancellations logged with tenant_id for future
  per-tenant export

### Cross-Jurisdiction Note
Not yet applicable (single-country pilot) — flagged as a design constraint to
revisit before onboarding any EU-based client: erasure requests would require
a per-tenant backup-purge capability not yet built.
```

## When to Use
- Before choosing an authentication model — check the identity questions checklist against actual client requirements, not against what looks more sophisticated
- The moment a second organization, company, or workspace is mentioned as a future or current requirement — run the multi-tenancy trigger assessment explicitly rather than adding a tenantId column reflexively
- Before onboarding a client from a different legal jurisdiction than existing tenants — check the cross-jurisdiction rule and whether per-tenant backup-purge and erasure capability already exist
- When scoping V1 architecture (lesson 388) for a product that might become multi-tenant — decide the isolation model deliberately rather than discovering it under pressure once a second customer signs

## Common Mistakes
- **SSO gets added because it looks professional, with no client requirement actually asking for it** — Adding SSO or social login because it looks professional, without a client requirement actually calling for it, adding implementation cost with no corresponding need
- **A `tenantId` column gets added "just in case," with no membership model or role scoping behind it** — Adding a `tenantId` column "just in case" without the accompanying membership model, role scoping, and audit strategy that make tenant isolation actually work
- **Tenant data separation happens by filtering in the frontend, not enforced on the server** — Relying on frontend-only filtering to separate tenant data instead of enforcing tenant scope server-side on every query
- **Per-tenant database isolation gets built before it's confirmed the product will ever have more than one tenant** — Building enterprise-grade per-tenant database isolation before validating that the product needs more than one tenant at all
- **Cross-jurisdiction compliance gets raised as a legal question after the isolation model is already built** — Treating cross-jurisdiction compliance as a legal afterthought instead of an architecture constraint that determines the isolation model upfront

## Further Reading
- AWS Well-Architected Framework — SaaS Lens (aws.amazon.com — practical tenant isolation model guidance at each isolation tier)
- Auth0 / Okta developer resources on session and SSO model selection (as background for the identity-model decision, distinct from implementation)
- GDPR Article 17 (Right to Erasure) — the source text behind the per-tenant backup-purge requirement in cross-jurisdiction tenancy

```recall
- q: "What are this lesson's three decisions, upstream of any implementation?"
  must:
    - "who owns identity"
    - "which authentication model actually fits the project"
    - "whether the system needs tenant isolation at all"

- q: "Name the identity questions that come first."
  must:
    - "can users self-register, or is invitation required"
    - "is social login or SSO actually required by the client's environment, or just aesthetically appealing"
    - "who owns the identity data"
    - "what happens operationally when a user leaves the organization"

- q: "Give the isolation spectrum and the default for an early SaaS MVP."
  must:
    - "shared database, shared schema, strict tenantId enforcement"
    - "shared database, separate schema per tenant"
    - "a fully separate database per tenant"
    - "default is the cheapest end — shared schema with strict server-side tenant filtering on every query"
    - "frontend filtering is not isolation"

- q: "What concrete architecture requirement falls out of cross-jurisdiction tenancy?"
  must:
    - "a GDPR erasure request must be fulfillable per tenant, including from backups"
    - "so a backup-purge flag scoped per tenant is a real architecture requirement"
    - "not a legal footnote to be handled later"
```
