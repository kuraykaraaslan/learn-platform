# 4. Circuit Breaker, Bulkhead, Retry

## Coverage Level
**Not Covered** — External service calls (payment providers, email, OAuth) are made with direct `await fetch` or SDK calls; there is no fault tolerance layer, no retry with backoff, and no circuit breaking if a provider goes down.

## What It Is
These three patterns form the core of resilience engineering for services that call external dependencies. Without them, a slow or failing external API can take down your entire application through timeout pile-up and resource exhaustion.

The **Retry** pattern re-executes a failed operation, ideally with exponential backoff and jitter. Naive retries (immediate, fixed-interval) can cause thundering herd — all clients hammering a recovering service simultaneously. Exponential backoff spreads retries out; jitter randomizes them so retries from thousands of users don't all fire at the same second. Retries are appropriate for transient failures (network blip, 429, 503) and must be paired with idempotency on the downstream service.

The **Circuit Breaker** prevents a cascade failure by tracking recent failure rates and "opening" the circuit when failures exceed a threshold. While open, calls fail fast (without attempting the real request), giving the downstream service time to recover. After a timeout, the circuit enters half-open state — it allows one probe request through. If it succeeds, the circuit closes; if it fails, it reopens. This pattern is what stops a Stripe outage from making every page load in your app hang for 30 seconds.

The **Bulkhead** pattern isolates failures by partitioning resources. Named after watertight compartments in a ship, it limits how many concurrent calls to a dependency are allowed, so a slow dependency can only exhaust its own thread/connection pool — not the shared pool used by healthy dependencies. In Node.js, this typically means limiting concurrency with a semaphore or a queue with a concurrency cap, per external service.

## Key Concepts
- **Exponential backoff**: Each retry waits `base * 2^attempt` ms — prevents hammering a recovering service
- **Jitter**: Random offset added to backoff — spreads retries across clients to prevent synchronized thundering herds
- **Circuit states**: `CLOSED` (normal, requests pass through), `OPEN` (failing fast, no requests attempted), `HALF-OPEN` (one probe allowed to test recovery)
- **Failure threshold**: The percentage or count of failures that triggers the circuit to open
- **Timeout**: How long the circuit stays open before transitioning to half-open
- **Bulkhead**: Resource isolation per dependency — limits concurrency so one slow service can't exhaust shared resources
- **Retry budget**: A total limit on retries per time window to prevent retry amplification in fan-out call graphs
- **Idempotency requirement**: Retries are only safe if the operation is idempotent; never retry non-idempotent mutations without an idempotency key

## Example Code
```typescript
// Circuit breaker + retry with exponential backoff + jitter
// Drop-in wrapper for external service calls (Stripe, SendGrid, etc.)

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerOptions {
  failureThreshold: number;   // failures before opening
  resetTimeoutMs: number;     // how long to stay open
  maxRetries: number;
  baseDelayMs: number;
}

class CircuitBreaker {
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime = 0;

  constructor(private readonly name: string, private readonly opts: CircuitBreakerOptions) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed < this.opts.resetTimeoutMs) {
        throw new Error(`Circuit breaker OPEN for ${this.name} — failing fast`);
      }
      // Transition to half-open: allow one probe request
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await this.withRetry(fn);
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.opts.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt === this.opts.maxRetries) break;
        // Exponential backoff with full jitter
        const cap = this.opts.baseDelayMs * Math.pow(2, attempt);
        const delay = Math.random() * cap; // jitter: random between 0 and cap
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastError;
  }

  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (
      this.state === 'HALF_OPEN' ||
      this.failureCount >= this.opts.failureThreshold
    ) {
      this.state = 'OPEN';
    }
  }
}

// One breaker per external service — shared across the process lifetime
export const stripeBreaker = new CircuitBreaker('stripe', {
  failureThreshold: 5,
  resetTimeoutMs: 30_000, // 30 seconds
  maxRetries: 3,
  baseDelayMs: 200,
});

// Usage: wraps any Stripe call
async function chargeCustomer(customerId: string, amountCents: number) {
  return stripeBreaker.call(() =>
    stripe.paymentIntents.create({ amount: amountCents, currency: 'usd', customer: customerId })
  );
}
```

## When to Use
- Every call to an external HTTP API (Stripe, SendGrid, Twilio, OAuth providers) — wrap these at the service boundary
- When your service calls another internal microservice or a slower downstream API
- When you have SLA requirements and cannot let a single dependency failure cascade to user-facing 500s
- In BullMQ workers that call external APIs — BullMQ's built-in retry is a partial solution, but a circuit breaker prevents endless retries against a completely dead service

## Common Mistakes
- **Retrying non-idempotent operations**: A payment charge retried three times without an idempotency key results in three charges; always pass idempotency keys to external APIs before adding retries
- **No jitter**: Exponential backoff without jitter causes synchronized retry storms — every client backs off to the same interval and fires simultaneously when it expires
- **One circuit breaker for all services**: A single global circuit breaker that trips on Stripe failures also blocks email sends; isolate by dependency
- **Catching and silencing circuit open errors**: If the circuit is open, you should either serve a degraded response (e.g., show cached data) or surface a clear error — not catch and return `null`, which hides the failure

## Further Reading
- **"Release It!" by Michael Nygard (2nd edition)** — The book that named the circuit breaker pattern; Chapter 5 is essential and very readable
- **"AWS Architecture Blog: Exponential Backoff and Jitter"** — The canonical article on jitter strategies (Full, Equal, Decorrelated); free and short
- **cockatiel (npm) or opossum (npm)** — Production-ready circuit breaker and retry libraries for Node.js; reading their source/docs shows the edge cases worth handling
