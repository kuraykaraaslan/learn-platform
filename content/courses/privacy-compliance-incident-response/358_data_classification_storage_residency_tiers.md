# 358. Data Classification & Storage Residency Tiers

## What It Is
A system cannot protect data it hasn't identified. Before a single database field, log statement, or export endpoint is designed, the data that will flow through it needs a classification — Public, Internal, Personal, Sensitive Personal, Financial/Payment, Credentials/Secrets, Uploaded Files, or Logs/Telemetry — because each class carries a different minimum bar for storage, access, and logging. This is a distinct discipline from a deletion or retention pipeline (which handles what happens to data a user already gave you): classification happens earlier, at design time, and its output is a decision about *whether to collect the field at all*, not just how to eventually delete it. The best protection for a sensitive field is not collecting it in the first place — if a city is enough for the feature, don't collect a full address; if age verification is the goal, don't store a birthdate.

Classification has a direct, practical consequence most teams skip: each data class implies a minimum storage tier, and using a lower tier than required is a compliance violation, not just a best-practice miss. A useful way to think about tiers: Tier 4 is CDN/edge storage for public assets with no restriction; Tier 3 is any major commercial cloud region, fine for general personal data with a signed data processing agreement; Tier 2 is domestic commercial cloud, required for private health data, fintech, legal, and HR records; Tier 1 is sovereign or government cloud for public-sector health and national-security-adjacent work; and credentials/secrets have no tier exception at all — they must be encrypted at rest regardless of which tier everything else lives in. Health and biometric data sit at the top of this hierarchy: several jurisdictions (Turkey, the UK's NHS-adjacent work) mandate domestic-only storage for identifiable patient records with no exception for "but our cloud provider has good security."

The other half of classification discipline that's routinely skipped is development environment hygiene: real personal, health, financial, or identity data must never appear in a local development database, a staging environment seeded from a production dump, or a bug report screenshot — not "temporarily," not "just this once to debug." The fix is synthetic data generators (Faker.js, Mimesis) or a formal, reviewed anonymized extract process, and if a client or teammate accidentally sends a database dump containing real records, the correct response is to treat it as a potential breach — stop, don't open the file, and follow the incident response process — rather than quietly using it because it's convenient.

```quiz
- q: "A feature needs to know roughly where a user is. What does classification tell you to collect?"
  anchor: "The best protection for a sensitive field is not collecting it in the first place"
  options:
    - text: "The full address — it can always be truncated later"
      correct: false
      why: "Truncating later still means the full address was collected, stored and logged. The protection is in not collecting it."
    - text: "The city, if the city is enough for the feature"
      correct: true
      why: "Classification's output at design time is whether to collect the field at all — city instead of full address is the lesson's own example."
    - text: "A birthdate, so age checks work from the same field"
      correct: false
      why: "That is the lesson's other example of the same mistake: if age verification is the goal, do not store a birthdate."

- q: "Identifiable patient records for a private clinic. Which storage tier?"
  anchor: "Tier 2 is domestic commercial cloud, required for private health data, fintech, legal, and HR records"
  options:
    - text: "Tier 3 — any major commercial cloud region, with a signed DPA"
      correct: false
      why: "Tier 3 covers general personal data. Health sits higher, and several jurisdictions mandate domestic-only storage for identifiable patient records."
    - text: "Tier 2 — domestic commercial cloud"
      correct: true
      why: "Alongside fintech, legal and HR records. Public-sector health goes further still, to Tier 1."
    - text: "Tier 4 — CDN edge, because reads have to be fast"
      correct: false
      why: "Tier 4 is public assets with no restriction. Nothing personal belongs there, whatever the performance argument."

- q: "A client emails you a production database dump so you can debug a report. What do you do with it?"
  anchor: "the correct response is to treat it as a potential breach — stop, don't open the file, and follow the incident response process"
  options:
    - text: "Use it once and delete it — it is faster than building fixtures"
      correct: false
      why: "\"Just this once\" is the exact framing the lesson rules out, alongside \"temporarily\"."
    - text: "Treat it as a potential breach: stop, do not open it, follow the incident response process"
      correct: true
      why: "Real personal data must never reach a local database, a staging seed, or a bug report screenshot."
    - text: "Anonymize it locally first, then work from the anonymized copy"
      correct: false
      why: "Anonymizing means opening it. A reviewed anonymized extract is a process that runs before the data leaves production, not after it lands in your inbox."
```

## Key Concepts
- **Data classification tiers**: Public, Internal, Personal, Sensitive Personal, Financial/Payment, Credentials/Secrets, Uploaded Files, Logs/Telemetry — each with a distinct minimum handling rule
- **Minimization question set**: why do we need this field, who uses it, how long do we keep it, can we derive it instead of storing it, can we store a less sensitive version — asked before adding any field, not after
- **Storage tier hierarchy**: Tier 4 (CDN/public) → Tier 3 (any major cloud region) → Tier 2 (domestic commercial cloud) → Tier 1 (sovereign/government cloud) → credentials (no tier exception, always encrypted)
- **Data residency**: some data classes (health, biometric, government-classified) carry a legal requirement to stay within a specific country's borders, independent of which cloud provider is used
- **Safe logging pattern**: userId, action, resourceId, timestamp, result, requestId are generally safe; passwords, tokens, full request bodies, and payment card numbers are never safe to log
- **Synthetic data for development**: Faker.js, Mimesis, or a formally reviewed anonymized extract — never a raw production dump — for local and staging environments
- **Accidental real-data exposure as an incident**: a production dump landing in a dev environment or inbox by mistake is treated as a potential breach, not a convenience to quietly use
- **Under-tiering as a compliance violation**: storing sensitive personal or health data in a lower tier than its classification requires is itself a violation, independent of whether a breach ever occurs

## Example Code
```typescript
// A lightweight, enforceable classification registry.
// The point is not the specific library — it's making classification a
// declared, checkable property of a field instead of tribal knowledge.

type DataClass =
  | "public"
  | "internal"
  | "personal"
  | "sensitive_personal"
  | "financial"
  | "credential"
  | "log_telemetry";

const MIN_STORAGE_TIER: Record<DataClass, number> = {
  public: 4,
  internal: 3,
  personal: 3,
  sensitive_personal: 1, // health, biometric — domestic/sovereign cloud only
  financial: 2,
  credential: 0, // no tier exception — always encrypted at rest, regardless of tier
  log_telemetry: 3,
};

interface FieldClassification {
  field: string;
  entity: string;
  dataClass: DataClass;
  purpose: string;
}

const registry: FieldClassification[] = [
  { field: "email", entity: "User", dataClass: "personal", purpose: "login/communication" },
  { field: "diagnosisCode", entity: "PatientRecord", dataClass: "sensitive_personal", purpose: "treatment history" },
  { field: "cardLast4", entity: "Invoice", dataClass: "financial", purpose: "receipt display only" },
  { field: "refreshToken", entity: "Session", dataClass: "credential", purpose: "auth" },
];

// CI check: fail the build if a field's actual storage region tier is below
// the minimum its declared classification requires.
function assertTierCompliance(field: FieldClassification, actualTier: number): void {
  const required = MIN_STORAGE_TIER[field.dataClass];
  if (actualTier > required) {
    // Lower tier number here means MORE restrictive (Tier 1 = sovereign cloud).
    throw new Error(
      `${field.entity}.${field.field} is classified '${field.dataClass}' ` +
      `(requires tier <= ${required}) but is stored at tier ${actualTier}.`
    );
  }
}
```

## When to Use
- Before adding any new database field, especially on entities that already hold personal data — classify before you migrate, not after
- When choosing a cloud region or provider for a new service — check the data class it will hold against the minimum tier table first
- When setting up a new environment (staging, a contractor's local machine, a demo instance) — decide the synthetic-data policy before anyone seeds it
- When a teammate or client sends over a "sample" export for debugging — verify it's synthetic or anonymized before it touches any non-production system
- During a compliance audit or enterprise security questionnaire — the data classification table is one of the first artifacts requested

## Common Mistakes
- **A "company size" field gets added to the schema "in case it's useful someday," with no feature actually needing it yet** — Adding fields "just in case we need them later," which expands the classification surface and the retention burden for data that may never be used
- **The cloud provider has a great security reputation, and that gets treated as satisfying the domestic-hosting requirement for health data** — Assuming a single cloud provider's general security posture satisfies residency requirements, when the actual rule is about which country the data physically sits in
- **A real production dump gets loaded into the local dev database "just to debug this one issue," and it's the fastest way to reproduce the bug** — Using a production database dump in a local or staging environment "just to debug one issue," treating a serious data-handling violation as a convenience
- **Full request bodies get logged "temporarily" on the checkout endpoint, and the log statement is still there three months later** — Logging full request or response bodies "temporarily for debugging" on an endpoint that handles personal or payment data, then forgetting to remove it

## Further Reading
- [NIST SP 800-60 — Guide for Mapping Types of Information to Security Categories](https://csrc.nist.gov/pubs/sp/800/60/v1/r1/final) — a formal framework for the classification exercise
- [ICO — Data Minimisation Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-protection-principles/a-guide-to-the-data-protection-principles/the-principles/data-minimisation/)
- [Faker.js](https://fakerjs.dev/) — widely used synthetic data generator for development/test fixtures

```recall
- q: "Name the data classes."
  must:
    - "Public and Internal"
    - "Personal and Sensitive Personal"
    - "Financial/Payment"
    - "Credentials/Secrets"
    - "Uploaded Files"
    - "Logs/Telemetry"

- q: "Give the storage tiers and what each one is for."
  must:
    - "Tier 4 — CDN/edge, public assets, no restriction"
    - "Tier 3 — any major commercial cloud region, general personal data with a signed data processing agreement"
    - "Tier 2 — domestic commercial cloud, for private health, fintech, legal and HR records"
    - "Tier 1 — sovereign or government cloud, public-sector health and national-security-adjacent work"
    - "credentials and secrets get no tier exception — encrypted at rest regardless"

- q: "How does classification differ from a retention or deletion pipeline?"
  must:
    - "retention handles what happens to data a user already gave you"
    - "classification happens earlier, at design time"
    - "its output is a decision about whether to collect the field at all"

- q: "State the development-environment rule and its remedy."
  must:
    - "real personal, health, financial or identity data never appears in a local database, a staging environment seeded from production, or a bug report screenshot"
    - "not temporarily, not just this once"
    - "use synthetic data generators (Faker.js, Mimesis) or a formal, reviewed anonymized extract"
```
