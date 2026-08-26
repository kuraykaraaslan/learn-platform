# 82. Estimation — Confidence Intervals Instead of Story Points

## Coverage Level
**Partial** — Your project management rules address estimation, but there is no formal model for communicating uncertainty ranges to clients or tracking estimation accuracy over time. You likely give single-point estimates, which sets you up for trust damage when the real number differs.

## What It Is
Software estimation is the process of predicting how long a piece of work will take before you have done it. It is inherently uncertain, and the pretense that it is not — the single-number estimate, the commitment to a date without caveats — is the root cause of most developer-client trust problems. The client does not need a precise answer; they need a calibrated one. A calibrated estimate is one that accurately communicates both the expected value and the uncertainty range.

Confidence intervals are the formal version of this. Instead of "this will take 3 days," you say "I'm 90% confident this takes between 2 and 6 days, with a most likely time of 3 days." The range is not weakness — it is honesty. Clients who receive calibrated estimates learn to trust you because your stated uncertainties match the actual outcomes over time. Clients who receive only point estimates learn to distrust you when reality deviates from the number, even if your most likely guess was accurate.

Story points, used in Scrum, are a relative sizing system (this feature is "twice as complex as that feature") that requires velocity calibration across sprints to convert to time. As a solo developer, you do not have sprints and velocity data — and even for teams, story points are frequently misused as time estimates rather than complexity proxies. The confidence interval approach is more honest, more communicable to clients (who do not understand story points), and more useful for project planning. The key tool is the three-point estimate (optimistic, most likely, pessimistic) combined with the PERT formula to produce an expected value with an implicit confidence range.

## Key Concepts
- **Three-point estimate**: Optimistic (O), Most Likely (M), Pessimistic (P) — three scenarios for the same task
- **PERT formula**: `Expected = (O + 4M + P) / 6` — the weighted average; weights the most likely case 4x
- **Standard deviation of estimate**: `SD = (P - O) / 6` — the spread; larger SD means more uncertainty
- **90% confidence interval**: `Expected ± 1.645 × SD` — the range within which 90% of your estimates should fall if your calibration is accurate
- **Estimation vs. commitment**: An estimate is a prediction; a commitment is a promise; confusing them is the primary cause of strained client relationships
- **Cone of uncertainty**: Estimates made at project start have 4× wider uncertainty than estimates made after design is complete — communicate which phase you are in
- **Estimation accuracy tracking**: Log your three-point estimates and actual outcomes; if your actuals frequently exceed your pessimistic estimate, your pessimistic estimates are not pessimistic enough
- **Breaking down before estimating**: Tasks estimated at > 2 days have 3× the error rate of tasks estimated at < 2 days — always decompose before estimating

## Example Code or Template

```typescript
// Three-point PERT estimation model
// Use this before quoting any project or task to a client

interface ThreePointEstimate {
  taskName: string;
  optimistic: number;   // hours — everything goes right
  mostLikely: number;   // hours — normal day, normal interruptions
  pessimistic: number;  // hours — dependencies delayed, unexpected complexity
  unit?: 'hours' | 'days';
}

interface EstimateResult {
  taskName: string;
  expected: number;          // PERT weighted mean
  standardDeviation: number; // spread of uncertainty
  confidenceInterval90: { low: number; high: number };
  confidenceInterval80: { low: number; high: number };
}

function calculatePERT(estimate: ThreePointEstimate): EstimateResult {
  const { optimistic: O, mostLikely: M, pessimistic: P } = estimate;

  const expected = (O + 4 * M + P) / 6;
  const sd = (P - O) / 6;

  return {
    taskName: estimate.taskName,
    expected: Math.round(expected * 10) / 10,
    standardDeviation: Math.round(sd * 10) / 10,
    confidenceInterval90: {
      low: Math.round((expected - 1.645 * sd) * 10) / 10,
      high: Math.round((expected + 1.645 * sd) * 10) / 10,
    },
    confidenceInterval80: {
      low: Math.round((expected - 1.282 * sd) * 10) / 10,
      high: Math.round((expected + 1.282 * sd) * 10) / 10,
    },
  };
}

// Aggregate multiple tasks into a project estimate
function aggregateProjectEstimate(tasks: ThreePointEstimate[]): {
  totalExpected: number;
  projectCI90: { low: number; high: number };
} {
  const results = tasks.map(calculatePERT);
  const totalExpected = results.reduce((sum, r) => sum + r.expected, 0);
  // Combined SD of independent tasks: sqrt(sum of squared SDs)
  const combinedSD = Math.sqrt(
    results.reduce((sum, r) => sum + r.standardDeviation ** 2, 0)
  );

  return {
    totalExpected: Math.round(totalExpected * 10) / 10,
    projectCI90: {
      low: Math.round((totalExpected - 1.645 * combinedSD) * 10) / 10,
      high: Math.round((totalExpected + 1.645 * combinedSD) * 10) / 10,
    },
  };
}

// Example: estimating a payment module integration
const tasks: ThreePointEstimate[] = [
  { taskName: 'Stripe webhook handler', optimistic: 3, mostLikely: 6, pessimistic: 12, unit: 'hours' },
  { taskName: 'PayPal provider adapter', optimistic: 4, mostLikely: 8, pessimistic: 20, unit: 'hours' },
  { taskName: 'Refund flow + idempotency', optimistic: 2, mostLikely: 5, pessimistic: 10, unit: 'hours' },
  { taskName: 'Integration tests', optimistic: 3, mostLikely: 5, pessimistic: 8, unit: 'hours' },
];

const project = aggregateProjectEstimate(tasks);
console.log(
  `Project estimate: ${project.totalExpected}h expected, ` +
  `90% CI: [${project.projectCI90.low}h – ${project.projectCI90.high}h]`
);
// → Project estimate: 29.2h expected, 90% CI: [20.1h – 38.3h]

// Client-facing translation of the above:
// "This work will take approximately 3.5 days. In 90% of scenarios given
// the complexity involved, it will fall between 2.5 and 5 days.
// I flag this range upfront so we can plan accordingly."
```

## When to Use
- Before quoting any fixed-price project — use three-point estimates per task, aggregate them, and give the client the CI90 range alongside the expected value
- When a client pushes back on a timeline — share your pessimistic estimate rationale ("here is what could cause this to take longer") rather than defending the single number
- After completing a task — log actual vs. estimated; if actuals are consistently outside your CI80, your pessimistic estimates are miscalibrated
- When scoping a project during discovery — use wide confidence intervals and explicitly label them "pre-design estimates, expect this to narrow after specifications are complete"
- When negotiating a contract — CI ranges let you offer a "best case" price anchored to the optimistic estimate and a "not-to-exceed" price anchored to the pessimistic estimate

## Common Mistakes
- **Single-point estimates to clients**: "Five days" sounds confident; "four to seven days with five being most likely" sounds honest — the second builds more long-term trust because it proves accurate over time
- **Not decomposing before estimating**: A "build the dashboard" estimate is useless; "implement five chart components, wire up three API endpoints, and write unit tests" is estimable — decompose to tasks of 2–8 hours before estimating
- **Optimism bias unchecked**: Most developers' "optimistic" estimates are actually their "everything goes perfectly, I have no meetings, no bugs, and unlimited focus" estimates — these never occur; pad your optimistic estimate by 20% to account for baseline friction
- **Not tracking calibration**: Estimation improves only through feedback; if you never compare your estimates to actuals, your confidence intervals are just theater — log every estimate and review monthly

## Further Reading
- **"Software Estimation: Demystifying the Black Art" — Steve McConnell** — The most comprehensive treatment of software estimation as a discipline; includes the PERT model, cone of uncertainty, and calibration tracking in detail
- **"How to Measure Anything" — Douglas Hubbard** — The case for calibrated confidence intervals in business decision-making; Chapter 3 covers how to train yourself to make accurate probabilistic estimates
- **"The Planning Fallacy" — Daniel Kahneman (Thinking, Fast and Slow, Chapter 23)** — The psychological explanation for why single-point estimates are systematically optimistic and how to correct for it using reference class forecasting
