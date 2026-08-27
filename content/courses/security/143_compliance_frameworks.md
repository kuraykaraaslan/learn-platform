# 143. Compliance Frameworks — SOC 2, ISO 27001, HIPAA

## What It Is
Compliance frameworks formalize "prove your security practices are actually what you claim" into a set of controls an independent auditor checks — and engineering usually owns most of the evidence, even when a compliance or legal team owns the process. **SOC 2** is the most common one for B2B SaaS: **Type I** attests that controls are designed correctly *as of a point in time*; **Type II** — the one enterprise customers actually ask for — attests that those controls operated effectively *over a period* (typically 3-12 months), which means it requires continuous evidence, not a one-time snapshot. **ISO 27001** is broader and more process-oriented — it certifies an entire **Information Security Management System (ISMS)**: documented policies, a risk register, and a continuous risk-assessment cycle, not just a checklist of technical controls. **HIPAA** (US healthcare) splits its requirements into administrative, physical, and technical safeguards, and applies not just to the primary company but to any vendor that touches protected health information (a "business associate").

The practical trap is treating any of these as a security-team-only concern handled once before an audit. In reality, the evidence an auditor wants — access review logs, deployment approval records, incident response tickets, dependency scan results — is generated continuously by engineering's normal work, and the sustainable approach is collecting it as a byproduct of everyday process (tied to #47 Audit Log Design, #36 Dependency Audit Automation) rather than reconstructing months of evidence in the two weeks before an audit window opens.

## Key Concepts
- **SOC 2 Type I vs Type II**: point-in-time design attestation vs effectiveness over a period — Type II is what most enterprise buyers actually require
- **ISO 27001 ISMS**: a documented policy + risk register + ongoing risk-assessment cycle, not just a technical control checklist
- **HIPAA safeguard categories**: administrative (policies, training), physical (facility access), technical (encryption, access control) — and it extends to vendors as "business associates"
- **Trust Services Criteria** (SOC 2's actual control categories): security, availability, processing integrity, confidentiality, privacy — most companies scope to security + availability first
- **Continuous evidence collection**: access reviews, deployment logs, incident tickets generated as a byproduct of normal engineering process, not assembled retroactively
- **Vendor/sub-processor risk**: your own compliance posture inherits risk from every third-party service that touches the same data

## Example Code
```typescript
// Not "code to pass an audit" — but the underlying engineering discipline the evidence comes from:
// making access changes an auditable, queryable event as a byproduct of the normal system (ties to #47).

async function grantAdminAccess(actorId: string, targetUserId: string, reason: string) {
  await db.$transaction([
    db.userRole.update({ where: { userId: targetUserId }, data: { role: "admin" } }),
    db.auditLog.create({
      data: {
        action: "role.grant",
        actorId,
        targetId: targetUserId,
        metadata: { newRole: "admin", reason },
        createdAt: new Date(),
      },
    }),
  ]);
  // Six months later, "show every admin grant in the last quarter and who approved it"
  // is a query against this table, not an archaeology project.
}
```

## When to Use
- Selling into enterprise customers, healthcare, or finance — SOC 2 Type II (or HIPAA/ISO 27001, depending on sector) is frequently a hard procurement requirement, not a nice-to-have
- Preparing for a first audit — start evidence collection well before the audit window, ideally continuously from day one of the compliance program
- Evaluating a vendor/sub-processor — their compliance posture becomes part of your own risk surface

## Common Mistakes
- Treating compliance as purely a security or legal team responsibility, when engineering generates most of the actual evidence
- Scrambling to reconstruct months of evidence right before the audit window instead of collecting it continuously as a byproduct of normal process
- Confusing "compliant" with "secure" — they overlap substantially but a passed audit doesn't guarantee an absence of vulnerabilities, and vice versa
- Onboarding a new vendor/sub-processor without checking their compliance posture, inheriting their risk silently

## Further Reading
- Vanta / Drata compliance automation guides (vendor-published, but the explanations of what auditors actually check are accurate)
- The official SOC 2 Trust Services Criteria document (AICPA)
- [ISO/IEC 27001 overview](https://iso.org) — the standard itself is paywalled, but the structure/scope is well documented for free
