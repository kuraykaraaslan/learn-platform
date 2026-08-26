# 21. CDN Cache Strategy — Cache-Control, stale-while-revalidate

## Coverage Level
**Not Covered** — Your Next.js API routes and pages do not set explicit `Cache-Control` headers. The default behavior — which varies by deployment platform — likely caches nothing or caches incorrectly. For a multi-tenant SaaS with different data per tenant, incorrect caching could serve one tenant's data to another.

## What It Is
HTTP caching is a first-principles performance and cost optimization. When a browser, CDN edge node, or reverse proxy caches a response, subsequent identical requests are served without hitting your origin server. For static assets, this is obvious. For API responses and HTML pages in a SaaS, the rules are more nuanced and the stakes are higher: a misconfigured `Cache-Control` header can either over-cache (serving stale or cross-tenant data) or under-cache (making every request hit your origin unnecessarily).

`Cache-Control` is the primary header. `public, max-age=3600` tells the browser and CDN to cache the response for 1 hour. `private, max-age=60` tells the CDN not to cache (since it's user-specific), but allows the browser to cache for 60 seconds. `no-store` disables all caching. `stale-while-revalidate` is the most useful directive for SaaS: `Cache-Control: public, max-age=60, stale-while-revalidate=300` means "serve a fresh response for 60 seconds; after that, serve the stale response immediately while revalidating in the background; after 300 additional seconds, refuse to serve stale data." This gives users instant responses with background freshness, eliminating the "cache miss penalty" where the user waits for a full origin fetch.

For a multi-tenant SaaS, the key rule is: any response that differs per user or tenant must either be `private` (browser cache only, no CDN) or keyed by a tenant/user identifier that is part of the cache key. A CDN that caches a tenant dashboard response under the URL `/dashboard` without knowing about the tenant will serve tenant A's data to tenant B — a critical security vulnerability.

## Key Concepts
- **`Cache-Control: max-age=N`**: Cache for N seconds; after N seconds, the cached entry is stale
- **`Cache-Control: s-maxage=N`**: Like `max-age` but only for shared caches (CDNs); browser still uses `max-age`; use this to set different CDN vs browser TTLs
- **`Cache-Control: private`**: Only the browser can cache; CDNs must not; use for authenticated, user-specific responses
- **`Cache-Control: no-store`**: No caching anywhere; every request hits the origin; use for sensitive data (banking, PII)
- **`stale-while-revalidate`**: Serve stale content immediately; revalidate in background; eliminates cache miss latency
- **`Vary` header**: Tells the CDN to include specific request headers in the cache key; `Vary: Accept-Encoding` is standard; `Vary: Cookie` effectively disables CDN caching (every cookie variant is a different cache entry)
- **CDN cache key**: What the CDN uses to determine if a cached response can be served; typically URL + selected headers; must include tenant identity for tenant-scoped responses
- **`Surrogate-Control` / `CDN-Cache-Control`**: Cloudflare, Fastly, and others support custom headers that override `Cache-Control` at the CDN level without affecting the browser

## Example Code
```typescript
// Setting Cache-Control headers in Next.js API routes and RSC pages

import { NextRequest, NextResponse } from 'next/server';

// ─── Static public data: safe to cache aggressively at CDN ───
// e.g., pricing page, public feature list, documentation
export async function GET(request: NextRequest) {
  const data = await getPublicPricingData();

  return NextResponse.json(data, {
    headers: {
      // CDN caches for 1 hour, serves stale for up to 24h while revalidating
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}

// ─── Tenant-specific data: browser cache OK, CDN must not cache ───
// e.g., tenant dashboard data, user profile, settings
export async function GET(request: NextRequest) {
  const tenantId = getTenantFromRequest(request);
  const data = await getTenantDashboard(tenantId);

  return NextResponse.json(data, {
    headers: {
      // 'private' = browser can cache for 60s, CDN must not
      'Cache-Control': 'private, max-age=60',
    },
  });
}

// ─── Authenticated API responses: no CDN, short browser cache ───
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  const userProfile = await getUserProfile(session.userId);

  return NextResponse.json(userProfile, {
    headers: {
      'Cache-Control': 'private, no-cache', // Revalidate with origin before serving cached
      // 'no-cache' ≠ 'no-store': no-cache means "revalidate first", no-store means "don't cache at all"
    },
  });
}

// ─── Next.js App Router: caching for Server Components ───
// In page.tsx (RSC), control caching via next.config.js or export const revalidate

// app/pricing/page.tsx — statically generated, revalidated hourly
export const revalidate = 3600; // ISR: regenerate every hour

export default async function PricingPage() {
  const plans = await db.plan.findMany({ where: { isPublic: true } });
  return <PricingGrid plans={plans} />;
}

// app/(tenant)/dashboard/page.tsx — dynamic, never cached at CDN
export const dynamic = 'force-dynamic'; // Opt out of static generation

export default async function DashboardPage() {
  const tenantId = await getTenantFromCookies();
  const stats = await getTenantStats(tenantId);
  return <Dashboard stats={stats} />;
}

// ─── Handling CDN cache purging when data changes ───
// Vercel: use `revalidatePath` or `revalidateTag` from next/cache
import { revalidatePath, revalidateTag } from 'next/cache';

async function updatePricingPlan(planId: string, data: PlanUpdateInput) {
  await db.plan.update({ where: { id: planId }, data });

  // Invalidate cached pricing pages
  revalidatePath('/pricing');
  revalidateTag('pricing-plans'); // Tag-based invalidation (Next.js 14+)
}

// ─── Security: ensure no cross-tenant caching ───
function addTenantCacheHeaders(response: NextResponse, tenantId: string): NextResponse {
  // For CDN edge caching keyed by tenant (Cloudflare Workers, Vercel Edge Config):
  response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  // Custom Cloudflare header to add tenantId to cache key:
  response.headers.set('CF-Cache-Tag', `tenant-${tenantId}`);
  // Allows purging all cache for a specific tenant:
  // cloudflare.zones.purgeCache({ tags: [`tenant-${tenantId}`] })
  return response;
}
```

## When to Use
- Public marketing pages and documentation — `public, max-age=3600, stale-while-revalidate=86400` and let the CDN serve them
- API responses for pricing, feature flags, or any non-personalized data — cache aggressively at the CDN
- Tenant-specific API responses — `private` to prevent CDN caching; browser-level cache acceptable with short TTL
- Authenticated session-dependent pages — `private, no-cache` or `no-store` depending on sensitivity

## Common Mistakes
- **No `Cache-Control` header = platform default caching**: Some CDNs (Cloudflare) cache responses with no `Cache-Control` header by default; an absent header is not the same as "no cache"
- **Caching tenant-specific responses as `public`**: If Cloudflare or Vercel's edge caches a tenant dashboard under a shared URL, the next user to request that URL gets the first tenant's data — a security incident
- **Using `Vary: Cookie`**: This prevents CDN caching for any request with a cookie, which is every authenticated request; instead of `Vary: Cookie`, use `private` for authenticated responses and restrict CDN caching to public routes
- **Misunderstanding `no-cache` vs `no-store`**: `no-cache` means "you may cache it, but revalidate with the origin on every use" — it's not the same as disabling caching; use `no-store` when you genuinely don't want any caching

## Further Reading
- **MDN Web Docs — "HTTP Caching"** — The definitive reference for `Cache-Control` directives; covers `stale-while-revalidate`, `stale-if-error`, and `Vary` with clear examples
- **"A Comprehensive Guide to HTTP Caching" by Jake Archibald (web.dev/http-cache)** — Clear, visual, and correct; explains the difference between `no-cache` and `no-store`, and when to use each directive
- **Next.js documentation — "Caching"** — Covers the four caching layers in Next.js 14+ (Request Memoization, Data Cache, Full Route Cache, Router Cache); essential reading for RSC-based apps
