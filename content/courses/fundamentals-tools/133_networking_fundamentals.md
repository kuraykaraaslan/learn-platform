# 133. Networking Fundamentals for Backend Engineers — DNS, TCP/IP, Load Balancers

## Coverage Level
**Not assessed** — added during the roadmap gap review. CDN Cache Strategy (#21) and HTTP/2 Multiplexing (#22) both assume this layer already exists underneath them; it was never covered directly.

## What It Is
Before a request ever reaches a Next.js route handler, it travels through a chain most backend engineers can name but not actually reason about when something breaks. **DNS resolution** turns a hostname into an IP address through a chain of resolvers (browser cache → OS cache → recursive resolver → root/TLD/authoritative servers), and the **TTL** on each DNS record determines how long that answer is cached — which is exactly why a DNS-based failover doesn't take effect instantly, and why lowering TTL *before* a planned migration is a real, common technique.

Once the IP is known, a **TCP handshake** (SYN, SYN-ACK, ACK) establishes a connection before any HTTP bytes flow — this per-connection setup cost is precisely what HTTP/2 multiplexing (#22) is optimizing away by reusing one connection for many requests. In front of the actual application servers usually sits a **load balancer** — operating at L4 (TCP/UDP, routes by IP/port, doesn't see HTTP) or L7 (HTTP-aware, can route by path/header, terminate TLS) — and often a **reverse proxy** (nginx, or the load balancer itself) handling TLS termination and forwarding the real client IP via `X-Forwarded-For`, which the app must validate rather than blindly trust.

## Key Concepts
- **DNS resolution chain**: browser/OS cache → recursive resolver → root → TLD → authoritative server; **TTL** governs cache lifetime and failover speed
- **TCP handshake**: SYN/SYN-ACK/ACK sets up a connection before any application data flows — a real, measurable cost per new connection
- **L4 vs L7 load balancing**: L4 routes by IP/port without understanding HTTP; L7 is HTTP-aware and can route by path, header, or cookie
- **Reverse proxy responsibilities**: TLS termination, request routing, sometimes caching — nginx or the load balancer itself
- **`X-Forwarded-For`**: the original client IP, added by each proxy hop — must only be trusted from a known, trusted proxy, never taken as-is from the raw request
- **Health checks**: what the load balancer polls to decide whether an instance receives traffic — distinct from a deeper application health/readiness check

## Example Code
```
# A request's actual path, annotated
1. Browser: DNS lookup for app.example.com
     → OS cache miss → recursive resolver → authoritative server → 203.0.113.10 (TTL 300s)
2. Browser: TCP handshake to 203.0.113.10:443 (SYN / SYN-ACK / ACK)
3. TLS handshake (certificate validation, session key negotiation)
4. L7 load balancer receives HTTPS request, terminates TLS, adds:
     X-Forwarded-For: <original client IP>
     X-Forwarded-Proto: https
5. Load balancer routes to a healthy app server instance (per its last health check)
6. App server: MUST only trust X-Forwarded-For because step 4 came from a known, trusted proxy
```

```typescript
// Validating the forwarded IP — only trust it if the immediate peer is your known load balancer
function getClientIp(req: Request, trustedProxyIps: Set<string>): string {
  const remoteAddr = getSocketRemoteAddress(req); // the actual TCP peer
  if (!trustedProxyIps.has(remoteAddr)) return remoteAddr; // untrusted — ignore the header entirely
  const forwarded = req.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0].trim() ?? remoteAddr;
}
```

## When to Use
- Diagnosing latency that isn't explained by application code — check DNS, TCP setup cost, and proxy hops before assuming it's the app
- Planning a migration or failover — lower DNS TTL ahead of time so the cutover propagates quickly
- Designing rate limiting or geo-based logic — decide explicitly whether it needs the real client IP (requires trusted-proxy validation) or can use the load balancer's IP

## Common Mistakes
- Trusting `X-Forwarded-For` from any request without verifying it came through a known proxy — trivially spoofable otherwise
- Leaving DNS TTL high going into a planned migration, then being surprised failover takes hours to fully propagate
- Conflating a load balancer's shallow health check (TCP port open) with real application readiness (DB connection pool warm, dependencies reachable)
- Assuming L4 load balancing can do path-based routing — that requires L7

## Further Reading
- "High Performance Browser Networking" by Ilya Grigorik (free online at hpbn.co)
- Cloudflare Learning Center — "What is DNS?" and "What is a reverse proxy?" (vendor-published, technically accurate and vendor-neutral in explanation)
- Julia Evans — "How DNS works" and "How TCP works" zines
