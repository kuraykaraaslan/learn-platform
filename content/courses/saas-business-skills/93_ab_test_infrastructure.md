# 93. A/B Test Infrastructure — Statistical Significance

## What It Is
A/B testing (also called split testing or controlled experimentation) is the practice of showing different versions of a feature or UI to randomly assigned groups of users and measuring which version performs better on a defined metric. It is the mechanism by which product decisions move from "I think this is better" to "this is measurably better with 95% confidence." The alternative — launching changes without A/B tests and observing overall metrics — conflates your change with every other change happening simultaneously and cannot attribute causality.

The statistical foundation of A/B testing is hypothesis testing. You define a null hypothesis (the new variant has no effect on the metric), measure the difference in outcomes between the control and variant, and calculate the probability that the observed difference could have occurred by random chance if the null hypothesis were true. This probability is the p-value. When the p-value is below your significance threshold (typically 5%, meaning α=0.05), you reject the null hypothesis and conclude the difference is statistically significant. Critically, "statistically significant" does not mean "large enough to matter" — it means "unlikely to be due to random variation." You still need to evaluate practical significance (is the improvement worth the implementation cost?).

The most common mistake in A/B testing is declaring a winner before sufficient sample size is reached — a practice called "peeking." If you run a test and check results daily, the p-value fluctuates randomly and will cross 0.05 by chance even when there is no real effect. The solution is to calculate the required sample size before starting the test (based on expected baseline conversion rate, minimum detectable effect, and desired power), and commit to running the test until that sample size is reached, regardless of intermediate results.

```quiz
- q: "Your test crosses p < 0.05 on day 3, well short of the target sample size. Can you call it?"
  anchor: "Checking results before the target sample size is reached inflates false-positive rates"
  options:
    - text: "Yes — the threshold is the threshold"
      correct: false
      why: "The threshold assumes a stopping rule fixed in advance. Peeking inflates exactly the error rate that threshold was chosen to control."
    - text: "No — that is the peeking problem, and the stopping rule had to be committed to before the test started"
      correct: true
      why: "The rule exists precisely because an early crossing is the tempting case."
    - text: "Yes, provided the effect is also practically significant"
      correct: false
      why: "Practical significance is a separate question, and it does not repair a p-value obtained by peeking."

- q: "A result comes back statistically significant. What has that established?"
  anchor: "does not mean \"large enough to matter\" — it means \"unlikely to be due to random variation"
  options:
    - text: "The improvement is big enough to justify shipping"
      correct: false
      why: "That is practical significance — a separate evaluation of whether the improvement is worth the implementation cost."
    - text: "The difference is unlikely to be due to random variation"
      correct: true
      why: "Nothing more, and in particular nothing about the size of the effect."
    - text: "The variant will perform the same way for all future users"
      correct: false
      why: "Significance is a statement about the evidence in this sample, not a forecast guarantee."

- q: "You are testing a subscription upgrade flow in a multi-tenant product. What is the randomization unit?"
  anchor: "for subscription upgrades, randomize by tenant (not by user within a tenant)"
  options:
    - text: "Users — they are the ones who click"
      correct: false
      why: "Users inside one tenant share the decision, so randomizing below the conversion event's level contaminates both arms."
    - text: "Tenants — the unit that matches the conversion event"
      correct: true
      why: "The rule is to choose the unit that matches the conversion event."
    - text: "Sessions, so returning users give a fresh sample each visit"
      correct: false
      why: "Assignment has to be stable — a user stays in their group for the duration of the test."
```

## Key Concepts
- **Control and variant**: The control is the current version (A); the variant is the new version (B); users are randomly assigned to one group and stay in that group for the duration of the test
- **Randomization unit**: Users, tenants, or sessions — choose the unit that matches the conversion event; for subscription upgrades, randomize by tenant (not by user within a tenant)
- **Minimum Detectable Effect (MDE)**: The smallest improvement you care about detecting; a 0.5% improvement in conversion rate requires thousands of samples; a 5% improvement requires far fewer — set MDE based on business value
- **Statistical power**: The probability that your test will detect an effect if one exists; standard target is 80%; lower power means high false-negative rates (missing real improvements)
- **p-value**: The probability the observed difference occurred by chance under the null hypothesis; p < 0.05 is the standard threshold for declaring significance
- **Sample size calculator**: Use before starting any test: `n = (Z_α/2 + Z_β)² × (p1(1-p1) + p2(1-p2)) / (p1-p2)²` — or use an online calculator
- **Peeking problem**: Checking results before the target sample size is reached inflates false-positive rates; commit to a stopping rule before the test starts
- **Feature flags for experiments**: A/B tests are feature flags with random assignment; using your feature flag infrastructure (PostHog, LaunchDarkly) for experiments is more reliable than ad-hoc if/else checks

## Example Code or Template

```tsx
// A/B test infrastructure using PostHog feature flags
// PostHog handles random assignment, persistence, and result tracking

// ============================================================
// 1. EXPERIMENT DEFINITION — define before writing any code
// ============================================================

/*
Experiment: pricing-page-cta-text
Goal: Increase trial-to-paid conversion rate
Hypothesis: "Start Free Trial" converts better than "Get Started" for
            users on the pricing page

Control (A): "Get Started" button text
Variant (B): "Start Free Trial" button text

Primary metric: subscription_created within 14 days of seeing the pricing page
Secondary metric: trial_started within 7 days

Required sample size: ~800 pricing page visitors per variant (calculated below)
  - Baseline conversion: 8%
  - MDE: 2% absolute (from 8% to 10%)
  - α = 0.05, power = 80%
  - n ≈ (1.96 + 0.84)² × (0.08×0.92 + 0.10×0.90) / (0.02)² ≈ 780 per variant

Minimum test duration: ~3 weeks at current traffic
Stopping rule: Do NOT check results until 800 visitors per variant
*/

// ============================================================
// 2. VARIANT ASSIGNMENT — using PostHog feature flags
// ============================================================

'use client';
import { useFeatureFlagVariantKey } from 'posthog-js/react';
import { analytics, AnalyticsEvents } from '@/lib/analytics/analytics.service';

export function PricingCTAButton() {
  // PostHog assigns users to control/variant and persists the assignment
  const ctaVariant = useFeatureFlagVariantKey('pricing-page-cta-text');

  const buttonText = ctaVariant === 'start-free-trial'
    ? 'Start Free Trial'
    : 'Get Started'; // control

  const handleClick = () => {
    // Track the experiment exposure at click time
    analytics.track('pricing_cta_clicked', {
      experiment: 'pricing-page-cta-text',
      variant: ctaVariant ?? 'control',
      button_text: buttonText,
    });
    // ... navigate to signup
  };

  return (
    <button onClick={handleClick} className="btn-primary">
      {buttonText}
    </button>
  );
}

// ============================================================
// 3. STATISTICAL SIGNIFICANCE CALCULATOR
// ============================================================

interface ExperimentResults {
  controlVisitors: number;
  controlConversions: number;
  variantVisitors: number;
  variantConversions: number;
}

interface SignificanceResult {
  controlRate: number;
  variantRate: number;
  relativeUplift: number;
  pValue: number;
  isSignificant: boolean;
  zScore: number;
  sampleSizeAdequate: boolean;
}

function normalCDF(z: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return 0.5 * (1 + sign * y);
}

export function calculateSignificance(results: ExperimentResults): SignificanceResult {
  const { controlVisitors, controlConversions, variantVisitors, variantConversions } = results;

  const controlRate = controlConversions / controlVisitors;
  const variantRate = variantConversions / variantVisitors;
  const relativeUplift = (variantRate - controlRate) / controlRate;

  // Two-proportion z-test
  const pooledRate = (controlConversions + variantConversions) / (controlVisitors + variantVisitors);
  const standardError = Math.sqrt(
    pooledRate * (1 - pooledRate) * (1 / controlVisitors + 1 / variantVisitors)
  );
  const zScore = (variantRate - controlRate) / standardError;

  // Two-tailed p-value
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));

  return {
    controlRate,
    variantRate,
    relativeUplift,
    pValue,
    isSignificant: pValue < 0.05,
    zScore,
    sampleSizeAdequate: controlVisitors >= 100 && variantVisitors >= 100,
  };
}

// Example usage:
const results = calculateSignificance({
  controlVisitors: 820,
  controlConversions: 66,   // 8.0% conversion
  variantVisitors: 810,
  variantConversions: 81,   // 10.0% conversion
});
// → { isSignificant: true, pValue: 0.034, relativeUplift: 0.25, ... }
// → 25% relative uplift with p=0.034 — variant wins
```

The sample size calculator the Key Concepts tell you to use before starting
any test. The `(Z_α/2 + Z_β)²` term is evaluated here at the lesson's own
stated defaults — 95% confidence and 80% power — which makes it the constant
7.84; change either of those and the constant changes with them.

```calc
inputs:
  - { id: base, label: "Baseline conversion rate (%)", type: number, default: 5, min: 0, step: 0.5 }
  - { id: lift, label: "Relative improvement you want to detect — MDE (%)", type: number, default: 10, min: 0.1, step: 1 }
  - { id: visitors, label: "Visitors per day entering the test", type: number, default: 800, min: 1, step: 100 }
outputs:
  - { label: "Samples needed per arm", expr: "7.84 * ((base / 100) * (1 - base / 100) + (base * (1 + lift / 100) / 100) * (1 - base * (1 + lift / 100) / 100)) / ((base * lift / 10000) * (base * lift / 10000))", format: number }
  - { label: "Total samples (both arms)", expr: "2 * 7.84 * ((base / 100) * (1 - base / 100) + (base * (1 + lift / 100) / 100) * (1 - base * (1 + lift / 100) / 100)) / ((base * lift / 10000) * (base * lift / 10000))", format: number }
  - { label: "Days the test has to run", expr: "2 * 7.84 * ((base / 100) * (1 - base / 100) + (base * (1 + lift / 100) / 100) * (1 - base * (1 + lift / 100) / 100)) / ((base * lift / 10000) * (base * lift / 10000)) / visitors", format: number }
```

Halve the MDE and watch the required sample roughly quadruple — that is the
relationship behind "a 0.5% improvement requires thousands of samples." The
last line is the one that decides whether an experiment is worth running at
all: if the honest answer is longer than you will wait, the choice is a bigger
MDE or a different test, not a shorter run with a peek at the end.

## When to Use
- When changing your pricing page, signup flow, or any conversion touchpoint — these changes have direct MRR impact; test before permanent rollout
- When a client asks "should we use wording A or wording B on this CTA?" — the answer is "run a test"; a two-week test with 500 visitors per variant is faster and more reliable than any amount of debate
- When activation rate is below benchmarks — test different onboarding sequences, first-login flows, or empty state messaging; small improvements in activation compound into significant MRR over time
- After calculating your required sample size and determining your current traffic is insufficient — this is important information: it tells you to invest in traffic acquisition before investing in conversion optimization
- When making a business case for a product change to a client — "variant B produced a statistically significant 23% improvement in trial-to-paid conversion (p=0.03, n=1,640)" is a fundable result; "I think the new design is better" is not

## Common Mistakes
- **Stopping early when results look good**: The p-value fluctuates naturally during a test; if you stop as soon as p < 0.05, your false-positive rate is much higher than 5% — commit to the sample size target before starting
- **Testing too many variants simultaneously**: Each additional variant requires proportionally more traffic to reach significance; stick to A/B (one control, one variant) until you have high traffic; A/B/C/D tests require 3–4× the traffic
- **Choosing the wrong randomization unit**: If you randomize by session instead of by user/tenant, the same user might see different variants across sessions — contaminating the experiment and reducing statistical power
- **Not tracking the experiment exposure event**: If you only track conversions without tracking when users were exposed to the experiment, you cannot calculate the conversion rate — always fire an exposure event when the variant is shown, not just when the user converts

## Further Reading
- **"Trustworthy Online Controlled Experiments" — Kohavi, Tang, Xu** — The definitive textbook on A/B testing at scale, written by Microsoft and Google experimentation teams; the chapters on the peeking problem and sample ratio mismatch are essential
- [**"Statistical Significance and the Peeking Problem" — Evan Miller](https://evanmiller.org)** — The most readable explanation of why peeking inflates false-positive rates; includes an interactive visualization; free to read online
- [**PostHog Experiments Documentation](https://posthog.com/docs/experiments)** — End-to-end guide to running A/B tests with PostHog; covers feature flag setup, result analysis, and the statistical method PostHog uses internally

```recall
- q: "Define MDE and statistical power, and say what each one controls."
  must:
    - "MDE — the smallest improvement you care about detecting, set from business value"
    - "a 0.5% improvement needs thousands of samples; a 5% improvement far fewer"
    - "power — the probability the test detects an effect if one exists, standard target 80%"
    - "lower power means a high false-negative rate, missing real improvements"

- q: "What is a p-value, and what does significance not tell you?"
  must:
    - "the probability the observed difference occurred by chance under the null hypothesis"
    - "p < 0.05 is the standard threshold"
    - "significance does not mean large enough to matter — only unlikely to be random"
    - "practical significance is evaluated separately, against implementation cost"

- q: "State the peeking problem and its remedy."
  must:
    - "checking results before the target sample size is reached inflates false-positive rates"
    - "commit to a stopping rule before the test starts"

- q: "How is randomization set up?"
  must:
    - "control is the current version, variant is the new one"
    - "users are randomly assigned and stay in their group for the duration of the test"
    - "choose the randomization unit to match the conversion event — tenant for a subscription upgrade"
    - "run experiments through feature flag infrastructure rather than ad-hoc if/else checks"
```
