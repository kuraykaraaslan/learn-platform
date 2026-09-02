# 364. Third-Party Vendor Risk & Data Processing Agreements

## What It Is
Every third-party provider a system talks to — hosting, managed database, object storage, email, SMS, payment, analytics, error monitoring, an AI API, a CRM or helpdesk, CDN/DNS — extends the system's own security and privacy boundary, whether or not anyone wrote that down. Privacy by design (lesson #359) treats "a Data Processing Agreement is mandatory with every processor sub-contractor" as one line item in a larger checklist; this lesson is the dedicated process for getting there: building and maintaining the vendor inventory, asking the right questions before a vendor is added, and handling the specific failure modes — AI providers, payment providers, and account-ownership drift — that show up often enough to need their own rules.

The inventory itself is the artifact: for every vendor, record its purpose, exactly what data is shared with it, which environment uses it, who owns its API keys/secrets, who owns the account, which country and cloud region the data is processed or stored in, whether a DPA or contract is needed, what breaks if the vendor goes down, and what the replacement or exit strategy is. That data-residency field is not decorative — it's the same tier question data classification (#358) asks of internal storage, applied to every place data leaves the system's own infrastructure. Before any vendor is integrated, a fixed set of questions has to be answered: what data leaves the system, does it include personal or sensitive data, does the vendor train on or reuse that data, where is it processed, can the client approve this vendor, and is a DPA required — and the legal answer to "is a DPA required" belongs to the client or their legal advisor, not to the engineer wiring up the integration.

Two vendor categories carry rules specific enough to call out on their own. AI providers should never receive personal, sensitive, or client-confidential data unless that data flow was explicitly scoped and approved — prompts should be minimized, secrets and tokens kept out of them entirely, AI request logging handled carefully or disabled for sensitive paths, and outputs labeled as advisory rather than authoritative. Payment providers should be handled through redirect or hosted-checkout flows, or a tokenizing provider, rather than the system touching raw card data directly; a client who wants to store and process card numbers in a custom application is asking for a specialized compliance project (PCI DSS scope), not a checkbox to tick during a normal build. The account-ownership problem shows up specifically at handover: production vendor accounts should end up owned by the client, not left under a freelancer's personal login with no maintenance agreement, and any API key touched during the engagement should be rotated when ownership changes hands — an unrotated key under someone else's account is a standing access risk that outlives the contract.

```quiz
- q: "Who decides whether a DPA is required for a new vendor?"
  anchor: "belongs to the client or their legal advisor, not to the engineer wiring up the integration"
  options:
    - text: "The engineer, who knows exactly what the integration sends"
      correct: false
      why: "Knowing what data leaves is the engineer's job. Deciding the legal requirement is not."
    - text: "The client or their legal advisor"
      correct: true
      why: "The engineer answers the factual questions feeding that decision — what leaves, whether it is personal, where it is processed."
    - text: "The vendor, since they are the ones who publish a DPA"
      correct: false
      why: "A vendor offering a DPA does not settle whether your use of them requires one."

- q: "What makes the vendor inventory an artifact rather than a list of names?"
  anchor: "record its purpose, exactly what data is shared with it, which environment uses it, who owns its API keys/secrets, who owns the account"
  options:
    - text: "That it is versioned in the repository alongside the code"
      correct: false
      why: "Where it lives is not what makes it useful."
    - text: "Each entry records purpose, data shared, environment, key and account ownership, region, DPA need, blast radius and exit strategy"
      correct: true
      why: "Those fields are what let the inventory answer a question rather than just enumerate vendors."
    - text: "That it lists only the vendors that touch personal data"
      correct: false
      why: "Every third party the system talks to extends its boundary, whether or not anyone wrote that down."

- q: "Why is the data-residency field on each vendor entry not decorative?"
  anchor: "applied to every place data leaves the system's own infrastructure"
  options:
    - text: "Because latency depends on which region serves the request"
      correct: false
      why: "A real concern, and not this one."
    - text: "It is the storage-tier question from data classification, applied wherever data leaves your own infrastructure"
      correct: true
      why: "The same tier requirement does not stop at the edge of your own systems."
    - text: "Because vendors move regions without telling anyone"
      correct: false
      why: "They can, which is a reason to record it — but the reason it matters is the tier requirement itself."
```

## Key Concepts
- **Vendor inventory fields**: provider, purpose, data shared, environment, secrets owner, account owner, data residency (country + cloud region), DPA/contract status, failure impact, exit strategy
- **Pre-integration question set**: what data leaves the system, is it personal/sensitive, does the vendor train on or reuse it, where is it processed, does the client need to approve it, is a DPA required
- **The DPA decision belongs to legal**: engineering surfaces the data flow; the client or their legal/privacy advisor decides whether a Data Processing Agreement is required and reviews its terms
- **AI provider rule**: no personal/sensitive/confidential data to an AI API without explicit scope and approval; minimize prompt content; never send secrets/tokens; handle AI request logging carefully; label outputs as advisory
- **Payment provider rule**: prefer redirect/hosted/tokenized flows over touching card data directly; direct card storage is a separate, specialized compliance project (PCI DSS), not default scope
- **Account ownership at handover**: production accounts should transfer to the client; freelancer-owned accounts should be removed or reduced absent an active maintenance agreement; keys rotate on ownership change
- **Failure impact as a first-class field**: knowing what breaks (and how badly) if a given vendor goes down belongs in the inventory before an incident, not discovered during one

## Example Code
```markdown
# Vendor Inventory — [Project Name]

| Vendor | Purpose | Data Shared | Region | Owner | DPA/Legal Review | Failure Impact | Exit Strategy |
|---|---|---|---|---|---|---|---|
| SES (email) | Transactional email | email, name, message metadata | eu-west-1 | Client | Signed | Emails fail; queue and retry | SMTP fallback provider documented |
| Stripe | Payment processing | tokenized card ref only, no PAN | US | Client | Stripe DPA accepted | Checkout fails | N/A — hosted checkout, no local card data |
| OpenAI API | Support-ticket summarization | ticket text, minus attachments | US | Client | Under review — flagged to legal | Feature degrades to manual summary | Prompt redaction toggle; provider swap documented |
| Sentry | Error monitoring | stack traces, request metadata (PII scrubbed) | EU | Client | DPA on file | Errors go unmonitored | Self-hosted fallback documented, not active |

## Pre-Integration Checklist (run before adding any new vendor)
- [ ] What data leaves our system for this vendor?
- [ ] Does it include personal or sensitive data?
- [ ] Does the vendor train on or otherwise reuse the data?
- [ ] Where is the data processed/stored (country + region)?
- [ ] Has the client approved this vendor?
- [ ] Is a DPA/contract required — and has legal reviewed it?
- [ ] Is this an AI provider? → apply the AI Provider Rule (minimize, no secrets, log carefully)
- [ ] Is this a payment provider? → confirm hosted/tokenized flow, not raw card storage

## Handover: Account Ownership Transfer
- [ ] Every vendor account is owned by the client, or ownership transfer is scheduled
- [ ] Freelancer/agency access removed or reduced (no maintenance agreement) or explicitly retained (active agreement)
- [ ] API keys touched during the engagement are rotated post-handover
- [ ] Billing responsibility is unambiguous for every vendor in the table
```

## When to Use
- Before adding any new third-party service to a project — even a "small" one like an error-monitoring SDK, since it still receives data
- When scoping a project that will touch payment data, health data, or an AI API — the vendor rules for those categories change the architecture, not just a config value
- At every client handover — the vendor inventory and account-ownership checklist are handover artifacts, not optional extras
- When a vendor announces a policy change (e.g., "we now use customer data to improve our models") — re-run the data-sharing questions against the new terms
- During a security questionnaire or enterprise procurement review — the vendor inventory table is one of the first documents requested, alongside the data flow map from lesson #359

## Common Mistakes
- Adding a vendor (an analytics SDK, an AI API, a new SaaS integration) without documenting it or telling the client, so the vendor inventory silently drifts out of date
- Sending production personal data to a test or debugging tool because it was convenient, without checking whether that tool's own data handling meets the same bar
- Treating "the provider has a DPA available" as equivalent to "the DPA is reviewed and signed" — availability is not adoption
- Leaving vendor accounts under a freelancer's personal login after handover with no maintenance agreement, so the client has no way to manage or rotate access if something goes wrong
- Accepting a client's request to store raw payment card data directly as a routine feature request, instead of flagging it as the specialized compliance project it actually is

## Further Reading
- [GDPR Article 28 — Processor Obligations](https://gdpr-info.eu/art-28-gdpr/) — the legal basis for requiring a DPA with any data processor
- [PCI Security Standards Council](https://www.pcisecuritystandards.org/) — the compliance framework triggered by direct card-data storage or processing
- Course #359 — *Privacy by Design — Process, Artifacts & Multi-Jurisdiction Legal Basis* (the data flow map this inventory feeds into)

```recall
- q: "What does each vendor inventory entry record?"
  must:
    - "its purpose, and exactly what data is shared with it"
    - "which environment uses it"
    - "who owns its API keys and secrets, and who owns the account"
    - "which country and cloud region the data is processed or stored in"
    - "whether a DPA or contract is needed"
    - "what breaks if the vendor goes down, and the replacement or exit strategy"

- q: "Give the questions answered before any vendor is integrated."
  must:
    - "what data leaves the system"
    - "does it include personal or sensitive data"
    - "does the vendor train on or reuse that data"
    - "where is it processed"
    - "can the client approve this vendor"
    - "is a DPA required — and that legal answer belongs to the client or their advisor"

- q: "Why does every third party count, not just the obviously sensitive ones?"
  must:
    - "every provider the system talks to extends its own security and privacy boundary"
    - "whether or not anyone wrote that down"
    - "hosting, managed database, object storage, email, SMS, payment, analytics, error monitoring, an AI API, CRM or helpdesk, CDN/DNS"
```
