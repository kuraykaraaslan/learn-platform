# 258. Warranty, Maintenance Packages, and Support Transition

## What It Is
The moment a project moves from "being built" to "being live," the nature of the relationship has to change, and the biggest risk at that transition is leaving the new shape of the relationship unstated. Without explicit terms, support drifts toward one of two bad defaults: unbounded free labor that the freelancer eventually resents and can't sustain, or an abrupt silence that leaves the client feeling abandoned right after paying a large invoice. Warranty, maintenance, and support transition are the three tools that replace that drift with a deliberate, written structure — each covering a genuinely different kind of work.

Warranty covers defects: a feature promised in the final agreed scope that doesn't work as specified, for a fixed period after signoff. Maintenance covers ongoing health under a paid, recurring arrangement — dependency updates, small fixes, monitoring review, minor improvements — sold in tiers like Basic Care, Growth Care, or Product Partner, each with an explicit monthly capacity stated in hours, never in unlimited terms. A change request covers genuinely new functionality — a new module, a new workflow, a redesign — priced and scheduled separately from either of the other two. Confusing these categories is how "just one more small thing" quietly becomes an unpaid maintenance relationship with no boundary and no billing.

The unused-capacity policy deserves explicit attention because it's the detail clients most often assume favorably and freelancers most often regret leaving unstated: unused hours not rolling over, rolling over for one month only, or availability-based capacity with no hourly carryover at all are three different commercial commitments, and picking one and stating it in writing — before the first month starts — prevents a dispute about "banked hours" that otherwise surfaces months later. Emergency handling deserves the same explicit treatment: promising 24/7 response without pricing it or having the operational capacity to deliver it is a promise made under optimism that becomes a liability the first time it's tested.

## Key Concepts
- **Three distinct categories, three different rules**: warranty (free, fixed period, defects only), maintenance (paid, recurring, bounded scope), change request (paid, scoped separately, new functionality)
- **Warranty covers only agreed scope failing to work as specified**: a new idea that surfaces during the warranty window is not a warranty item just because it arrived during that window
- **Maintenance packages are tiered and capacity-bound**: Basic Care (minor fixes, health checks), Growth Care (priority support, small improvements, monthly call), Product Partner (reserved capacity, roadmap involvement) — never sold as vague, unlimited "support"
- **State the unused-capacity policy explicitly, before month one**: no rollover, one-month rollover, or availability-based — pick one and write it down, because this is the detail most likely to become a dispute if left implicit
- **Emergency support is priced or explicitly excluded**: "emergency support outside business hours is not included unless explicitly contracted" protects both realistic expectations and the freelancer's actual capacity
- **Every post-signoff change request still needs the full write-up**: description, business reason, affected workflows, estimated impact, price/timeline, and approval — the maintenance relationship doesn't exempt new work from this discipline
- **A monthly report keeps the maintenance relationship visible**: tasks completed, issues resolved, open items, recommendations, risks, and next month's priorities — sent whether or not anything dramatic happened

## Example Code
```md
# Support and Maintenance Terms — Order Management Admin Panel

## Warranty Period
14 calendar days after signoff (2026-09-11 to 2026-09-25).

## Included During Warranty
- Bugs in agreed delivered scope (e.g., order export failing on a valid filter)
- Critical delivery defects affecting core workflows
- Clarification questions about delivered documentation

## Not Included During Warranty
- New features or changed workflows (e.g., the accounting export format, CR-002)
- Third-party provider pricing or policy changes
- Content or data entry
- Issues caused by unauthorized changes to the delivered code

## Support Channel
Email support@meridianretail-dev.example. Response reviewed during business
hours, Monday–Friday.

## Maintenance Option — Growth Care (proposed at closure)
- Up to 8 hours/month: priority support, small improvements, monthly review call
- Unused hours: do not roll over
- Excludes: large features, new integrations, major redesign
- Emergency support outside business hours: not included; available as a
  separately quoted incident rate if needed
- Monthly report: tasks completed, issues resolved, open items, next
  month's recommended priorities
- Price: $900/month, cancel with 30 days' notice
```

## When to Use
- Before final handover, as part of the closure package, so the client knows exactly what happens to support the moment the warranty clock starts
- At the moment warranty is about to expire, as the trigger to propose a maintenance option rather than letting support silently continue unbilled or stop abruptly
- Whenever a post-signoff request arrives, to classify it against warranty, maintenance, or change request before responding to it
- When a client asks for emergency or after-hours coverage, as the prompt to price it explicitly rather than agreeing informally in the moment

## Common Mistakes
- Providing unlimited free support indefinitely because no warranty period was ever put in writing
- Selling a maintenance package as vague "ongoing support" with no stated monthly capacity or exclusions
- Leaving the unused-hours policy unstated, creating a dispute later about hours the client assumed were banked
- Promising emergency or 24/7 response casually, without pricing it or confirming it's operationally realistic to deliver

## Further Reading
- ITIL Foundation guidance on service level and warranty definitions — a formalized reference point for distinguishing defect remediation from ongoing service: https://www.axelos.com/certifications/itil-service-management
- Blair Enns, *Pricing Creativity: A Guide to Profit Beyond the Billable Hour* — on structuring recurring value-based retainers instead of undifferentiated hourly support
- HubSpot, "How to structure a client retainer agreement" — practical guidance on tiering and capacity language for ongoing service relationships: https://blog.hubspot.com/agency/retainer-agreement
