# 74. TDD Cycle — Red/Green/Refactor in Practice

## What It Is
Test-Driven Development is a programming technique — not a testing technique — where you write a failing test before you write any production code. The cycle has three phases:

**Red** — write a test for behavior that does not exist yet. The test must fail for the right reason (not a syntax error or import problem, but because the feature is not implemented). This step forces you to think about the public interface of your code before writing the internals.

**Green** — write the minimum code needed to make the test pass. Minimum means exactly that: if the test passes with `return 42`, write `return 42`. This sounds absurd, but it trains you to write only what you need and to trust the tests to define the requirements.

**Refactor** — with the test passing (green), clean up the implementation without changing behavior. Extract a function, rename a variable, remove duplication. The test suite is your safety net: if refactoring breaks anything, a test fails immediately.

The real benefit of TDD is not the tests themselves — it is the design pressure. When a function is hard to test, it is usually hard to test because it has too many dependencies, too many responsibilities, or too much hidden state. TDD surfaces these design problems before they harden into production code. The functions in your codebase that are hardest to test today (because they directly import TypeORM, directly call Redis, etc.) are also the hardest to change without risk — those two things are the same problem.

```quiz
- q: "`return 42` passes your entire test suite. What does TDD tell you to do?"
  anchor: "add another test case that forces a more general solution"
  options:
    - text: "Write the real implementation — the tests have served their purpose"
      correct: false
      why: "Then the code stops being driven by tests, which was the part TDD was doing for you."
    - text: "Add a test case that `return 42` cannot satisfy"
      correct: true
      why: "That is triangulation: forcing generality with another example rather than by intention."
    - text: "Delete the test — it clearly asserts nothing useful"
      correct: false
      why: "It asserts one true case. What is missing is a second one."

- q: "Which describes outside-in, \"London school\" TDD?"
  anchor: "start with a failing E2E/integration test, then write unit tests to drive the internal design"
  options:
    - text: "Start with unit tests on the smallest pieces and compose upward"
      correct: false
      why: "That is inside-out — the Chicago/Detroit school."
    - text: "Start with a failing E2E or integration test, then drive the internals with unit tests"
      correct: true
      why: "The outer test states what is wanted before any internal design exists."
    - text: "Write every test first, then all of the implementation"
      correct: false
      why: "Neither school does that. The cycle stays red-green-refactor either way."

- q: "You are in the green phase and can already see the general solution. Do you write it?"
  anchor: "write the simplest code that makes the test pass; resist the urge to write more"
  options:
    - text: "Yes — you know it already, and writing it twice is waste"
      correct: false
      why: "Resisting that urge is the instruction. Generality should be forced by the next test, not by foresight."
    - text: "No — write the simplest code that passes and let the next test force more"
      correct: true
      why: "Untested generality is precisely what YAGNI enforcement exists to prevent."
    - text: "Yes, provided you skip the refactor phase afterwards"
      correct: false
      why: "Refactor is where the design improves under passing tests. Skipping it licenses nothing."
```

## Key Concepts
- **Red phase** — write a failing test that describes the desired behavior; the failure must be meaningful
- **Green phase** — write the simplest code that makes the test pass; resist the urge to write more
- **Refactor phase** — improve the code with the safety of passing tests; all tests must remain green
- **Triangulation** — when the simplest implementation (e.g., `return 42`) still passes all tests, add another test case that forces a more general solution
- **Outside-in TDD** — start with a failing E2E/integration test, then write unit tests to drive the internal design; used in "London school" TDD
- **Inside-out TDD** — start with unit tests on the smallest pieces, compose them up; used in "Chicago/Detroit school" TDD
- **YAGNI enforcement** — TDD prevents adding code that has no test coverage; if no test requires it, it should not be there
- **Test as specification** — a well-written test reads like a spec; `describe('AuthService.login') > it('rejects wrong password')` is executable documentation

## Example Code
```typescript
// Walkthrough: adding a "maximum login attempts" feature to AuthService via TDD

// ── CYCLE 1: Red ─────────────────────────────────────────────────────────────
// Write the test FIRST, before any implementation.
// Test describes behavior: after 5 failed attempts, account is locked.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

// This import will fail (module doesn't have this method yet) — that's the RED
// import { AuthService } from '@/modules/auth/auth.service';

describe('AuthService — brute force protection', () => {
  const mockRedis = { incr: vi.fn(), expire: vi.fn(), get: vi.fn(), del: vi.fn() };

  vi.mock('@/lib/redis', () => ({ default: mockRedis }));
  vi.mock('@/lib/typeorm', () => ({
    getSystemDataSource: vi.fn().mockResolvedValue({
      getRepository: () => ({
        findOne: vi.fn().mockResolvedValue({
          userId: 'u1',
          email: 'a@b.com',
          password: 'hashed',
        }),
      }),
    }),
  }));

  beforeEach(() => vi.clearAllMocks());

  // RED: this test fails because the method doesn't exist yet
  it('locks the account after 5 failed login attempts', async () => {
    mockRedis.get.mockResolvedValue('5');  // simulate 5 prior failures

    await expect(
      AuthService.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toThrow('Account temporarily locked');
  });

  it('increments failure counter on each failed attempt', async () => {
    mockRedis.get.mockResolvedValue('2');
    mockRedis.incr.mockResolvedValue(3);
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

    await expect(
      AuthService.login({ email: 'a@b.com', password: 'wrong' }),
    ).rejects.toThrow();

    expect(mockRedis.incr).toHaveBeenCalledWith('login_attempts:a@b.com');
  });

  it('clears the failure counter on successful login', async () => {
    mockRedis.get.mockResolvedValue('3');
    vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

    await AuthService.login({ email: 'a@b.com', password: 'correct' });

    expect(mockRedis.del).toHaveBeenCalledWith('login_attempts:a@b.com');
  });
});

// ── CYCLE 1: Green ────────────────────────────────────────────────────────────
// Now write the minimum code to make the tests pass.
// modules/auth/auth.service.ts — add to the existing login method:

/*
static async login({ email, password }) {
  const key = `login_attempts:${email.toLowerCase()}`;

  // GREEN: check lock first
  const attempts = parseInt(await redis.get(key) ?? '0');
  if (attempts >= 5) throw new Error('Account temporarily locked');

  const ds = await getSystemDataSource();
  const user = await ds.getRepository(UserEntity).findOne({ where: { email } });
  if (!user) throw new Error(AuthMessages.INVALID_EMAIL_OR_PASSWORD);

  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    // GREEN: increment counter with TTL
    await redis.incr(key);
    await redis.expire(key, 15 * 60);  // 15-minute window
    throw new Error(AuthMessages.INVALID_EMAIL_OR_PASSWORD);
  }

  // GREEN: clear counter on success
  await redis.del(key);
  return { user: SafeUserSchema.parse(user) };
}
*/

// ── CYCLE 1: Refactor ─────────────────────────────────────────────────────────
// Tests are green. Now clean up:
// - Extract constants: MAX_LOGIN_ATTEMPTS = 5, LOCKOUT_TTL_SECONDS = 900
// - Extract a method: checkRateLimit(email) and recordFailure(email)
// - All tests remain green throughout

// ── TRIANGULATION example ─────────────────────────────────────────────────────
// If your initial "green" implementation hardcoded the number 5:
// const LOCKED = attempts >= 5; // hardcoded
// Add a test that unlocks after the window expires to force a real implementation:

it('allows login again after the lockout window expires', async () => {
  mockRedis.get.mockResolvedValue(null);  // TTL expired, key gone
  vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

  const result = await AuthService.login({ email: 'a@b.com', password: 'correct' });
  expect(result.user).toBeTruthy();
  // This forces the implementation to rely on Redis TTL, not a hardcoded state machine
});
```

## When to Use
1. **Adding new features to existing code** — TDD prevents the "I'll write tests later" pattern; write the test, watch it fail, then implement.
2. **Bug fixes** — write a test that reproduces the bug (it will be red), then fix the bug (green). You now have a regression test that ensures the bug never returns.
3. **Designing new APIs** — TDD forces you to think about the caller's perspective first. If the test is awkward to write, the API design is awkward for callers.
4. **Refactoring with confidence** — never refactor without a green test suite first. If you do not have tests, write them before refactoring.
5. **Learning a new domain** — writing tests forces you to understand the expected behavior precisely before implementing it; useful when working in an unfamiliar business domain.

## Common Mistakes
- **Writing tests after the code** — this is testing, not TDD. Without the Red phase, you lose the design pressure and you tend to write tests that reflect what the code does rather than what it should do.
- **Not doing the Refactor phase** — TDD without refactoring is just writing tests first; the clean design comes from the refactor step. If you skip it, code quality degrades over time.
- **Making the Red phase pass by accident** — if your first test passes without any implementation, the test is either testing the wrong thing or too weak. Make sure it fails for the right reason.
- **Big steps** — writing 50 lines of implementation to pass a test is not the TDD cycle; write the minimum, verify green, then proceed. Small steps give you a safety net at every moment.

## Further Reading
- Kent Beck — "Test-Driven Development: By Example" (the definitive book, uses Java but fully transferable)
- Ian Cooper — "TDD, Where Did It All Go Wrong?" (YouTube, 2013): the most important talk on applying TDD correctly
- Vitest documentation (the test runner recommended for this stack): https://vitest.dev/

```recall
- q: "Name the three phases and what each one requires."
  must:
    - "red — write a failing test describing the desired behavior, and the failure must be meaningful"
    - "green — write the simplest code that makes it pass, resisting the urge to write more"
    - "refactor — improve the code under passing tests, and all tests must stay green"

- q: "Contrast outside-in and inside-out TDD."
  must:
    - "outside-in starts with a failing E2E or integration test, then unit tests drive the internal design — the London school"
    - "inside-out starts with unit tests on the smallest pieces and composes them upward — the Chicago/Detroit school"

- q: "What is YAGNI enforcement in TDD, and what does test-as-specification mean?"
  must:
    - "TDD prevents adding code that has no test coverage — if no test requires it, it should not be there"
    - "a well-written test reads like a spec"
    - "`describe('AuthService.login') > it('rejects wrong password')` is executable documentation"
```
