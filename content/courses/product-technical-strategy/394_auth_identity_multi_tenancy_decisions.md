# 394. Auth, Identity, and Multi-Tenancy Architecture Decisions

## What It Is
This lesson sits upstream of RBAC/ABAC implementation and session-token mechanics, which are covered elsewhere in this curriculum's security material. Here, the decisions are: who owns identity, which authentication model actually fits the project, and whether the system needs tenant isolation at all — before any of that gets implemented. The identity questions come first: can users self-register or is invitation required, is social login or SSO actually required by the client's environment or just aesthetically appealing, who owns the identity data, and what happens operationally when a user leaves the organization. For most SME and internal systems, email/password or invitation-based login is genuinely enough — SSO and social login are additions justified by a specific, stated requirement, not defaults reached for because they seem more professional.

Multi-tenancy is a major architecture decision, not a casual one, because it touches the data model, authorization, billing, support, analytics, backups, and security all at once. The trigger question is "do multiple companies or organizations actually need isolated data and roles," not "should we add a tenantId column just in case it's useful later." Once the answer is genuinely yes, the isolation model sits on a spectrum: shared database with shared schema and strict tenantId enforcement, shared database with a separate schema per tenant, or a fully separate database per tenant. The default for an early SaaS MVP is the cheapest end of that spectrum — shared schema with strict, server-side tenant filtering on every query — reserving heavier isolation for when compliance requirements, enterprise contracts, or genuine per-tenant operational needs actually demand it. Every tenant-scoped query has to enforce that scope server-side; frontend filtering is not isolation.

Cross-jurisdiction tenancy raises the isolation bar independent of technical preference. When tenants in different legal jurisdictions — a GDPR-covered EU company and a KVKK-covered Turkish company, for instance — share the same shared-schema infrastructure, a most-restrictive-law-wins rule applies to whatever they share: if personal data flows through shared audit logs or shared analytics, GDPR's stricter standard effectively governs the whole shared surface. The practical response is not to lift every tenant to the highest common burden, but to isolate the stricter tenants at the schema or database level instead. This has a concrete architectural consequence: a GDPR erasure request must be fulfillable per tenant, including from backups — which means a backup-purge flag scoped per tenant is a real architecture requirement, not a legal footnote to handle later.

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
- Adding SSO or social login because it looks professional, without a client requirement actually calling for it, adding implementation cost with no corresponding need
- Adding a `tenantId` column "just in case" without the accompanying membership model, role scoping, and audit strategy that make tenant isolation actually work
- Relying on frontend-only filtering to separate tenant data instead of enforcing tenant scope server-side on every query
- Building enterprise-grade per-tenant database isolation before validating that the product needs more than one tenant at all
- Treating cross-jurisdiction compliance as a legal afterthought instead of an architecture constraint that determines the isolation model upfront

## Further Reading
- AWS Well-Architected Framework — SaaS Lens (aws.amazon.com — practical tenant isolation model guidance at each isolation tier)
- Auth0 / Okta developer resources on session and SSO model selection (as background for the identity-model decision, distinct from implementation)
- GDPR Article 17 (Right to Erasure) — the source text behind the per-tenant backup-purge requirement in cross-jurisdiction tenancy
