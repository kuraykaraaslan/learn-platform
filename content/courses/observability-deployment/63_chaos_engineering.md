# 63. Chaos Engineering Fundamentals — Failure Injection

## What It Is
Chaos engineering is the practice of intentionally injecting failures into your system in a controlled way to discover how it behaves under adverse conditions before those conditions appear in production unexpectedly. Netflix famously invented this discipline with their "Chaos Monkey" tool that randomly terminated production EC2 instances. The insight behind it is blunt: if your system cannot survive a random instance termination on a Tuesday afternoon, it definitely cannot survive one at 3 AM when you are asleep.

The process has a scientific structure: you form a hypothesis ("if the Redis instance becomes unavailable, users can still log in because we fall back to the database"), you define a steady state (normal error rate, response times, queue depth), you inject a failure (kill Redis), and you observe whether your hypothesis held. If it did not, you have found a real resilience gap before a real outage did.

For a Next.js multi-tenant SaaS, your natural chaos experiments align with your architecture's dependencies: Redis (session cache, queues, rate limiting), the primary database, external payment providers, S3, and the email service. Each of these going down has different user-visible consequences that you probably have not tested. Does your app serve a graceful degraded experience when Redis is unreachable, or does it throw 500s for every authenticated request?

You do not need Netflix-scale chaos tools to start. A `sleep` command that blocks Redis calls, a network namespace manipulation, or a simple process kill in a staging environment gives you most of the value.

## Key Concepts
- **Steady state** — the measurable normal behavior of your system (e.g., 99.9% success rate, < 200ms p99); your baseline before injecting chaos
- **Hypothesis** — a specific prediction about how your system will behave under a specific failure condition
- **Blast radius** — the scope of impact from a chaos experiment; start small (1 instance, staging environment)
- **Graceful degradation** — the system continues serving reduced functionality when a dependency fails; the opposite of hard dependencies everywhere
- **Circuit breaker** — a pattern that stops calling a failing dependency after N failures and returns a cached/fallback response; essential for chaos resilience
- **Fault injection** — programmatic introduction of latency, errors, or data corruption to test handling code
- **Game day** — a structured team exercise where engineers run chaos experiments together and practice incident response
- **Turbulence / Gremlin / Chaos Toolkit** — commercial and open-source tools for orchestrating chaos experiments

## Example Code
```typescript
// libs/chaos.ts — a minimal fault injection wrapper for local and staging testing
// Toggle via environment variable: CHAOS_MODE=true
// NEVER enable in production without a controlled experiment plan

const CHAOS_ENABLED = process.env.CHAOS_MODE === 'true' && process.env.NODE_ENV !== 'production';

interface FaultConfig {
  errorRate: number;       // 0.0–1.0: probability of injecting an error
  latencyMs?: number;      // add artificial latency before executing
  errorMessage?: string;
}

// Wrap any async function with fault injection
export async function withChaos<T>(
  label: string,
  fn: () => Promise<T>,
  config: FaultConfig,
): Promise<T> {
  if (!CHAOS_ENABLED) return fn();  // no-op in production

  if (config.latencyMs) {
    console.warn(`[CHAOS] Injecting ${config.latencyMs}ms latency on: ${label}`);
    await new Promise((r) => setTimeout(r, config.latencyMs));
  }

  if (Math.random() < config.errorRate) {
    console.warn(`[CHAOS] Injecting error on: ${label}`);
    throw new Error(config.errorMessage ?? `[CHAOS] Simulated failure in ${label}`);
  }

  return fn();
}

// libs/redis/index.ts — wrap Redis calls with chaos for resilience testing
import IORedis from 'ioredis';
import { withChaos } from '@/libs/chaos';

const redisClient = new IORedis({ /* your config */ });

export async function safeRedisGet(key: string): Promise<string | null> {
  try {
    return await withChaos(
      'redis.get',
      () => redisClient.get(key),
      { errorRate: 0.1, latencyMs: 200 },  // 10% failures, 200ms extra latency
    );
  } catch (err) {
    // Resilience behavior: log the Redis failure and fall through to DB
    console.warn('Redis unavailable, falling back to DB', { key, error: err });
    return null;  // caller must handle null and fetch from DB
  }
}

// Circuit breaker — simple implementation using a counter and timestamp
class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private readonly threshold = 5;
  private readonly resetMs = 30_000;

  async call<T>(fn: () => Promise<T>, fallback: () => T): Promise<T> {
    const isOpen = this.failures >= this.threshold
                && Date.now() - this.lastFailure < this.resetMs;

    if (isOpen) {
      console.warn('[CircuitBreaker] Circuit open — returning fallback');
      return fallback();
    }

    try {
      const result = await fn();
      this.failures = 0;  // reset on success
      return result;
    } catch (err) {
      this.failures++;
      this.lastFailure = Date.now();
      throw err;
    }
  }
}

export const redisBreaker = new CircuitBreaker();

// Experiment template — document your chaos experiments like ADRs
const EXPERIMENT = {
  title: 'Redis unavailability during authentication',
  hypothesis: 'When Redis is unreachable, users can still log in because session data falls back to DB',
  steadyState: { errorRate: '<0.1%', p99Latency: '<500ms' },
  method: 'Kill Redis container for 60 seconds via `docker stop redis`',
  rollback: 'Restart Redis: `docker start redis`',
  result: 'TBD — run the experiment and record outcome here',
};
```

## When to Use
1. **Before going live with a new dependency** — you are adding Stripe webhooks; what happens if Stripe's endpoint is slow? Inject 5-second latency on webhook processing and see if your queue backs up gracefully.
2. **Validating circuit breakers** — you wrote a Redis circuit breaker; run a chaos experiment to confirm it actually opens and serves fallbacks correctly before an outage does it for you.
3. **Quarterly game days** — schedule a 2-hour session where you run 3–4 experiments in staging: kill a DB replica, fill the disk, add 1-second latency to all outbound HTTP calls.
4. **After adding a new critical dependency** — any new library or service that becomes load-bearing in the request path needs a chaos test before it goes to production.
5. **Validating graceful degradation claims** — your README says "degrades gracefully if email service is unavailable"; prove it with a chaos experiment that blocks SMTP calls.

## Common Mistakes
- **Running chaos in production without safeguards** — always start in staging; define a rollback plan before every experiment; have a kill switch ready.
- **No steady state baseline** — if you do not measure normal behavior first, you cannot tell whether your experiment changed anything. Capture metrics before and after.
- **Too large a blast radius** — do not kill your entire database cluster for a first experiment. Kill one read replica, or inject 10% errors on one service, and observe from there.
- **Chaos without observability** — chaos experiments are useless if you cannot see what is happening. Set up logging, metrics, and traces before running chaos; otherwise you are flying blind.

## Further Reading
- Principles of Chaos Engineering: https://principlesofchaos.org/
- Chaos Toolkit (open-source): https://chaostoolkit.org/
- AWS Fault Injection Simulator: https://aws.amazon.com/fis/
