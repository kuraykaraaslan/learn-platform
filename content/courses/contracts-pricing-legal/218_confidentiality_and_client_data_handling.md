# 218. Confidentiality and Client Data Handling

## What It Is
A client hands a freelancer things they'd never hand a stranger: production credentials, customer lists, pricing strategy, sometimes real user data. Confidentiality and data handling is the set of professional habits that keep that trust intact even when the client never explicitly asks for them — because by the time a client feels the need to ask, something has usually already gone wrong. This isn't only about a signed confidentiality clause (though that matters); it's about the operational defaults a freelancer follows automatically: how credentials move, whether production data ever touches a laptop, and what happens to access when the project ends.

Confidential information covers more than most people initially list: business plans, customer lists, pricing, internal workflows, source code, API keys, login credentials, server access, analytics, and any personal data the system touches. The credential-handling default follows from this — secrets move through a managed vault or account-based access, never pasted into an informal chat, and get rotated the moment the engagement ends rather than "whenever someone gets around to it." Production data deserves the same caution: development and staging environments should use test data wherever possible, and copying real customer records into a local environment "just to test" is a decision that needs an explicit yes, not a default.

Two boundaries are worth drawing clearly and in advance. First, portfolio and screenshot use: no private dashboard, customer data, or non-public system view gets published without approval, and even sanitized screenshots need a second look for anything identifying. Second, and just as important: a freelancer can implement the technical controls a client asks for, but should not personally guarantee legal compliance with data protection law — "I can implement the privacy/security measures you specify, but the compliance interpretation itself should come from your legal advisor" is the honest, professional line. This entire lesson is operational guidance on good habits, not a data protection law course — if your work touches real personal data in any volume, get a lawyer or a qualified privacy consultant to review what's actually required in your and your client's jurisdiction.

## Key Concepts
- **Confidential information scope**: business plans, customer data, pricing, workflows, source code, credentials, and any personal data the client's systems touch.
- **Credential handling default**: shared through a managed vault or scoped account access, never plain-text chat; rotated immediately at engagement end, not eventually.
- **Production data caution**: development and staging environments default to test/synthetic data; copying real customer data into a non-production environment requires an explicit, informed decision, not a shortcut.
- **Portfolio and screenshot boundary**: no non-public dashboard, customer data, or credential ever appears publicly without approval; sanitized use still needs a second check for identifying details.
- **Technical-vs-legal boundary**: implementing requested privacy/security controls is the freelancer's job; certifying legal compliance with data protection law is the client's legal advisor's job.

## Example Code
```markdown
## Confidentiality and Data Handling (illustrative)

Contractor will treat as confidential all business, technical, and
customer information encountered while performing this engagement,
and will not disclose it during or after the engagement except as
required by law.

Credentials and API keys will be shared through [vault/tool name] rather
than plain-text messages. At project completion, Client will rotate all
credentials Contractor had access to and remove unnecessary access.

Production data will not be copied into development environments unless
specifically approved in writing. Where possible, synthetic or anonymized
data will be used for testing.

Contractor may reference this engagement in a portfolio only with prior
written approval, and only using screenshots that contain no non-public
customer data or confidential business information.

Contractor can implement the technical privacy/security measures
requested by Client, but does not represent or warrant compliance with
any specific data protection law; Client is responsible for confirming
compliance requirements with qualified legal counsel.
```

## When to Use
- On every project that involves customer data, production access, or internal business information, which in practice is nearly every project.
- Before agreeing to use production data in a development or staging environment.
- Any time you consider adding a client project to your public portfolio.

## Common Mistakes
- **The database password gets sent over chat "just this once" because setting up the shared vault felt like too much overhead** — Sending passwords or API keys over chat "just this once" because setting up a shared vault feels like overhead.
- **Real customer records get copied into the local dev environment because generating test data felt like extra work** — Defaulting to real customer data in development because it's more convenient than generating test data.
- **The new case study screenshot goes live with a customer's real dashboard numbers still visible in the corner** — Publishing a case study or screenshot without checking whether it reveals a customer name, dashboard, or internal metric the client would consider confidential.
- **"Don't worry, this is fully GDPR compliant" gets said to a client, with no lawyer ever having reviewed it** — Telling a client "don't worry, this is fully compliant" about a data protection law you haven't actually had reviewed by a lawyer.

## Further Reading
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html) — a technical starting point for credential handling practices
- The IAPP's (International Association of Privacy Professionals) introductory resources on data processor obligations.
- [Bitwarden: organizations and collections](https://bitwarden.com/help/about-organizations/) — shared-vault workflows for contractor access; 1Password documents an equivalent model
