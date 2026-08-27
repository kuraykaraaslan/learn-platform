# 335. Designing Custom Service Bundles for Strategic Accounts

## What It Is
> This lesson is general education, not financial or tax advice. Confirm any custom pricing arrangement in writing, and consult a lawyer if the account is large enough to warrant a formal contract amendment.

Standard retainer tiers exist precisely so most clients don't need a custom arrangement. But a strategic existing client — high revenue, long tenure, high referral value — will occasionally have a real mix of needs that doesn't fit any standard tier cleanly: some development hours, some advisory time, a guaranteed response window, maybe a recurring deliverable. A custom bundle combines two to four of these standard components into one arrangement with a single price and explicit caps, built specifically for that account.

Custom bundles are justified only when the relationship has already proven itself and a standard tier would genuinely over- or under-serve actual usage — never as a way to avoid a harder scope conversation. The design process starts with an honest audit of the last three months of actual usage (how many development hours, how many advisory conversations, what ratio of reactive bugs versus proactive improvements), identifies the primary driver of that usage, and then adds one or two supporting components around it. Every bundle needs the same boundaries a standard tier needs — explicit monthly caps per component, exclusions, a rollover policy, response commitments, and renewal terms — because ambiguity in any of these fields is what turns a thoughtful custom arrangement into a scope dispute six weeks later.

Pricing a custom bundle typically applies a modest 10–15% discount versus buying each component separately, but never below your floor rate, and never by including components you can't reliably deliver at the stated volume. Crucially, a custom bundle still needs written confirmation before work begins — an email summary is enough, but a verbal custom arrangement is not; if the client won't confirm in writing, the correct fallback is a standard tier or a project model, not an informal handshake deal.

## Key Concepts
- **What makes a bundle "custom"**: it combines two or more normally-separate components (maintenance hours, development hours, advisory sessions, priority response, a deliverable-based item, training) under one price and one set of boundaries.
- **When custom is justified**: proven strategic relationship, a real mix that doesn't fit standard tiers, and a standard tier that would clearly over- or under-serve actual usage — not a shortcut around a scope conversation.
- **Design process**: audit the last 3 months of actual usage, identify the primary driver, add 1–2 supporting components, then define every boundary explicitly.
- **Required boundaries**: fixed monthly price, explicit caps per component, exclusions, a rollover policy, a response-time commitment (if priority is included), and renewal terms.
- **Pricing rule**: a 10–15% discount versus separate-component pricing is reasonable; never below your floor rate, never for components you can't reliably deliver.
- **Documentation requirement**: written confirmation (email is sufficient) before work begins — a verbal custom arrangement reverts by default to a standard tier or project model.
- **Forbidden patterns**: designing a custom bundle for a brand-new client, using "custom bundle" to dodge a scope-change conversation, and letting unused hours roll over indefinitely.

## Example Code
A bundle designed from a real 3-month usage audit for a long-standing client:

```md
## Account Audit — Client F, last 3 months
Development hours used: avg 12h/month (mostly small feature additions)
Advisory conversations: 2 ad hoc calls, unplanned, unbilled
Reactive (bugs) vs proactive (improvements) ratio: 20% / 80%
Gap: advisory time has been given away informally, no billed structure

## Bundle Designed: "Technical Partner"
Components: development hours (monthly cap 12h) + 1 advisory session/mo
Price: $2,400/mo (vs. $2,000 dev-only + $600 advisory separately = $2,600
  — a 7.7% bundle discount, within the 10-15% guideline once rounded)
Excluded: infrastructure migrations, third-party integration costs
Rollover: up to 4 unused dev hours roll over once, non-cumulative
Renewal terms: minimum 3 months, then month-to-month

## Presented as:
"Based on how we've actually worked together, I put together an
arrangement that reflects real usage rather than a standard tier that
doesn't quite fit. $2,400/month covers up to 12 dev hours and one
advisory session. Infrastructure changes stay separate. Does this match
how you'd want this to work going forward?"
```
The bundle didn't invent a new need — it formalized and priced advisory time that was already happening for free, which is usually where the real margin in a custom bundle comes from.

## When to Use
- When a proven, strategic client's actual usage pattern has clearly outgrown or sidestepped any standard tier.
- When you notice you're giving away real value (like informal advisory calls) that was never actually priced.
- During the annual review of any existing custom bundle, to confirm usage still matches the design.
- Never for a new or unproven client relationship — use a standard tier or project model until the relationship earns a custom arrangement.

## Common Mistakes
- Building a custom bundle for a client who hasn't yet proven the relationship, before trust and usage patterns are established.
- Using a custom bundle to avoid having an overdue scope-change conversation instead of actually addressing the scope problem.
- Leaving rollover policy undefined, which quietly creates an unlimited future liability of accumulated unused hours.
- Operating under a verbally agreed custom arrangement with no written confirmation before work begins.

## Further Reading
- *Managing the Professional Service Firm* — David H. Maister: on tailoring service delivery to strategic accounts without losing structural discipline.
- The Sales_Growth custom-bundle-design examples (Technical Partner, Reliability Pack, Growth Sprint, Team Enabler) are usable directly as bundle archetypes.
