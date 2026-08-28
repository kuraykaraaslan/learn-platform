# 214. Change Request Control

## What It Is
Clients change their minds. That's not a red flag — it's what happens when real users, real data, and real business pressure start touching a project that used to be theoretical. The mistake isn't the change; it's treating every change as either a fight to refuse or a favor to grant for free. Change request control is the professional middle path: any request outside the approved SOW becomes one of four decisions — accept within existing scope, replace an existing scoped item, defer to a future phase, or price as a paid change request — and, occasionally, reject outright as unsuitable.

The trigger list is broader than most freelancers expect: a new feature or screen is obviously a change, but so is a new role or permission, a new report or export, a new integration, a design direction change after approval, rework of an already-accepted milestone, or a compliance requirement that wasn't part of the original scope. The soft, friendly words that precede these requests — "just one small thing," "while you're in there," "it should be simple" — are exactly why a written trigger list matters: they're designed, usually without any bad intent, to make a new request feel too small to formalize.

The replacement rule is the tool that keeps this collaborative rather than adversarial: if a client wants to add something without increasing the budget, the professional response is "we can keep the budget stable only if we remove or reduce another scoped item of similar effort — otherwise it's a change request." That reframes the conversation from "no" to "here's how," which is a much easier position for both sides. A signed change request, however informal, is still a small contract amendment — for high-value or legally sensitive changes (new data types, new liability exposure, new third-party integrations with their own terms), it's worth having your base contract reviewed by a lawyer to confirm your change-request mechanism actually holds up as an amendment, rather than assuming a one-line email is always enough.

## Key Concepts
- **Four-decision framework**: accept in scope / replace / defer / price as change request — plus reject when a request is genuinely unsuitable for the project.
- **Change triggers**: new feature, screen, role, report, integration, payment logic, translation workflow, admin operation, post-approval design change, rework of accepted work, unscoped data migration, new device/browser support, or a new compliance requirement.
- **Replacement rule**: adding scope without increasing price requires removing scope of similar effort — otherwise it becomes a paid change request.
- **Change request document**: requested change, business reason, scope impact, technical impact, timeline impact, cost impact, and the options offered to the client, with a written approval step before work starts.
- **Emergency change carve-out**: urgent production changes outside warranty/bug boundaries get separately approved and may carry different pricing and availability than standard change requests.

## Example Code
```markdown
# Change Request: Add CSV Export to Order List

## Requested Change
Client wants to export the order list as CSV from the admin panel.

## Reason
Finance team needs offline reporting for month-end reconciliation.

## Scope Impact
New deliverable: CSV export endpoint + "Export" button on order list.

## Technical Impact
New API endpoint, filtering logic reuse, no data model change.

## Timeline Impact
Adds approximately 2 days; does not block the current milestone's other
deliverables if scheduled for the following sprint.

## Cost Impact
Fixed additional fee: [amount], invoiced on approval.

## Options
1. Add as a paid change request (recommended)
2. Replace the "saved filters" item in Milestone 2 with this instead
3. Defer to Phase 2

## Approval
Work begins after written approval of one option and, if applicable,
payment of the additional fee.
```

## When to Use
- Any time a client asks for something during a call, in chat, or in feedback that wasn't in the approved SOW.
- When a "small" request keeps recurring in slightly different forms — a sign it needs to be classified once and referenced going forward.
- Before agreeing to "just add it, we'll figure out the details later."

## Common Mistakes
- **"Just one small thing" gets absorbed for free, again, because saying no feels like an awkward conversation** — Absorbing new work silently because saying no feels confrontational, then resenting the project later.
- **A scope change request turns into a tense back-and-forth about whether it's really "in scope"** — Treating every change request as a fight instead of offering the calm, standard add/replace/defer framework.
- **A change gets agreed to on a call, and work on it starts the same day with nothing written down** — Verbally agreeing to a change in a call without ever producing the written document and approval.
- **"This is urgent" is enough to skip the change-request process entirely and just start building** — Letting "urgent" language from the client skip the change-request process entirely instead of routing it through an accelerated version of the same process.

## Further Reading
- Tom DeMarco and Timothy Lister, *Peopleware* — on managing shifting requirements without destroying a project's structure.
- The PMBOK Guide's treatment of integrated change control, as a formal analog to this freelance-scale process.
- Blair Enns, *Pricing Creativity* — on why every unscoped request is a pricing conversation, not a favor.
