# 56. Canary Deployment and Feature Flag Integration

## Coverage Level
**Not Covered** — Your project has no feature flag system and no canary deployment configuration; all deploys go to 100% of traffic simultaneously.

## What It Is
A canary deployment routes a small percentage of production traffic to a new version of your application before rolling it out fully. The name comes from the coal-mining practice of sending a canary into a mine first — if it survives, the miners follow. In software, the canary is a small slice of real users who experience the new code; if error rates, latency, and business metrics stay healthy for that slice, you proceed with the full rollout. If not, you route them back and investigate without having impacted everyone.

Feature flags (also called feature toggles) are a complementary but distinct tool. Where canary deployments control which version of code runs, feature flags control which features are visible inside a version. You can deploy code with a new feature disabled, then turn it on for 1% of users, then 10%, then everyone — all without a new deployment. This "dark launch" pattern decouples deployment from release.

For a solo developer, both tools pay off more than you might think. A new payment provider integration (like adding a new Iyzico checkout flow) is a perfect candidate for a feature flag: deploy the code, enable it for internal users, watch the logs, then enable for all. You avoid the rollback dance because the old code path is still live behind a flag.

## Key Concepts
- **Canary deployment** — a traffic-split strategy: 5% of requests go to the new version, 95% to the old
- **Feature flag / toggle** — a boolean (or percentage-based) condition in code that gates a feature
- **Kill switch** — a flag whose only purpose is to disable a feature in production without a deploy
- **Percentage rollout** — enable a feature for X% of users, deterministically based on `hash(userId + flagKey)`
- **Targeting rules** — enable a flag for specific users, tenants, or segments (e.g., "enable for tenants on Enterprise plan")
- **Gradual rollout** — increment the percentage over time while monitoring error rates; abort if metrics degrade
- **Flag evaluation context** — the data passed to the flag SDK at evaluation time: `userId`, `tenantId`, `plan`, `email`
- **Technical debt from stale flags** — flags that are never cleaned up accumulate and make code unreadable; treat them as temporary

## Example Code
```typescript
// libs/feature-flags.ts — a minimal in-house feature flag evaluator
// For production use, consider OpenFeature + a provider (Unleash, LaunchDarkly, Flagsmith)

import redis from '@/libs/redis';
import crypto from 'crypto';

interface FlagConfig {
  enabled: boolean;
  rolloutPercent: number;           // 0–100
  allowedTenantIds?: string[];      // explicit allowlist
  allowedUserIds?: string[];
}

// Store flag configs in Redis so you can change them without a deploy
async function getFlagConfig(flagKey: string): Promise<FlagConfig | null> {
  const raw = await redis.get(`feature_flag:${flagKey}`);
  return raw ? JSON.parse(raw) : null;
}

// Deterministic hash-based bucket assignment — same user always gets the same result
function userBucket(userId: string, flagKey: string): number {
  const hash = crypto.createHash('sha256').update(`${flagKey}:${userId}`).digest('hex');
  return parseInt(hash.slice(0, 8), 16) % 100; // 0–99
}

interface EvalContext {
  userId: string;
  tenantId: string;
  plan?: string;
}

export async function isEnabled(flagKey: string, ctx: EvalContext): Promise<boolean> {
  const config = await getFlagConfig(flagKey);
  if (!config || !config.enabled) return false;

  // Explicit allowlists take priority over percentage rollout
  if (config.allowedTenantIds?.includes(ctx.tenantId)) return true;
  if (config.allowedUserIds?.includes(ctx.userId)) return true;

  // Percentage rollout — deterministic per user
  const bucket = userBucket(ctx.userId, flagKey);
  return bucket < config.rolloutPercent;
}

// Set a flag config (call from admin API or CLI)
export async function setFlag(flagKey: string, config: FlagConfig): Promise<void> {
  await redis.set(`feature_flag:${flagKey}`, JSON.stringify(config));
}

// Usage in your payment provider selection:
// Enable the new Iyzico checkout flow for 10% of users, then ramp up
export async function getCheckoutProvider(ctx: EvalContext): Promise<'stripe' | 'iyzico_v2'> {
  const useNewIyzico = await isEnabled('new_iyzico_checkout', ctx);
  return useNewIyzico ? 'iyzico_v2' : 'stripe';
}

// Cleanup: once a flag is at 100% and stable, delete the flag and the conditional
// redis.del('feature_flag:new_iyzico_checkout') — then remove the branch in code
```

## When to Use
1. **Shipping risky features safely** — a new checkout flow or OAuth integration; dark-launch it, enable for internal accounts first, then ramp.
2. **A/B testing pricing pages or UX flows** — split users deterministically and track conversion per cohort without a separate A/B testing platform.
3. **Hotfix kill switch** — if a new feature is causing errors in production, flip a flag to disable it in seconds without a rollback deploy.
4. **Tenant-specific early access** — give a large enterprise customer access to a beta feature before general availability as a sales incentive.
5. **Canary deploys on Kubernetes/Railway** — split ingress traffic by weight (e.g., 5% to the new pod, 95% to the old) and watch metrics before promoting.

## Common Mistakes
- **Permanent flags** — every flag should have a removal ticket filed at creation. Flags older than 90 days are technical debt; old flags with dead code paths are bugs waiting to happen.
- **Evaluating flags in a tight loop** — fetching a flag from Redis on every item in a 1,000-row loop is 1,000 Redis calls. Cache flag configs in process memory with a short TTL (e.g., 30 seconds).
- **Non-deterministic rollout** — using `Math.random() < 0.1` means a user's experience changes on every page load. Always use a hash of `userId + flagKey` for consistency.
- **Skipping monitoring during rollout** — a flag rollout without watching error rate, p99 latency, and business conversion metrics is just a slow deploy, not a canary.

## Further Reading
- Martin Fowler — Feature Toggles: https://martinfowler.com/articles/feature-toggles.html
- OpenFeature — vendor-neutral feature flag standard: https://openfeature.dev/
- Unleash — open-source feature flag server: https://docs.getunleash.io/
