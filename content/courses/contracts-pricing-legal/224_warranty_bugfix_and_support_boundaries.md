# 224. Warranty, Bug-Fix, and Support Boundaries

## What It Is
Delivery isn't the end of the relationship, but it also isn't the start of unlimited lifetime obligation, and the line between the two needs to be drawn in writing before delivery, not negotiated after a client's first post-launch email. A bug is behavior that fails against the scope and acceptance criteria that were actually agreed — a scoped form that doesn't submit, an approved login flow that fails. A request for a new workflow, a changed business rule, support for a browser that was never in scope, or a fix needed because the client's own infrastructure changed underneath the delivered system, is not a bug, however urgently it's phrased.

A workable warranty clause states a specific period — commonly a shorter window for small projects and a longer one for medium or custom work — during which bug fixes against the agreed scope are included, and explicitly excludes new features, third-party provider changes, content updates, user training beyond what was scoped, data entry errors, and unauthorized configuration changes made after handover. Anything needed beyond that warranty window routes into a separate maintenance agreement, hourly support, or a change request — never into an assumed, unbounded "of course I'll take a look" obligation that quietly becomes a second unpaid project.

Maintenance retainers, if offered, deserve the same bounding discipline: hours per month, response time, explicitly excluded work, a stated carry-over (or no-carry-over) rule for unused hours, and separate, explicit pricing for anything urgent enough to be called emergency support. The specific legal effect of warranty and liability-limiting language — including how disclaimers like "provided as is" actually function, and whether a liability cap is enforceable — is heavily jurisdiction- and consumer-protection-dependent. This lesson explains the commercial structure worth building; it is not legal advice on what your specific disclaimer language will actually hold up to, and that wording deserves a lawyer's review before you rely on it, especially for a B2C product.

## Key Concepts
- **Bug definition**: behavior that fails against the agreed scope and written acceptance criteria — not a new workflow, a changed business rule, an unsupported platform, or damage from the client's own later changes.
- **Warranty period**: a stated, bounded number of days after final delivery during which in-scope bug fixes are included, sized to project complexity rather than left open-ended.
- **Explicit warranty exclusions**: new features, third-party/provider changes, content updates, training beyond scoped sessions, data entry issues, hosting outages, and unauthorized post-handover changes.
- **Support/maintenance separation**: anything beyond the warranty period is handled through a separate maintenance agreement, hourly support, or a change request — never assumed as an unbounded extension of the original price.
- **Maintenance retainer bounding**: hours/month, response time, excluded work categories, a carry-over rule, and separately priced emergency response.

## Example Code
```markdown
## Warranty and Support (illustrative — confirm liability language with counsel)

This project includes a bug-fix warranty for issues that relate to agreed
scope and written acceptance criteria, reported within [14] days of final
delivery.

**Not covered by warranty:**
- New features or workflow changes
- Third-party/provider behavior changes
- Content updates or data entry
- Training beyond the sessions scoped in this SOW
- Issues caused by unauthorized code or configuration changes after handover

Support beyond the warranty period is available through a separate
maintenance agreement, hourly support, or change request.

## Maintenance Retainer Skeleton
- Included: [X] hours/month of minor fixes, monitoring review, dependency
  updates, and a monthly summary report.
- Response time: [X] business hours.
- Excluded: new features, major redesigns, third-party outages.
- Unused hours: [do not carry over / carry over up to X hours].
- Emergency response: priced and scheduled separately unless included.
```

## When to Use
- In every SOW's handover section, stated before delivery rather than negotiated afterward.
- Whenever a post-delivery request arrives and needs to be classified as a bug, a change request, or a maintenance item.
- When deciding whether to offer an ongoing retainer and how to bound it.

## Common Mistakes
- Offering "lifetime support" or an unbounded warranty period as a selling point without realizing what it commits to.
- Treating every post-launch bug report as equally valid without checking it against the original acceptance criteria.
- Doing free "just this once" fixes for out-of-warranty issues, which quietly resets the client's expectation for every future issue.
- Leaving a maintenance retainer's scope and hours vague, so "monthly support" becomes whatever the client needs that month.

## Further Reading
- ITIL's service-level and support-tier concepts, adapted down to freelance scale, for structuring maintenance offerings.
- Jonathan Stark's writing on productized retainers and bounding ongoing support commercially.
- The Uniform Commercial Code's Article 2 warranty provisions (US) as one jurisdiction's example of how "as is" and implied warranty disclaimers function — illustrative only, not applicable everywhere.
