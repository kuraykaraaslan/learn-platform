# 133. Networking Fundamentals for Backend Engineers — DNS, TCP/IP, Load Balancers

## What It Is
Before a request ever reaches a Next.js route handler, it travels through a chain most backend engineers can name but not actually reason about when something breaks. **DNS resolution** turns a hostname into an IP address through a chain of resolvers (browser cache → OS cache → recursive resolver → root/TLD/authoritative servers), and the **TTL** on each DNS record determines how long that answer is cached — which is exactly why a DNS-based failover doesn't take effect instantly, and why lowering TTL *before* a planned migration is a real, common technique.

Once the IP is known, a **TCP handshake** (SYN, SYN-ACK, ACK) establishes a connection before any HTTP bytes flow — this per-connection setup cost is precisely what HTTP/2 multiplexing (#22) is optimizing away by reusing one connection for many requests. In front of the actual application servers usually sits a **load balancer** — operating at L4 (TCP/UDP, routes by IP/port, doesn't see HTTP) or L7 (HTTP-aware, can route by path/header, terminate TLS) — and often a **reverse proxy** (nginx, or the load balancer itself) handling TLS termination and forwarding the real client IP via `X-Forwarded-For`, which the app must validate rather than blindly trust.

```quiz
- q: "You rate-limit by the IP in `X-Forwarded-For`, read straight off the request. What did you build?"
  anchor: "must only be trusted from a known, trusted proxy, never taken as-is from the raw request"
  options:
    - text: "Correct per-client limiting — that header carries the real client IP"
      correct: false
      why: "It is a header the client can set. Read from a raw request it is attacker-controlled."
    - text: "A limiter anyone can bypass by setting the header themselves"
      correct: true
      why: "It may only be trusted when it arrives from a known, trusted proxy that appended it."
    - text: "A limiter that breaks behind a CDN but is otherwise sound"
      correct: false
      why: "Behind a trusted proxy is the one place it does work. The raw request is where it fails."

- q: "You need `/api/*` sent to one pool and everything else to another. L4 or L7?"
  anchor: "L4 routes by IP/port without understanding HTTP; L7 is HTTP-aware and can route by path, header, or cookie"
  options:
    - text: "L4 — it is faster, and paths map onto ports anyway"
      correct: false
      why: "L4 cannot see the path at all; it routes by IP and port and never parses HTTP."
    - text: "L7 — routing by path requires HTTP awareness"
      correct: true
      why: "It can route by header or cookie for the same reason."
    - text: "Either — the load balancer parses the request in both modes"
      correct: false
      why: "That parsing is precisely what separates the two layers."

- q: "Your load balancer's health check hits `/`, gets 200, and the database is down. What is missing?"
  anchor: "distinct from a deeper application health/readiness check"
  options:
    - text: "Nothing — the instance is serving, which is what the LB asked"
      correct: false
      why: "It is what the LB asked, and it is why traffic keeps arriving at an instance that cannot serve it."
    - text: "A deeper application readiness check, distinct from the LB's poll"
      correct: true
      why: "The two are separate on purpose, and the deeper one is what should know about the database."
    - text: "A shorter health check interval"
      correct: false
      why: "Polling a check that cannot fail more often changes nothing."
```

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
- **The DNS TTL is still set to 24 hours the week before a planned migration, and failover takes most of a day to actually propagate** — Leaving DNS TTL high going into a planned migration, then being surprised failover takes hours to fully propagate
- **The load balancer's health check confirms the TCP port is open, and traffic keeps routing to an instance whose database connection pool is actually exhausted** — Conflating a load balancer's shallow health check (TCP port open) with real application readiness (DB connection pool warm, dependencies reachable)
- Assuming L4 load balancing can do path-based routing — that requires L7

## Further Reading
- "High Performance Browser Networking" by Ilya Grigorik (free online at hpbn.co)
- Cloudflare Learning Center — "What is DNS?" and "What is a reverse proxy?" (vendor-published, technically accurate and vendor-neutral in explanation)
- Julia Evans — "How DNS works" and "How TCP works" zines

```recall
- q: "Trace the DNS resolution chain, and say what TTL governs."
  must:
    - "browser or OS cache → recursive resolver → root → TLD → authoritative server"
    - "TTL governs cache lifetime and failover speed"

- q: "What is the TCP handshake, and what does it cost?"
  must:
    - "SYN, SYN-ACK, ACK sets up a connection before any application data flows"
    - "it is a real, measurable cost per new connection"

- q: "What does a reverse proxy do?"
  must:
    - "TLS termination"
    - "request routing"
    - "sometimes caching"
    - "nginx, or the load balancer itself"
```
