# 124. Writing Your First Unit Tests — Assertions & Mocking Basics

## What It Is
A unit test verifies one small piece of behavior in isolation, structured as Arrange (set up inputs/state) → Act (call the thing) → Assert (check the outcome). The "in isolation" part is what makes it a *unit* test rather than an integration test: any collaborator that talks to the outside world (a database, an API, the filesystem) gets replaced with a test double so the test is fast, deterministic, and only fails when the unit itself is wrong.

Test doubles aren't all the same thing, and conflating them causes confusion: a **stub** returns canned data with no verification; a **mock** additionally asserts it was called correctly; a **fake** is a lightweight working implementation (an in-memory array standing in for a database); a **spy** wraps a real implementation just to record how it was called. Most day-to-day testing needs stubs and fakes far more than it needs mocks — over-mocking makes tests assert on *implementation* instead of *behavior*, so they break on every refactor even when the behavior didn't change.

## Key Concepts
- **AAA pattern**: Arrange, Act, Assert — keeps a test readable as a mini-specification
- **Unit vs integration boundary**: a unit test replaces I/O-touching collaborators; an integration test lets some or all of them be real
- **Test doubles**: stub (canned response), mock (canned response + call verification), fake (working lightweight substitute), spy (wraps the real thing to observe)
- **Test independence**: no test should depend on another test's side effects or run order
- **Naming as specification**: `it("throws when the email is already registered")` documents behavior, not just labels a function

## Example Code
```typescript
// A pure function — no doubles needed, the simplest kind of unit test
function calculateDiscount(subtotalCents: number, percent: number): number {
  if (percent < 0 || percent > 100) throw new Error("percent must be 0-100");
  return Math.round(subtotalCents * (percent / 100));
}

describe("calculateDiscount", () => {
  it("returns 10% of the subtotal", () => {
    expect(calculateDiscount(10000, 10)).toBe(1000); // Arrange is the args, Act is the call, Assert is expect()
  });

  it("throws for an out-of-range percent", () => {
    expect(() => calculateDiscount(10000, 150)).toThrow();
  });
});

// A service with a dependency — use a fake, not a heavy mocking framework
interface UserRepository {
  findByEmail(email: string): Promise<{ id: string } | null>;
}

class FakeUserRepository implements UserRepository {
  constructor(private users: { id: string; email: string }[] = []) {}
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
}

it("rejects registration when email already exists", async () => {
  const repo = new FakeUserRepository([{ id: "1", email: "a@b.com" }]);
  const service = new RegistrationService(repo);
  await expect(service.register("a@b.com", "pw")).rejects.toThrow("already registered");
});
```

Two functions and their tests, running for real. Press Run and read the output —
`npm install` fetches vitest into the page, then the suite executes.

```typescript run project entry=cart.test.ts cmd="npx vitest run"
// cart.ts
export type LineItem = { sku: string; unitPrice: number; qty: number };

// The collaborator that talks to the outside world. In production this reads a
// tax table over the network; in a unit test it gets replaced.
export interface RateSource {
  rateFor(country: string): number;
}

export function subtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
}

export function totalWithTax(items: LineItem[], country: string, rates: RateSource): number {
  const base = subtotal(items);
  return Math.round(base * (1 + rates.rateFor(country)) * 100) / 100;
}

// cart.test.ts
import { describe, expect, it } from 'vitest';
import { subtotal, totalWithTax, type LineItem, type RateSource } from './cart.ts';

// A FAKE, not a mock: a real working implementation, just a tiny one. It makes
// no assertions about how it was called, so a refactor that changes the number
// of lookups does not break these tests.
const fakeRates: RateSource = {
  rateFor: (country) => (country === 'DE' ? 0.19 : 0),
};

const items: LineItem[] = [
  { sku: 'A', unitPrice: 10, qty: 2 },
  { sku: 'B', unitPrice: 5.5, qty: 4 },
];

describe('subtotal', () => {
  it('multiplies each line and sums them', () => {
    expect(subtotal(items)).toBe(42);
  });

  it('is 0 for an empty cart', () => {
    expect(subtotal([])).toBe(0);
  });
});

describe('totalWithTax', () => {
  it('applies the rate the source returns', () => {
    expect(totalWithTax(items, 'DE', fakeRates)).toBe(49.98);
  });

  it('leaves the total alone for a zero-rate country', () => {
    expect(totalWithTax(items, 'US', fakeRates)).toBe(42);
  });
});
```

The tax lookup is replaced with a **fake** — a real, tiny implementation —
rather than a mock. Try it: change `totalWithTax` to call `rateFor` twice and
re-run. The tests still pass, because they assert on the returned total rather
than on how the collaborator was used. A mock asserting "called exactly once"
would have failed on a refactor that changed nothing the caller can observe,
which is the over-mocking trap described above.

## When to Use
- Any function/module with non-trivial branching logic — pure functions first, they're the cheapest tests to write
- A service with an external dependency — use a fake/stub, reach for a full mocking framework only when a fake is impractical
- Bug fixes — write a failing test that reproduces the bug before fixing it, so it can't silently regress

## Common Mistakes
- Testing implementation details (e.g., "was this private method called") instead of observable behavior — breaks on every harmless refactor
- **One test named "user registration" contains fifteen unrelated assertions, and a single failure gives no idea which one broke** — One giant test with many unrelated assertions instead of several small, clearly-named tests
- **The test suite passes when run in one order and fails in another, because a module-level array never gets reset between tests** — Shared mutable state between tests (a module-level array, a `beforeAll` that isn't reset) causing order-dependent failures
- Mocking everything, including simple pure logic — turns the test into a restatement of the implementation instead of a check on behavior

## Further Reading
- Kent C. Dodds — "Testing JavaScript" blog and course
- Martin Fowler — "Mocks Aren't Stubs" (the canonical explanation of test double types)
- [Vitest](https://vitest.dev/) and [Jest](https://jestjs.io/) — the official docs; the mocking chapters are where the real differences show up
