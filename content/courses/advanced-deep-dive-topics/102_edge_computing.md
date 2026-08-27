# 102. Edge Computing — Vercel Edge Functions, Cloudflare Workers

## What It Is
Edge computing executes code at CDN PoPs (Points of Presence) geographically close to the user — typically 50–100 ms RTT from anywhere on Earth, vs. 200–400 ms to a single-region server. The trade-off is a severely restricted runtime: no Node.js built-ins, no native modules, no filesystem, no long-lived TCP connections, and typically no Prisma (which requires a TCP socket to PostgreSQL). Vercel Edge Functions and Cloudflare Workers both run the V8 isolate model — a lightweight sandboxed JS context that cold-starts in <5 ms vs. a Node.js Lambda that may take 200–800 ms.

The key insight is that edge is not a replacement for your Node.js API routes — it's a layer in front of them. You run logic that needs low latency and doesn't need a database connection: authentication header inspection, geo-routing, A/B test cookie assignment, rate limiting via Durable Objects or Redis with an HTTP adapter, bot detection, and rewriting/redirecting URLs. Heavy work — querying PostgreSQL, running BullMQ jobs, calling Stripe — stays in your Node.js runtime.

Cloudflare Workers extend this further with Durable Objects (strongly consistent stateful edge), R2 (S3-compatible object storage), and KV (eventually consistent key-value). For your stack, the most immediately useful application is replacing your Next.js `middleware.ts` with a smarter edge layer that handles tenant resolution by domain, sets a `X-Tenant-Id` header, and blocks invalid domains before they hit your Node.js handlers.

## Key Concepts
- **V8 isolate model**: No OS process per request; a V8 context is created and destroyed per invocation. Cold start is ~0–5 ms. This is why you can't run native binaries or open TCP sockets.
- **Edge middleware vs. Edge Function**: Next.js `middleware.ts` runs at the Vercel edge globally before every matched route. An Edge Function (`export const runtime = "edge"` in a route file) runs at edge for that specific route only.
- **Prisma at edge**: Prisma requires the `pg` driver which opens a TCP socket — not available in V8 isolate environments. Use Prisma Accelerate (HTTP proxy), Neon serverless driver, or keep DB access in Node.js runtime routes.
- **Geo-routing**: `request.geo` (Vercel) or `request.cf` (Cloudflare) provides country, region, and city. Use this for directing users to region-specific API clusters or serving localized defaults.
- **A/B assignment at edge**: Set a deterministic bucket cookie at the CDN layer before the page renders. This prevents layout shift from client-side assignment and keeps experiments outside your Next.js bundle.
- **KV / Durable Objects**: Cloudflare's answer to stateful edge. KV is eventually consistent (good for feature flags, config). Durable Objects are strongly consistent (good for rate limiting, presence tracking).
- **`waitUntil`**: Edge APIs don't wait for background promises after `Response` is returned. Use `context.waitUntil(promise)` (Cloudflare) or `NextFetchEvent.waitUntil` (Vercel) to run fire-and-forget analytics without blocking response time.
- **CPU time limits**: Cloudflare Workers have a 10 ms CPU wall-clock limit per request on the free tier, 50 ms on paid. Long loops or heavy crypto will exceed this.

## Example Code

```typescript
// middleware.ts — runs at Vercel edge before every request
// Handles: tenant resolution by hostname, geo-based redirects, A/B assignment

import { NextRequest, NextResponse } from "next/server";

const TENANT_DOMAIN_MAP: Record<string, string> = {
  "acme.yoursaas.com": "tenant_acme",
  "beta.yoursaas.com": "tenant_beta",
};

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export default async function middleware(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const country = req.geo?.country ?? "US";
  const url = req.nextUrl.clone();

  // --- 1. Tenant resolution by subdomain ---
  // We cannot hit PostgreSQL here (no TCP at edge), so we use a
  // pre-built static map or a Cloudflare KV / Vercel Edge Config lookup.
  const tenantId = TENANT_DOMAIN_MAP[hostname];

  if (!tenantId && !hostname.includes("localhost") && !hostname.includes("yoursaas.com")) {
    // Unknown domain — return 404 immediately at edge, never hits Node.js
    return new Response("Unknown tenant", { status: 404 });
  }

  const response = NextResponse.next();

  if (tenantId) {
    // Downstream Node.js route handlers read this header instead of
    // parsing the hostname themselves on every request
    response.headers.set("x-tenant-id", tenantId);
  }

  // --- 2. Geo-based redirect (GDPR region) ---
  // If user is in EU and hitting the global endpoint, redirect to EU cluster
  const EU_COUNTRIES = new Set(["DE", "FR", "NL", "PL", "SE", "ES", "IT"]);
  if (EU_COUNTRIES.has(country) && url.hostname === "api.yoursaas.com") {
    url.hostname = "api-eu.yoursaas.com";
    return NextResponse.redirect(url, { status: 302 });
  }

  // --- 3. A/B test bucket assignment ---
  // Assign a stable bucket before the page renders to avoid CLS
  const existingBucket = req.cookies.get("ab_bucket")?.value;
  if (!existingBucket) {
    // Deterministic: hash userId cookie or fall back to random
    const bucket = Math.random() < 0.5 ? "control" : "variant_a";
    response.cookies.set("ab_bucket", bucket, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: false, // Needs to be readable by analytics JS
      sameSite: "lax",
    });
  }

  return response;
}
```

## When to Use
- **Tenant domain resolution**: Match `hostname` to `tenantId` at edge via Edge Config (Vercel) or KV (Cloudflare) — saves a DB round-trip on every request.
- **Auth token presence check**: Inspect JWT existence and structural validity (not signature — that needs your secret in Node.js) to redirect unauthenticated users before hitting Node.js.
- **Geo-routing and compliance**: Redirect EU users to EU-region deployments automatically, without application code changes.
- **A/B experiment assignment**: Set experiment buckets at CDN layer to avoid flicker and keep assignment logic out of React.
- **Bot/abuse filtering**: Block known bad IPs, user agents, or request patterns at edge before they consume your Node.js server resources.

## Common Mistakes
- **Putting DB queries in middleware**: Even a single Prisma call in `middleware.ts` will fail silently or error — Prisma requires TCP which edge isolates don't provide. Use Vercel Edge Config, Cloudflare KV, or a simple HTTP fetch to a lightweight lookup endpoint.
- **Using `crypto` from Node.js**: Edge runtime uses the Web Crypto API (`crypto.subtle`), not Node's `crypto` module. Code that does `require('crypto')` will fail. Use `jose` library or Web Crypto for JWT verification at edge.
- **Expecting long execution time**: Edge functions timeout in milliseconds. Any I/O that isn't `fetch`-based (no TCP, no UDP) will error. If your logic takes >50 ms CPU, it belongs in Node.js.
- **Storing secrets in edge code**: Edge functions can access environment variables, but they're bundled — secrets visible in Vercel dashboard. Rotate anything exposed in middleware, and never put raw DB credentials there.

## Further Reading
- [Vercel Edge Middleware docs](https://vercel.com/docs/functions/edge-middleware) — especially the "Limitations" section
- [Cloudflare Workers: How Workers Works](https://developers.cloudflare.com/workers/reference/how-workers-works/) — V8 isolate model explained
- [Prisma Accelerate](https://www.prisma.io/data-platform/accelerate) — the official solution for using Prisma in edge environments via HTTP proxy
