# 366. Health Data Compliance — HIPAA, NHS & KVKK Sağlık Verileri

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — recognizing which obligations exist and when they are triggered, not carrying the compliance decision yourself. Requirements differ by jurisdiction: TR, US, UK, UAE, EU and JP do not align on lawful basis, breach notification deadlines, data residency or children's-data thresholds, so confirm the specifics for the regions you actually operate in.

Health data sits at the top of the classification hierarchy from lesson #358 — "sensitive personal data" or "special category" data under every major privacy law — and the trigger for this entire lesson is one scoping question: does the system store or process any information a doctor, nurse, or patient has about a person's physical or mental health condition, diagnosis, treatment, prescription, or test result? If yes, the compliance cost has to be in the budget from day one, because a client who says "it's just a patient portal, don't overthink it" is still building a system HIPAA (or its non-US equivalents) fully applies to — the *use case* triggers the obligation, not the client's framing of the project.

The specifics diverge sharply by jurisdiction, but three structural obligations repeat everywhere: a formal agreement, a storage-location restriction, and mandatory audit logging. In the US, HIPAA makes any vendor that creates, receives, maintains, or transmits Protected Health Information on behalf of a "covered entity" (a hospital, clinic, or health plan) a "Business Associate," which triggers a mandatory Business Associate Agreement (BAA) before any PHI access — and PHI itself is defined by eighteen specific identifiers (name, address, dates other than year, phone, email, SSN, medical record number, device identifiers, biometrics, full-face photos, and more) that must *all* be stripped to count as de-identified. Infrastructure matters concretely here: AWS, Azure, and GCP offer HIPAA-eligible services under a signed BAA, but Vercel, Netlify, and generic PaaS platforms are not HIPAA-eligible at all — choosing one for a PHI-touching feature is a compliance failure baked into the architecture, not a fixable configuration issue. In the UK, NHS-adjacent data must stay in the UK as a contractual requirement independent of GDPR, and any supplier touching NHS patient data needs its system built to enable the NHS body's own Data Security and Protection Toolkit (DSPT) compliance — role-based clinical/admin/patient access, NHS Login or CIS2 authentication for public-facing systems, HL7 FHIR R4 for clinical data exchange, and MFA for all staff with patient-data access. In Turkey, KVKK Article 6 classifies health and sexual-life data as the most restrictive special category, and Ministry of Health circulars require patient records to be stored domestically with no exception for a well-regarded international cloud provider — a rule that mirrors the sovereign-storage tier from lesson #358's classification hierarchy exactly.

The audit-logging and dev-data rules are consistent across all three regimes even though the citations differ: every access to a health record — who, when, what action — must be logged, and real patient data must never appear in a local development database, a staging environment, or a bug-report screenshot, full stop; the fix is synthetic data (NHS Synth, Faker-generated records) or a formally reviewed anonymized extract, never a "just this once" production dump. Breach notification for health-data incidents follows the timelines already covered in lesson #363 (72 hours for KVKK/UK GDPR, 60 days for HIPAA's covered-entity chain) — this lesson's job is making sure the infrastructure, agreements, and audit trail are in place *before* an incident, so that clock isn't starting from zero.

## Key Concepts
- **Scope trigger**: any diagnosis, treatment, prescription, test result, or health-condition data — the use case triggers HIPAA/KVKK/NHS obligations regardless of how the client frames the project
- **Formal agreement is mandatory before access**: BAA (US, defines a software vendor as a "Business Associate"), NHS Data Processing Agreement (UK), veri işleme sözleşmesi (TR) — signed before any real health data is seen, not after
- **18 HIPAA identifiers**: name, address, dates besides year, phone, email, SSN, medical record/account/license numbers, device IDs, biometrics, full-face photos, and other unique identifiers — *all* must be removed to count as de-identified
- **HIPAA-eligible infrastructure only**: AWS/Azure/GCP under a signed BAA qualify; Vercel, Netlify, and generic shared PaaS do not — an infrastructure choice can itself be a compliance failure
- **Domestic/sovereign storage requirements**: TR (Ministry of Health circular) and UK (NHS contractual requirement) both mandate in-country storage for identifiable patient records, independent of the cloud provider's general security posture
- **Universal audit-logging requirement**: every access to a health record (who, when, what action) logged and retained — HIPAA specifies a 6-year retention minimum
- **Real health data never in dev/staging**: synthetic generators (NHS Synth, Faker) or a reviewed anonymized extract only — a production dump landing in a dev environment is an incident, not a shortcut (see lesson #358)
- **Breach notification follows lesson #363's timelines**: 72 hours (KVKK/UK GDPR/ICO) or 60 days (HIPAA covered-entity chain) — this lesson's job is having the agreement, infrastructure, and audit trail ready before that clock starts

## Example Code
```markdown
# Discovery Checklist — Health Data Project

## Applicability
- [ ] Does the system store/process diagnosis, treatment, prescription, or
      test-result data for an identifiable person?
- [ ] Which jurisdiction(s) govern — US (HIPAA), UK (NHS/UK GDPR), TR (KVKK), other?
- [ ] Who is the data controller? (Must be the client, not the development team.)

## Required Agreement Before Any Real Data Access
| Jurisdiction | Agreement | Signed by |
|---|---|---|
| US | Business Associate Agreement (BAA) | Covered entity + vendor (you) |
| UK | NHS Data Processing Agreement + DSPT alignment | NHS body + supplier |
| TR | Veri işleme sözleşmesi (KVKK) | Data controller + processor |

## Infrastructure Gate
- [ ] Hosting is HIPAA-eligible (AWS/Azure/GCP + signed BAA) if US PHI is in scope
- [ ] Hosting is UK-region and NHS-DSPT-compatible if NHS-adjacent data is in scope
- [ ] Hosting is Turkey-region (or TÜBİTAK BİLGEM/government-approved) if TR patient
      records are in scope
- [ ] Vercel/Netlify/generic shared PaaS explicitly ruled OUT if any of the above apply

## Technical Safeguards (minimum, regardless of jurisdiction)
- [ ] Encryption at rest (AES-256) and in transit (TLS 1.2+)
- [ ] Audit log: who accessed which record, when, what action — retained per
      the strictest applicable rule (HIPAA: 6 years)
- [ ] Role-based access: clinician/admin/patient roles enforced server-side
- [ ] MFA required for all staff accounts with patient-data access
- [ ] Emergency access procedure documented (break-glass access, logged separately)

## Development Environment Rule
- [ ] Local/staging environments use synthetic data only (Faker, NHS Synth, or a
      formally reviewed anonymized extract)
- [ ] A real patient-data dump received "for debugging" is treated as a
      potential breach — stop, don't open it, follow lesson #362's incident process

## Breach Path (see lesson #363 for full jurisdiction routing)
- [ ] KVKK Kurumu (TR) / ICO (UK) — 72 hours from discovery
- [ ] Sağlık Bakanlığı (TR) / NHS DSPT + NHS England (UK) — parallel reporting path
- [ ] Covered entity notifies individuals within 60 days (US) — business associate
      notifies the covered entity fast enough for that chain to close on time
```

## When to Use
- At discovery, before any health-related field or integration enters scope — the compliance cost belongs in the budget and timeline from day one, not discovered mid-build
- When choosing a hosting provider or cloud region for a system that will touch PHI, NHS-adjacent data, or Turkish patient records — verify eligibility before committing, not after deployment
- When a client pushes back with "it's just a patient portal, don't overthink the compliance" — apply the scope trigger question directly rather than accepting the framing
- When a teammate or client sends a "sample" dataset containing real patient records for debugging — treat it as a potential breach, not a convenience, per lesson #358
- Before signing a SOW for any project where the discovery checklist above returns "yes" — the BAA/DPA/veri işleme sözleşmesi has to be signed before real data is seen

## Common Mistakes
- Accepting "it's just a patient portal" as a reason to skip HIPAA/KVKK/NHS scoping, when the use case — not the client's framing — determines applicability
- Deploying a health-data feature to Vercel, Netlify, or another platform that isn't HIPAA-eligible, treating hosting choice as an implementation detail rather than a compliance gate
- Using a real (even "old" or "test") patient database dump in a local development environment, instead of a synthetic generator or a reviewed anonymized extract
- Assuming a single BAA or DPA covers all jurisdictions a health-data product operates in, when the US, UK, and TR each require their own specific agreement and storage-location rule
- Treating audit logging of health-record access as optional or "nice to have" instead of a baseline requirement present in every jurisdiction's rule set

## Further Reading
- [HHS — Business Associates Guidance (HIPAA)](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/business-associates/index.html) — BAA requirements and the 18 PHI identifiers
- [NHS Digital — Data Security and Protection Toolkit (DSPT)](https://www.dsptoolkit.nhs.uk/) — the annual self-assessment framework suppliers must enable their NHS clients to meet
- Course #358 — *Data Classification & Storage Residency Tiers* (the sovereign-storage tier this lesson's TR/UK residency rules map onto)
- Course #363 — *Breach Notification Requirements Across Jurisdictions* (the notification timelines that apply once a health-data incident is confirmed)
