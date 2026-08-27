# 320. Expense and Subscription Cost Control

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Finance_and_Operations_Rules material to build out the Business Growth & Finance course; no existing coverage data for your own practice.

## What It Is
Expenses aren't the enemy — unreviewed expenses are. A $20/month tool doesn't feel like a decision worth scrutinizing, which is exactly why solo businesses accumulate a dozen of them: a design tool trialed once and never cancelled, a project-management app duplicating what Notion already does, an AI tool subscribed to "just in case." None of these individually breaks the business, but their sum quietly erodes margin every single month, invisibly, because no single charge is large enough to trigger a reaction.

The discipline that fixes this is treating every recurring cost as something with an owner, a renewal date, and a decision — not a background hum. Every subscription should answer: what problem does this solve, is it used weekly, is there a cheaper or already-owned alternative, and what's the cancellation date if it stops earning its place? A subscription with no clear answer to "what does this solve" is a candidate for cancellation, not a fixture.

The other half is a purchase-decision habit for one-time expenses: before buying, ask whether it improves revenue, delivery quality, speed, or risk reduction — and whether a cheaper option already covers the need. This isn't about frugality for its own sake; a course that closes a genuine skill gap for an active project is a good expense. A course bought because it looked interesting during a slow week is not, and buying it anyway is the same impulse that leads to accumulating unused subscriptions.

## Key Concepts
- **Purpose note requirement**: Every expense gets a one-line purpose ("used for client X's production hosting") — an expense with no purpose note is a candidate for the next review.
- **Subscription register**: Every recurring tool tracked with cost, billing cycle, renewal date, purpose, and a keep/cancel/downgrade/review decision — never left to renew silently.
- **Keep vs. cancel test**: Keep if used weekly, required for active delivery, protects security/backups, or a client pays for it directly. Cancel or downgrade if unused in 30–60 days, duplicated by another tool, or adopted only experimentally.
- **Client-billable vs. internal**: Decide explicitly whether a tool's cost is absorbed internally, billed to a specific client, or reimbursed — ambiguity here quietly erodes project margin.
- **Annual-plan discipline**: Only commit to an annual plan when usage is proven, cash flow is healthy, and the tool is genuinely core — a discount on a tool you might cancel in three months is not a saving.
- **Hidden cost awareness**: Transaction fees, currency conversion spread, usage overages, and auto-renewals are costs that don't show up as a clean line item but erode margin the same way a subscription does.
- **Monthly review cadence**: Subscriptions and expenses get reviewed on a fixed monthly schedule, not only when cash feels tight — waiting until it hurts means months of accumulated waste.

## Example Code
A subscription register reviewed monthly — every row ends in a decision, not a shrug:

```
| Tool         | Category        | Cost/mo | Renewal   | Purpose                        | Usage (30d) | Decision   |
|--------------|-----------------|--------:|-----------|---------------------------------|-------------|------------|
| Vercel       | hosting_cloud   | $20     | monthly   | Client + personal project hosts | Daily       | keep       |
| Figma        | design          | $15     | annual    | Reviewing client-supplied UI    | 2x this mo. | downgrade  |
| Linear       | project_mgmt    | $8      | monthly   | Personal task tracking          | Unused 45d  | cancel     |
| Notion       | project_mgmt    | $10     | monthly   | Client docs + task tracking     | Daily       | keep       |
| ChatGPT Plus | ai_productivity | $20     | monthly   | Drafting, research              | Weekly      | keep       |
| Adobe CC     | design          | $55     | annual    | Trialed once, 8 months ago      | Unused      | cancel     |
```
Cancelling Linear and Adobe CC alone removes $75/month — $900/year — that was producing zero measurable value, without touching a single tool that's actually load-bearing.

Expense review note for a one-time purchase, filled out before buying, not after:

```
Item: MacBook Pro replacement battery service
Amount: $180 (one-time)
Category: hardware_equipment
Business purpose: Current laptop battery health at 62%, affects reliable
  client delivery during long working sessions.
Revenue/delivery impact: Prevents a mid-project hardware failure risk.
Receipt saved: yes
Decision: approve
```

## When to Use
- Monthly, as a fixed calendar item — review every active subscription against the keep/cancel test, not only the ones that feel expensive.
- Before any new subscription starts — write the purpose note and renewal date into the register at the moment of signup, not after the fact.
- Before choosing an annual plan over monthly — confirm usage is already proven for at least one full billing cycle.
- Whenever cash flow tightens — the subscription register is the fastest place to find real, immediate savings without touching client-facing capability.

## Common Mistakes
- Letting a subscription renew silently for months after the project or use case that justified it has ended.
- Keeping two tools that do the same job (two design tools, two project trackers) out of inertia rather than picking one.
- Buying a course, gadget, or tool as an emotional response to stress or a slow pipeline, rather than against a defined skill or delivery gap.
- Treating small recurring charges as too minor to review, when their sum is often larger than a single purchase that would have triggered scrutiny.

## Further Reading
- *Profit First* — Mike Michalowicz: frames every business cost as competing for a share of a deliberately scarce operating account, which naturally forces the keep/cancel discipline described here.
- Ramit Sethi's writing on "conscious spending" (iwillteachyoutoberich.com) — though aimed at personal finance, the framework of cutting ruthlessly on things you don't value to spend freely on things you do maps directly onto subscription triage.
- This lesson is general education, not accounting advice. Whether a given expense is deductible, and how to categorize it, depends on your jurisdiction and entity type — confirm specifics with your own accountant.
