# 5. Rate Limiting Strategies (Token Bucket, Leaky Bucket, Sliding Window)

## What It Is
Rate limiting controls how many requests a client can make in a given period. The algorithm you choose determines the user experience at limit boundaries, the fairness of enforcement, and the complexity of your Redis operations. Fixed-window is the simplest, but it has a well-known vulnerability: a client can fire 2x the allowed rate by clustering requests at the end of one window and the start of the next.

**Sliding window log** tracks the exact timestamp of each request; the window slides with the current time. Perfectly accurate, but storing per-request timestamps gets expensive at high throughput. **Sliding window counter** approximates the sliding window using two fixed-window counters and a weighted average — fast and Redis-efficient. **Token bucket** gives each client a bucket that fills at a fixed rate (e.g., 10 tokens/second) up to a maximum capacity. Each request consumes one token. This naturally allows short bursts (up to bucket capacity) while enforcing a long-term rate. **Leaky bucket** is the inverse: requests enter a queue and are processed at a fixed output rate regardless of burst — useful for smoothing spiky input to protect downstream services.

One algorithm across every endpoint is almost always the wrong choice, because the endpoints are defending against different things. Public auth endpoints (login, register) want a sliding window — the whole point is that an attacker cannot burst at the window edge. API endpoints used by paying tenants want a token bucket — legitimate batch work arrives in bursts, and penalising it makes the product feel broken. Background job triggers want a leaky bucket, because what you are protecting there is the database's write throughput, not fairness between callers.

```quiz
- q: "Fixed-window rate limiting has a well-known hole. What is it?"
  anchor: "a client can fire 2x the allowed rate by clustering requests at the end of one window and the start of the next"
  options:
    - text: "Counters drift because window boundaries are not synchronized across servers"
      correct: false
      why: "A genuine distributed-systems concern, but not the vulnerability named here."
    - text: "A client can send 2x the allowed rate by clustering at the boundary between two windows"
      correct: true
      why: "The window resets, so the burst at the end and the burst at the start both count as within-limit."
    - text: "It can only express global limits, not per-client ones"
      correct: false
      why: "It can express per-client limits. The problem is the boundary, not the granularity."

- q: "You want to allow short bursts while still holding a long-term rate. Which algorithm?"
  anchor: "This naturally allows short bursts (up to bucket capacity) while enforcing a long-term rate"
  options:
    - text: "Leaky bucket — the queue absorbs the burst"
      correct: false
      why: "Leaky bucket is the inverse: it drains at a fixed output rate regardless of burst, which smooths rather than allows."
    - text: "Token bucket — it fills at a fixed rate, and its capacity is the burst allowance"
      correct: true
      why: "Each request consumes one token, so capacity bounds how large a burst can be while the fill rate holds the long-term limit."
    - text: "Sliding window log — exact timestamps measure the burst precisely"
      correct: false
      why: "It measures precisely and rejects precisely. Precision is not a burst allowance."

- q: "A fragile downstream service needs protecting from spiky input. Which algorithm fits?"
  anchor: "useful for smoothing spiky input to protect downstream services"
  options:
    - text: "Token bucket — bursts are exactly what needs allowing"
      correct: false
      why: "Token bucket permits the burst, which is the thing the downstream cannot absorb."
    - text: "Leaky bucket — requests queue and are processed at a fixed output rate regardless of burst"
      correct: true
      why: "Smoothing is its purpose, which is what a fragile downstream needs."
    - text: "Sliding window counter, for its Redis efficiency"
      correct: false
      why: "Efficiency is its selling point, but it still admits traffic in bursts up to the limit."
```

## Key Concepts
- **Fixed window**: Count resets at interval boundaries; simple but allows 2x burst at window edges
- **Sliding window log**: Exact per-request timestamp tracking; accurate but memory-intensive
- **Sliding window counter**: Two fixed-window buckets weighted by position in current window; fast approximation
- **Token bucket**: Bucket refills at a fixed rate; allows bursts up to bucket capacity; most user-friendly for API limits
- **Leaky bucket**: Requests processed at fixed output rate; smooths bursts; ideal for protecting downstream services
- **Rate limit headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` — clients need these to back off gracefully
- **Key strategy**: Rate limit by IP for unauthenticated routes, by `tenantId` or `userId` for authenticated routes, by API key for integrations
- **Redis MULTI/EXEC (transactions)**: Required for atomic increment + expiry operations; without it, a concurrent request can race between the GET and the SET

## Example Code
```typescript
// Upgrading from fixed-window to sliding window counter and token bucket
// Sliding window counter: accurate burst prevention at window boundaries

import Redis from 'ioredis';
export async function slidingWindowRateLimit(
  redis: Redis,
  key: string,       // e.g., `rl:login:${ip}`
  limit: number,     // max requests
  windowMs: number   // window size in ms
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const currentWindowKey = `${key}:${Math.floor(now / windowMs)}`;
  const prevWindowKey = `${key}:${Math.floor(now / windowMs) - 1}`;

  const [current, prev] = await Promise.all([
    redis.get(currentWindowKey).then(Number),
    redis.get(prevWindowKey).then(Number),
  ]);

  // Weight the previous window by how far into the current window we are
  const windowProgress = (now % windowMs) / windowMs;
  const weightedCount = prev * (1 - windowProgress) + current;

  if (weightedCount >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(Math.ceil(now / windowMs) * windowMs),
    };
  }

  // Atomic increment with expiry (2 windows to keep prev window data)
  const pipeline = redis.pipeline();
  pipeline.incr(currentWindowKey);
  pipeline.pexpire(currentWindowKey, windowMs * 2);
  await pipeline.exec();

  return {
    allowed: true,
    remaining: Math.floor(limit - weightedCount - 1),
    resetAt: new Date(Math.ceil(now / windowMs) * windowMs),
  };
}

// Token bucket: allows bursts up to capacity, refills at steady rate
// Implemented with Redis using "last refill time" + "current tokens" stored as a hash

export async function tokenBucketRateLimit(
  redis: Redis,
  key: string,         // e.g., `tb:api:${tenantId}`
  capacity: number,    // max tokens (burst ceiling)
  refillRate: number,  // tokens added per second
): Promise<{ allowed: boolean; remaining: number }> {
  const bucketKey = `tb:${key}`;
  const now = Date.now() / 1000; // seconds

  const result = await redis.eval(
    // Lua script for atomic token bucket operation
    `
    local key = KEYS[1]
    local capacity = tonumber(ARGV[1])
    local refill_rate = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
    local tokens = tonumber(bucket[1]) or capacity
    local last_refill = tonumber(bucket[2]) or now

    -- Refill tokens based on time elapsed
    local elapsed = now - last_refill
    tokens = math.min(capacity, tokens + elapsed * refill_rate)

    if tokens < 1 then
      redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
      redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 60)
      return {0, math.floor(tokens)}  -- not allowed
    end

    tokens = tokens - 1
    redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
    redis.call('EXPIRE', key, math.ceil(capacity / refill_rate) + 60)
    return {1, math.floor(tokens)}  -- allowed
    `,
    1, bucketKey, String(capacity), String(refillRate), String(now)
  ) as [number, number];

  return { allowed: result[0] === 1, remaining: result[1] };
}
```

The "2x burst at window edges" claim in Key Concepts, made concrete. Ten
requests arrive across 80 milliseconds, straddling a window boundary, against a
limit of five per second. Predict how many get through.

```typescript run
type Verdict = { t: number; window: number; allowed: boolean };

const LIMIT = 5;
const WINDOW_MS = 1000;

function fixedWindow(timestamps: number[]): Verdict[] {
  const counts = new Map<number, number>();
  return timestamps.map((t): Verdict => {
    const window = Math.floor(t / WINDOW_MS);
    const used = counts.get(window) ?? 0;
    if (used >= LIMIT) return { t, window, allowed: false };
    counts.set(window, used + 1);
    return { t, window, allowed: true };
  });
}

const burst = [960, 970, 980, 990, 999, 1000, 1010, 1020, 1030, 1040];
const results = fixedWindow(burst);

console.log(`limit: ${LIMIT} requests per ${WINDOW_MS}ms fixed window`);
for (const r of results) {
  console.log(`  t=${String(r.t).padStart(4)}ms  window ${r.window}  ${r.allowed ? 'ALLOWED' : 'blocked'}`);
}

const allowed = results.filter((r) => r.allowed).length;
const span = burst[burst.length - 1] - burst[0];
console.log('');
console.log(`${allowed} requests allowed inside ${span}ms — ${allowed / LIMIT}x the limit.`);
console.log('Both windows stayed within their own count. The boundary is the bug.');
```

Every window honoured its own count correctly — that is what makes this hard to
spot in a code review. The defect is not in the counting, it is in where the
boundary falls relative to the traffic.

## When to Use
- **Sliding window counter**: Auth endpoints (login, password reset, OTP) where burst-at-boundary attacks are a real concern
- **Token bucket**: Authenticated API endpoints for paying tenants — allows short legitimate bursts while enforcing overall rate
- **Leaky bucket**: Protecting downstream services (DB writes, external API calls) from traffic spikes originating from your own code
- **Fixed window (your current implementation)**: Acceptable for coarse abuse prevention on low-value endpoints where boundary exploits aren't a concern

## Common Mistakes
- **Not returning rate limit headers**: Clients that don't know their limit or remaining count will retry aggressively; always send `X-RateLimit-*` headers with every response
- **Limiting by IP on load-balanced endpoints**: Users behind NAT or corporate proxies share IPs; limit by authenticated identity whenever possible, fall back to IP only for unauthenticated routes
- **Non-atomic Redis operations**: GET then SET is a race condition; use Lua scripts or Redis transactions (MULTI/EXEC) for all counter operations
- **Same limit for all tenants**: A free-tier tenant and a high-volume enterprise tenant should not share the same rate limit; make limits configurable per plan in your tenant settings

## Further Reading
- [**"An alternative approach to rate limiting" by Cloudflare Blog](https://cloudflare.com/blog)** — Describes the sliding window counter approximation; explains the math and the tradeoffs clearly
- **"Rate Limiting" chapter in "Building Microservices" by Sam Newman (2nd edition)** — Covers rate limiting in the context of API gateways and service meshes; practical framing
- **redis-rate-limiter-flexible (npm)** — Production-tested Node.js library supporting all four algorithms with Redis; reading the documentation surfaces the edge cases you'll need to handle in a custom implementation
- [RateLimit header fields for HTTP (IETF draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/) — the standard way to tell a client what its remaining quota is, instead of inventing your own headers

```recall
- q: "Name the rate-limiting algorithms and the one-line tradeoff of each."
  must:
    - "fixed window — simplest, but 2x the rate is reachable across a boundary"
    - "sliding window log — exact per-request timestamps, perfectly accurate, expensive at high throughput"
    - "sliding window counter — two fixed windows plus a weighted average; a fast, Redis-efficient approximation"
    - "token bucket — fills at a fixed rate up to a capacity; allows bursts while holding a long-term rate"
    - "leaky bucket — a queue draining at a fixed output rate; smooths spiky input"

- q: "What does the choice of algorithm actually determine?"
  must:
    - "the user experience at limit boundaries"
    - "the fairness of enforcement"
    - "the complexity of your Redis operations"

- q: "Contrast token bucket with leaky bucket."
  must:
    - "token bucket allows short bursts up to bucket capacity"
    - "leaky bucket processes at a fixed output rate regardless of burst"
    - "token bucket enforces a long-term rate; leaky bucket protects a downstream service from spikes"
```
