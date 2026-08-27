# 202. Pricing Models — Matching Commercial Structure to Risk

## What It Is
New freelancers tend to have exactly one pricing model — usually an hourly rate, sometimes a fixed price guessed from gut feeling — and apply it to every engagement regardless of how much risk and uncertainty the project actually carries. Professional pricing works the other way around: you look at how clear the scope is, how much of the risk sits with you versus the client, and how the client prefers to buy, and only then pick a model. The model is a tool selected for the job, not a personality trait of your business.

There are, in practice, seven usable structures: paid discovery/audit (for genuinely unclear scope), fixed price (for stable, well-defined scope), phased fixed price (for larger projects broken into scoped chunks), hourly (for uncertain or advisory work), day rate (for focused execution blocks), retainer (for ongoing support), and value-based pricing (for high-impact outcomes with a trusting, sophisticated client). Each one requires different supporting infrastructure to be safe — hourly needs time tracking and a weekly cap, fixed price needs a locked scope document and revision limits, retainers need explicit exclusions and a rollover policy. Choosing the model without building its supporting structure is how each model fails.

The failure mode to watch for is defaulting to fixed price because clients like the certainty of a single number, even when the underlying scope is exploratory. Fixed price on unclear scope transfers all the discovery risk onto the freelancer, who then either eats the loss or fights the client over what counts as "included." The fix isn't to avoid fixed price — it's to only offer it once scope has actually earned that certainty, and to reach for paid discovery, hourly, or a smaller phased slice when it hasn't.

This is general business education, not legal advice; nothing here should be read as a template contract clause. Any commercial terms you actually put in front of a client should be checked against your own jurisdiction's contract law, and a real agreement worth meaningful money is worth a short conversation with a lawyer before it's signed.

## Key Concepts
- **Paid discovery/audit**: used when scope is genuinely unclear; the deliverable is a scope document, risk list, and estimate range — not working software.
- **Fixed price**: requires written scope, acceptance criteria, milestones, and change-request rules to be safe; otherwise it silently transfers all uncertainty to you.
- **Phased fixed price**: breaks a large project into discovery → core build → integrations → maintenance, re-pricing at each phase boundary instead of guessing the whole arc up front.
- **Hourly / day rate**: protects against scope uncertainty but needs a minimum block, a weekly cap or approval threshold, and a reporting cadence to avoid becoming unbounded.
- **Retainer**: converts one-time delivery into recurring revenue, but only holds together with defined included hours, priority level, and exclusions.
- **Value-based pricing**: requires strong understanding of business impact, a clear decision-maker, and high trust — it is the hardest model to use correctly and the easiest to abuse as an excuse to overcharge without justification.
- **Selection matrix logic**: match the model to the situation (vague idea → discovery; changing-scope SaaS MVP → phased fixed; emergency fix → hourly with a minimum), rather than to habit.

## Example Code
```markdown
## Recommended Pricing Model — [Project Name]

**Situation:** [one-line description of scope clarity and risk]
**Recommended model:** Fixed price / Phased fixed price / Hourly / Day rate / Retainer / Paid discovery / Value-based

**Why this model fits:**
- Scope clarity: [clear / partial / unclear]
- Who carries discovery risk if this is priced wrong: [you / client]
- Client's stated preference: [certainty / flexibility / speed]

**Required conditions for this model to be safe:**
- [ ] Written scope and acceptance criteria (fixed price)
- [ ] Minimum block + weekly cap + reporting cadence (hourly/day rate)
- [ ] Included hours, exclusions, rollover policy (retainer)
- [ ] Clear business-impact number, trusted relationship (value-based)

**Fallback if conditions aren't met:** [e.g., "Offer a 2-week paid discovery phase before quoting a fixed price."]
```

## When to Use
- Any time a prospect asks for "a price" before you've chosen how you're going to charge, not just what number to charge.
- When an existing client's request doesn't fit the model you used for their last project (e.g., moving from project work to ongoing support).
- When you catch yourself defaulting to fixed price purely because it's what you've always quoted.
- When a project's scope is stable on paper but depends on legacy code, third-party APIs, or a codebase you haven't seen.

## Common Mistakes
- Quoting fixed price on a project description that's really a vision statement, not a scope document.
- Using hourly billing to paper over a poor estimate rather than because the work is genuinely open-ended.
- Offering a retainer with no stated exclusions, so "included maintenance" quietly expands to cover new feature requests.
- Treating "payment after launch" as a pricing model rather than recognizing it as the absence of one.

## Further Reading
- Jonathan Stark, *Hourly Billing Is Nuts* — a practical case for outcome- and scope-based pricing over time-based billing.
- Blair Enns, *Pricing Creativity: A Guide to Profit Beyond the Billable Hour*.
- [Rafael Corrales / a16z-style writing on SaaS and service pricing models is widely available, but for freelance/agency-specific pricing, Jonathan Stark's "Ditching Hourly" newsletter and podcast archive is a solid, free primary source](https://ditchinghourly.com).
