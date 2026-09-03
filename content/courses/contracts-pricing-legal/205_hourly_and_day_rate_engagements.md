# 205. Hourly and Day-Rate Engagements

## What It Is
> This lesson is general education, not legal advice. The intent is practical judgment — knowing what a clause is for and where the risk sits, not carrying responsibility for drafting or judging one. What actually holds differs by jurisdiction: TR, US, UK, UAE, EU and JP do not treat IP transfer, contractor classification, consumer protection or liability limits the same way, so have anything you sign reviewed where you and your client actually operate.

Hourly and day-rate billing get a bad reputation in pricing-strategy circles, but they are the correct tool for a specific, common category of work: debugging an unfamiliar codebase, providing ongoing technical advisory, rescuing a stalled project, or covering agency overflow where the exact task list can't be known in advance. The mistake isn't using time-based billing — it's using it without any of the structure that keeps it from becoming an unbounded, low-trust arrangement for both sides.

A safe hourly engagement defines a rate, a minimum billable block, a weekly cap or approval threshold above which the client must explicitly sign off on more hours, a reporting cadence, and a clear list of what's included versus excluded. Day-rate work follows the same logic at a coarser grain: a daily rate, a number of reserved days, a stated focus area, and a limit on how many meetings can eat into billable time before they start displacing the work itself. Without these boundaries, hourly work drifts into two failure modes — either the freelancer under-reports out of guilt over slow days, or the client starts treating every message as a free five-minute favor that never quite reaches the invoice.

Hourly is a poor fit when the client wants a guaranteed outcome without a defined scope, wants to approve every individual minute, or has shown weak payment reliability — in those situations, time-based billing just makes the underlying trust problem worse by adding ambiguity about what's "reasonable" time spent. The fix in that case isn't a stricter hourly agreement; it's a different pricing model entirely, most often a small paid discovery phase that produces enough clarity to move to fixed price.

## Key Concepts
- **Minimum billable block**: a floor (e.g., 2 hours for advisory/debugging, half a day for implementation) that prevents five-minute favors from eroding your effective rate.
- **Weekly cap or approval threshold**: a stated ceiling above which additional hours require explicit written approval, protecting both predictability and cash flow.
- **Reporting cadence**: a simple recurring report — date, task, time spent, result, blocker, next action — that builds trust and creates a paper trail if hours are ever disputed.
- **Day-rate structure**: daily rate, number of reserved days, availability window, and a meeting limit, suited to short, focused execution blocks rather than open-ended support.
- **Best-fit use cases**: bug fixing, existing-codebase work, consulting, technical rescue, and uncertain research tasks where a fixed scope can't yet be written.
- **Poor-fit signals**: a client wanting a guaranteed outcome with no defined scope, wanting to approve every minute, or showing weak payment history.
- **Time tracking as non-optional**: hourly work without time tracking is unenforceable and indefensible if either side later disputes the invoice.

## Example Code
```template
## Hourly / Day-Rate Agreement Summary

**Rate:** $[X]/hour or $[Y]/day
**Minimum block:** 2 hours (advisory/debugging) / half-day (implementation)
**Weekly cap:** 10 hours without written approval for more
**Included work:** [debugging, code review, advisory calls, specified feature work]
**Excluded work:** [new architecture decisions requiring separate scoping, on-call/emergency response]
**Reporting cadence:** Weekly summary — date, task, time spent, result, blocker, next action
**Payment frequency:** Weekly or bi-weekly, net 7
**Approval threshold:** Any week trending over cap requires written client sign-off before continuing
```

The two failure modes above are not abstract — they have a number. Put your own
rate in and see what the unbilled hours actually cost you over a year, and what
your advertised rate quietly becomes once they are counted.

```calc
inputs:
  - { id: rate,           label: "Your hourly rate (USD)",        type: number, default: 90, min: 0, step: 5 }
  - { id: billable_hours, label: "Billed hours per week",         type: number, default: 25, min: 0 }
  - { id: unbilled_hours, label: "Unbilled \"quick question\" hours per week", type: number, default: 4, min: 0 }
  - { id: weeks,          label: "Working weeks per year",        type: number, default: 44, min: 1 }
outputs:
  - { label: "Annual revenue, as invoiced",   expr: "rate * billable_hours * weeks", format: usd }
  - { label: "What you actually earn per hour worked", expr: "rate * billable_hours / (billable_hours + unbilled_hours)", format: usd }
  - { label: "Annual cost of the unbilled hours", expr: "rate * unbilled_hours * weeks", format: usd }
```

That third figure is the one worth writing into the agreement as a minimum
billable block. It is not a rounding error.

## When to Use
- Debugging or improving an existing codebase whose condition and complexity aren't yet known.
- Ongoing technical advisory where the value is judgment, not a fixed deliverable.
- Emergency or rescue work where speed matters more than upfront scoping.
- Agency overflow support with a defined focus area but no single deliverable to fix-price.
- Short, sprint-based implementation blocks better suited to a day rate than an hourly trickle.

## Common Mistakes
- **The hourly invoice goes out at month's end with no time log behind the number** — Billing hourly with no time-tracking discipline, leaving no defensible record if hours are questioned.
- **A five-minute Slack question here and there never quite makes it onto the invoice, month after month** — Letting "quick calls" and informal Slack questions go unbilled indefinitely until they're a significant chunk of unpaid time.
- Accepting an hourly engagement from a client who wants a guaranteed fixed outcome — the mismatch in expectations, not the rate, causes the eventual conflict.
- **There's no stated weekly cap, and the client is surprised by how large this month's invoice turned out to be** — Leaving the weekly cap undefined, so a slow-communicating client discovers a much larger invoice than they expected at month's end.

## Further Reading
- Jonathan Stark, *Hourly Billing Is Nuts* — a direct critique of open-ended time billing and when it's still appropriate.
- Sara Horowitz, *The Freelancer's Bible* — general freelance business practices including time-tracking and invoicing discipline.
