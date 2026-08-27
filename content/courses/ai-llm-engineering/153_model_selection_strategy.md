# 153. Model Selection Strategy

## What It Is
Model selection is a cost/latency/quality tradeoff, and treating it as a one-time choice made at the start of a project (rather than a per-feature decision, revisited as usage data comes in) is one of the more expensive mistakes in production AI systems. Anthropic's Claude lineup in 2026 spans three tiers with genuinely different economics: Haiku is cheap and fast, built for high-volume, short, structured tasks; Sonnet is the default — the right choice whenever you're uncertain — balancing capability against cost for feature-grade reasoning, code, and medium-length generation; Opus is the expensive, high-latency tier reserved for genuinely hard multi-step reasoning where a missed edge case has real cost, like architecture review or long-document analysis.

The selection rules follow directly from the shape of the task rather than from a vague sense of "how smart does this need to be." Output length and call volume are the two strongest signals: a task producing under 200 tokens of structured output at over 1,000 calls a day is a strong Haiku candidate purely on cost grounds, while an open-ended, medium-length generation task at moderate volume defaults to Sonnet. Opus should almost never be the choice for anything a user triggers interactively — its latency is high enough that it will visibly degrade the experience — and it should never be reached for until an eval has actually shown that Sonnet's quality is insufficient, not just assumed to be.

The other discipline worth internalizing: never use a model alias that can silently resolve to a different underlying version over time, and never switch models at runtime based on user tier without explicit product sign-off (a cost-based downgrade that a paying customer didn't agree to is a trust problem, not just a technical one). Every model choice should be documented at the call site — model, reason, and what was evaluated — so a future engineer (or you, in six months) can tell at a glance whether the choice was deliberate or just inherited from a copy-pasted example.

## Key Concepts
- **Three-tier ladder**: Haiku (cheap, fast, structured/high-volume) → Sonnet (default, balanced) → Opus (expensive, deep reasoning only)
- **"When in doubt, use Sonnet"**: the explicit default absent a specific reason to move up or down the ladder
- **Volume and output length as the primary signals**: high call volume + short structured output → Haiku; open-ended prose/code at moderate volume → Sonnet
- **Opus requires justification, not intuition**: reserved for explicitly complex multi-step reasoning, documented with *why* Sonnet was evaluated and found insufficient
- **Opus is never for interactive, user-triggered latency-sensitive paths**: its response time is unsuitable for a user actively waiting
- **Full versioned model IDs, never aliases**: aliases can resolve to a different model version over time, silently changing behavior in production
- **Document the choice at the call site**: a comment or ADR entry stating model, reason, and volume — makes the decision auditable later
- **Context window is rarely the constraint** — the current frontier models carry a 1M-token window and the small tier 200K, so cost is the real ceiling; never conflate "the model can handle this much input" with "you should send this much input"

## Example Code
```typescript
// libs/ai/prompts/summary.prompt.ts

// Model: claude-sonnet-5
// Reason: summary generation, ~500 output tokens, ~50 calls/day, open-ended prose
// Evaluated: haiku was too terse on the golden eval set (see eval-pipeline lesson); opus unnecessary at this quality bar
export const SUMMARY_CONFIG = {
  model: 'claude-sonnet-5',
  max_tokens: 600,
} as const;

// libs/ai/prompts/classification.prompt.ts

// Model: claude-haiku-4-5
// Reason: binary/enum classification, <20 output tokens, ~5,000 calls/day — cost and latency both favor Haiku
// Evaluated: Haiku hits 96% agreement with Sonnet on the golden eval set at 1/4 the cost
export const CLASSIFICATION_CONFIG = {
  model: 'claude-haiku-4-5',
  max_tokens: 20,
} as const;

// libs/ai/prompts/architecture-review.prompt.ts

// Model: claude-opus-5
// Reason: multi-file architecture review, ~40 page document, missed edge cases have real cost
// This is triggered from a background job, never an interactive user-facing call — latency is acceptable here
export const ARCHITECTURE_REVIEW_CONFIG = {
  model: 'claude-opus-5',
  max_tokens: 4000,
} as const;
```

## When to Use
- At the start of every new AI feature — pick and document the tier before writing the prompt
- When a feature's call volume crosses a threshold (e.g., >1,000/day) — revisit whether Haiku now makes more economic sense
- When an eval shows Sonnet's quality is genuinely insufficient for a specific task — that's the trigger to evaluate Opus, not intuition
- When reviewing an existing codebase's AI calls for cost optimization — mismatched model tiers are a common, easy win
- Never for a runtime, per-user-tier model switch without explicit product approval

## Common Mistakes
- Defaulting to the most capable (and most expensive) model "to be safe" without ever testing whether a cheaper tier meets the quality bar
- Using Opus in a user-facing interactive path, causing latency the user directly feels
- Pinning to a model alias instead of a full versioned model ID, so behavior can shift underneath the application without a deliberate upgrade
- Never revisiting model choice after shipping, even as call volume or output requirements change significantly

## Further Reading
- [Anthropic — "Models overview" and pricing page](https://anthropic.com/pricing) — verify current tiers before writing a cost spec
- Anthropic — "Choosing the right Claude model for your use case" (documentation)
- Chip Huyen, "AI Engineering" — chapter on model selection tradeoffs across cost, latency, and quality
