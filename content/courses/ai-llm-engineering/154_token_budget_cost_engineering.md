# 154. Token Budget and Cost Engineering

## What It Is
AI API cost scales linearly with token volume, which makes it one of the few parts of a modern application where a single unreviewed design decision — an oversized system prompt, an uncapped `max_tokens`, sending a full document instead of a retrieved excerpt — turns directly into a recurring line item on the company's bill. The engineering discipline is treating token budget as a real constraint to design against, the same way you'd design against a database query budget or a bandwidth cap, rather than discovering the cost after the fact from a billing alert.

The cost math itself is simple and worth internalizing well enough to do in your head during a feature review: cost per call is input tokens times the input price plus output tokens times the output price, and monthly cost is that figure times daily call volume times thirty. Because output tokens are typically priced several times higher than input tokens across model tiers, the `max_tokens` ceiling deserves as much scrutiny as the prompt itself — a summary feature that needs 150 words of output should not be configured with a 2,000-token ceiling "just in case," because that ceiling doesn't just bound worst-case cost, it's also the first thing to check when `stop_reason === 'max_tokens'` shows up in production logs as a truncation bug.

Controlling input volume is the other half of the budget, and it has three concrete levers: truncating user input to a sane character limit before it ever reaches the prompt, stripping whitespace and boilerplate that add tokens without adding meaning, and — the highest-leverage one on any prompt that's been in production a while — periodically auditing the system prompt itself, since every 100 tokens sitting in a system prompt gets paid for on every single call, not just once. None of this replaces logging: token usage per feature has to be attributed and aggregated so a cost spike is caught within days, not discovered at the next billing cycle after a prompt regression has been running unnoticed for weeks.

## Key Concepts
- **Cost formula**: `cost_per_call = (input_tokens × input_price) + (output_tokens × output_price)`; `monthly_cost = cost_per_call × daily_calls × 30`
- **Every AI feature needs a documented budget before shipping** — not as a formality, but as the number that gets checked when cost actually deviates
- **Output tokens are priced higher than input tokens** — an oversized `max_tokens` ceiling is a bigger cost risk than a slightly verbose prompt
- **Truncate and clean input before sending**: cap character length, strip redundant whitespace/boilerplate — every token sent is a token paid for
- **System prompt cost compounds**: a prompt token is paid on every call, so a bloated system prompt is a recurring tax, not a one-time cost
- **`max_tokens` sized to the task**: use a lookup by task type (classification ~20, short extraction ~50, page summary ~500, code generation ~800) rather than a single blanket ceiling everywhere
- **Cost attribution by feature**: log input/output token counts per feature so a cost spike can be traced to a specific prompt or usage pattern, not just "AI costs went up"
- **Rate limits are a capacity constraint, not just a cost one**: SDK-level retry with backoff handles normal load; burst/batch jobs need an explicit token-per-minute throttle

## Example Code
```typescript
// libs/ai/prompts/summary.prompt.ts

export const SUMMARY_CONFIG = {
  model: 'claude-sonnet-5',
  max_tokens: 300,
  // Budget: ~1,200 input tokens (400 system + 800 doc) + 300 output
  // Cost/call = (1200 × $2.00/1M) + (300 × $10.00/1M) = $0.0024 + $0.0030 = $0.0054
  // At 50 calls/day → ~$8.10/month. Rates move: re-check the pricing page before
  // you quote this to anyone, and re-run the arithmetic rather than the conclusion.
} as const;

const MAX_INPUT_CHARS = 6_000; // ~1,500 tokens

function truncateForAI(text: string): string {
  if (text.length <= MAX_INPUT_CHARS) return text;
  return text.slice(0, MAX_INPUT_CHARS) + '\n[Document truncated for processing]';
}

function prepareDocument(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Cost attribution — logged per call, aggregated per feature per day
export async function generateSummaryWithBudget(text: string): Promise<string> {
  const document = truncateForAI(prepareDocument(text));

  const response = await anthropic.messages.create({
    ...SUMMARY_CONFIG,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: document }],
  });

  if (response.stop_reason === 'max_tokens') {
    logger.warn('Summary hit max_tokens — investigate before raising the limit blindly', { usage: response.usage });
  }

  logger.info('ai_call_cost', {
    feature: 'summary',
    model: response.model,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
  });

  return extractText(response);
}
```

## When to Use
- Before shipping any new AI feature — the cost estimate is part of the feature spec, not an afterthought
- When call volume for an existing feature grows significantly — re-run the cost math, it may justify a model tier change (see the Model Selection lesson)
- During a quarterly prompt audit — check system prompt length and `max_tokens` ceilings for creep
- When a billing alert or weekly cost dashboard shows an unexpected spike — token attribution by feature is what lets you find the cause quickly

## Common Mistakes
- Shipping an AI feature with no documented token budget, discovering the actual cost only from a billing surprise
- Setting `max_tokens` to a large round number "for safety" instead of sizing it to what the task needs
- Sending full database records or entire documents to the model when only a relevant excerpt (via retrieval or truncation) is needed
- Running AI on every request for input that's deterministic and cacheable, instead of caching results (see the Observability lesson)

## Further Reading
- [Anthropic pricing page](https://anthropic.com/pricing) — always verify current rates before writing a cost spec, prices change
- Anthropic — "Reduce costs" section of the prompt engineering documentation
- Anthropic — prompt caching documentation, for reducing repeated system-prompt cost on high-volume features
