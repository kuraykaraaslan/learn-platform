# 55. SLO/SLI/SLA — Error Budget Calculation

## Coverage Level
**Not Covered** — Your boilerplate has no defined reliability targets, no SLI measurement points, and no error budget tracking.

## What It Is
SLI, SLO, and SLA form a hierarchy for making reliability commitments precise and actionable. Without them, "the system should be reliable" is a wish. With them, it is a number you can measure, alert on, and budget engineering time against.

An **SLI (Service Level Indicator)** is a quantitative measurement of some aspect of your service's behavior: request success rate, p99 latency, checkout completion rate. It is just a metric. An **SLO (Service Level Objective)** is a target for that metric: "99.5% of API requests must succeed over a rolling 30-day window." An **SLA (Service Level Agreement)** is the contractual version of an SLO — a promise to customers, with financial penalties (credits) if you breach it. SLAs are typically slightly looser than your internal SLOs, because you need headroom to catch breaches before they become customer-visible.

The most important derived concept is the **error budget**: the allowed amount of unreliability within your SLO window. A 99.5% monthly SLO means you have 0.5% of requests — or about 3.6 hours of downtime — as your budget. Error budgets change the cultural dynamic: instead of ops vs. dev ("you broke it"), everyone tracks the same budget. When it's healthy, you deploy aggressively. When it's depleted, you freeze non-critical deployments and focus on reliability work.

For a solo SaaS builder, you may not have formal SLAs yet, but defining internal SLOs forces you to instrument your system correctly and gives you an honest answer when enterprise customers ask "what is your uptime?"

## Key Concepts
- **SLI** — a specific measurable indicator: `successful_requests / total_requests`, `p99_latency_ms`, `checkout_completion_rate`
- **SLO** — a target threshold for an SLI over a time window: "99.5% availability over 30 days"
- **SLA** — a contractual SLO with consequences (credits, exits); always weaker than your internal SLO
- **Error budget** — `(1 - SLO_target) × window`; the amount of failures you can afford before breaching
- **Error budget burn rate** — how fast you are consuming the budget; a burn rate > 1 means you will breach before the window closes
- **Rolling window vs. calendar window** — rolling windows (last 30 days) are harder to game than calendar months; prefer rolling
- **Good event** — a request/operation that satisfies your SLI criterion (responded < 500ms, returned 2xx)
- **Alerting on burn rate** — alert when 5% of budget is consumed in 1 hour (fast burn) or 10% in 6 hours (slow burn), not on raw error rate

## Example Code
```typescript
// libs/slo-tracker.ts — minimal error budget calculator using Redis counters

import redis from '@/libs/redis';
import Logger from '@/libs/logger';

const WINDOW_SECONDS = 30 * 24 * 60 * 60; // 30-day rolling window
const SLO_TARGET = 0.995; // 99.5% availability target

interface BudgetStatus {
  totalRequests: number;
  goodRequests: number;
  currentSLI: number;       // e.g. 0.998
  budgetRemaining: number;  // fraction of budget left, e.g. 0.6 means 60% remaining
  burnRate: number;         // > 1 means on track to breach
}

// Call this after every API request — good = request succeeded in < 2s
export async function recordRequest(tenantId: string, isGood: boolean): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / 60); // 1-minute buckets

  const pipeline = redis.pipeline();
  pipeline.hincrby(`sli:${tenantId}:${bucket}`, 'total', 1);
  if (isGood) pipeline.hincrby(`sli:${tenantId}:${bucket}`, 'good', 1);
  pipeline.expire(`sli:${tenantId}:${bucket}`, WINDOW_SECONDS + 120); // keep slightly longer than window
  await pipeline.exec();
}

// Compute current SLI and budget status for a tenant
export async function getBudgetStatus(tenantId: string): Promise<BudgetStatus> {
  const now = Math.floor(Date.now() / 1000);
  const oldestBucket = Math.floor((now - WINDOW_SECONDS) / 60);
  const currentBucket = Math.floor(now / 60);

  let totalRequests = 0;
  let goodRequests = 0;

  // Aggregate all buckets in the rolling window
  const keys: string[] = [];
  for (let b = oldestBucket; b <= currentBucket; b++) {
    keys.push(`sli:${tenantId}:${b}`);
  }

  const pipeline = redis.pipeline();
  keys.forEach((k) => pipeline.hgetall(k));
  const results = await pipeline.exec() ?? [];

  for (const [, data] of results) {
    if (data && typeof data === 'object') {
      const d = data as Record<string, string>;
      totalRequests += parseInt(d.total ?? '0');
      goodRequests  += parseInt(d.good  ?? '0');
    }
  }

  const currentSLI    = totalRequests > 0 ? goodRequests / totalRequests : 1;
  const allowedErrors = (1 - SLO_TARGET) * totalRequests;
  const actualErrors  = totalRequests - goodRequests;
  const budgetRemaining = allowedErrors > 0 ? Math.max(0, (allowedErrors - actualErrors) / allowedErrors) : 1;
  const burnRate      = allowedErrors > 0 ? actualErrors / allowedErrors : 0;

  if (burnRate > 2) {
    Logger.warn('High SLO burn rate detected', { tenantId, burnRate, currentSLI });
  }

  return { totalRequests, goodRequests, currentSLI, budgetRemaining, burnRate };
}
```

## When to Use
1. **Before signing enterprise contracts** — a customer's legal team will ask for your SLA. Define your internal SLO first so you know what you can commit to.
2. **Deciding whether to deploy** — if your error budget for the month is 80% consumed with 15 days left, hold non-critical deployments.
3. **Prioritizing reliability work** — if SLO for the payments service is consistently breached, that takes priority over new features.
4. **Multi-tenant fairness** — track SLIs per tenant. One noisy tenant consuming resources can degrade SLIs for others; per-tenant SLOs reveal this.
5. **Communicating incidents** — "we consumed 40% of our monthly error budget in 2 hours during the outage" is more precise than "we had some downtime."

## Common Mistakes
- **Confusing SLO and SLA** — make your internal SLO stricter than your customer-facing SLA (e.g., internal 99.9% → SLA 99.5%), so you catch breaches before they become contractual violations.
- **Measuring the wrong thing** — success rate at the load balancer is not the same as checkout completion rate. Define SLIs that match what users actually care about.
- **Alerting on instantaneous error rate** — a 5-minute spike to 2% errors is noise. Alert on burn rate against your error budget over a longer window to reduce alert fatigue.
- **Forgetting planned maintenance** — exclude maintenance windows from SLI calculations or your maintenance will eat your budget.

## Further Reading
- Google SRE Book — Chapter 4 (Service Level Objectives): https://sre.google/sre-book/service-level-objectives/
- Alex Hidalgo — "Implementing Service Level Objectives" (O'Reilly)
- Alerting on SLOs using burn rates (Google SRE Workbook): https://sre.google/workbook/alerting-on-slos/
