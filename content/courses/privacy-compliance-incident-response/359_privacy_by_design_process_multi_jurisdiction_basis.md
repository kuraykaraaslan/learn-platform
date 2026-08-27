# 359. Privacy by Design — Process, Artifacts & Multi-Jurisdiction Legal Basis

## What It Is
Privacy by design is the practice of building purpose limitation, data minimization, safe defaults, and user-rights support into scope, data model, UX, and logging from the start — not bolting a privacy policy page onto the end of a project and calling it compliant. It rests on five concrete engineering habits: collect data only for a defined purpose (don't add a "company size" field because it might be useful someday); use the least sensitive data that solves the problem (a city instead of a full address, an age-confirmation checkbox instead of a birthdate); make the safest setting the default (marketing opt-in should never be silently pre-enabled); design so the system's own data flows can be explained on request (what is collected, why, where it's stored, who can access it, which vendors receive it, how long it's retained); and support user rights — access, deletion, correction, consent withdrawal — as first-class operations, not manual database surgery performed by an engineer when a support ticket arrives. This is a different, earlier-stage concern than an erasure pipeline: privacy by design shapes what gets built, an erasure pipeline handles what happens to data that already exists.

For any medium-or-higher privacy risk system, this process produces a specific set of artifacts: a data inventory (what personal data exists, where), a data flow map (the path data takes — user form → backend → database → email provider → analytics → admin dashboard → backup storage — with purpose, owner, access, retention, and risk noted at each hop), a vendor list, a retention table, an access control matrix, and a log data review confirming personal data isn't leaking into logs. These aren't paperwork for its own sake — the data flow map in particular is what makes a Data Subject Access Request answerable in hours instead of weeks, because the places personal data lives are already documented rather than rediscovered under time pressure.

The legal basis and specific obligations vary meaningfully by jurisdiction, and treating "GDPR" as the only regulation to think about is itself a gap. Under GDPR, legal basis (contract performance, legitimate interest, or consent) must be documented per feature, cross-border transfers need an adequacy decision or Standard Contractual Clauses, and a Data Processing Agreement is mandatory with every processor sub-contractor. KVKK largely mirrors GDPR in practice but has its own supervisory authority and a VERBİS registration requirement for data controllers above a processing threshold. UK GDPR is a separate legal instrument post-Brexit — EU Standard Contractual Clauses are not valid for UK transfers; the UK's own International Data Transfer Agreement or reliance on adequacy regulations is required instead, and DPAs must reference "UK GDPR," not plain "GDPR." US privacy law has no federal general-purpose statute — instead a state-by-state patchwork (CCPA/CPRA in California, VCDPA in Virginia, CPA in Colorado, CTDPA in Connecticut) that uses an opt-out "Do Not Sell" model rather than GDPR's opt-in consent model, and requires detecting and honoring the Global Privacy Control browser signal in California.

The engineering team's role in all of this is bounded and should be stated as such: implement the technical mechanisms — export, deletion, consent state, retention enforcement — but the privacy notice text, the specific retention periods, the legal basis for a given feature, and the final compliance position belong to legal/privacy counsel, not to the person writing the code.

## Key Concepts
- **Five privacy-by-design habits**: purpose limitation, data minimization, safe defaults, transparency support, user-rights support — built into the data model and UX, not added afterward
- **Data flow map**: the documented path personal data takes through the system (form → backend → database → vendors → dashboard → backup), with purpose/owner/access/retention/risk noted per hop
- **Required engineering artifacts**: data inventory, data flow map, vendor list, retention table, access control matrix, log data review — the standard package for medium+ privacy risk systems
- **Legal basis documentation**: under GDPR, each feature that processes personal data needs an explicit, recorded basis — contract performance, legitimate interest, or consent — not a blanket assumption
- **UK GDPR is a distinct regime**: separate from EU GDPR post-Brexit — different transfer mechanism (IDTA, not EU SCCs), different regulator (ICO), DPAs must say "UK GDPR"
- **US state privacy patchwork**: no federal general privacy law — CCPA/CPRA and similar state laws use an opt-out "Do Not Sell" model and require honoring the Global Privacy Control signal, unlike GDPR's opt-in model
- **KVKK specifics**: Turkey's supervisory authority is the KVKK Kurumu; VERBİS registration is required above a processing threshold; cross-border transfer needs an adequacy decision, written undertaking with Board approval, or explicit consent
- **Engineering vs. legal boundary**: the team implements technical mechanisms (export, delete, consent state); legal/privacy counsel owns notice text, retention periods, and the final compliance determination

## Example Code
```markdown
# Data Flow Map — "Contact Sales" Form (SaaS marketing site)

User submits form (name, work email, company, message)
  │  Purpose: route inquiry to sales; Owner: Marketing; Retention: 12 months
  ▼
Backend API validates + stores in `leads` table
  │  Access: sales team (read), marketing admin (read/write)
  ▼
Email provider (transactional) — sends internal notification
  │  Data sent: name, email, message body
  │  DPA required: Yes — signed with provider
  ▼
CRM sync (webhook) — lead pushed to CRM for pipeline tracking
  │  Data sent: full lead record
  │  DPA required: Yes — check CRM vendor's sub-processor list
  ▼
Analytics event fired: "lead_submitted" (NO personal fields attached)
  │  Data sent: event name, timestamp, anonymized session ID only
  ▼
Backup snapshot (nightly, encrypted)
  │  Retention: matches primary retention (12 months), then purged from backups

## Jurisdiction Notes
- EU/UK visitor: legal basis = legitimate interest (responding to their own
  inquiry); no consent banner required for the form itself.
- CA visitor: "Do Not Sell" applies to analytics/ad pixels on the page, not to
  this form's own data — kept separate in the record.
- TR visitor: KVKK açık rıza not required for direct-response inquiries under
  contract-adjacent processing, per legal review — confirm with counsel.
```

## When to Use
- At the design stage of any feature that collects or transmits personal data — before the database schema or form fields are finalized, not after
- When entering a new jurisdiction's user base (first UK, first California, first Turkish customers) — the applicable checklist changes and needs to be re-run
- When a Data Subject Access Request or deletion request arrives — the data flow map is what makes answering it a lookup instead of an investigation
- When adding a new vendor or sub-processor that will touch personal data — confirm a DPA is in place before data starts flowing
- Before a privacy-focused enterprise security questionnaire or SOC 2 Type II audit — the artifact package (inventory, flow map, vendor list) is exactly what's requested

## Common Mistakes
- Treating a generic, copy-pasted privacy policy as proof of compliance instead of an artifact that has to match what the system actually does
- Assuming GDPR covers every non-US jurisdiction, missing that UK GDPR has its own transfer mechanism and that US states use an opt-out model instead of opt-in
- Building the consent/export/delete mechanisms but never producing the data flow map, so a Data Subject Access Request becomes a multi-day investigation instead of a query
- Letting engineering decide the legal basis or retention period unilaterally instead of routing that decision to legal/privacy counsel and simply implementing it

## Further Reading
- [GDPR.eu — Developer Guide to Compliance](https://gdpr.eu/developers/)
- [ICO — International Transfers Guidance (IDTA)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/international-data-transfer-agreement-and-guidance/)
- [California Attorney General — CCPA Regulations](https://oag.ca.gov/privacy/ccpa)
