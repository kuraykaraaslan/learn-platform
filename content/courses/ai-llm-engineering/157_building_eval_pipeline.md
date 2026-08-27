# 157. Building an Eval Pipeline

## Coverage Level
**Not assessed** — this concept was added to expand the AI & LLM Engineering course from internal-ai-rules' AI_Integration_Rules/eval-and-testing.md material, going deeper than the introductory eval coverage in item 140; no existing coverage data for your own practice.

## What It Is
Unit tests verify that your code behaves correctly. They cannot verify that a prompt produces good output, because a passing test suite with a mocked model response tells you nothing about whether the actual prompt-model combination is any good — that requires calling the real model and judging the real output, which is what an eval is. The mental model that keeps this straight is three distinct levels of testing, each catching a different class of regression: unit tests (mock the client, test your parsing/error-handling code), evals (call the real model against a fixed golden dataset and score the output), and human review (spot-check a sample of real production outputs on a rubric, on a cadence, because no automated score fully captures quality).

A golden dataset is the backbone of level 2: a small, versioned, representative set of inputs paired with *properties* a good output must have — not exact-match text, since LLM output is non-deterministic by nature, but checkable properties like "contains this term," "does not exceed this length," "does not contain these words." The eval runner executes every case, scores it against its expected properties, and reports a pass rate; a threshold below roughly 85% usually signals the golden dataset itself is too noisy or ambiguous to be a useful gate, not that the feature is unusually hard. Running evals costs real API money and takes real time, so they belong on a schedule (nightly or weekly in CI) and on every prompt change — not on every commit.

The discipline that actually prevents silent regressions is prompt regression testing: before merging any prompt change, run the eval suite against both the old and new prompt, and the new prompt does not ship unless it meets or exceeds the old pass rate. Without this gate, "does this new prompt feel better" is a vibe, not a measurement, and a well-intentioned tweak that improves one case while quietly breaking three others will ship straight to production. For features that parse structured output, evals should run the *full* pipeline — real model call through to the parsed, validated result — because a mocked response in a unit test cannot catch the model drifting away from the expected schema.

## Key Concepts
- **Three levels, three purposes**: unit tests (code correctness, mocked model) → evals (output quality, real model, golden dataset) → human review (rubric-scored sample of production output)
- **Golden dataset checks properties, not exact text**: `mustContain`, `mustNotContain`, `maxLength` — never exact string equality against non-deterministic output
- **Evals run on a schedule, not per-commit**: cost and latency make per-commit eval runs impractical; nightly/weekly CI or pre-merge-on-prompt-change is the standard cadence
- **Regression gate on prompt changes**: a new prompt must meet or exceed the old pass rate on the same golden set before merging — "meets or exceeds," not "feels better"
- **85% floor as a dataset-quality signal**: a pass-rate threshold set below ~85% usually means the golden set needs fixing, not that the bar should be lowered
- **Human review is not optional**: sample ~20 production outputs per feature per sprint against a simple rubric (accurate, concise, on-topic, safe, correctly formatted) — track the score trend over time
- **Full-pipeline evals for structured output**: test real model output through the actual Zod parse, not a mocked response — the model's schema adherence is exactly what you're checking
- **A >10% sustained drop in human review score triggers a prompt review** — not a one-off bad sample, a sustained trend

## Example Code
```typescript
// evals/summary/golden.ts
export const goldenCases = [
  {
    id: 'short-article',
    input: 'The company reported a 10% revenue increase...',
    expect: { maxLength: 300, mustContain: ['revenue', 'increase'], mustNotContain: ['hallucination'] },
  },
  {
    id: 'technical-doc',
    input: 'The API accepts JSON payloads...',
    expect: { maxLength: 200, mustContain: ['API', 'JSON'] },
  },
];

// evals/summary/run.ts
import { generateSummary } from '@/services/summary.service';
import { goldenCases } from './golden';

async function runEvals() {
  let passed = 0;
  for (const tc of goldenCases) {
    const output = await generateSummary(tc.input);
    const failures: string[] = [];
    if (output.length > tc.expect.maxLength) failures.push(`too long: ${output.length}`);
    for (const term of tc.expect.mustContain ?? []) {
      if (!output.toLowerCase().includes(term.toLowerCase())) failures.push(`missing: "${term}"`);
    }
    for (const term of tc.expect.mustNotContain ?? []) {
      if (output.toLowerCase().includes(term.toLowerCase())) failures.push(`forbidden term present: "${term}"`);
    }
    failures.length === 0 ? passed++ : console.error(`✗ ${tc.id}: ${failures.join(', ')}`);
  }
  const rate = passed / goldenCases.length;
  console.log(`Pass rate: ${(rate * 100).toFixed(1)}%`);
  if (rate < 0.9) process.exit(1); // fail CI below the documented floor
}
runEvals();
```
```yaml
# .github/workflows/evals.yml
on:
  schedule: [{ cron: '0 6 * * 1' }]  # weekly
  workflow_dispatch:                 # also runnable manually before merging a prompt change
jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx ts-node evals/summary/run.ts
        env: { ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }} }
```

## When to Use
- Any feature whose prompt or model is expected to change over time — evals are what make "is this better or worse" answerable
- Before merging a prompt change, model upgrade, or temperature adjustment — run the before/after comparison
- When a feature has been in production long enough to accumulate real usage patterns worth adding to the golden set
- On a recurring schedule (weekly is typical) to catch silent drift from an upstream model version update

## Common Mistakes
- Shipping a prompt change with no eval run, relying on "it read better in my testing" as the quality signal
- Testing only with mocked AI responses and calling that sufficient QA for an AI feature — mocks cannot catch prompt or schema drift
- Setting the pass-rate threshold arbitrarily low to make a noisy or unrepresentative golden dataset "pass"
- Treating unit test coverage as equivalent to eval coverage — they test different things and neither substitutes for the other

## Further Reading
- Chip Huyen — "Designing Machine Learning Systems" and her AI Engineering writing on eval-driven development (huyenchip.com)
- Anthropic — "Building evals" and "Empirical approach to prompt engineering" (official documentation)
- OpenAI Evals framework (github.com/openai/evals) — a widely referenced open-source pattern for structuring golden datasets, model-agnostic in approach
