# 149. Structured Output and Schema Validation

## What It Is
A large fraction of production AI features don't need free-form prose back — they need a JSON object with specific fields your code can parse and act on: a classification label and confidence score, extracted structured fields from a document, a decision plus reasoning. Getting reliable structured output from a model that is fundamentally generating text token by token requires two disciplines working together: instructing precisely (tell the model the exact schema, in the system prompt, and explicitly forbid markdown fences or explanatory preamble around the JSON), and validating defensively (never trust that the model followed the instruction — parse the output and run it through a schema validator before your code touches it).

Zod is the natural fit here because it gives you both a runtime validator and a static TypeScript type from the same definition, so the shape you tell the model to produce and the shape your code expects to consume are provably the same object. `JSON.parse` on model output can throw if the model wrapped the JSON in prose despite instructions, so that has to be handled explicitly too — a `safeParse` after a defensive `tryParseJSON` is the standard shape.

The failure mode that separates production-grade structured output handling from a demo is what happens when validation fails. A demo just crashes or shows an error. Production code retries once with an explicit correction ("your previous response was not valid JSON, output ONLY the JSON object"), because models are good at self-correcting when told exactly what went wrong, and only falls back to a hard failure after that retry also fails. This buys real reliability without resorting to something heavier like full tool-use machinery for cases where a simple structured-JSON contract is all that's needed.

## Key Concepts
- **Instruct + validate, always both**: telling the model the schema is necessary but never sufficient; every response must be parsed and validated before use
- **Zod as the single source of truth**: define the schema once, get both a runtime validator and a static TypeScript type from it
- **Explicit format instructions**: "output only the JSON object, no markdown fences, no explanation" reduces (but does not eliminate) formatting drift
- **Retry-with-correction pattern**: on validation failure, retry once with an explicit message describing what was wrong, before falling back
- **`safeParse` over `parse`**: use Zod's non-throwing variant so a malformed response becomes a handled `success: false` branch, not an uncaught exception
- **When to escalate to tool use instead**: if the "schema" is really a decision about which action to take next, that's a tool-calling problem, not a JSON-output problem — see the Tool Use lesson
- **Confidence and reasoning fields**: including a `confidence: number` and `reason: string` field in the schema gives you a lever for downstream logic (e.g., route low-confidence classifications to human review)

## Example Code
```typescript
import { z } from 'zod';
import { anthropic } from '@/lib/ai/client';
import { extractText } from '@/lib/ai/extract-text';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

const ClassificationSchema = z.object({
  category: z.enum(['billing', 'technical', 'feature_request', 'other']),
  confidence: z.number().min(0).max(1),
  reason: z.string(),
});
type Classification = z.infer<typeof ClassificationSchema>;

const SYSTEM_PROMPT = `
You classify support tickets.

Output a JSON object matching this schema exactly:
{ "category": "billing" | "technical" | "feature_request" | "other", "confidence": number (0-1), "reason": string }

Output ONLY the JSON object. No markdown fences. No explanation.
`.trim();

function tryParseJSON(raw: string): unknown {
  try { return JSON.parse(raw); } catch { return null; }
}

async function callClassifier(text: string, isRetry: boolean) {
  const correction = isRetry
    ? '\n\nIMPORTANT: Your previous response was not valid JSON matching the schema. Output ONLY the JSON object.'
    : '';
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 150,
    temperature: 0,
    system: SYSTEM_PROMPT + correction,
    messages: [{ role: 'user', content: `<ticket>\n${text}\n</ticket>` }],
  });
  return extractText(response);
}

export async function classifyTicket(text: string): Promise<Classification> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const raw = await callClassifier(text, attempt > 0);
    const parsed = ClassificationSchema.safeParse(tryParseJSON(raw));
    if (parsed.success) return parsed.data;
    logger.warn('Ticket classification returned invalid schema', { attempt, raw: raw.slice(0, 200) });
  }
  throw new AppError('Ticket classification failed after retry', 502);
}
```

## When to Use
- Any feature where downstream code needs to branch on the model's output (routing, storing to a typed column, triggering a workflow)
- Classification, extraction, and scoring tasks where the output is a small, well-defined shape
- When you want a static TypeScript type for AI output but don't want to hand-maintain it separately from the runtime check
- As the lighter-weight alternative to tool use when the model isn't taking an action, just returning a structured judgment

## Common Mistakes
- Trusting `JSON.parse(modelOutput)` without a schema check, so a subtly wrong field name or type slips silently into business logic
- Giving up after one failed parse instead of retrying once with an explicit correction — models self-correct well when told exactly what was wrong
- Defining the Zod schema in one place and the prompt's described schema in another, letting them drift apart over time
- Using free-text prompting for a decision that's really "pick one of N actions" — that's what tool use is for, not JSON-output prompting

## Further Reading
- [Zod official documentation](https://zod.dev) — schema definition and `safeParse`
- Anthropic — "Increase output consistency with JSON output" (prompt engineering docs)
- [Tool use overview](https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview) — for when structured output should become an actual function call instead
- [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs) — constraining the response format at the API level rather than validating after the fact
