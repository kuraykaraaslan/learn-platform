# 163. MCP Server Auth, Errors, and Idempotency

## What It Is
An MCP server sits between an AI client and real systems of record, which means every design shortcut that would be merely sloppy in an internal service becomes a direct security or reliability exposure here — the client calling your tools is a model, and a model cannot exercise judgment about a token it was never supposed to see. Auth validation belongs entirely in middleware, checked once per request, never re-implemented inside individual tool handlers; scattering `if (!isValidToken(...))` checks across handlers is both repetitive and the kind of thing that gets missed on the one handler added under deadline pressure. Tokens travel exclusively as a Bearer value in the `Authorization` header — never as a query parameter (which lands in server logs and browser history), never as a request body field (which conflates auth with business payload), and never returned in a tool's response, because tools return data, not credentials. Storage follows the same discipline as any other secret: environment variables or a secrets manager, never a plaintext database column, never client-side code, and never a log line, under any circumstances, including a debug build.

Errors need the same rigor, because the consumer reading your error response is a model deciding what to do next, not a human glancing at a stack trace. Every tool error must return a fixed structural envelope — a machine-readable `code`, a human-readable `message` with no stack trace in it, an optional `details` object, and a `retryable` boolean — rather than letting a raw exception escape the handler. That `retryable` flag is doing real work: a `RATE_LIMITED` error is retryable after a delay, a `VALIDATION_ERROR` is not, because retrying the same malformed input just burns another round trip for an identical failure. Getting this wrong in either direction has a real cost — marking a permanent failure retryable causes wasted retries, and marking a transient one non-retryable causes an agent to give up on something that would have succeeded a second later. Partial results deserve the same explicitness: if some items in a batch succeeded and others failed, the response must say so with an explicit `partial: true` flag and a breakdown, never returned as if it were a complete success.

Idempotency is the last piece, and it follows directly from the verb taxonomy established in tool naming: reads — `list`, `get`, `search`, `analyze`, `validate` — are naturally idempotent and need no special handling, while `create` and `upload` are not, because calling them twice with the same input produces two resources, not one. For these, the AI client supplies an idempotency key, and the server stores the result of the first call against that key, returning the cached result for any repeat call with the same key rather than creating a duplicate — this matters more with an AI client than a human one, because a model retrying after what looks like a timeout has no way to know whether the first call actually succeeded server-side. That idempotency store has to be Redis or an equivalent shared, persistent store; an in-memory `Map` loses every key on a restart and can't deduplicate across multiple server instances behind a load balancer, which defeats the entire purpose the moment you scale past one process.

## Key Concepts
- **Auth in middleware, once per request**: never re-implement token validation inside individual tool handlers — it's the one place a missed check under deadline pressure becomes a real vulnerability
- **Bearer token via `Authorization` header only**: never query parameters (logged, browser history), never request body fields, never returned in a tool's own response
- **Token storage discipline**: environment variable or secrets manager, never a plaintext database column, client-side code, or any log sink
- **Standard error envelope**: `{ code, message, details?, retryable }` on every failure — never a raw exception, never an HTTP status code repurposed as the `code` field
- **Retryable flag drives client behavior**: `RATE_LIMITED`/`TIMEOUT` are retryable after a delay; `VALIDATION_ERROR`/`NOT_FOUND`/`UNAUTHORIZED` are not — retrying identical bad input wastes a round trip for a guaranteed repeat failure
- **Idempotency by verb**: reads (`list`/`get`/`search`/`analyze`/`validate`) are naturally idempotent; `create`/`upload` require a caller-supplied idempotency key
- **Idempotency store must be shared and persistent**: Redis, not an in-memory `Map` — a `Map` loses keys on restart and can't dedupe across multiple server instances
- **Partial results must say so explicitly**: a `partial: true` flag and a per-item breakdown, never a batch result presented as fully successful when part of it failed

## Example Code
```tsx
// middleware/auth.ts — validated once, never per-handler
import { z } from 'zod';
function createAuthMiddleware(validTokens: Set<string>) {
  return (req: Request, next: () => Promise<Response>): Promise<Response> => {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token || !validTokens.has(token)) {
      return Promise.resolve(new Response('Unauthorized', { status: 401 }));
    }
    return next();
  };
}

// libs/mcp/error-envelope.ts
type MCPToolError = { code: string; message: string; details?: unknown; retryable: boolean };

function toolError(code: string, message: string, retryable: boolean, details?: unknown) {
  return {
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ code, message, details, retryable } satisfies MCPToolError) }],
  };
}

// libs/mcp/idempotency.ts — Redis-backed, never an in-memory Map
async function withIdempotency<T>(key: string | undefined, run: () => Promise<T>): Promise<T> {
  if (!key) return run();
  const cached = await redis.get(`idem:${key}`);
  if (cached) return JSON.parse(cached) as T;
  const result = await run();
  await redis.set(`idem:${key}`, JSON.stringify(result), 'EX', 3600); // 1h TTL
  return result;
}

server.tool(
  'project_create_item',
  `Creates a new project item. Requires idempotencyKey to prevent duplicate creation on retry.
  Input: projectId, name, idempotencyKey.
  Output: { id, name, createdAt }.
  Errors: VALIDATION_ERROR (not retryable) if name is empty, UPSTREAM_ERROR (retryable) if the backing API fails.`,
  { projectId: z.string(), name: z.string().min(1), idempotencyKey: z.string() },
  async ({ projectId, name, idempotencyKey }) => {
    try {
      const result = await withIdempotency(idempotencyKey, () => createItem(projectId, name));
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch (err) {
      return toolError('UPSTREAM_ERROR', 'Failed to create item — the backing API is unavailable.', true);
    }
  },
);
```

## When to Use
- Any MCP server that accepts calls from more than one caller or environment — auth middleware is the correct place to enforce that boundary
- Every tool that has a side effect, particularly `create` and `upload` — idempotency keys prevent an AI client's retry from producing duplicate resources
- Whenever a tool can fail in more than one distinguishable way — the AI client needs the `code` and `retryable` fields to react differently, not one generic error string
- Any batch or multi-item operation where some items can succeed while others fail — the `partial` flag is what keeps that from being silently misreported as full success

## Common Mistakes
- **Each new tool handler adds its own token check, copy-pasted from the last one** — Checking the token inside each tool handler individually instead of once in shared middleware, creating gaps as handlers are added over time
- **A tool accepts a token as one of its input parameters** — Accepting a token as a tool input parameter or returning one in a tool's response, instead of confining it entirely to the `Authorization` header
- **Idempotency keys are stored in an in-memory `Map`** — Using an in-memory `Map` for idempotency keys, which silently stops working the moment the server restarts or runs behind more than one instance
- **A `VALIDATION_ERROR` response is marked `retryable: true`** — Marking a `VALIDATION_ERROR` as `retryable: true`, causing an AI client to burn calls retrying input that will fail identically every time
- **A batch of 10 items has 2 failures, and the response still reports full success** — Returning a batch result as if fully successful when some items actually failed, instead of setting `partial: true` with a breakdown

## Further Reading
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification) — read the authentication and error-handling sections
- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) — broken authentication and improper asset management are the two that apply most directly here
- Stripe API documentation — "Idempotent Requests," the reference implementation the idempotency-key pattern here is modeled on
