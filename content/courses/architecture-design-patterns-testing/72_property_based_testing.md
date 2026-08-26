# 72. Property-Based Testing (fast-check, Hypothesis)

## Coverage Level
**Not Covered** — The project has zero test files. Property-based testing is an advanced testing technique, but it is especially powerful for validating Zod schemas, data transformation functions, and invariants that hold across all inputs — exactly the kind of logic your boilerplate has.

## What It Is
Traditional (example-based) testing is: you think of specific inputs, compute the expected output, write the assertion. The weakness is that you only test the cases you think of. If you did not think of an empty string, `null`, a very large number, or a string with Unicode surrogate pairs, you did not test those cases.

Property-based testing inverts this. Instead of writing specific examples, you describe **properties** — invariants that must hold for all possible inputs — and the framework generates hundreds or thousands of random inputs automatically. If any input violates the property, the framework reports the minimal failing example (this process is called "shrinking").

The canonical example: instead of testing `sort([3,1,2]) === [1,2,3]`, you test two properties: (1) the output array has the same length as the input, and (2) every element is less than or equal to the next element. These properties hold for any array, so the framework can generate thousands of random arrays and verify both properties on each.

For your stack, property-based testing shines on Zod schemas (does the schema accept exactly what it should and reject everything else?), password hashing (does `verify(hash(x), x)` hold for all `x`?), and multi-tenant isolation invariants (does a query for tenant A ever return data from tenant B?).

## Key Concepts
- **Property** — an invariant that must hold for all valid inputs; expressed as a function that returns `true` or throws
- **Arbitrary** — fast-check's term for a generator that produces random values of a specific type
- **Shrinking** — after finding a failing input, the framework automatically reduces it to the smallest input that still fails (e.g., a 10-word string is shrunk to the exact 2-character sequence that causes the bug)
- **Stateful property testing** — generate random sequences of operations (create, update, delete) and verify invariants hold after each step
- **Model-based testing** — run the same operations against your real implementation and a simple reference implementation; verify they agree
- **Hypothesis** — Python's property-based testing library; the inspiration for fast-check
- **`fc.assert`** — fast-check's test runner: takes a property function and runs it with many generated inputs
- **`fc.pre`** — filter out inputs that do not satisfy preconditions; use sparingly as it reduces effective sample size

## Example Code
```typescript
// npm install -D fast-check
import * as fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import bcrypt from 'bcrypt';

// ── Property 1: Password hashing round-trip ─────────────────────────────────
// Property: for any non-empty string s, bcrypt.compare(s, hash(s)) is true
describe('password hashing', () => {
  it('hash → compare round-trip holds for any string', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 72 }),  // bcrypt truncates at 72 bytes
        async (password) => {
          const hash = await bcrypt.hash(password, 10);
          const valid = await bcrypt.compare(password, hash);
          expect(valid).toBe(true);
        },
      ),
      { numRuns: 50 },  // 50 random passwords; bcrypt is slow so keep numRuns low
    );
  });
});

// ── Property 2: Zod schema — accepts valid, rejects invalid ─────────────────
// For any schema, it should parse all values it previously parsed (idempotent),
// and it should consistently reject what it rejects.
const UserCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(255).optional(),
});

describe('UserCreateSchema properties', () => {
  it('valid email always parses successfully', () => {
    fc.assert(
      fc.property(
        // fast-check can generate valid email addresses
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        (email, password) => {
          expect(() => UserCreateSchema.parse({ email, password })).not.toThrow();
        },
      ),
    );
  });

  it('invalid email always fails parsing', () => {
    fc.assert(
      fc.property(
        // Generate strings that are definitely NOT emails
        fc.string({ minLength: 1 }).filter((s) => !s.includes('@')),
        (notAnEmail) => {
          const result = UserCreateSchema.safeParse({ email: notAnEmail, password: 'validpass1' });
          expect(result.success).toBe(false);
        },
      ),
    );
  });

  it('parsed object is idempotent: parsing twice yields the same result', () => {
    fc.assert(
      fc.property(
        fc.emailAddress(),
        fc.string({ minLength: 8, maxLength: 100 }),
        (email, password) => {
          const first  = UserCreateSchema.safeParse({ email, password });
          const second = UserCreateSchema.safeParse({ email, password });
          expect(first.success).toBe(second.success);
          if (first.success && second.success) {
            expect(first.data).toEqual(second.data);
          }
        },
      ),
    );
  });
});

// ── Property 3: Multi-tenant isolation invariant ─────────────────────────────
// Property: querying data for tenant A should never return rows with tenant_id !== A
// This is a stateful property test — run N random queries and check each result
describe('tenant isolation (integration)', () => {
  it('getUsersByTenant never returns users from another tenant', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uuid(),  // random tenantId
        async (tenantId) => {
          const users = await UserService.getByTenantId(tenantId);
          for (const user of users) {
            // Every returned row must belong to the queried tenant
            expect(user.tenantId).toBe(tenantId);
          }
        },
      ),
      { numRuns: 20 },
    );
  });
});

// ── Property 4: Encoding round-trip (useful for token/serialization code) ────
// Property: encode(decode(x)) === x and decode(encode(x)) === x
describe('base64 encoding round-trip', () => {
  it('encode → decode is the identity function for any Buffer', () => {
    fc.assert(
      fc.property(
        fc.uint8Array({ minLength: 0, maxLength: 1024 }),
        (bytes) => {
          const encoded = Buffer.from(bytes).toString('base64');
          const decoded = Buffer.from(encoded, 'base64');
          expect(decoded).toEqual(Buffer.from(bytes));
        },
      ),
    );
  });
});
```

## When to Use
1. **Validating Zod schemas** — property tests catch schema bugs that your manually chosen examples never would: edge-case emails, zero-length strings, Unicode characters, numbers at exact boundary values.
2. **Serialization / deserialization round-trips** — JSON serialization, base64 encoding, JWT encoding, date formatting; the round-trip property (`decode(encode(x)) === x`) is a perfect fit.
3. **Pure business logic with invariants** — billing calculations ("total always equals sum of line items"), permission checks ("deny is always stronger than allow"), rate limiting ("counter never exceeds limit regardless of request ordering").
4. **Data transformation functions** — any `transform(input)` function that has rules the output must obey; express those rules as properties.
5. **Finding edge cases in new features before they ship** — run `fc.assert` with 1,000 iterations against a new service method before writing specific examples; fast-check will surface the weird inputs you did not think of.

## Common Mistakes
- **Using property tests as a substitute for example tests** — property tests find bugs; example tests document expected behavior. Both have a place. Start with examples, add properties for invariants.
- **Checking implementation details in a property** — your property should describe what the result must be, not how it was computed. If your property mirrors your implementation, it will pass for the wrong reasons.
- **Too many `fc.pre` filters** — filtering out 90% of generated values means you are effectively testing a narrow input range; the test looks thorough but is not.
- **Slow `numRuns` without justification** — bcrypt is slow; 1,000 bcrypt rounds per test run takes 15 minutes. Tune `numRuns` based on the cost of each run; use `{ numRuns: 50 }` for expensive operations.

## Further Reading
- fast-check documentation: https://fast-check.dev/
- fast-check — model-based testing guide: https://fast-check.dev/docs/advanced/model-based-testing/
- "Property-Based Testing with PropEr, Erlang, and Elixir" — Fred Hebert (the canonical deep dive, language-agnostic concepts)
