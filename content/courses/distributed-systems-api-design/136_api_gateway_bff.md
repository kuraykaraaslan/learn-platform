# 136. API Gateway / Backend-for-Frontend (BFF) Pattern

## Coverage Level
**Not assessed** — added during the roadmap gap review. API Versioning Strategies (#9) covers evolving a single API's contract; this is the missing pattern for the entry layer in front of *multiple* backend services.

## What It Is
Once a system has more than one backend service (see #135), something has to sit at the edge and decide how clients reach them — that's the **API gateway**: a single entry point handling cross-cutting concerns (authentication, rate limiting, routing to the right service, sometimes response caching) so individual services don't each reimplement them. It's infrastructure, not business logic — the moment a gateway starts making domain decisions, it's become an undeclared, hard-to-test service of its own.

**Backend-for-Frontend (BFF)** solves a more specific problem: different clients (a web app, a mobile app, a third-party integration) often want the *same* underlying data shaped differently — the mobile app wants a smaller payload with fewer fields, the web dashboard wants several services' data aggregated into one response to avoid round trips. A BFF is a thin layer, owned by (or at least driven by the needs of) the frontend team, that does exactly that aggregation and shaping for one specific client — which is why "one BFF per client type" is the pattern, not "one BFF to serve everyone," since that just re-creates a generic gateway with extra steps.

## Key Concepts
- **API gateway responsibilities**: routing, authentication, rate limiting at the edge — infrastructure concerns, not business logic
- **BFF**: a per-client-tailored aggregation/shaping layer, typically one per client type (web BFF, mobile BFF)
- **Fan-out / fan-in**: the gateway or BFF calls multiple backend services concurrently and merges their responses into one
- **Gateway-as-god-object anti-pattern**: business logic creeping into the gateway, making it an untested, undeclared service
- **Resilience at the aggregation point**: a fan-out call needs its own timeout/circuit breaker (#4) per downstream call, so one slow service doesn't take down the whole aggregated response

## Example Code
```typescript
// A mobile BFF: aggregates two internal services into one shaped response,
// with per-call timeouts so one slow service doesn't sink the whole request.
async function getMobileDashboard(userId: string) {
  const [profile, notifications] = await Promise.allSettled([
    withTimeout(profileService.get(userId), 2000),
    withTimeout(notificationService.getUnread(userId), 2000),
  ]);

  return {
    // shaped specifically for the mobile client: smaller payload, only what the screen needs
    name: profile.status === "fulfilled" ? profile.value.name : null,
    avatarUrl: profile.status === "fulfilled" ? profile.value.avatarUrl : null,
    unreadCount: notifications.status === "fulfilled" ? notifications.value.length : 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}
```

## When to Use
- Multiple client types (web, mobile, third-party) needing meaningfully different response shapes from the same underlying services
- Multiple backend services that a frontend would otherwise have to call directly and merge itself, duplicating that logic per client
- Centralizing cross-cutting concerns (auth, rate limiting) once services multiply, instead of reimplementing them in each one

## Common Mistakes
- Letting business logic (validation rules, domain decisions) accumulate in the gateway/BFF, turning it into an untested, undocumented service
- Building one BFF to serve every client "to keep it simple," which just becomes a second generic gateway with none of the per-client shaping benefit
- Fanning out to multiple services with no per-call timeout, so one slow downstream service makes the whole aggregated request hang
- Duplicating the same aggregation logic across a gateway *and* a BFF instead of picking clear ownership for each concern

## Further Reading
- Sam Newman — "Pattern: Backends For Frontends" (samnewman.io)
- ThoughtWorks Technology Radar — BFF pattern writeups (multiple years, worth the search)
- Netflix Tech Blog — API gateway evolution at scale (real-world scaling lessons)
