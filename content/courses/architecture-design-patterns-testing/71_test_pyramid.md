# 71. Test Pyramid — Unit, Integration, E2E Ratio and Trade-offs

## Coverage Level
**Not Covered** — Zero test files exist in this project. This is the single biggest gap in the entire codebase, and it is worth being direct about: a production SaaS with multi-tenant data isolation, payment processing, and authentication logic, and zero tests is a significant operational risk. This file gives you a concrete path to fix it.

## What It Is
The test pyramid describes the ideal ratio of three test types, stacked by cost and confidence:

At the base, **unit tests** test a single function or class in isolation, with all dependencies mocked or stubbed. They run in milliseconds, cost nothing in infrastructure, and give you fast feedback. You should have the most of these.

In the middle, **integration tests** test how two or more real components work together: your service against a real database, your API handler with real Redis, your payment service against a sandbox Stripe account. They are slower (seconds to minutes) and require real infrastructure, but they catch the bugs that unit tests miss — wrong SQL queries, TypeORM misconfiguration, Redis key expiry logic.

At the top, **E2E tests** (end-to-end) drive a real browser through a real user flow: sign up, subscribe, log in, change settings. They are the most expensive, most brittle, and slowest. You should have the fewest of these, covering only your most critical flows.

The pyramid ratio for a typical SaaS: 70% unit, 20% integration, 10% E2E. Most teams get the pyramid upside down — they rely entirely on manual testing and a few E2E tests, which is slow, fragile, and gives no fast feedback during development.

For your codebase, the highest-value first tests are integration tests on `AuthService.login` and `AuthService.register` — the services that gate all user access — followed by unit tests on your Zod schemas and pure utility functions.

## Key Concepts
- **Unit test** — tests one function; all external dependencies are mocked; fast, cheap, high volume
- **Integration test** — tests a real component against real infrastructure (test DB, test Redis); slower but higher confidence
- **E2E test** — drives the full application through a browser or HTTP client; slowest, most brittle, highest confidence for happy paths
- **Test double** — umbrella term for mocks, stubs, fakes, and spies
- **Mock** — replaces a dependency and records what it was called with (verification-oriented)
- **Stub** — replaces a dependency with a fixed return value (state-oriented)
- **Fake** — a working simplified implementation (e.g., an in-memory database)
- **Test isolation** — each test should set up and tear down its own state; no shared mutable state between tests

## Example Code
```typescript
// ── Setting up Vitest (faster than Jest for TypeScript projects) ─────────────
// npm install -D vitest @vitest/coverage-v8 supertest

// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { branches: 70, functions: 70, lines: 80 },
    },
  },
});

// tests/setup.ts — shared setup across all test files
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { DataSource } from 'typeorm';

let testDs: DataSource;

beforeAll(async () => {
  testDs = new DataSource({
    type: 'postgres',
    url: process.env.SYSTEM_DATABASE_URL,
    entities: ['modules/**/entities/*.entity.ts'],
    synchronize: true,   // create test schema on connect
    dropSchema: true,    // start fresh on every test run
  });
  await testDs.initialize();
});

afterAll(async () => {
  await testDs?.destroy();
});

// ── Unit test: AuthService.login ─────────────────────────────────────────────
// tests/unit/auth.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AuthService from '@/modules/auth/auth.service';
import bcrypt from 'bcrypt';

// Stub the TypeORM DataSource — no real DB needed for unit tests
const mockFindOne = vi.fn();
vi.mock('@/libs/typeorm', () => ({
  getSystemDataSource: vi.fn().mockResolvedValue({
    getRepository: () => ({ findOne: mockFindOne }),
  }),
}));

describe('AuthService.login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a SafeUser when credentials are valid', async () => {
    const hashedPassword = await bcrypt.hash('correct-password', 10);

    mockFindOne.mockResolvedValue({
      userId: 'user-001',
      email: 'alice@example.com',
      password: hashedPassword,
      isEmailVerified: true,
    });

    const result = await AuthService.login({
      email: 'alice@example.com',
      password: 'correct-password',
    });

    expect(result.user.email).toBe('alice@example.com');
    expect(result.user).not.toHaveProperty('password');  // SafeUser strips the password
  });

  it('throws with a generic message when user does not exist', async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(
      AuthService.login({ email: 'nobody@example.com', password: 'x' }),
    ).rejects.toThrow('Invalid email or password');
  });

  it('throws with a generic message when password is wrong', async () => {
    const hashedPassword = await bcrypt.hash('real-password', 10);
    mockFindOne.mockResolvedValue({
      userId: 'u2', email: 'bob@example.com', password: hashedPassword,
    });

    await expect(
      AuthService.login({ email: 'bob@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('Invalid email or password');
  });

  // Security test: ensure error messages are identical for both failure modes
  // Attackers use different error messages to enumerate valid email addresses
  it('returns the same error message for missing user and wrong password', async () => {
    mockFindOne.mockResolvedValue(null);
    const err1 = await AuthService.login({ email: 'a@b.com', password: 'x' })
      .catch((e: Error) => e.message);

    const hashed = await bcrypt.hash('real', 10);
    mockFindOne.mockResolvedValue({ userId: 'u1', email: 'a@b.com', password: hashed });
    const err2 = await AuthService.login({ email: 'a@b.com', password: 'wrong' })
      .catch((e: Error) => e.message);

    expect(err1).toBe(err2);
  });
});

// ── Integration test: registration flow with real DB ────────────────────────
// tests/integration/auth.register.test.ts
import { describe, it, expect } from 'vitest';
import AuthService from '@/modules/auth/auth.service';
import { getSystemDataSource } from '@/libs/typeorm';

describe('AuthService.register (integration)', () => {
  it('creates a user and returns a SafeUser without password field', async () => {
    const result = await AuthService.register({
      email: `test+${Date.now()}@example.com`,  // unique per run
      password: 'StrongPass1!',
    });

    expect(result.user.userId).toBeTruthy();
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws when the email is already registered', async () => {
    const email = `duplicate+${Date.now()}@example.com`;
    await AuthService.register({ email, password: 'Pass1!' });

    await expect(
      AuthService.register({ email, password: 'Pass2!' }),
    ).rejects.toThrow();
  });
});
```

## When to Use
1. **Write unit tests first for all pure logic** — Zod schema validation, AuthMessages constants, password hashing utilities, token generation — these are zero-dependency, take 5 minutes to write, and run in < 1ms.
2. **Write integration tests for every service method** — `AuthService.login`, `AuthService.register`, `TenantService.provisionPersonal`, payment provider `createCheckoutSession` — these are where real bugs hide.
3. **Write E2E tests for the three or four most critical user flows** — sign up → verify email → log in → subscribe. Use Playwright. These are expensive to maintain; keep the count small and the coverage targeted.
4. **Write regression tests immediately after fixing a bug** — every time you fix a bug, write a test that would have caught it. This prevents regressions.
5. **Write tests before any major refactoring** — you want to refactor `AuthService` to use DI? Write tests first so you know the refactored version is still correct.

## Common Mistakes
- **Skipping integration tests because "unit tests cover it"** — unit tests with mocked DBs cannot find wrong SQL queries, missing indexes, or TypeORM configuration bugs. You need both.
- **Sharing state between tests** — if test B passes only when test A runs first, your tests are order-dependent and will randomly fail in CI. Use `beforeEach` to reset state.
- **Over-mocking everything** — if your unit test mocks 8 out of 9 dependencies, it is testing the test setup, not the code. Either reduce the mock surface or write an integration test.
- **Not running tests in CI** — local tests that never run in CI are eventually ignored. Item 60 shows you how to add `npm test` as a required CI step.

## Further Reading
- Vitest documentation: https://vitest.dev/
- Martin Fowler — Test Pyramid: https://martinfowler.com/articles/practical-test-pyramid.html
- Testing JavaScript with Kent C. Dodds: https://testingjavascript.com/
