# 155. Streaming AI Responses in Production

## What It Is
Streaming exists to solve one specific user experience problem: an LLM generating 500+ tokens of prose can take several seconds, and showing nothing until the full response is ready feels broken even when the system is working correctly. Streaming the response token-by-token as it's generated gets the first visible content on screen in a fraction of a second, which is the metric that actually matters for perceived responsiveness — time to first token, not total generation time. The decision of whether to stream at all is a UX judgment, not a default: short classification or extraction outputs don't benefit from streaming and shouldn't pay its complexity cost, and anything that must be validated before being shown (structured output feeding a downstream system) can't be safely streamed at all, because you can't validate a response that isn't complete yet.

The mechanics differ meaningfully by transport. In a Next.js App Router route handler, streaming means returning a `ReadableStream` built from the SDK's async iterator over `content_block_delta` events, and this must run on the Node.js runtime — the Edge runtime does not support the Anthropic SDK's streaming interface. In Express, the equivalent is Server-Sent Events: setting `Content-Type: text/event-stream` and writing `data: ...\n\n` chunks as they arrive. Both approaches share the same client-side consumption pattern: read the response body with a `ReadableStreamDefaultReader`, decode chunks, and append them to UI state as they land.

The failure mode unique to streaming is what happens when an error occurs mid-response: by the time the model starts failing partway through generation, the HTTP status code and headers have already been sent as 200 OK, so you cannot retroactively signal an error through the status code. The standard pattern is an error sentinel written into the stream itself — a JSON payload like `{ "error": "..." }` embedded as just another chunk — which the client-side consumer explicitly checks for and uses to transition into an error state, rather than treating stream termination alone as success.

## Key Concepts
- **Stream when time-to-first-token matters**: chat, drafting, and any response over roughly 300 tokens where the user is actively waiting
- **Don't stream when validation must happen first**: structured output, classification, or anything persisted before display needs the complete response
- **Node.js runtime only**: the Anthropic SDK's streaming does not work under Next.js Edge runtime — `export const runtime = 'nodejs'` is required
- **SSE for Express, `ReadableStream` for Next.js route handlers** — different transport mechanics, same underlying `content_block_delta` event stream from the SDK
- **Error-mid-stream sentinel**: since headers are already sent once streaming begins, errors must be signaled as a payload inside the stream, not via HTTP status
- **Client-side cursor UX**: show a blinking cursor or similar indicator while streaming is active, remove it and show the AI disclosure label once complete
- **Stream cleanup on disconnect**: abort the underlying stream (`stream.abort()`) when the client disconnects (`req.on('close', ...)`) to avoid paying for generation nobody will see
- **Never write a streaming response directly to a database**: accumulate the full response, validate it, then persist — streaming and persistence are separate concerns

## Example Code
```typescript
// app/api/ai/stream/route.ts — Next.js App Router
import { anthropic } from '@/libs/ai/client';

export const runtime = 'nodejs'; // required — Edge does not support SDK streaming

export async function POST(request: Request) {
  const { text } = await request.json();

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: DRAFT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        // Error sentinel — status/headers are already sent, this is the only channel left
        controller.enqueue(encoder.encode(JSON.stringify({ error: 'AI unavailable' })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' },
  });
}

// hooks/useAiStream.ts — client consumption
export function useAiStream() {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function stream(input: string) {
    setText(''); setError(null);
    const res = await fetch('/api/ai/stream', {
      method: 'POST',
      body: JSON.stringify({ text: input }),
    });
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      if (chunk.startsWith('{"error"')) { setError('AI is temporarily unavailable.'); break; }
      setText((prev) => prev + chunk);
    }
  }
  return { text, error, stream };
}
```

## When to Use
- Chat interfaces and drafting tools where the user is watching the response generate
- Any single response expected to exceed roughly 300 tokens where perceived latency matters
- Live transcription or real-time assistance features
- Never for classification/extraction outputs, background jobs, or anything requiring pre-display validation

## Common Mistakes
- Attempting to use streaming under the Edge runtime, where the Anthropic SDK's streaming interface is unsupported
- Writing streamed chunks directly into a database as they arrive instead of accumulating, validating, then persisting the complete response
- Relying on HTTP status codes to signal a mid-stream failure after the 200 response has already started
- Not handling client disconnects, leaving the model generating (and the meter running) for a response nobody will ever see

## Further Reading
- Anthropic — "Streaming Messages" (official SDK and API documentation)
- MDN — "Using readable streams" and "Server-Sent Events" (for the underlying web platform mechanics)
- Vercel — Next.js documentation on Route Handlers and streaming responses
