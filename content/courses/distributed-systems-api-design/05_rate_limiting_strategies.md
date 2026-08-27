# 5. Rate Limiting Strategies (Token Bucket, Leaky Bucket, Sliding Window)

## What It Is
Rate limiting controls how many requests a client can make in a given period. The algorithm you choose determines the user experience at limit boundaries, the fairness of enforcement, and the complexity of your Redis operations. Fixed-window is the simplest, but it has a well-known vulnerability: a client can fire 2x the allowed rate by clustering requests at the end of one window and the start of the next.

**Sliding window log** tracks the exact timestamp of each request; the window slides with the current time. Perfectly accurate, but storing per-request timestamps gets expensive at high throughput. **Sliding window counter** approximates the sliding window using two fixed-window counters and a weighted average — fast and Redis-efficient. **Token bucket** gives each client a bucket that fills at a fixed rate (e.g., 10 tokens/second) up to a maximum capacity. Each request consumes one token. This naturally allows short bursts (up to bucket capacity) while enforcing a long-term rate. **Leaky bucket** is the inverse: requests enter a queue and are processed at a fixed output rate regardless of burst — useful for smoothing spiky input to protect downstream services.

One algorithm across every endpoint is almost always the wrong choice, because the endpoints are defending against different things. Public auth endpoints (login, register) want a sliding window — the whole point is that an attacker cannot burst at the window edge. API endpoints used by paying tenants want a token bucket — legitimate batch work arrives in bursts, and penalising it makes the product feel broken. Background job triggers want a leaky bucket, because what you are protecting there is the database's write throughput, not fairness between callers.

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
