# 356. Risk-Based Security Scoping & Threat Model Lite

## What It Is
Not every system deserves the same security budget, and treating a public marketing page and a multi-tenant billing dashboard as equally risky wastes effort in one direction and under-invests in the other. Risk-based scoping means classifying a project or feature into a tier — typically Low, Medium, High, or Critical — based on what data it touches and what happens if that data or access is compromised, and then letting that tier determine which controls are mandatory versus optional. A static content site with no login needs HTTPS and spam protection; a marketplace handling payments and multi-tenant customer records needs a threat model, tenant isolation tests, MFA readiness for admins, and an incident response plan before it ships. The tier is decided once, explicitly, at design time — not inferred implicitly by whoever happens to be writing the code that week.

The practical tool for the "what can go wrong" half of this is a lightweight threat model, often called Threat Model Lite: for any medium-or-higher risk feature, spend ten minutes naming the Assets (what needs protecting), Actors (who uses or attacks the system), Entry points (forms, APIs, webhooks, uploads, admin pages), Trust boundaries (where data crosses from a domain you control into one you don't — frontend to backend, backend to a third-party API, one tenant's data plane into a shared service), Abuse cases (what could a malicious or careless actor do at each entry point), Controls (what specifically reduces each abuse case), and Residual risk (what's left over even after the controls). This is deliberately not a formal STRIDE workshop with a dedicated facilitator — it is a five-question checklist applied by the engineer who is about to write the code, cheap enough that skipping it has no excuse.

The risk register is what keeps this from being a one-time exercise that gets stale. It is a living table — Risk, Level, Impact, Control, Owner, Residual Risk — that travels with the project and gets revisited whenever scope changes, a new integration is added, or a new data type starts flowing through the system. This is also the artifact that shows up, almost unchanged, in a SOC 2 or ISO 27001 audit as evidence that risk is being actively managed rather than assumed away. The final discipline is scoping security work explicitly in any proposal, roadmap, or ticket: stating which controls are included (authentication, RBAC, input validation, basic audit logging) and which are explicitly excluded unless separately funded (penetration testing, 24/7 monitoring, formal compliance certification) prevents the common failure mode where security work is silently assumed to be someone else's responsibility.

## Key Concepts
- **Risk tiering (Low/Medium/High/Critical)**: match required controls to how much damage a compromise of this specific system would cause, not a blanket policy applied everywhere
- **Threat Model Lite**: Assets, Actors, Entry points, Trust boundaries, Abuse cases, Controls, Residual risks — a fast, repeatable design-time exercise, not a formal workshop
- **Trust boundary**: the point where data crosses from a domain you control into one you don't — frontend/backend, backend/third-party API, tenant/tenant
- **Abuse case**: the mirror image of a user story — "as an attacker, I want to enumerate valid emails via the password reset error message"
- **Residual risk**: the risk that remains after controls are applied — must be named explicitly in the register, never left implied by silence
- **Risk register**: a living table (Risk / Level / Impact / Control / Owner / Residual Risk) revisited whenever scope changes, not a document written once at kickoff
- **Security scope statement**: an explicit list of included vs. excluded controls in a given engagement or roadmap item, so nothing is assumed by default
- **Proportionality principle**: a content site and a multi-tenant admin panel do not warrant the same threat-modeling depth or the same sign-off bar

## Example Code
```markdown
# Threat Model Lite — Feature: Bulk CSV Export of Customer Records
# (multi-tenant SaaS, "Export all contacts" button on the CRM dashboard)

## Assets
- Customer PII (name, email, phone) across all contacts in the tenant
- The export job's temporary file storage
- The signed download URL

## Actors
- Legitimate tenant admin triggering a normal export
- A compromised tenant-admin session (stolen cookie / token)
- A malicious low-privilege user attempting to trigger an export they shouldn't have access to
- An external party who obtains a leaked/forwarded download link

## Entry Points
- POST /api/tenants/:tenantId/contacts/export
- GET /api/exports/:exportId/download (signed URL)
- Background job that generates the CSV

## Trust Boundaries
- Frontend → backend export API (untrusted tenantId/exportId from the client)
- Backend → object storage (where the generated CSV temporarily lives)
- Backend → email/notification service (export-ready notification)

## Abuse Cases
1. Low-privilege user calls the export endpoint directly, bypassing the UI's role check
2. Tenant A guesses/enumerates an exportId belonging to Tenant B
3. Download URL is forwarded (Slack, email) and used outside its intended lifetime
4. Export job never expires the generated file — the CSV sits in storage indefinitely

## Controls
| Abuse Case | Control |
|---|---|
| 1 | Server-side role check on the export endpoint (not just hidden button) |
| 2 | exportId scoped to tenantId in the query; 403 on mismatch, not 404-leak |
| 3 | Signed URL, 15-minute expiry, single download, logged access |
| 4 | Scheduled cleanup job deletes generated exports after 24 hours |

## Residual Risk
- A tenant admin with legitimate access can still exfiltrate the export and misuse
  it outside the system — accepted, logged via audit trail (who exported what, when)
  for after-the-fact investigation, not prevented outright.

## Register Entry
| Risk | Level | Impact | Control | Owner | Residual Risk |
|---|---|---|---|---|---|
| Cross-tenant export access via exportId guessing | High | PII leak across tenants | tenantId-scoped signed URLs, audit log | Backend team | Low |
```

## When to Use
- At the start of any new feature or project, before implementation, to assign a risk tier and decide which controls are mandatory
- When a feature crosses a new trust boundary — a new third-party integration, a new admin capability, a new export/import path
- Before a customer security review, SOC 2 audit, or enterprise procurement questionnaire — the risk register is the artifact they will ask to see
- When scoping a proposal or sprint, to make explicit which security controls are included versus excluded so nothing is assumed by default
- When a system's risk tier changes — a formerly internal tool becomes customer-facing, or a Low-risk project starts processing payment data

## Common Mistakes
- Applying the same security checklist to every project regardless of what data it touches, which wastes effort on trivial systems and under-invests in critical ones
- Treating the threat model as a one-time document written at kickoff and never revisited as scope, integrations, or data types change
- Skipping the "residual risk" column entirely — every control has limits, and not naming what's left over gives false confidence
- Letting security scope be assumed rather than stated explicitly, so a client or stakeholder believes penetration testing or 24/7 monitoring was included when it was never funded

## Further Reading
- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [OWASP Risk Rating Methodology](https://owasp.org/www-community/OWASP_Risk_Rating_Methodology)
- Adam Shostack — *Threat Modeling: Designing for Security* (Wiley) — the standard reference for the Assets/Actors/Entry-points style of lightweight threat modeling
