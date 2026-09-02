# 119. HTTP Fundamentals — Methods, Status Codes, Statelessness

## What It Is
HTTP is the request/response protocol underneath every route handler, every `fetch()` call, and every webhook in this codebase. It looks simple on the surface — verb, URL, headers, body — but three ideas do most of the real work: methods carry semantic guarantees (not just "do a thing"), status codes are a shared vocabulary for outcomes, and statelessness means the server remembers nothing about you between requests unless you explicitly hand it something (a cookie, a token) to remember by.

Statelessness is the one that trips people up. It's not a limitation to work around — it's why HTTP scales horizontally so easily (any server can handle any request) and why "session state" always has to live somewhere explicit: a cookie-backed server session, a signed JWT, or a database row keyed by a token.

Headers are underrated. They're the protocol's real API surface for anything that isn't the primary payload: content negotiation, caching directives, auth credentials, tracing IDs. Treating them as an afterthought is how you end up re-inventing what `Cache-Control` or `ETag` already solve.

```quiz
- q: "Is DELETE safe, idempotent, both, or neither?"
  anchor: "GET, PUT, DELETE, HEAD — calling twice has the same effect as calling once"
  options:
    - text: "Both — it creates nothing"
      correct: false
      why: "Safe means it must not change server state, and DELETE plainly does. It is idempotent only."
    - text: "Idempotent only — deleting twice leaves the same state, but state did change"
      correct: true
      why: "Safe is GET, HEAD and OPTIONS; those must not change server state at all."
    - text: "Neither — the second call returns a different status code"
      correct: false
      why: "Idempotence is about the resulting state, not the status code that comes back."

- q: "A malformed JSON body makes your handler throw, and it returns 500. What is wrong with that?"
  anchor: "4xx client error (you did something wrong), 5xx server error (we did something wrong)"
  options:
    - text: "Nothing — an unhandled exception is a server error by definition"
      correct: false
      why: "The exception is yours; the cause is the client's body. 4xx is the family that says the caller sent something wrong."
    - text: "It should be 4xx — the client sent something wrong"
      correct: true
      why: "5xx tells the caller to retry and wait for you to fix it, and a malformed body will fail identically forever."
    - text: "It should be 3xx, redirecting the caller to the API docs"
      correct: false
      why: "3xx is a redirect to another representation, not an error channel."

- q: "What does HTTP statelessness mean for a logged-in user?"
  anchor: "each request is self-contained"
  options:
    - text: "The server holds a session object in memory between their requests"
      correct: false
      why: "That memory is an illusion: it is rebuilt on each request from a cookie or token plus a database."
    - text: "Each request is self-contained; the login is reconstructed from a token plus a lookup"
      correct: true
      why: "Nothing carries over on its own — the appearance of memory is assembled every single time."
    - text: "It applies to GET only; a POST may carry session state in its body"
      correct: false
      why: "It applies to every method. A body is not a session."
```

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
- **A failed checkout returns HTTP 200 with `{ error: "card declined" }` in the body** — Returning `200 OK` for application-level errors, forcing every client to parse the body to know if it worked
- Treating PUT as a partial update (that's PATCH) — PUT means "replace this resource entirely"
- **A new server instance gets deployed, and a user's "logged in" state just disappears, because nothing was actually behind it but memory** — Assuming any server-side "session" exists without an explicit cookie/token mechanism behind it

## Further Reading
- [MDN: HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP) — methods, status codes and headers, with the semantics spelled out
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html) — the current specification, replacing RFC 7231
- Julia Evans — "HTTP: let's GET it on" zine (approachable, still technically precise)

```recall
- q: "Which methods are safe, which are idempotent, and which are neither?"
  must:
    - "safe: GET, HEAD, OPTIONS — must not change server state"
    - "idempotent: GET, PUT, DELETE, HEAD — calling twice has the same effect as calling once"
    - "neither: POST and PATCH, where each call can have a new effect"

- q: "What do the status code families mean?"
  must:
    - "2xx success"
    - "3xx redirect"
    - "4xx client error — you did something wrong"
    - "5xx server error — we did something wrong"

- q: "Name the four headers and what each one answers."
  must:
    - "`Content-Type` — what the body is"
    - "`Cache-Control` — how long it is valid"
    - "`Authorization` — who is asking"
    - "`ETag` / `If-None-Match` — has it changed"

- q: "What is content negotiation?"
  must:
    - "`Accept` and `Accept-Language`"
    - "one URL can serve multiple representations"
```
