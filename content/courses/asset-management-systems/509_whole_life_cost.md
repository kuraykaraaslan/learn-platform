# 509. Whole-Life Cost: Repair vs Replace, With Your Own Numbers

## What It Is
An asset reaches a point where the next repair is large enough to ask whether it should be replaced instead. The instinct is to compare the repair quote against the replacement quote, and that comparison is almost always wrong, because it weighs a one-off cost against a one-off cost and ignores that the two options buy different amounts of future.

The right comparison is **cost per year of service each option provides**. Keeping the asset costs the repair now plus its rising maintenance over whatever life it has left. Replacing it costs the capital now, spread over the longer life of the new unit, plus the new unit's lower maintenance. Divide each total by the years it buys, and the two numbers are comparable. Often the repair still wins; the point is that you now know why.

Every input to that calculation is **the organisation's own number**, and none of them are knowable in general. Remaining life if kept depends on this unit's condition and duty. Replacement capital includes install, disruption and disposal, which vary by site. The maintenance trend is whatever this asset's own history shows. This lesson gives you the structure and some example figures to see it working — the example figures are illustrative, and the first thing to do is replace them.

Two refinements sit on top and are worth knowing but not always worth doing. Money later is worth less than money now, so a rigorous version discounts future costs to present value — which tends to favour deferring the capital, i.e. repairing. And replacement can carry benefits the old unit cannot: lower energy use, a safety improvement, a capability the site now needs. Those belong in the model explicitly or not at all; a vague "it'll be more efficient" is how a replacement business case gets padded.

```quiz
- q: "Why is comparing the repair quote directly against the replacement quote usually the wrong comparison?"
  anchor: "it weighs a one-off cost against a one-off cost and ignores that the two options buy different amounts of future"
  options:
    - text: "Because replacement quotes are always inflated by suppliers"
      correct: false
      why: "They may be, but that is not the structural error. The error is comparing two costs that buy different amounts of service life."
    - text: "Because the two options provide different service lives, so only cost per year of service is comparable"
      correct: true
      why: "A repair buys a few more years; a replacement buys the full life of a new unit. Annualising makes them comparable."
    - text: "Because repair costs are tax-deductible and capital is not"
      correct: false
      why: "Accounting treatment matters elsewhere; it is not why the raw quote comparison misleads."

- q: "What should be done with the default figures in a whole-life cost model?"
  anchor: "the example figures are illustrative, and the first thing to do is replace them"
  options:
    - text: "Use them as a starting estimate and adjust only if the result looks wrong"
      correct: false
      why: "That anchors the decision to numbers from nowhere. The inputs are all site-specific."
    - text: "Replace every one with the organisation's own figure — remaining life, capital, maintenance trend are all local"
      correct: true
      why: "The model is the structure; the numbers must come from this asset's history and this site's costs."
    - text: "Keep the maintenance figures and replace only the capital cost"
      correct: false
      why: "The maintenance trend is the most asset-specific input of all — it comes straight from the work-order history."
```

## Key Concepts
- **The repair-vs-replace decision is about cost per year of service**, not one quote against another
- **Keep cost** = repair now + rising maintenance over the remaining life
- **Replace cost** = capital now, spread over the new unit's longer life, + its lower maintenance
- **Annualise both** by dividing by the years each buys, then compare
- **Every input is the organisation's own number** — remaining life, full capital, maintenance trend — none are general
- **Default figures are illustrative** and the first task is to replace them
- **Discounting to present value** is the rigorous refinement, and it tends to favour repairing
- **Replacement benefits** — energy, safety, capability — belong in the model explicitly or not at all

## Example Code
Put this asset's numbers in. The defaults are an example of the shape, not a recommendation:

```calc
inputs:
  - { id: repair_now,        label: "Cost of the repair being considered (example only)", type: number, default: 18000, min: 0 }
  - { id: keep_years,        label: "Years of service the repair buys (this unit's condition)", type: number, default: 4, min: 1 }
  - { id: maint_if_kept,     label: "Average annual maintenance if kept (rising — from history)", type: number, default: 6500, min: 0 }
  - { id: replace_capital,   label: "Replacement capital incl. install, disruption, disposal", type: number, default: 52000, min: 0 }
  - { id: new_life_years,    label: "Expected service life of the new unit", type: number, default: 20, min: 1 }
  - { id: maint_if_new,      label: "Average annual maintenance of the new unit", type: number, default: 2200, min: 0 }
outputs:
  - { label: "Annualised cost if kept", expr: "repair_now / keep_years + maint_if_kept", format: usd }
  - { label: "Annualised cost if replaced", expr: "replace_capital / new_life_years + maint_if_new", format: usd }
  - { label: "Yearly difference (positive = replacing is cheaper per year)", expr: "(repair_now / keep_years + maint_if_kept) - (replace_capital / new_life_years + maint_if_new)", format: usd }
  - { label: "Break-even repair cost — above this, replacing wins", expr: "(replace_capital / new_life_years + maint_if_new - maint_if_kept) * keep_years", format: usd }
```

The discounting refinement, as code rather than as a widget, because the discount rate is one more number the organisation owns:

```typescript
/** Present value of a stream of equal annual costs — the rigorous version of
 *  "spread the capital over the life". A higher rate makes future costs matter
 *  less, which favours deferring capital (repairing). */
function presentValueOfAnnualCost(annualCost: number, years: number, rate: number): number {
  let pv = 0;
  for (let year = 1; year <= years; year++) {
    pv += annualCost / Math.pow(1 + rate, year);
  }
  return pv;
}

/** Keep vs replace on a present-value basis. `rate` (e.g. 0.05) and every
 *  cost are the organisation's figures. */
function repairOrReplace(opts: {
  repairNow: number;
  keepYears: number;
  maintIfKept: number;
  replaceCapital: number;
  newLifeYears: number;
  maintIfNew: number;
  rate: number;
}): { keepPv: number; replacePvPerKeepWindow: number } {
  const keepPv = opts.repairNow + presentValueOfAnnualCost(opts.maintIfKept, opts.keepYears, opts.rate);
  // Compare over the same window: the replacement's capital annualised across
  // its own life, charged for the years the repair would have covered.
  const replaceAnnualised = opts.replaceCapital / opts.newLifeYears + opts.maintIfNew;
  const replacePvPerKeepWindow = presentValueOfAnnualCost(replaceAnnualised, opts.keepYears, opts.rate);
  return { keepPv, replacePvPerKeepWindow };
}
```

## When to Use
- When a repair quote is large relative to replacement — the trigger to annualise rather than eyeball
- In a capital planning cycle, to rank replacement candidates by yearly saving rather than by age
- When a replacement business case is being built, to keep the benefits explicit and numbered
- When the same asset class fails repeatedly across a portfolio — the model run once per unit becomes a fleet replacement schedule

## Common Mistakes
- **Comparing the two quotes directly** — a one-off against a one-off, ignoring that they buy different service lives
- **Trusting the default numbers** — every input is site- and asset-specific, and the maintenance trend especially comes from this asset's own history
- **Leaving install, disruption and disposal out of replacement capital** — the sticker price of the unit is not the cost of replacing it
- **A flat maintenance figure for the kept option** — the reason the decision came up is that maintenance is rising, so a flat number understates the keep cost
- **Padding the business case with vague efficiency claims** — a benefit that is not numbered does not belong in the comparison
- **Ignoring discounting entirely on a large, long-horizon decision** — money in year 20 is not money today, and the rigorous version says so

## Further Reading
- [ISO 15686-5 catalogue page](https://www.iso.org/standard/61148.html) — life-cycle costing for buildings and constructed assets; the cost-breakdown structure, number and scope only
- [GOV.UK: The Green Book — discounting and present value](https://www.gov.uk/government/publications/the-green-book-appraisal-and-evaluation-in-central-government) — a public methodology for discounting future costs, with worked rationale for the rate
- [Lesson 322](/courses/business-finance-solo-ops/time-tracking-and-effective-rate) — the same "put your own numbers in a model rather than read a worked example" approach applied to rates

```recall
- q: "State the correct basis for a repair-vs-replace comparison and why the raw quotes mislead."
  must:
    - "cost per year of service each option provides"
    - "the raw quotes are one-off against one-off, buying different service lives"
    - "annualise each — repair over the years it buys, capital over the new unit's life"

- q: "Which inputs to the whole-life model must come from the organisation, and which is the most asset-specific?"
  must:
    - "remaining life if kept, full replacement capital, maintenance trend, discount rate — all local"
    - "the maintenance trend is the most asset-specific, straight from the work-order history"
    - "default figures are illustrative and must be replaced"

- q: "What do discounting and replacement benefits each add to the model?"
  must:
    - "discounting values future costs less than present ones, tending to favour repairing"
    - "replacement benefits (energy, safety, capability) must be explicit and numbered"
    - "a vague efficiency claim does not belong in the comparison"
```
