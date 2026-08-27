# 307. Confidentiality, Anonymization & Technical Depth Calibration

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Case_Study_and_Portfolio_Rules material (anonymized-case-studies.md, technical-depth-balance.md) to build out the Content, SEO & Personal Brand course; no existing coverage data for your own practice.

## What It Is
Two different calibration problems both come down to the same question — how much do you reveal, and to whom — but they protect against opposite failures. Confidentiality decides what can be shown *at all*, protecting client trust and legal safety; technical depth decides how much detail to show *once something is safe to show*, matching the reader's actual sophistication. Getting confidentiality wrong exposes a real client to real risk. Getting technical depth wrong either bores a technical reviewer with business fluff or loses a business buyer under implementation trivia they never asked for.

On confidentiality: whenever a project involves a real client, private business process, unreleased product, or anything with NDA-like expectations, identifying details get replaced with safe categories while the useful business and technical story stays intact — "a regional operations company," "a B2B service provider," "an event-focused platform" instead of a real name. What has to be removed is specific: client and employee names, internal URLs, API keys, credentials, financial details, private process details, unreleased features, and anything from a production database. What can usually stay, generalized: industry category, workflow type, technical challenge, high-level architecture, sanitized screenshots, generic metrics, and lessons learned. Screenshots need their own sanitization pass — blur names, replace emails, remove IDs and logos unless permitted, and use seed or demo data rather than real records; recreating a flow with demo data is almost always safer and cleaner than trying to redact a real screenshot after the fact. And permission is explicit, never assumed: using a client's name, logo, testimonial, or real screenshots requires asking directly, with an anonymized version offered as the default fallback if they'd rather not be named.

On technical depth: the fix for mixed audiences — founders, SME owners, agency partners, CTOs, and developers all reading the same page — is progressive disclosure, not a single depth chosen for the "average" reader. A business summary comes first, a technical summary second, and deep implementation details are optional for whoever wants to keep reading. The same fact can be told at three altitudes: to a business buyer, "the system separates booking availability from appointment persistence to reduce double-booking risk and keep the booking flow responsive"; to a technical manager, "Redis handles fast slot availability operations, while PostgreSQL stores durable appointment records through Prisma"; to a developer, "SlotService manages TTL-backed Redis keys and overlap validation, while AppointmentService coordinates Prisma persistence through transactional logic." None of these three versions contradicts the others — they're the same decision at different resolution. The "Decision / Why it mattered / Trade-off / Result" format turns any single technical choice into evidence of judgment rather than a name-drop, and the same discipline applies to naming a stack at all: "React, Next.js, Node.js, Prisma, PostgreSQL, Redis" proves nothing by itself, while explaining what each piece was actually for turns the same list into proof of architectural thinking.

## Key Concepts
- **Confidentiality default**: when a real client or private process is involved, replace identifying details with safe categories while preserving the real business and technical story.
- **What must be removed vs. what can stay**: names, credentials, internal URLs, and financial details are removed; industry category, workflow type, and sanitized screenshots can usually stay generalized.
- **Screenshot sanitization over redaction**: recreating a flow with demo/seed data is safer and cleaner than trying to redact a real screenshot after the fact.
- **Explicit permission, never assumed**: using a client's real name, logo, testimonial, or screenshots requires directly asking, with an anonymized version as the default fallback.
- **Progressive disclosure**: business summary first, technical summary second, deep implementation details optional — never open with a wall of stack details.
- **Three-layer technical explanation**: the same decision explained to a business buyer, a technical manager, and a developer — same fact, different resolution, none of them false.
- **Decision / Why it mattered / Trade-off / Result format**: turns one technical choice into demonstrated judgment instead of a name-drop.
- **Stack-in-context rule**: naming technologies earns credibility only when paired with why they were chosen — a bare list proves nothing.

## Example Code
```md
## Anonymized Case Study Opening

# Internal Dashboard for a B2B Operations Team

## Context
A small B2B operations team was managing requests through spreadsheets and
messaging tools.

## Confidentiality Note
Client identity, internal data, and screenshots have been anonymized. The
workflow and technical structure are described at a high level.

## Permission Request Script

Hi <Name>, I am preparing a portfolio case study about the project. I can
keep it high-level and avoid sensitive details. Are you comfortable with me
mentioning your company name and using approved screenshots, or would you
prefer an anonymized version?

## Technical Decision Format

Decision: Use Redis for availability slot operations.
Why it mattered: Slot checks needed to be fast and avoid repeated
  database-heavy availability calculations.
Trade-off: Redis state must be coordinated carefully with persistent
  appointment records.
Result: The architecture separates fast operational availability from
  durable booking history.
```

## When to Use
- Before publishing anything involving a real client, real data, or real screenshots
- When a case study's likely audience mixes business buyers and technical reviewers
- Auditing an existing case study for overexposure — real names, real data, or unexplained stack lists
- Whenever a client hasn't explicitly said yes to being named, logoed, or quoted
- When a technical decision is worth including but needs framing that works for a non-technical reader too

## Common Mistakes
- Assuming silence or a past casual conversation counts as permission to use a client's name or screenshots
- Publishing admin screens with real records instead of recreating the flow with demo data
- Opening a case study with a package or technology list instead of the business benefit it enabled
- Exposing security-sensitive architecture details that could be misused by exposing them publicly
- Treating "more developer-level detail everywhere" as automatically more credible, regardless of who's actually reading

## Further Reading
- OWASP's guidance on information disclosure risks (owasp.org) — a useful technical grounding for what's genuinely risky to publish about a system's architecture
- *Presenting to Win* — Jerry Weissman: a widely used framework for adapting the same message to different audience sophistication levels
- A practical primer on privacy-by-design for client work (e.g., IAPP's foundational resources) — relevant background for handling client data responsibly in portfolio and case-study contexts
