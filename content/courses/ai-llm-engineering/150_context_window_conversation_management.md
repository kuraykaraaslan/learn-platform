# 150. Context Window and Conversation Management

## What It Is
The Anthropic API is stateless: every call is a complete, independent request, and the model has no memory of anything outside the exact `system` string and `messages` array you send it. For a chat-style feature, that means the calling application — not the API — owns the entire responsibility of assembling conversation history and passing it in full on every single request. This is a different mental model from a database connection or a WebSocket session, and it surprises engineers new to LLM APIs: there is no server-side session to attach to, only the payload you construct each time.

Most product features are actually single-turn — one user input produces one AI response — and should be built that way by default; multi-turn conversation management is real added complexity that should only be reached for when the UI genuinely requires back-and-forth. When it is needed, the growing history has to be bounded on two axes: turn count (keep the last N user+assistant pairs, always as complete pairs so a dangling unpaired message never gets sent) and token count (use the SDK's `countTokens` method to check total size before sending, and trim proactively rather than discovering the problem when a request gets expensive or hits a context error).

A subtlety that's easy to get backwards: the `system` parameter is a distinct field from `messages`, not text to prepend into the first user turn. Mixing them wastes tokens and breaks the model's role attribution between "stable instructions" and "conversation content." Similarly, per-user personalization (name, language preference, account tier) belongs injected into the system prompt at call time as structured context, not folded into the user's message — and conversation history itself needs a real storage decision: React state only survives the page session, a database row keyed by user and session ID survives reloads, and a cookie is never appropriate because token volumes routinely exceed cookie size limits.

## Key Concepts
- **Statelessness**: the API has no memory between calls; the calling application must assemble and send full context every time
- **Single-turn by default**: most features don't need conversation history at all — add multi-turn complexity only when the UI requires it
- **Turn-bounded history**: cap history to the last N user+assistant pairs, always trimmed as complete pairs, never a dangling half-turn
- **Token-bounded history**: use `anthropic.messages.countTokens()` before sending and trim proactively against a hard cap (e.g., 20k tokens of history)
- **`system` is not a message**: it's a separate parameter from `messages` — prepending it to the first user turn wastes tokens and breaks role attribution
- **Per-user context injection**: personalization data (name, language, tier) goes into the system prompt at call time, built fresh per request — never permanently baked in
- **Storage tiering**: React state for single-session UI, a database row for persistence across reloads, never client-side localStorage or cookies for authenticated conversation history

## Example Code
```typescript
// types/ai.ts
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
export type ConversationHistory = MessageParam[];

// libs/ai/history.ts
const MAX_HISTORY_TURNS = 10;
const MAX_HISTORY_TOKENS = 20_000;

function trimToTurns(history: ConversationHistory): ConversationHistory {
  const pairs: ConversationHistory[] = [];
  for (let i = history.length - 1; i >= 1; i -= 2) {
    pairs.unshift([history[i - 1], history[i]]);
    if (pairs.length >= MAX_HISTORY_TURNS) break;
  }
  return pairs.flat();
}

export async function trimHistory(
  history: ConversationHistory,
  system: string,
): Promise<ConversationHistory> {
  const byTurns = trimToTurns(history);
  const { input_tokens } = await anthropic.messages.countTokens({
    model: 'claude-sonnet-5',
    system,
    messages: byTurns,
  });
  return input_tokens > MAX_HISTORY_TOKENS ? byTurns.slice(-4) : byTurns; // hard fallback
}

// services/chat.service.ts
function buildSystemPrompt(user: { name: string; language: string }): string {
  return `You are a support assistant.

User context:
- Name: ${user.name}
- Preferred language: ${user.language}
- Respond in ${user.language} unless the user switches languages.`;
}

export async function continueConversation(
  history: ConversationHistory,
  userMessage: string,
  user: { name: string; language: string },
): Promise<{ reply: string; updatedHistory: ConversationHistory }> {
  const system = buildSystemPrompt(user);
  const trimmed = await trimHistory(history, system);
  const messages: ConversationHistory = [...trimmed, { role: 'user', content: userMessage }];

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 1024,
    system,
    messages,
  });
  const reply = extractText(response);
  return { reply, updatedHistory: [...messages, { role: 'assistant', content: reply }] };
}
```

## When to Use
- Any chat-style feature where the UI allows back-and-forth exchanges rather than a single request/response
- When personalizing model behavior per authenticated user (language, name, tier, preferences)
- When a conversation needs to survive a page reload or work across devices for the same user
- When you notice API costs rising per conversation — unbounded history growth is a common silent cause

## Common Mistakes
- Sending the entire, unbounded conversation history on every turn, so cost and latency grow linearly with conversation length
- Storing full conversation history in a cookie or client-side localStorage for an authenticated session, risking both size overflow and data exposure on shared devices
- Prepending the system prompt as the first user message instead of using the dedicated `system` parameter
- Reconstructing conversation context from the database on every streaming chunk instead of loading it once before the stream starts

## Further Reading
- Anthropic — Messages API reference, particularly the `system` parameter and multi-turn conversation examples
- Anthropic — "Building with the Messages API" guide on statelessness and context assembly
- Anthropic SDK documentation for `messages.countTokens()`
