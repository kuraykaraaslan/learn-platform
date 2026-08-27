# 148. Prompts as Versioned Code

## What It Is
A system prompt is not a string literal you type into a function call — it's a piece of the application's behavior, and it should be versioned, reviewed, and tested with the same seriousness as any other code. The practical rule is simple: if a prompt is longer than a couple of lines, it does not belong inline in a service or route file. It goes into a dedicated `.prompt.ts` file, exported as a named constant, colocated with the model configuration (model ID, `max_tokens`, `temperature`) it's meant to be used with. This turns a prompt change into a diff a reviewer can actually read, instead of a buried string mutation in the middle of business logic.

Beyond file organization, a well-structured system prompt follows a consistent internal order: role definition first (one sentence establishing what the model is), then the task description, then constraints — critically, the constraints section is where safety and scope boundaries live, and it should come before the output format so the model weighs "what not to do" before "how to format it." Examples are added last, and only when the desired output format is genuinely non-obvious from a plain-language description; padding a prompt with examples it doesn't need just burns tokens on every call.

Two parameters deserve explicit, deliberate values every time rather than being left at whatever the SDK defaults to: `temperature` and `max_tokens`. Temperature controls how deterministic versus creative the output is — 0.0-0.2 for code generation and classification where you want the same answer every time, up to 0.7-1.0 for creative or marketing copy. `max_tokens` should be sized to what the task actually needs, not to the model's maximum; a three-sentence summary needs perhaps 150 tokens, and setting a needlessly high ceiling doesn't make the response longer, it just makes a truncation bug more silent when something eventually goes wrong.

## Key Concepts
- **Prompts are code**: version them, review them in PRs, and treat any prompt edit as a feature change requiring the same scrutiny as logic changes
- **Extraction threshold**: more than 2-3 lines of prompt text does not belong inline in a service or route — move it to `libs/ai/prompts/*.prompt.ts`
- **Canonical prompt structure**: role → task → constraints → output format → examples (only if format is non-obvious)
- **Temperature by task type**: 0.0-0.2 for code/classification, 0.2-0.4 for summarization/extraction, 0.3-0.5 for document Q&A, 0.7-1.0 for creative writing; default to 0.3 absent a reason to deviate
- **`max_tokens` is a budget, not a ceiling to max out**: size it to the task's actual expected output length
- **`stop_reason === 'max_tokens'` is a bug signal**: it means output was truncated — log it and raise the limit deliberately, never silently accept truncated output
- **Colocate config with prompt**: export a `..._CONFIG` object (model, max_tokens, temperature) alongside the prompt string so both change together and both are overridable in tests

## Example Code
```typescript
// libs/ai/prompts/summary.prompt.ts

export const SUMMARY_SYSTEM_PROMPT = `
You are a concise technical writer.

Task: Summarize the provided text in 3-5 sentences.

Constraints:
- Use plain language, no jargon unless the source uses it.
- Do not add information not present in the source.
- Output only the summary — no preamble, no explanation.
- Maximum 150 words.
`.trim();

export const SUMMARY_CONFIG = {
  model: 'claude-sonnet-4-6',
  max_tokens: 200,      // ~150 words output budget, with headroom
  temperature: 0.3,     // deterministic-leaning; this is a factual summary, not prose
} as const;

// services/summary.service.ts
import { anthropic } from '@/libs/ai/client';
import { SUMMARY_SYSTEM_PROMPT, SUMMARY_CONFIG } from '@/libs/ai/prompts/summary.prompt';
import { extractText } from '@/libs/ai/extract-text';
import { logger } from '@/libs/logger';

export async function generateSummary(text: string): Promise<string> {
  const response = await anthropic.messages.create({
    ...SUMMARY_CONFIG,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });

  if (response.stop_reason === 'max_tokens') {
    logger.warn('Summary truncated by max_tokens limit', { usage: response.usage });
  }

  return extractText(response);
}
```

## When to Use
- The moment a prompt string exceeds roughly 2-3 lines inline in application code
- Whenever a prompt is going to be reused across more than one call site — extraction prevents drift between copies
- When setting up a new AI feature — write the prompt file and config object before wiring up the service call
- During code review of any PR that touches AI behavior — the prompt file diff should be reviewed with the same rigor as logic changes
- When debugging inconsistent output quality — check temperature and prompt structure before assuming the model itself is the problem

## Common Mistakes
- Leaving a multi-line system prompt as an inline template literal inside a route handler, making it invisible to code review and impossible to reuse
- Never setting `max_tokens` explicitly and relying on the SDK/model default, which can silently allow far more expensive output than the feature needs
- Interpolating user-supplied content directly into the system prompt string instead of keeping it in the `user` message — this breaks the trust boundary between instructions and data
- Ignoring `stop_reason === 'max_tokens'` in production logs, allowing silently truncated responses to reach users indefinitely

## Further Reading
- Anthropic — "Prompt engineering overview" and "Use XML tags to structure prompts" (official docs)
- Anthropic — "Building effective agents" (writing precise, minimal system prompts)
- Chip Huyen, "Designing Machine Learning Systems" — treating prompts as a first-class, versioned artifact
