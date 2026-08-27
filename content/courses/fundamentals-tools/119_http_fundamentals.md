# 119. HTTP Fundamentals — Methods, Status Codes, Statelessness

## What It Is
HTTP is the request/response protocol underneath every route handler, every `fetch()` call, and every webhook in this codebase. It looks simple on the surface — verb, URL, headers, body — but three ideas do most of the real work: methods carry semantic guarantees (not just "do a thing"), status codes are a shared vocabulary for outcomes, and statelessness means the server remembers nothing about you between requests unless you explicitly hand it something (a cookie, a token) to remember by.

Statelessness is the one that trips people up. It's not a limitation to work around — it's why HTTP scales horizontally so easily (any server can handle any request) and why "session state" always has to live somewhere explicit: a cookie-backed server session, a signed JWT, or a database row keyed by a token.

Headers are underrated. They're the protocol's real API surface for anything that isn't the primary payload: content negotiation, caching directives, auth credentials, tracing IDs. Treating them as an afterthought is how you end up re-inventing what `Cache-Control` or `ETag` already solve.

## Key Concepts
- **Safe methods**: GET, HEAD, OPTIONS — must not change server state
- **Idempotent methods**: GET, PUT, DELETE, HEAD — calling twice has the same effect as calling once
- **Neither**: POST, PATCH — each call can have a new effect (a new resource, a new partial mutation)
- **Status code families**: 2xx success, 3xx redirect, 4xx client error (you did something wrong), 5xx server error (we did something wrong)
- **Statelessness**: each request is self-contained; server-side "memory" is an illusion built from cookies/tokens + a database
- **Headers**: `Content-Type` (what the body is), `Cache-Control` (how long it's valid), `Authorization` (who's asking), `ETag`/`If-None-Match` (has it changed)
- **Content negotiation**: `Accept` / `Accept-Language` let one URL serve multiple representations

## Example Code
```
// A raw HTTP request — this is literally what fetch()/axios build for you
GET /api/projects/42 HTTP/1.1
Host: app.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOi...
If-None-Match: "a1b2c3"

// A raw HTTP response
HTTP/1.1 304 Not Modified
ETag: "a1b2c3"
Cache-Control: private, max-age=60
```

```typescript
// Retry logic that only retries when it's SAFE to — this is why the method matters
async function fetchWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const isIdempotent = ["GET", "HEAD", "PUT", "DELETE"].includes(method);

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || !isIdempotent) return res; // never blindly retry a POST
      if (i === attempts - 1) return res;
    } catch (err) {
      if (!isIdempotent || i === attempts - 1) throw err;
    }
    await new Promise((r) => setTimeout(r, 200 * 2 ** i));
  }
  throw new Error("unreachable");
}
```

## When to Use
- Designing a new endpoint — pick the method for what it *guarantees*, not just what sounds right
- Choosing status codes for error responses instead of always returning `200` with an `{ error: ... }` body
- Writing retry/timeout logic — only auto-retry safe or idempotent methods
- Debugging with curl or the browser network tab — read the actual request/response, not just the app's interpretation of it

## Common Mistakes
- Using POST for everything, including reads — breaks caching and safe retries
- Returning `200 OK` for application-level errors, forcing every client to parse the body to know if it worked
- Treating PUT as a partial update (that's PATCH) — PUT means "replace this resource entirely"
- Assuming any server-side "session" exists without an explicit cookie/token mechanism behind it

## Further Reading
- MDN: HTTP overview and methods reference
- RFC 9110 — HTTP Semantics (the current spec, replacing 7231)
- Julia Evans — "HTTP: let's GET it on" zine (approachable, still technically precise)
