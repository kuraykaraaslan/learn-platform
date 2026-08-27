# 57. Blue-Green vs Rolling Deployment

## What It Is
The moment your SaaS has paying customers, every deployment is a risk event. Blue-green and rolling deployments are the two dominant strategies for reducing that risk by controlling how traffic shifts from old code to new code.

**Blue-green deployment** keeps two identical production environments ("blue" and "green") at all times. One is live (serving all traffic), one is idle. You deploy the new version to the idle environment, run smoke tests, then flip the load balancer to send all traffic to the new environment. The old one stays up and idle. If anything goes wrong, the rollback is instant: flip the load balancer back. The trade-off is cost — you pay for two full environments, and you need your database schema changes to be backward-compatible with both versions simultaneously.

**Rolling deployment** replaces instances one at a time (or in small batches). The old version and new version coexist in production during the rollout. If you have 4 app instances, you replace them 1 by 1: first instance takes new traffic while the other 3 run old code, then the second, and so on. If a problem is detected, you stop the rollout and roll back remaining instances. The cost is lower (no idle environment), but rollback is slower and your code must handle two versions running simultaneously, which has implications for database migrations and API contracts.

For a Next.js SaaS deployed on Railway, Fly.io, or Kubernetes, you will choose between these based on your tolerance for risk, your budget, and how carefully you manage database migrations.

## Key Concepts
- **Blue environment / Green environment** — two identical production stacks; only one serves live traffic at a time
- **Traffic cutover** — the moment you flip the load balancer or DNS from old to new; in blue-green this is atomic
- **Rolling update** — replacing a fraction of instances at a time; used by Kubernetes Deployments by default
- **`maxUnavailable` / `maxSurge`** — Kubernetes rolling update parameters: how many pods can be down and how many extra can be created during a rollout
- **Database migration compatibility** — during a rolling deploy, old and new code run against the same database; migrations must be backward-compatible (additive only, never drop a column a running version still reads)
- **Readiness probe** — Kubernetes health check that gates traffic to a new pod; only routes traffic once the pod is healthy
- **Canary as a hybrid** — a canary deploy is a blue-green where you send only X% of traffic to green; you test before full cutover
- **Zero-downtime constraint** — both strategies aim for this; the key is that health checks and readiness probes must be tuned correctly

## Example Code
```typescript
// Example: expand/contract database migration pattern — required for safe rolling deploys
// Scenario: renaming column `user.name` to `user.full_name`

// ❌ Wrong: do this in one migration — old code crashes because it still reads `name`
// ALTER TABLE users RENAME COLUMN name TO full_name;

// ✓ Correct: three-phase expand/contract approach

// Phase 1 — EXPAND migration (deploy with v1 code still running):
// Add the new column, copy data, but keep the old column alive
// Migration file: 001_add_full_name.sql
/*
  ALTER TABLE users ADD COLUMN full_name TEXT;
  UPDATE users SET full_name = name WHERE full_name IS NULL;
  -- Old code reads `name` (still exists), new code reads `full_name` (now populated)
*/

// Phase 2 — Deploy new code (v2) that reads and writes `full_name`.
// v2 must also write to `name` for any old instances still running during rolling deploy.
// This is the "dual-write" window.

// Phase 3 — CONTRACT migration (after all instances are on v2):
// Safe to drop the old column now that no code reads it
// Migration file: 002_drop_old_name.sql
/*
  ALTER TABLE users DROP COLUMN name;
*/

// ─── Kubernetes rolling update config ───────────────────────────────────────
// k8s/deployment.yaml — safe rolling update defaults
const k8sDeploymentSpec = {
  strategy: {
    type: 'RollingUpdate',
    rollingUpdate: {
      maxUnavailable: 0,    // never take a pod offline before a new one is ready
      maxSurge: 1,          // spin up 1 extra pod during the rollout
    },
  },
  template: {
    spec: {
      containers: [{
        name: 'acme-web',
        image: 'ghcr.io/your-org/acme-web:${GIT_SHA}',
        readinessProbe: {
          httpGet: { path: '/api/health', port: 3000 },
          initialDelaySeconds: 5,
          periodSeconds: 5,
          failureThreshold: 3,   // 3 consecutive failures → stop rollout
        },
        lifecycle: {
          preStop: {
            // Give in-flight requests 15s to complete before the pod is terminated
            exec: { command: ['/bin/sh', '-c', 'sleep 15'] },
          },
        },
      }],
    },
  },
};

// app/api/health/route.ts — your readiness endpoint
import { NextResponse } from 'next/server';
import { getSystemDataSource } from '@/libs/typeorm';
import redis from '@/libs/redis';

export async function GET() {
  try {
    const ds = await getSystemDataSource();
    await ds.query('SELECT 1'); // verify DB connection
    await redis.ping();          // verify Redis connection
    return NextResponse.json({ status: 'ok' });
  } catch (err) {
    return NextResponse.json({ status: 'error' }, { status: 503 });
  }
}
```

## When to Use
1. **Blue-green** — when you need instant rollback capability and can afford two environments; ideal for high-stakes deployments like payment system upgrades or major schema changes.
2. **Rolling** — default choice on Kubernetes or Railway with multiple replicas; lower cost, acceptable rollback speed for most routine deployments.
3. **Canary (hybrid)** — use when you want to validate a high-risk change against real traffic (e.g., a new auth flow) before committing; route 5% to new, monitor for 30 minutes, then proceed.
4. **Expand/contract migrations** — mandatory for any rolling deploy that involves a database schema change; never rename or drop a column in a single migration while running a rolling deploy.
5. **`preStop` sleep** — always add a pre-stop hook with a sleep equal to your load balancer's connection drain time; without it, in-flight requests get cut off mid-execution.

## Common Mistakes
- **Deploying breaking database migrations with rolling updates** — if old pods still run while you apply `ALTER TABLE users DROP COLUMN`, those pods crash. Always use expand/contract.
- **Missing or misconfigured readiness probes** — without a readiness probe, Kubernetes sends traffic to a pod that is still initializing its database connections. Always probe your `/health` endpoint.
- **Not accounting for connection drain time** — your load balancer may take 10–30 seconds to drain connections from a pod being replaced. If the pod terminates instantly, requests in flight return 502.
- **Treating blue-green as zero-risk** — the traffic cutover is atomic, but if both environments share the same database, a migration bug still affects both.

## Further Reading
- Kubernetes Deployments documentation: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
- Martin Fowler — Blue-Green Deployment: https://martinfowler.com/bliki/BlueGreenDeployment.html
- Evolutionary Database Design (expand/contract): https://martinfowler.com/articles/evodb.html
