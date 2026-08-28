# 128. Clean Code Basics — Naming, Function Size, Readability

## What It Is
Clean code isn't a style preference — it's an investment in the next person reading the code, who is usually you in six months with no memory of the context. The core practices are unglamorous but compound: names that reveal intent (`activeSubscriptions`, not `data` or `temp`), functions that do one thing at one level of abstraction, and control flow that reads top-to-bottom instead of nesting five levels deep.

Guard clauses are the single highest-leverage habit here: instead of wrapping the "happy path" in a pyramid of nested `if`s, handle the exceptional/early-exit cases first and return, leaving the main logic unindented and linear. Comments should explain *why*, not *what* — a comment restating what the next line obviously does is noise; a comment explaining a non-obvious constraint (a workaround for a specific bug, a business rule that isn't derivable from the code) is valuable.

## Key Concepts
- **Intention-revealing names**: a name should answer what it holds/does without needing a comment
- **Single responsibility at the function level**: one function, one job, one level of abstraction inside it
- **Guard clauses over nested conditionals**: handle edge cases early and return, keep the main path flat
- **Magic numbers/strings**: extract to a named constant the moment the meaning isn't obvious from context
- **Comments explain why, not what**: if removing the comment wouldn't confuse a reader, it wasn't needed
- **Consistent conventions**: one casing style, one file-organization pattern, applied uniformly within a codebase

## Example Code
```typescript
// Before: nested conditionals, magic numbers, unclear names
function proc(u: any) {
  if (u) {
    if (u.age >= 18) {
      if (u.status === 1) {
        return u.balance * 0.05;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }
  return 0;
}

// Only the three fields this calculation reads — a function should not demand
// a whole domain object to answer a narrow question.
type User = {
  age: number;
  status: number;
  balance: number;
};

// After: guard clauses, named constant, intention-revealing names
const ACTIVE_STATUS = 1;
const INTEREST_RATE = 0.05;
const MINIMUM_AGE = 18;

function calculateMonthlyInterest(user: User | null): number {
  if (!user) return 0;
  if (user.age < MINIMUM_AGE) return 0;
  if (user.status !== ACTIVE_STATUS) return 0;

  return user.balance * INTEREST_RATE;
}
```

## When to Use
- Every day, especially before opening a pull request — a five-minute self-review catches most of this
- Code review — "I had to re-read this three times" is a specific, actionable comment; use it
- Refactoring inherited/legacy code — improving names and flattening conditionals is often lower-risk than restructuring classes

## Common Mistakes
- Premature abstraction — extracting a "reusable" helper for logic used exactly once, adding indirection with no payoff
- **A clever chained one-liner replaces three readable lines, and every future reader has to stop and decode it** — Clever one-liners that save two lines but cost thirty seconds of re-reading every time someone touches the file
- **The same file uses `userId`, `user_id`, and `uid` for the same concept in three different functions** — Inconsistent naming conventions within the same file (`userId` here, `user_id` there, `uid` somewhere else)
- **`// increment i` sits directly above `i++`, saying nothing the code doesn't already say** — Comments that restate the code (`// increment i` above `i++`) instead of explaining a non-obvious constraint

## Further Reading
- "Clean Code" by Robert C. Martin — read the naming/functions chapters critically; some later advice (e.g. on comments, classes) is debated
- Kent Beck — "Implementation Patterns" (a more measured take on the same territory)
- Sandi Metz's "rules" essay — deliberately extreme constraints as a teaching tool, not a mandate
