# 158. Observability and Logging for AI Features

## What It Is
AI-backed features need observability discipline that is stricter, not looser, than typical services, for a reason that trips up teams new to LLM integration: the payload itself — user input and model output — is exactly the thing you must not put in a log line, because it routinely contains PII, and because full conversation content in a log aggregator is both a privacy liability and a volume problem. The resolution is to log metadata religiously and content never: model ID, input/output token counts, latency, feature name, stop reason, and error type and code are all safe and all genuinely useful; full user input, full AI output, system prompt content, and anything resembling PII are never logged, in any environment, including staging.

That metadata, wrapped consistently around every AI call, is what turns a black box into something you can actually operate. Latency and token counts feed dashboards with concrete alert thresholds — p95 latency over 8 seconds, error rate over 2% in a 5-minute window, `max_tokens` truncation rate over 1%, refusal rate over 5% — and each of those thresholds corresponds to a real, distinct problem (a slow model call, an upstream outage, an undersized token budget, a prompt that's started triggering the model's safety behaviors more often than before). Token volume aggregated per feature per day is also the cost dashboard, and a cost spike is frequently the very first visible signal that something changed upstream — a prompt regression, a traffic pattern shift, or a silently deprecated cache.

Caching deserves its own line of judgment here: deterministic, non-personalized tasks (classification, extraction, translation of a fixed piece of content) cache well and aggressively, because the same input should produce the same categorical answer and there's no reason to pay for it twice; conversational or personalized responses should generally not be cached, because "the same-looking input" from a different user or a different point in a conversation is not actually the same request. Getting this distinction backwards either wastes money on repeat calls that could have been served from cache, or serves a stale, wrong answer to someone it was never generated for.

## Key Concepts
- **Log metadata, never content**: model, token counts, latency, feature name, stop reason, error type — yes; user input, AI output, system prompt text, PII — never
- **Wrap every AI call the same way**: a single `logAiCall`/`logAiError` helper used everywhere ensures consistent fields, not ad hoc logging per feature
- **Alert thresholds tied to specific failure modes**: p95 latency (>8s), error rate (>2%/5min), `max_tokens` rate (>1%), refusal rate (>5%) — each threshold maps to a distinct root cause to investigate
- **Cost dashboard = token aggregation**: sum input/output tokens per feature per day, multiply by price, review weekly — a spike is often the first sign of a prompt regression
- **Cache deterministic, non-personalized tasks aggressively**: classification and extraction results are safe and valuable to cache
- **Never cache chat or personalized responses**: "looks like the same input" is not the same request when a user or conversation context differs
- **Trace ID propagation**: pass an `x-trace-id` through to the AI call log so it correlates with the upstream user action in the log aggregator
- **Happy-path logging is not optional**: latency and token data from successful calls is exactly what feeds cost and performance dashboards — logging only failures leaves you blind on the common case

## Example Code
```typescript
// libs/ai/logger.ts
export interface AiCallMetadata {
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  stopReason: string;
  cached?: boolean;
  traceId?: string;
}

export function logAiCall(meta: AiCallMetadata): void {
  logger.info('ai_call', meta); // metadata only — never response content
}

export function logAiError(feature: string, err: unknown): void {
  logger.error('ai_error', {
    feature,
    errorType: err instanceof Error ? err.constructor.name : 'unknown',
    errorMessage: err instanceof Error ? err.message : String(err),
  });
}

// libs/ai/cache.ts — for deterministic, non-personalized tasks only
import { createHash } from 'crypto';
const CACHE_TTL = 60 * 60 * 24; // 24h

export function cacheKey(feature: string, input: string): string {
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 16);
  return `ai:${feature}:${hash}`;
}

// services/classification.service.ts
export async function classifyWithCache(text: string, traceId: string): Promise<string> {
  const key = cacheKey('classification', text);
  const cached = await redis.get(key);
  if (cached) {
    logAiCall({ feature: 'classification', model: 'cached', inputTokens: 0, outputTokens: 0, latencyMs: 0, stopReason: 'cache_hit', cached: true, traceId });
    return cached;
  }

  const start = Date.now();
  const response = await anthropic.messages.create({ model: 'claude-haiku-4-5', max_tokens: 20, ...CLASSIFY_CONFIG });
  logAiCall({
    feature: 'classification', model: response.model,
    inputTokens: response.usage.input_tokens, outputTokens: response.usage.output_tokens,
    latencyMs: Date.now() - start, stopReason: response.stop_reason ?? 'unknown', traceId,
  });

  const result = extractText(response);
  await redis.set(key, result, 'EX', CACHE_TTL);
  return result;
}
```

## When to Use
- Every AI call in the codebase, from day one — retrofitting observability after an incident is far more painful than building it in
- When setting up a new feature's dashboard — define the alert thresholds before launch, not after the first incident
- When a feature is a strong caching candidate (deterministic, non-personalized, repeatable input) — classification and extraction almost always qualify
- During a cost review — per-feature token attribution is what turns "AI costs went up" into "feature X's prompt regressed on Tuesday"

## Common Mistakes
- **Full user input and AI output get logged "just for debugging"** — Logging full user input or AI output "just for debugging," creating a PII exposure risk in the log aggregator
- **Only failed calls get logged, successful ones leave no trace at all** — Only logging failures and skipping metadata on successful calls, leaving no baseline to detect latency or cost drift
- **A personalized chat response gets cached because the input text happened to match a previous call** — Caching a chat or personalized response because the input text happens to look identical to a previous call
- **A dashboard shows latency and cost, with no alert threshold set on either** — Setting up dashboards without alert thresholds, so a real regression sits unnoticed until a user complains

## Further Reading
- [Claude API rate limits](https://platform.claude.com/docs/en/api/rate-limits) — the headers to read for usage and remaining quota
- Google SRE Book — "Monitoring Distributed Systems" (the four golden signals, directly applicable to AI call observability)
- OWASP — logging guidance on avoiding sensitive data exposure in log sinks, applicable to the "never log content" rule
