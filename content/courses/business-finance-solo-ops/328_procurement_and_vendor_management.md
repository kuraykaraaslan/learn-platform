# 328. Vendor and Procurement Decisions for a Solo Shop

## What It Is
> This lesson is general education, not financial or tax advice. Contract terms with subcontractors and vendors, and any related liability questions, should be reviewed with a lawyer where the engagement is significant.

Even a one-person software business depends on a web of vendors — hosting providers, domain registrars, payment processors, design and AI tools, analytics platforms, backup services, an accountant, a lawyer, occasionally a subcontractor. A bad vendor choice doesn't just cost money; it creates delivery risk, hidden cost, security exposure, and client dissatisfaction that's disproportionate to the size of the original decision.

Every non-trivial vendor decision deserves the same lightweight evaluation: what's the actual business need, how reliable and well-supported is the vendor, is pricing clear and are invoices actually available for accounting, what's the security posture and who owns the data, can data be exported or backed up, how hard would it be to switch away later, and what happens to the client if this vendor fails entirely? Choosing purely on sticker price and skipping this evaluation is how solo operators end up locked into tools they can't leave and can't fully trust.

Subcontractors deserve special care because they carry compounded risk: written scope, protected client confidentiality, clear payment terms, and a review buffer are non-negotiable, and ultimate quality responsibility stays with you regardless of who did the work. Any vendor cost that belongs to a specific client project also needs an explicit answer — is it included in the project price, reimbursed, paid directly by the client, or managed by you for a monthly fee? Leaving that ambiguous is a guaranteed source of friction later.

## Key Concepts
- **Vendor evaluation criteria**: business need, reliability, support quality, pricing clarity, invoice availability, security posture, data ownership, export/backup options, lock-in risk, client impact if the vendor fails, and difficulty of replacement.
- **Vendor types to track**: hosting provider, domain registrar, email provider, payment processor, design tool, AI tool, analytics tool, security/backup tool, accountant, lawyer, subcontractor, hardware supplier.
- **Procurement decision flow**: define the need, check existing tools first, compare at least two alternatives for significant purchases, evaluate total cost (not headline price), check accounting/invoice compatibility, review security and data risk, and document the decision plus a renewal/review date.
- **Subcontractor rule**: written scope, protected client confidentiality, clear payment terms, freelancer retains quality-review responsibility, and the delivery timeline includes a review buffer before client delivery.
- **Client-billable vendor costs**: always explicitly resolve whether a vendor cost is included in the project price, reimbursed, paid directly by the client, or managed under a monthly fee — never leave this implicit.
- **Forbidden patterns**: choosing purely on cheapest price, using unstable production tools with no backup plan, and letting client-critical systems depend on an undocumented personal account.

## Example Code
A vendor review applied to a hosting decision, using the standard output template:

```
## Vendor Review

Vendor/tool: Managed Postgres provider (evaluating a switch from self-hosted)
Need: reliable backups + reduced ops burden for 3 active client apps
Alternatives considered: Provider A ($25/mo, daily backups, no export lock-in),
  Provider B ($15/mo, weekly backups only, proprietary export format)
Cost: Provider A, ~$300/year across 3 apps
Invoice available: yes, monthly PDF invoice — accountant-compatible
Security/data risk: Provider A supports point-in-time recovery; encrypted at rest
Lock-in risk: low — standard pg_dump export supported by both
Client impact: reduces client-facing downtime risk vs. current self-hosted setup
Decision: approve Provider A
Review date: 2027-08 (annual renewal review)
```
The €10/month price difference between the two providers was almost irrelevant next to the export lock-in difference — the cheaper option would have been the wrong call.

## When to Use
- Before adopting any new tool, hosting provider, or subcontractor that a client project will depend on.
- During the quarterly operations review, to check renewal dates and whether existing vendors are still justified.
- Whenever a vendor cost needs to be attributed to a specific client project.
- Before delegating any part of client work to a subcontractor for the first time.

## Common Mistakes
- Selecting a vendor purely by lowest headline price without checking lock-in, support quality, or data export options.
- Running a client-critical system on an unstable tool with no documented backup or migration plan.
- Letting a client project depend on a personal, undocumented account instead of a properly tracked vendor relationship.
- Handing work to a subcontractor without a written scope, confidentiality terms, or a review step before it reaches the client.

## Further Reading
- *The Checklist Manifesto* — Atul Gawande: the underlying argument for why a short, repeatable evaluation checklist beats ad hoc judgment for recurring decisions like this.
- Most cloud providers publish standard invoices and export tools — checking for these before signing up is a five-minute step that prevents a much larger later migration cost.
