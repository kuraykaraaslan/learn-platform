# 132. Load & Stress Testing Basics — k6, Artillery

## Coverage Level
**Not assessed** — added during the roadmap gap review. Test Pyramid (#71) covers correctness testing; this is the missing performance-testing counterpart, and a direct prerequisite to Capacity Planning (#142).

## What It Is
Load testing answers different questions depending on which variant you run, and conflating them gives misleading answers. A **load test** simulates expected traffic to confirm the system meets its latency/error targets under normal conditions. A **stress test** pushes past expected traffic to find the actual breaking point and *how* it fails (graceful degradation vs. total collapse). A **soak test** runs a moderate load for an extended duration to catch problems that only show up over time — memory leaks, connection pool exhaustion, log disk filling up. A **spike test** checks recovery behavior from a sudden, short burst.

What you measure matters as much as the test type. Average latency hides the experience of your worst-served users — a 50ms average with a 4-second p99 means 1% of requests are having a terrible time, and averages won't show it. **Percentile latency** (p50, p95, p99) is the standard vocabulary, and it pairs with error rate and throughput (requests/sec sustained) as the three numbers that actually describe system behavior under load.

## Key Concepts
- **Load test**: expected traffic, confirms SLO targets are met (ties to #55 SLO/SLI/SLA)
- **Stress test**: traffic ramped past expected levels to find the breaking point and failure mode
- **Soak test**: moderate load sustained over hours, catches leaks and slow resource exhaustion
- **Spike test**: sudden burst, checks whether the system recovers cleanly afterward
- **Percentile latency (p50/p95/p99) over average**: averages hide tail latency that real users experience
- **Identify the actual bottleneck**: CPU, DB connection pool (#19), memory, or an external API — the test result is meaningless without knowing what capped it

## Example Code
```javascript
// k6 script — ramping virtual users against a real endpoint, checking p95 latency
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "1m", target: 50 },   // ramp up
    { duration: "3m", target: 50 },   // sustain
    { duration: "1m", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<300"], // fail the test if p95 exceeds 300ms
    http_req_failed: ["rate<0.01"],   // fail if error rate exceeds 1%
  },
};

export default function () {
  const res = http.get("https://staging.example.com/api/projects");
  check(res, { "status is 200": (r) => r.status === 200 });
  sleep(1);
}
```

## When to Use
- Before a launch, marketing push, or known traffic event — validate against realistic expected load
- After a suspected performance regression — a repeatable load test turns "feels slower" into a measured number
- As input to capacity planning (#142) — the breaking point from a stress test tells you how much headroom you actually have

## Common Mistakes
- Reporting only average latency, hiding a painful tail experienced by a meaningful fraction of users
- Testing against a non-production-like environment (different instance size, mocked downstream services), producing numbers that don't transfer
- Load testing the API layer while a downstream dependency (DB, third-party API) is mocked, so the real bottleneck never shows up
- Running a stress test against production without warning anyone — coordinate it like any other risky operation

## Further Reading
- k6 documentation (k6.io/docs) — test types explained with runnable examples
- "The Art of Capacity Planning" by John Allspaw
- Artillery.io documentation — a JS/YAML-based alternative with a lower learning curve for simple scenarios
