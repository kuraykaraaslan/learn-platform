# 507. Condition and Criticality: Modelling a Score You Did Not Invent

## What It Is
Two numbers get attached to an asset and they are constantly confused. **Condition** is how worn the asset is right now — an inspector's judgement on a visit, 1 for as-new, 5 for failed. **Criticality** is how much its failure matters — a property of the asset's role, not its state, and it barely changes over the asset's life. A pump in perfect condition can be the most critical asset on the site; a corroded handrail bracket can be the least.

The mistake this lesson exists to prevent is **importing a criticality number**. There is no industry table that says "a booster pump is criticality 4". Criticality is `consequence × likelihood` evaluated against *this* organisation's tolerance: what does it cost this site when this pump fails, given its redundancy, its spares holding, its lead time, and what is downstream. That calculation is the organisation's to make, and a developer's job is to build the model that lets them make it — not to seed it with plausible-looking defaults and hope nobody asks where they came from.

So the model is explicit and its inputs are the organisation's. Consequence is usually scored on a few axes — safety, environment, production loss, repair cost — each rated on a defined scale the organisation writes down. Likelihood comes from history where there is history and from a rating where there is not. The weights between the axes are a policy decision: a hospital weights safety differently from a data centre. The output is a single number only so it can be sorted; the inputs are what a review actually discusses.

Condition feeds a different loop. A rising condition score on a high-criticality asset is the signal that schedules work. Condition on a low-criticality asset is often logged and ignored on purpose — run-to-failure is a valid strategy when failure is cheap. The two numbers multiplied give a crude work-priority order, which is worth exactly as much as the honesty of the criticality model behind it.

```quiz
- q: "What is the difference between an asset's condition and its criticality?"
  anchor: "how worn the asset is right now"
  options:
    - text: "Condition is set by the manufacturer, criticality by the operator"
      correct: false
      why: "Neither is a manufacturer figure. Condition is an inspector's judgement; criticality is the operator's consequence assessment."
    - text: "Condition is the asset's current state of wear; criticality is how much its failure matters, and it barely changes over the asset's life"
      correct: true
      why: "One is a property of the state, the other of the role. A perfect-condition asset can be the most critical."
    - text: "They are the same number viewed from maintenance and from operations"
      correct: false
      why: "They are independent. Multiplying them gives a priority order, but they measure different things."

- q: "Why should a criticality score not be seeded with default values?"
  anchor: "not to seed it with plausible-looking defaults and hope nobody asks where they came from"
  options:
    - text: "Defaults are usually too conservative and inflate the maintenance budget"
      correct: false
      why: "The direction of the error is unknowable — that is the problem. A default is a number with no derivation."
    - text: "Criticality is consequence against this organisation's tolerance, so a default is a claim about a site the author has never seen"
      correct: true
      why: "The model must be filled from the organisation's own consequence scales, redundancy and lead times."
    - text: "The database cannot store default values for that column"
      correct: false
      why: "It can. The objection is to the meaning of the number, not its storage."
```

## Key Concepts
- **Condition is state**: current wear, an inspector's 1-to-5 judgement on a visit
- **Criticality is role**: how much a failure matters, roughly constant over the asset's life
- **A perfect-condition asset can be the most critical** — the two are independent
- **There is no industry criticality table** — it is `consequence × likelihood` against this organisation's tolerance
- **Consequence is scored on axes the organisation defines** — safety, environment, production, cost — each with a written scale
- **The weights between axes are a policy decision** — a hospital and a data centre differ
- **The single output number exists only to sort** — the axis inputs are what a review discusses
- **Run-to-failure is valid** for low-criticality assets — condition there is logged, not acted on
- **Condition × criticality is a crude priority order**, worth as much as the criticality model's honesty

## Example Code
A criticality model. Every weight and every scale value is a placeholder the organisation replaces — the code is the structure, not the answer:

```typescript run
/** REPLACE THESE. They are not defaults — they are the shape of the decision
 *  the organisation has to make. Each axis is scored 1..5 against a scale the
 *  organisation writes down; the weights say how the organisation trades the
 *  axes against each other and must sum to 1. */
const AXIS_WEIGHTS = { safety: 0.4, environment: 0.2, production: 0.25, repairCost: 0.15 };

type Consequence = { safety: number; environment: number; production: number; repairCost: number };

/** Weighted consequence, then combined with a likelihood rating (1..5, from
 *  failure history where it exists). Output is 1..5 only so a register can
 *  sort on it. */
function criticality(c: Consequence, likelihood: number): number {
  const w = AXIS_WEIGHTS;
  const consequence =
    c.safety * w.safety +
    c.environment * w.environment +
    c.production * w.production +
    c.repairCost * w.repairCost;
  // Geometric-ish blend: a high consequence with low likelihood still ranks,
  // but a 1 on either axis keeps it low. The organisation may prefer a plain
  // product or a matrix lookup — this is a choice, not a formula from nowhere.
  return Math.round(Math.sqrt(consequence * likelihood) * 10) / 10;
}

const weightSum = Object.values(AXIS_WEIGHTS).reduce((a, b) => a + b, 0);
console.log(`axis weights sum to ${weightSum.toFixed(2)} (must be 1.00 — adjust before trusting output)`);
console.log('');

// The organisation's own assessment of three assets. These rows are the input
// a review meeting produces; nothing here was picked to look reasonable.
const assessed: { tag: string; c: Consequence; likelihood: number }[] = [
  { tag: 'PMP-1001A', c: { safety: 2, environment: 3, production: 5, repairCost: 4 }, likelihood: 3 },
  { tag: 'FP-PUMP-01', c: { safety: 5, environment: 1, production: 1, repairCost: 3 }, likelihood: 2 },
  { tag: 'FILT-B2-01', c: { safety: 1, environment: 1, production: 2, repairCost: 1 }, likelihood: 4 },
];

console.log('tag         criticality   (driven by)');
for (const a of assessed) {
  const score = criticality(a.c, a.likelihood);
  const top = (Object.entries(a.c) as [keyof Consequence, number][]).sort((x, y) => y[1] - x[1])[0][0];
  console.log(`${a.tag.padEnd(11)} ${String(score).padEnd(13)} ${top}`);
}

console.log('');
console.log('FP-PUMP-01 stays above FILT-B2-01 on a single safety consequence of 5, even at');
console.log('likelihood 2 — one axis carried it. FILT-B2-01 fails more often (likelihood 4)');
console.log('and still ranks last, because nothing downstream of it matters: run-to-failure');
console.log('is the correct strategy for that row. None of these numbers is a recommendation —');
console.log('change AXIS_WEIGHTS and the order can change.');
```

```typescript
/** Condition is the other axis, and it is time-series, not a property. The
 *  register stores the latest; the trend is what schedules work. */
type ConditionReading = { tag: string; observedOn: string; score: number };

function latestCondition(readings: ConditionReading[], tag: string): ConditionReading | undefined {
  return readings
    .filter((r) => r.tag === tag)
    .sort((a, b) => b.observedOn.localeCompare(a.observedOn))[0];
}

/** Work priority: the crude product, explicitly labelled crude. A rising
 *  condition on a high-criticality asset is the real signal; this is just
 *  the sort key. */
function workPriority(criticalityScore: number, condition: ConditionReading | undefined): number {
  return criticalityScore * (condition?.score ?? 1);
}
```

## When to Use
- When configuring a register's criticality field — build the model, then run the organisation's assessment through it, rather than pre-filling
- In a criticality review workshop, where the axis scores and weights are the agenda and the output number is a by-product
- When prioritising a maintenance backlog — condition trend on high-criticality assets first, not the raw condition ranking
- When deciding a maintenance strategy per asset — run-to-failure is a defensible choice the criticality score should make visible

## Common Mistakes
- **Seeding criticality with defaults** — a number with no derivation that a review will eventually have to defend and cannot
- **Confusing condition and criticality** — acting on a bad condition score for an asset whose failure costs nothing, or ignoring a critical asset because it currently looks fine
- **A hidden formula** — if the reviewers cannot see how the axes combine, they cannot challenge the result, and an unchallengeable score is not trusted
- **Weights that do not sum to 1** — the output is then on an undefined scale and cannot be compared across assets
- **One consequence axis** — collapsing safety, environment, production and cost into a single guess loses the reason a number is what it is
- **Treating the output number as the deliverable** — the axis scores are what a re-assessment revisits; the number is regenerated from them

## Further Reading
- [ISO 55000 catalogue page](https://www.iso.org/standard/83053.html) — asset management vocabulary; the risk-based decision framing, number and scope only
- [FMEA — NASA/SP reliability practice overview](https://ntrs.nasa.gov/citations/20000102122) — failure modes and effects analysis, the more granular consequence method a criticality axis compresses
- [Reliability-centred maintenance (SAE JA1011 scope)](https://www.sae.org/standards/content/ja1011_200908/) — the standard defining what an RCM process must ask; the questions, not the answers

```recall
- q: "Distinguish condition from criticality, with an example that separates them."
  must:
    - "condition is current wear — an inspector's judgement, changes over time"
    - "criticality is how much failure matters — a property of the role, roughly constant"
    - "e.g. a perfect-condition pump can be the most critical asset; a worn low-consequence bracket the least"

- q: "Why is importing or defaulting a criticality number wrong?"
  must:
    - "criticality is consequence times likelihood against this organisation's tolerance"
    - "it depends on redundancy, spares, lead time and what is downstream — all local"
    - "a default is a claim about a site the author has not seen"

- q: "What should a criticality model expose, and why?"
  must:
    - "the consequence axes, their scales, and the weights between them"
    - "so a review can challenge the inputs rather than the opaque output"
    - "the single number exists only to sort the register"
```
