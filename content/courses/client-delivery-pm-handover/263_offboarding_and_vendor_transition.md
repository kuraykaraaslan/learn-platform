# 263. Offboarding and Vendor Transition

## What It Is
Every support or maintenance relationship eventually ends — the client hires an internal developer, moves to another vendor, or simply no longer needs the service — and how that ending is handled matters almost as much for reputation as how the original delivery went. A client left with ambiguous access, undocumented systems, and an unclear sense of what obligations actually ended is a client who will describe the experience unfavorably regardless of how good the actual work was. Good offboarding is the deliberate alternative: a clear statement of what's being transferred, what access is revoked, what documentation is provided, what obligations end, what future support would cost, and what risks remain.

The offboarding package looks a lot like a second, lighter handover: a final project summary, repository and hosting locations, environment variable names (without exposing secrets unnecessarily), a database backup note, known limitations, open issues, and — critically — an explicit support end date paired with an access revocation plan. This isn't optional ceremony for a relationship that's ending; it's the same rigor as an original handover, applied a second time, because the client's operational continuity depends on it exactly as much as it did the first time.

Handing a project to another developer or vendor is where professionalism gets tested most directly, because there's a real temptation to be either defensive (protecting reputation by withholding detail) or petty (criticizing the incoming vendor's approach). Neither serves the client. The right posture is factual and generous within the bounds of what's actually owed: provide the repository, deployment notes, environment variable names, service list, and known limitations, and offer any additional live walkthrough as a separately priced transition session rather than either refusing it or giving it away for free indefinitely.

## Key Concepts
- **Offboarding mirrors handover, applied a second time**: the same rigor — summary, access, documentation, known issues — gets applied when a relationship ends, not just when it begins
- **Six things offboarding must clarify**: what's transferred, what access is revoked, what documentation is provided, what obligations end, what future support would cost, and what risks remain
- **Access revocation is explicit and active, not passive**: remove freelancer access from client-owned systems, rotate shared credentials, confirm admin account ownership, and document any remaining access rather than letting it linger silently
- **Never criticize the incoming vendor**: professionalism at offboarding protects reputation far more than any defensive or competitive comment about who's taking over
- **A live walkthrough for a new developer is a separately priced transition session**: providing the repository and documentation is included; additional consultation time is not automatically free just because the relationship is ending
- **A final boundary message states the end date plainly**: "as of [date], my active support responsibility ends" removes ambiguity about when obligations actually stop
- **Ownership status is checked before final transfer, not assumed**: outstanding invoice or payment status may affect what's transferred and when, depending on the original contract terms

## Example Code
```md
## Offboarding Package — Order Management Admin Panel
**Transition reason:** Client hiring an internal developer
**Effective date:** 2026-12-01

## Final Project Summary
Delivered scope: order workflow, RBAC, CSV export, admin dashboard.
Current state: stable, in production since 2026-09-11.

## Access and Ownership
- Repository: already client-owned (github.com/meridianretail/order-admin)
- Hosting: Vercel + Railway, client-owned accounts
- Freelancer access: to be removed 2026-12-01

## Documentation Provided
- Full handover package (handover/ folder, already delivered 2026-09-10)
- Updated known issues list as of transition date
- Environment variable names (no real values) for the incoming developer

## Open Issues at Transition
- Accounting export format (CR-002) — deferred by client choice, not started
- Large CSV export latency (known, documented, low priority)

## Support End Date
2026-12-01. Any requests after this date go through a new agreement with
the incoming developer or a separately quoted transition consultation.

## Access Revocation Checklist
- [x] Freelancer removed from GitHub org
- [x] Freelancer removed from Vercel/Railway teams
- [x] Database password rotated
- [ ] Client confirms new developer's onboarding is complete

## Final Boundary Message
As of 2026-12-01, my active support responsibility for this project ends.
I'm glad to provide a paid transition session for your incoming developer
if useful — repository, deployment notes, environment variable names, and
known limitations are already documented in the handover package.
```

## When to Use
- When a maintenance or support relationship is ending for any reason, including a client's decision to move to another vendor
- Before removing any freelancer access from client-owned systems, as the checklist to confirm nothing is being revoked prematurely or left dangling
- When a client's incoming developer or new vendor requests information, as the boundary between what's included in the original delivery and what's a separately priced transition session
- Whenever a relationship winds down gradually rather than ending on a single clear date, as the prompt to set an explicit end date rather than letting the ambiguity persist

## Common Mistakes
- Leaving freelancer access to client systems active indefinitely after the relationship has effectively ended, with no stated reason
- Withholding client-owned assets or documentation out of frustration about how the relationship ended
- Criticizing the incoming vendor or developer, which reflects worse on the outgoing freelancer than on anyone else
- Providing unlimited free consultation to the incoming developer instead of pricing additional live walkthrough time appropriately

## Further Reading
- David Maister, *Managing the Professional Service Firm* — on ending client relationships in a way that preserves reputation and future referral potential
- SHRM (Society for Human Resource Management), general offboarding-process guidance — while written for employment contexts, the same structured-handoff principles translate directly to vendor transitions
- Atlassian, "Knowledge transfer checklist" — practical structure for handing off technical context to an incoming team: https://www.atlassian.com/agile/project-management/knowledge-transfer
