# 73. Contract Testing with Pact

## Coverage Level
**Not Covered** — The project integrates with multiple external services (Stripe, PayPal, Iyzico, S3, external auth providers) and has no contract tests to verify these integrations remain compatible as APIs evolve.

## What It Is
Contract testing is about verifying that two systems that communicate with each other agree on the shape of that communication: the request format, the response schema, and the error conditions. It sits between unit tests (too narrow, no real communication) and E2E tests (too slow and brittle, requires all services to be running).

Pact is the most widely used consumer-driven contract testing framework. The key insight of consumer-driven contracts is that the **consumer** (your code) defines what it needs from the **provider** (Stripe, your internal API, a microservice), and both sides test against that agreed contract independently. You do not need both systems running simultaneously.

The workflow: (1) your test writes a "pact" — a JSON document describing "when I call X with Y, I expect Z back"; (2) Pact generates a mock server from that pact for your consumer tests; (3) the pact file is shared with the provider (via a Pact Broker); (4) the provider runs a verification test that replays the pact against the real provider code; (5) if either side breaks the contract, the test fails before a bad deploy goes to production.

For your stack, the highest-value use of Pact is testing your payment provider integrations (the interface between your code and Stripe/PayPal/Iyzico), and if you ever extract services from your monolith, testing the contracts between those services. Even without a Pact Broker, writing consumer-side pact tests for your Stripe integration gives you a regression safety net that is faster and cheaper than calling the Stripe sandbox on every CI run.

## Key Concepts
- **Consumer** — the side that makes the API call and depends on the response format; your Next.js app
- **Provider** — the side that serves the API; Stripe, your internal API, another service
- **Pact** — a JSON file describing the interactions (request + expected response) that the consumer needs
- **Consumer test** — runs against a Pact mock server; verifies your consumer code handles the expected response correctly
- **Provider verification** — the provider replays the pact's requests against the real provider and verifies responses match; can be run locally or in the provider's CI
- **Pact Broker** — a central server that stores pact files and verification results; enables "can I deploy?" checks
- **Interaction** — one request/response pair in a pact; a pact typically has multiple interactions covering success and error cases
- **Flexible matching** — Pact lets you match on type and structure (`like`, `eachLike`) rather than exact values, so minor response changes do not break contracts unnecessarily

## Example Code
```typescript
// npm install -D @pact-foundation/pact

// ── Consumer test: your code against a Stripe mock ─────────────────────────
// tests/contract/stripe-checkout.pact.test.ts
import { Pact, Interaction, Matchers } from '@pact-foundation/pact';
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import axios from 'axios';
import path from 'path';

const { like, eachLike, string, integer } = Matchers;

const provider = new Pact({
  consumer: 'NextBoilerplate',
  provider: 'StripeAPI',
  port: 4200,
  log: path.resolve('./tests/logs', 'pact.log'),
  dir: path.resolve('./tests/pacts'),   // pact files written here
  logLevel: 'warn',
});

describe('Stripe Checkout Session (Pact Consumer)', () => {
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());  // writes the pact JSON file

  it('creates a checkout session successfully', async () => {
    // Define the interaction: "when my code sends this, I expect that back"
    await provider.addInteraction({
      state: 'Stripe is available and the API key is valid',
      uponReceiving: 'a request to create a checkout session',
      withRequest: {
        method: 'POST',
        path: '/v1/checkout/sessions',
        headers: {
          Authorization: like('Bearer sk_test_...'),  // match structure, not exact value
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: {
          mode: 'payment',
          'line_items[0][price_data][currency]': 'usd',
          'line_items[0][price_data][unit_amount]': like(1000),
          'line_items[0][quantity]': like(1),
          success_url: like('https://example.com/success'),
          cancel_url: like('https://example.com/cancel'),
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': like('application/json') },
        body: {
          id: string('cs_test_abc123'),     // flexible: match type, not exact value
          object: 'checkout.session',
          url: string('https://checkout.stripe.com/c/pay/cs_test_abc123'),
          payment_status: 'unpaid',
          amount_total: integer(1000),
        },
      },
    });

    // Your real provider code — pointed at the Pact mock server
    const response = await axios.post(
      'http://localhost:4200/v1/checkout/sessions',
      new URLSearchParams({
        mode: 'payment',
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][unit_amount]': '1000',
        'line_items[0][quantity]': '1',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
      }),
      {
        headers: {
          Authorization: `Bearer sk_test_fake`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      },
    );

    // Verify your code correctly reads the response fields
    expect(response.data.id).toMatch(/^cs_/);
    expect(response.data.url).toContain('checkout.stripe.com');
    expect(response.data.payment_status).toBe('unpaid');

    await provider.verify();  // verify all interactions were called
  });

  it('handles a 401 when the API key is invalid', async () => {
    await provider.addInteraction({
      state: 'the API key is invalid',
      uponReceiving: 'a request with an invalid API key',
      withRequest: {
        method: 'POST',
        path: '/v1/checkout/sessions',
        headers: { Authorization: like('Bearer sk_invalid') },
      },
      willRespondWith: {
        status: 401,
        body: {
          error: {
            type: 'invalid_request_error',
            message: string('No such API key'),
          },
        },
      },
    });

    // Your StripeProvider should throw a typed error on 401
    await expect(
      stripeProvider.createCheckoutSession({ /* params */ }),
    ).rejects.toThrow('No such API key');

    await provider.verify();
  });
});

// The pact JSON file is written to ./tests/pacts/NextBoilerplate-StripeAPI.json
// In a real setup, upload this to a Pact Broker and have Stripe's team
// run provider verification against it. For internal services, your CI does both.
```

## When to Use
1. **Integration with multiple payment providers** — write a pact for each provider (Stripe, PayPal, Iyzico) that captures the exact response shape your code depends on; run these in CI without hitting sandbox APIs.
2. **Internal service boundaries** — if you ever extract the billing module or user service into a separate process, pact contracts prevent breaking the communication contract silently.
3. **Third-party API upgrades** — when Stripe releases a new API version, run pact verification against the new version's responses before migrating; it tells you exactly which fields changed.
4. **Webhook handling** — write consumer pacts for Stripe webhooks: "when I receive a `checkout.session.completed` event with this shape, my handler should do X." Tests the handler without needing a real Stripe event.
5. **Staging environment cost reduction** — pact consumer tests run in milliseconds against a mock; you do not need a full Stripe sandbox account integration running in CI for every PR.

## Common Mistakes
- **Exact value matching on dynamic fields** — matching `id: 'cs_test_abc123'` exactly will break every time the mock generates a new ID. Use `string()` or `like()` matchers to match type and structure.
- **Testing provider implementation details** — pact tests should only cover what your consumer code actually uses. If your code only reads `session.id` and `session.url`, do not assert on 20 other Stripe fields.
- **Treating consumer tests as integration tests** — consumer pact tests run against a mock; they prove your code handles the mocked response correctly, but they do not prove the mock matches Stripe's real behavior. Provider verification is the other half.
- **Not publishing pact files** — if you write pact tests but never share the pact file with the provider (or a Pact Broker), the tests are only half of the contract; provider verification never runs.

## Further Reading
- Pact Foundation — JavaScript/TypeScript guide: https://docs.pact.io/implementation_guides/javascript
- Pact Broker (open-source): https://github.com/pact-foundation/pact_broker
- "Contract Testing in Practice" — Martin Fowler blog: https://martinfowler.com/articles/consumerDrivenContracts.html
