# 147. The Anthropic API Client Architecture

## Coverage Level
**Not assessed** — this concept was added to expand the AI & LLM Engineering course from internal-ai-rules' AI_Integration_Rules/api-client-patterns.md material; no existing coverage data for your own practice.

## What It Is
Every LLM-backed feature starts with the same unglamorous plumbing decision: where does the API client live, and who is allowed to construct it? The pattern that holds up in production is a single, module-level singleton client, instantiated once at import time, imported everywhere it's needed. Constructing a new `Anthropic()` instance inside a route handler or service method on every request is wasteful (it re-reads config and re-establishes client-level state per call) and makes it impossible to enforce consistent behavior — timeout, retry count, and API key resolution should be defined in exactly one place, not duplicated across every call site.

The client's configuration is itself a set of engineering decisions, not just plumbing: a hard timeout (30 seconds is the sane default for non-streaming calls, since an LLM call that hangs indefinitely will eventually take down a request queue), and SDK-level retry count (2 is typical — the SDK already retries transient errors like 429 and 529 with exponential backoff, so a hand-rolled retry loop around the call is redundant and causes double-retrying). The API key itself must come from an environment variable resolved at module load, with a fail-fast check — if the key is missing, the app should refuse to start rather than fail confusingly on the first real request.

This also establishes a security boundary worth taking seriously: if `process.env.ANTHROPIC_API_KEY` is readable from anywhere in the codebase, it will eventually leak into a log line, an error message, or a debugging print statement written under deadline pressure. Restricting access to the single client file and never exporting the raw key anywhere else closes that door structurally instead of relying on developer discipline at every call site.

## Key Concepts
- **Singleton client pattern**: one `Anthropic` instance per application, constructed once in a dedicated module, imported everywhere else
- **Fail-fast key validation**: throw at module load if `ANTHROPIC_API_KEY` is missing, not on the first API call
- **Centralized timeout and retry config**: `timeout` and `maxRetries` set once at client construction, not per call site
- **SDK-level retries vs hand-rolled retries**: the SDK already backs off on 429/529/5xx — a manual retry wrapper around it double-retries and wastes budget
- **Environment separation**: real key in `.env.local`/`.env` (gitignored), an empty placeholder committed in `.env.example`, actual value injected via secrets manager in CI/CD
- **Type imports from the SDK**: use `Message`, `MessageParam`, `ContentBlock` etc. from `@anthropic-ai/sdk/resources/messages` rather than hand-writing parallel types that will drift
- **Safe response extraction**: a small helper that finds the text content block and throws a typed error if the response shape is unexpected, rather than indexing `response.content[0]` blindly

## Example Code
```typescript
// libs/ai/client.ts — the ONLY place `new Anthropic()` is allowed to appear
import Anthropic from '@anthropic-ai/sdk';

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is not set'); // fail at boot, not at request time
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 30_000,   // 30s default for non-streaming calls
  maxRetries: 2,      // SDK retries 429 / 529 / 5xx with exponential backoff
});

// libs/ai/extract-text.ts
import type { Message, TextBlock } from '@anthropic-ai/sdk/resources/messages';
import { AppError } from '@/libs/errors';

export function extractText(response: Message): string {
  const block = response.content.find((b): b is TextBlock => b.type === 'text');
  if (!block) throw new AppError('AI returned no text content', 502);
  return block.text;
}

// services/summary.service.ts — consumer, never constructs its own client
import { anthropic } from '@/libs/ai/client';
import { extractText } from '@/libs/ai/extract-text';

export async function generateSummary(text: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: 'Summarize the input in 3-5 sentences.',
    messages: [{ role: 'user', content: text }],
  });
  return extractText(response);
}
```

## When to Use
- At the very start of any project that will call the Anthropic API — this is the foundation everything else builds on
- When you notice `new Anthropic()` appearing in more than one file — that's the signal to consolidate immediately
- When setting up CI/CD — the same client file dictates what secret needs to be injected and where
- When adding a second AI-backed feature to an existing codebase — it should import the existing client, never construct its own
- When writing unit tests for AI-calling code — mock the exported `anthropic` singleton, not a freshly constructed instance

## Common Mistakes
- Instantiating a new client per request inside a route handler or controller — wastes setup cost and fragments configuration
- Reading `process.env.ANTHROPIC_API_KEY` in multiple files instead of once in the client module — increases the surface area for an accidental leak
- Wrapping the SDK call in a hand-rolled retry loop on top of the SDK's own retry logic, causing requests to be retried far more than intended under an outage
- Skipping the fail-fast check and letting a missing API key surface as a confusing runtime error deep inside a request handler

## Further Reading
- Anthropic — official TypeScript/Node SDK documentation and README (github.com/anthropics/anthropic-sdk-typescript)
- Anthropic API reference — Messages API and client configuration options
- The Twelve-Factor App, "Config" — the underlying principle for env-var-based secret management
