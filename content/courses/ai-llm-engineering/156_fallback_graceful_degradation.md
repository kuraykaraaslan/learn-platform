# 156. Fallback and Graceful Degradation for AI Calls

## What It Is
An AI API call has more failure modes than a typical internal service call, and each one calls for a different response — treating them all as "the AI call failed, show an error" throws away information that would let the system recover more gracefully. Transient errors (overloaded, 500s) should retry with backoff; rate limits (429) should retry after the specified delay; input validation failures (prompt too long) should fail immediately without retrying, since retrying an invalid request just wastes time; and content-filtered refusals should surface a specific message and never be retried, because retrying doesn't change whether the model considers the request policy-violating.

The SDK already implements exponential backoff retry for the genuinely transient cases (429, 529, 5xx) when `maxRetries` is set at client construction — which means a hand-rolled retry loop wrapped around `anthropic.messages.create` is not just redundant, it actively causes double-retrying during an outage, compounding load exactly when the upstream service is already struggling. The engineering work that adds real value is everything the SDK doesn't handle: catching `Anthropic.APIError` and mapping status codes to appropriate application-level errors, and — the part that separates a resilient feature from a fragile one — defining an explicit fallback behavior for every AI feature and documenting it in the spec, not leaving "what happens when the API is down" as an unanswered question discovered during an actual incident.

A good fallback degrades usefully rather than failing outright: a summary feature that can't reach the API can return a truncated version of the original text with a `source: 'fallback'` flag, letting the UI show something useful while being honest that it isn't AI-generated. This same discipline extends to output validation failures — when the model returns malformed JSON, the correct response isn't an immediate hard failure, it's one retry with an explicit correction message, and only a fallback after that retry also fails (see the Structured Output lesson for the retry pattern in detail). Throughout all of this, raw SDK error messages must never reach the end user — they can leak implementation details and are rarely actionable for a non-technical audience — so every failure path routes through a small set of standard, user-facing messages.

## Key Concepts
- **Failure taxonomy drives response**: transient (retry via SDK) vs rate-limited (retry after delay) vs invalid input (fail immediately, never retry) vs content-filtered (surface once, never retry)
- **SDK retries are sufficient for transient errors**: `maxRetries` at client construction already backs off on 429/529/5xx — a manual retry wrapper on top double-retries
- **Every AI feature needs a documented fallback**: "what happens when the API is unavailable" is a spec requirement, not an incident discovery
- **Useful degradation over hard failure**: a truncated-text fallback for a summary feature beats a blank error state
- **Source flagging**: always tell the UI whether output came from `'ai'` or `'fallback'` so it can label accordingly
- **Retry-with-correction for malformed output**: one retry with an explicit "your previous response was invalid" message before falling back — see the Structured Output Validation lesson
- **Never surface raw SDK error messages to users**: map to a small, fixed set of user-facing strings instead
- **`finally` blocks for streaming cleanup**: any try/catch around stream iteration must still close/end the response in `finally`, or a client disconnect leaves the response hanging

## Example Code
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '@/libs/logger';
import { AppError } from '@/libs/errors';

const AI_ERROR_MESSAGES = {
  unavailable: 'AI is temporarily unavailable. Please try again in a moment.',
  busy: 'AI is processing a high volume of requests. Please wait and try again.',
  input_too_long: 'The provided text is too long to process. Please shorten it.',
  content_policy: 'This content cannot be processed. Please rephrase your request.',
} as const;

export async function generateSummary(text: string): Promise<string> {
  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 300,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: text }],
    });
    return extractText(response);
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      if (err.status === 400) throw new AppError(AI_ERROR_MESSAGES.input_too_long, 400);
      if (err.status === 429) throw new AppError(AI_ERROR_MESSAGES.busy, 503);
    }
    logger.error('AI service unavailable', { err }); // full detail logged server-side only
    throw new AppError(AI_ERROR_MESSAGES.unavailable, 503);
  }
}

// The fallback wrapper — the part a demo skips and production cannot
export async function getSummaryWithFallback(
  text: string,
): Promise<{ summary: string; source: 'ai' | 'fallback' }> {
  try {
    const summary = await generateSummary(text);
    return { summary, source: 'ai' };
  } catch {
    const fallback = text.slice(0, 300) + (text.length > 300 ? '…' : '');
    return { summary: fallback, source: 'fallback' };
  }
}
```

## When to Use
- Every AI-backed feature — fallback behavior is a required part of the feature spec, not an optional hardening pass
- When designing the client-side UI — it needs to render both the `'ai'` and `'fallback'` source states distinctly
- During incident review after an Anthropic API outage — verify the fallback path actually engaged and degraded usefully
- When adding a new failure category not covered by the existing taxonomy (e.g., a new refusal pattern) — extend the mapping, don't special-case it inline

## Common Mistakes
- Wrapping `anthropic.messages.create` in a custom retry loop on top of the SDK's own `maxRetries`, causing compounded retries during an outage
- Retrying a 400 (invalid input) error, which wastes time since the request will fail identically every time
- Shipping a feature with no defined fallback, so an API outage produces a blank error state instead of degraded-but-useful output
- Exposing `err.message` from the Anthropic SDK directly in an HTTP response, leaking internal details to the client

## Further Reading
- Anthropic — SDK error handling documentation (`APIError` subclasses and status code mapping)
- Google SRE Book — "Handling Overload" chapter, for the general principles behind graceful degradation
- Anthropic — rate limits documentation, for `retry-after` header semantics
