# 28. Horizontal Scaling — Stateless Service Design

## Coverage Level
**Covered** — Your architecture is genuinely stateless: JWT access tokens carry all session claims, refresh tokens are hashed and stored in the database (not in process memory), and Redis is used for the session cache. You could run 10 instances of your API today and any instance could serve any request. What this section covers is the reasoning behind that design and the patterns that become relevant when you actually start running multiple instances.

## What It Is
A stateless service is one where no instance holds exclusive knowledge required to serve a request. If you can kill instance A, route the same request to instance B, and get the same result, your service is stateless. This is the foundational requirement for horizontal scaling — adding more instances behind a load balancer to handle more traffic.

The failure mode of stateful services is sticky sessions: load balancers must route a user back to the same instance that holds their in-memory session. This creates uneven load distribution, complicates deployments (you can't restart an instance without logging users out), and creates a single point of failure per session. Your design avoids all of this by never putting session state in process memory — the JWT is self-describing, the hashed token in the database is the source of truth, and Redis is the shared cache layer that any instance can read.

The nuance your design navigates well is the difference between stateless at the application layer and stateful at the infrastructure layer. Your PostgreSQL and Redis are stateful — that's intentional and correct. What must be stateless is the compute layer (your Next.js API routes and service classes). Any local variable, module-level cache, or in-memory map that persists between requests is a statefulness leak that will cause subtle bugs when you scale out.

## Key Concepts
- **Stateless compute layer** — API instances hold zero per-user state; all state lives in DB/Redis
- **JWT as session carrier** — Token payload carries `userId`, `userSessionId`, `deviceFingerprint`; no server-side session lookup needed for auth, only for cache
- **Shared cache (Redis)** — All instances read/write the same Redis; `session:{userId}:{hashedToken}` key pattern means any instance can serve a cached session
- **Sticky sessions (anti-pattern)** — Load balancer pin to instance; breaks scaling and makes deploys painful
- **Read replicas** — As you scale, direct read queries to a replica and writes to primary; your TypeORM DataSource config controls this
- **Connection pooling** — Each instance opens DB connections; at 10 instances × 20 connections = 200 connections; use PgBouncer or `pgpool` before you hit PostgreSQL's `max_connections`
- **Rate limiting at the edge** — Your `libs/limiter/` should use Redis as the store, not in-memory; otherwise each instance has its own counter and your rate limit is effectively multiplied by instance count
- **Graceful shutdown** — Each instance should finish in-flight requests before exiting; critical for zero-downtime rolling deploys

## Example Code
```typescript
// The anti-pattern: in-memory state that breaks horizontal scaling
// DON'T DO THIS
const sessionCache = new Map<string, SessionData>(); // lives on ONE instance only

export function getSession(token: string) {
  return sessionCache.get(token); // returns undefined on any other instance
}

// ─────────────────────────────────────────────────────────────────────────────

// Your actual pattern (already correct): shared Redis cache
// libs/redis/session-cache.ts
import redis from '@/libs/redis';

const SESSION_TTL = 1800; // 30 minutes

export async function cacheSession(
  userId: string,
  hashedToken: string,
  data: { user: SafeUser; userSession: SafeUserSession }
): Promise<void> {
  const key = `session:${userId}:${hashedToken}`;
  // EX = expire in seconds; any instance can read this
  await redis.set(key, JSON.stringify(data), 'EX', SESSION_TTL);
}

export async function getCachedSession(
  userId: string,
  hashedToken: string
): Promise<{ user: SafeUser; userSession: SafeUserSession } | null> {
  const key = `session:${userId}:${hashedToken}`;
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

// ─────────────────────────────────────────────────────────────────────────────

// Rate limiter that works across instances (Redis-backed)
// libs/limiter/redis-rate-limiter.ts
import redis from '@/libs/redis';

export async function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const redisKey = `rate:${key}`;
  const count = await redis.incr(redisKey);
  if (count === 1) {
    // First request in window; set expiry
    await redis.expire(redisKey, windowSeconds);
  }
  return {
    allowed: count <= maxRequests,
    remaining: Math.max(0, maxRequests - count),
  };
}
// Any instance calling this hits the same Redis counter — correct behavior.
// An in-memory counter would give each of 10 instances its own limit.

// ─────────────────────────────────────────────────────────────────────────────

// Graceful shutdown for a long-running worker process
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, draining in-flight jobs...');
  await worker.close(); // BullMQ: finish current jobs, stop accepting new ones
  await redis.quit();
  process.exit(0);
});
```

## When to Use
- Before deploying behind a load balancer or autoscaling group — verify you have no in-memory state
- When adding BullMQ workers: run multiple worker processes without any shared in-process state
- When your single instance hits CPU or memory limits and you want to scale horizontally rather than vertically
- When planning blue-green or rolling deploys — stateless services can be replaced instance-by-instance safely

## Common Mistakes
- **Module-level caches** — A `const cache = {}` at the top of a service file is shared within one process only; use Redis for anything that should be consistent across instances
- **In-memory rate limiters** — `express-rate-limit` with the default memory store multiplies your actual limit by the number of instances; always use the Redis store adapter
- **Not accounting for connection pool exhaustion** — 20 instances × 20 PG connections is 400 connections; PostgreSQL's default `max_connections` is often 100; configure PgBouncer early
- **Assuming file system is shared** — If you store uploaded files to local disk, instance B cannot serve files written by instance A; use your `libs/s3/` for all file storage

## Further Reading
- [The Twelve-Factor App: Processes](https://12factor.net/processes)
- [PgBouncer documentation — connection pooling for PostgreSQL](https://www.pgbouncer.org/usage.html)
- [ioredis cluster mode for Redis horizontal scaling](https://ioredis.readthedocs.io/en/stable/README/#cluster)
