# 385. Product Risk and Assumption Log

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `product-risk-and-assumption-log.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Feedback and validation loops (lesson 383) are how you test an individual assumption; the product risk and assumption log is where every assumption and risk across the whole project lives, visible and owned, so nothing stays a private worry in one person's head until it explodes mid-delivery. Every product plan has assumptions — that the payment provider will approve the account in time, that the client's data export is actually clean, that a workflow admins insist is simple really is simple. Left unwritten, each one becomes hidden project risk that surfaces as a scope fight, a blown timeline, or a feature nobody realizes was never actually validated.

The log itself is a structured table, not a paragraph of worry: each entry gets an ID, a category (user adoption, business model, scope, technical feasibility, integration, payment/commercial, legal/compliance, data quality, operations, timeline, or stakeholder alignment), a severity, a likelihood, an owner, a mitigation or validation approach, a decision impact, and a status. The severity rule gives the log teeth: any high-severity risk that affects price, timeline, legal exposure, or feasibility has to be addressed before a proposal goes out or implementation starts — it does not get carried silently into a signed contract as a problem for future-you.

The assumption resolution rule is what keeps the log from becoming a graveyard of noted-but-ignored concerns: any assumption that touches MVP scope, pricing, or architecture must land in exactly one of five buckets — validated, converted into an explicit stated assumption, moved out of scope, priced as risk, or turned into paid discovery. What's explicitly forbidden is the honest-sounding but professionally weak answer, "we'll figure it out later." The professional version of the same uncertainty is naming it directly: this is an open assumption, it affects scope, and it needs to be validated before final pricing is locked in. That single reframing is what protects the delivery team from silently absorbing unbounded risk for free.

## Key Concepts
- **Risk categories (eleven)**: user adoption, business model, scope, technical feasibility, integration, payment/commercial, legal/compliance, data quality, operations, timeline, stakeholder alignment
- **Log fields**: ID, risk/assumption, category, severity, likelihood, owner, mitigation/validation, decision impact, status
- **Severity rule**: high-severity risks touching price, timeline, legal exposure, or feasibility must be resolved before proposal or implementation, not carried into a signed commitment
- **Five resolution buckets**: validated, converted to explicit assumption, moved out of scope, priced as risk, turned into paid discovery — every scope/pricing/architecture-relevant assumption must land in one
- **"We'll figure it out later" anti-pattern**: the professional reframe is naming the open assumption and its scope/price impact directly, not deferring silently
- **Distinct from validation (lesson 383)**: validation is the method for testing one assumption; the log is the registry that tracks every assumption and risk across the whole project to resolution
- **Relationship to scope boundaries (lesson 377)**: a risk that materializes should trigger a scope or price conversation through the change-request triggers, not silent absorption of the extra work

## Example Code
```markdown
## Risk and Assumption Log — Crew Scheduler

| ID | Type | Description | Category | Severity | Likelihood | Owner | Mitigation/Validation | Decision Impact | Status |
|---|---|---|---|---|---|---|---|---|---|
| A-001 | Assumption | Technicians carry smartphones capable of receiving SMS reliably in the field | Technical feasibility | Medium | Low | PM | Confirm device list with client before pilot | If false, notification channel must change (app push or IVR call) | Validated |
| A-002 | Assumption | Client's technician roster spreadsheet is clean enough for direct import | Data quality | High | Medium | PM | Request sample export before quoting migration effort | If false, migration effort and price must be revised upward | Open |
| R-001 | Risk | SMS provider approval/verification may delay pilot start | Integration | High | Medium | Dev lead | Start provider account setup in week 1, before feature work | Pilot start date depends on this; flag to client now | Open |
| R-002 | Risk | Client expects multi-region support "eventually" but hasn't confirmed timeline | Scope | Medium | Medium | PM | Confirm in kickoff call; log as roadmap item, not MVP scope | If timeline moves up, tenant isolation must be added to MVP architecture | Pending |
| A-003 | Assumption | Single dispatch coordinator role is sufficient for pilot | Stakeholder alignment | Low | Low | PM | Confirmed in discovery call | None if holds; scope change trigger if a second coordinator role appears | Validated |
```

## When to Use
- Continuously throughout product strategy, not as a one-time document — update it as assumptions are validated or new risks surface
- Before finalizing a proposal, price, or timeline, to surface any high-severity risk that must be resolved or explicitly priced in first
- Whenever a stakeholder says something is "simple" or "obvious" without evidence — that's an assumption, and it belongs in the log, not in someone's memory
- When a client project involves integrations, payments, compliance, data migration, or marketplace dynamics — these categories generate the highest-severity risks most often
- During any handoff to architecture or development, so the next phase inherits known risks instead of rediscovering them

## Common Mistakes
- Keeping the log informally in chat history or meeting notes instead of a structured, shared document with owners and statuses
- Recording a risk once and never revisiting its status, so "Open" risks silently become "ignored" risks
- Letting a high-severity risk ride into a signed proposal because addressing it felt like it would slow down the sale
- Saying "we'll figure it out later" instead of the professional reframe: naming the assumption explicitly and tying it to a validation step before pricing is locked
- Treating the log as the PM's private tracking tool rather than a document the client and delivery team both see and act on

## Further Reading
- Tom DeMarco & Timothy Lister — "Waltzing with Bears: Managing Risk on Software Projects" (risk visibility as a project management discipline, not a formality)
- Atul Gawande — "The Checklist Manifesto" (on why a structured, visible list catches what memory and good intentions don't)
- Project Management Institute — "Practice Standard for Project Risk Management" (the formal version of the severity/likelihood/mitigation structure this log compresses)
