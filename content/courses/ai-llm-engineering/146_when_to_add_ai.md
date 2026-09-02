# 146. When to Add an AI Feature

## What It Is
The most expensive mistake in applied AI engineering happens before a single API call is written: deciding to use a language model for a problem that a regex, a lookup table, or a plain `if` statement would solve more cheaply, more reliably, and with zero hallucination risk. LLMs are probabilistic text generators — even a well-prompted, well-evaluated model will occasionally produce a wrong or malformed answer. Deterministic code doesn't have that failure mode. The engineering discipline here is treating "should this be AI at all" as a real design decision with a rejection criterion, not a default reach because the API is easy to call.

The useful dividing line is whether the task requires genuine semantic understanding or open-ended generation, versus whether it's actually a structured transformation with a small number of known cases. Classifying a support ticket into one of six categories based on nuanced free-text complaints is a good AI candidate. Parsing a date string, converting currency formats, or matching against a fixed enum is not — those are solved problems with libraries that are faster, free, and never hallucinate. The test that scales across a career: could a regex, a lookup table, or a standard classical ML model hit better than roughly 90% accuracy on this? If yes, that's very likely the better engineering choice, and AI should be reserved for the residual cases the deterministic path can't reach.

This decision also has a compounding cost dimension. Every AI feature you ship carries an ongoing per-call API cost, a latency tax, a new failure surface (timeouts, rate limits, refusals), and now a maintenance burden (prompts drift, models get deprecated, evals need upkeep). None of that is free. A feature that could have been 40 lines of TypeScript but became an LLM call inherits all of that overhead for no accuracy benefit — it's technical debt with a monthly invoice attached.


```quiz
- q: "What test does the lesson give for whether a task should use an LLM at all?"
  anchor: "could a regex, a lookup table, or a standard classical ML model hit better than roughly 90% accuracy on this?"
  options:
    - text: "Whether the input is natural language"
      correct: false
      why: "Plenty of natural-language tasks \u2014 parsing a date string, matching a fixed enum \u2014 are solved better without a model."
    - text: "Whether a regex, lookup table or classical model could clear roughly 90% accuracy"
      correct: true
      why: "If a deterministic path gets there, it is faster, free and never hallucinates; the model is then for the residual cases only."
    - text: "Whether the team has budget for the API calls"
      correct: false
      why: "Cost matters but is not the dividing line. A cheap wrong answer is still a wrong answer."

- q: "Why is 'the model is well-prompted and well-evaluated' not an answer to the reliability concern?"
  anchor: "Deterministic code doesn't have that failure mode"
  options:
    - text: "Because evaluation suites are usually too small to trust"
      correct: false
      why: "Sample size is a real issue but a different one. The lesson's point holds even with a perfect eval."
    - text: "Because a probabilistic generator retains a failure mode deterministic code simply does not have"
      correct: true
      why: "Prompting and evals reduce the rate; they do not change the category. An `if` statement cannot hallucinate."
    - text: "Because prompts drift as the model is updated"
      correct: false
      why: "Drift is a real operational cost, but the argument here is about the failure mode existing at all."
```

## Key Concepts
- **Semantic vs structural tasks**: free-form generation, intent classification, and open-ended Q&A are AI-shaped; format parsing and rule-based categorization with finite cases are not
- **The 90% deterministic gate**: if a regex, lookup table, or classical ML model can hit ~90%+ accuracy, prefer it over an LLM call
- **Total cost of an AI feature**: per-call API cost + latency + new failure modes (timeouts, refusals, rate limits) + ongoing prompt/eval maintenance
- **Natural-language-to-structured-output**: a strong AI use case — extracting structured fields from unstructured documents or messages
- **Exact-match tasks are anti-patterns**: keyword search, known-format parsing, and static rule application should never route through an LLM
- **Code generation and review assistance**: legitimate AI use cases, but static linting/type-checking should still do what they already do well
- **Reversibility**: prefer AI first for read-only, non-destructive tasks; gate any AI-initiated write or irreversible action behind human confirmation

## Example Code
```typescript
// A decision gate you can literally drop into a feature spec review.
// Answer these before writing the first prompt.

interface AiFeatureGate {
  canDeterministicSolveAt90Percent: boolean; // regex / lookup / classical ML
  requiresSemanticUnderstanding: boolean;    // free text, ambiguity, judgment calls
  outputIsReversible: boolean;               // can a human undo it if wrong?
  hasDocumentedCostEstimate: boolean;        // see token-budget-and-cost lesson
}

function shouldUseAI(gate: AiFeatureGate): 'use-ai' | 'use-deterministic-code' | 'blocked-need-more-info' {
  if (gate.canDeterministicSolveAt90Percent) return 'use-deterministic-code';
  if (!gate.requiresSemanticUnderstanding) return 'use-deterministic-code';
  if (!gate.hasDocumentedCostEstimate) return 'blocked-need-more-info';
  return 'use-ai';
}

// Example: "categorize this transaction as Food/Transport/Other from free text"
// canDeterministicSolveAt90Percent: false (merchant strings are messy and varied)
// requiresSemanticUnderstanding: true
// outputIsReversible: true (user can recategorize)
// → use-ai, with a human override in the UI
```

## When to Use
- At feature-spec time, before any prompt is written — this is a scoping decision, not an implementation detail
- When a PM or stakeholder suggests "just have AI do it" for a task that sounds like data transformation
- When evaluating whether an existing AI feature should be replaced with cheaper deterministic logic after production data shows the input space is actually narrow
- When estimating timeline and cost for a new feature — the AI-vs-deterministic call changes both by an order of magnitude
- When a classical ML model (sklearn, a simple classifier) would meet the bar without LLM latency or per-call cost

## Common Mistakes
- Defaulting to an LLM call because it's the fastest way to get a demo working, then never revisiting the decision once it's in production
- Building an AI feature for a task with a small, enumerable input space that a switch statement would have handled perfectly
- Ignoring the compounding cost: one AI call in a hot path multiplies into a real monthly bill and a new on-call failure mode
- Treating "AI can technically do this" as equivalent to "AI is the right tool for this" — capability is not the same as fit

## Further Reading
- Google's "Rules of Machine Learning" (Martin Zinkevich) — rule #1 is "don't be afraid to launch a product without machine learning"
- Chip Huyen, "Designing Machine Learning Systems" (O'Reilly) — chapter on when ML/AI is and isn't the right solution
- Anthropic's "Building Effective Agents" — the opening framing on starting with the simplest solution that works

```recall
- q: "State the rejection criterion for using an LLM."
  must:
    - "ask whether a regex, lookup table or classical model clears roughly 90%"
    - "if it does, that is the better engineering choice"
    - "reserve the model for the residual cases the deterministic path cannot reach"

- q: "Give one good and one bad candidate task, and say what separates them."
  must:
    - "classifying free-text tickets into categories is a good candidate"
    - "parsing a date or matching a fixed enum is not"
    - "the split is genuine semantic understanding versus a structured transformation with known cases"

- q: "Why does 'we prompt it well and we have evals' not settle the reliability question?"
  must:
    - "a probabilistic generator can still produce a wrong or malformed answer"
    - "prompting and evals lower the rate, not the category of failure"
    - "deterministic code has no equivalent failure mode"
```
