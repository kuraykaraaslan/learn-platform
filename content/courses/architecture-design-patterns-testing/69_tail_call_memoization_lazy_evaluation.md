# 69. Tail Call Optimization, Memoization, Lazy Evaluation

## What It Is
These three techniques address three different performance and correctness problems that arise as your code grows in sophistication.

**Tail Call Optimization (TCO)** solves the stack overflow problem in recursive functions. A "tail call" is a function call that is the very last operation before a function returns — no post-processing of the result. When a recursive function is in tail position, a smart runtime can reuse the current stack frame instead of adding a new one. In theory, TypeScript/Node.js supports TCO for `'use strict'` code. In practice, V8 only partially implements it. The practical solution is converting recursion to iteration or using a trampoline function.

**Memoization** solves redundant computation. If a function is pure (same inputs always produce the same output, no side effects) and expensive, you can cache its results keyed by its arguments. The second call with the same arguments returns the cached result instantly. This is distinct from HTTP caching or Redis caching — memoization is in-process, in-memory, and automatic once you wrap a function.

**Lazy Evaluation** solves the problem of doing work you might not need. In an eagerly evaluated language like JavaScript, `const results = expensiveComputation()` runs immediately whether or not `results` is ever used. Lazy evaluation defers computation until the value is actually needed. In JavaScript, you implement this with functions, `Proxy`, generators, or async iterators.

For your stack, memoization is immediately applicable to permission checking, tenant configuration lookups, and feature flag evaluation — any pure-enough function that is called repeatedly with the same arguments. Lazy evaluation maps directly to async generators for streaming large result sets from your database.

## Key Concepts
- **Tail position** — the call is the very last thing in the function; `return f(n-1)` is tail position; `return f(n-1) + 1` is not (the `+1` happens after)
- **Trampoline** — a loop that executes thunks (zero-argument functions) one at a time; converts deep recursion into a while loop without TCO support
- **Memoization** — cache `(args → result)` in a Map; invalidate when inputs can change; only safe for pure functions
- **Thunk** — a zero-argument function that defers computation: `() => expensiveValue()` instead of `expensiveValue()`
- **Generator** — a function that yields values lazily; `function*`; the iterator only computes the next value when `.next()` is called
- **Async generator** — `async function*`; yields Promises lazily; perfect for streaming database results
- **WeakMap memoization** — use `WeakMap` when keys are objects; keys are garbage-collected when the object is, preventing memory leaks
- **Cache invalidation** — memoization is a footgun if you cache mutable data; always ask "can this input change without changing its identity?"

## Example Code
```typescript
// ── 1. Trampoline: recursion without stack overflow ─────────────────────────
// TCO is unreliable in V8; use a trampoline instead for deep recursion

type Thunk<T> = () => T | Thunk<T>;

function trampoline<T>(fn: Thunk<T>): T {
  let result: T | Thunk<T> = fn;
  while (typeof result === 'function') {
    result = (result as Thunk<T>)();
  }
  return result;
}

// Recursive Fibonacci expressed as a trampoline (handles n=100,000 without stack overflow)
function fibTrampoline(n: number, a = 0, b = 1): number {
  if (n === 0) return a;
  // Return a thunk (closure) instead of recursing directly
  return trampoline(() => fibTrampoline(n - 1, b, a + b));
}

// ── 2. Memoization: cache expensive pure computations ──────────────────────

// Generic memoize — works for synchronous pure functions
function memoize<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => TResult,
): (...args: TArgs) => TResult {
  const cache = new Map<string, TResult>();

  return (...args: TArgs): TResult => {
    const key = JSON.stringify(args);  // simple key; use a better serializer for objects
    if (cache.has(key)) return cache.get(key)!;

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

// Real use case: permission check that is pure given (userId, tenantId, action)
async function checkPermissionRaw(userId: string, tenantId: string, action: string): Promise<boolean> {
  // This hits the DB — expensive if called 50× per request
  const perm = await db.query(
    'SELECT 1 FROM tenant_member_permissions WHERE user_id=$1 AND tenant_id=$2 AND action=$3',
    [userId, tenantId, action],
  );
  return perm.rowCount! > 0;
}

// Memoized version with a request-scoped cache (cleared per request)
const permissionCache = new Map<string, boolean>();

async function checkPermission(userId: string, tenantId: string, action: string): Promise<boolean> {
  const key = `${userId}:${tenantId}:${action}`;
  if (permissionCache.has(key)) return permissionCache.get(key)!;

  const result = await checkPermissionRaw(userId, tenantId, action);
  permissionCache.set(key, result);
  return result;
}

// ── 3. Lazy Evaluation: async generator for large DB result sets ────────────
// Instead of loading 100,000 audit log entries into memory, stream them lazily

async function* streamAuditLogs(
  tenantId: string,
  batchSize = 1000,
): AsyncGenerator<AuditLogRow[]> {
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const batch = await db.query<AuditLogRow>(
      `SELECT * FROM audit_log WHERE tenant_id = $1 ORDER BY created_at LIMIT $2 OFFSET $3`,
      [tenantId, batchSize, offset],
    );

    if (batch.rows.length === 0) {
      hasMore = false;
    } else {
      yield batch.rows;  // caller processes this batch before we fetch the next
      offset += batchSize;
      hasMore = batch.rows.length === batchSize;
    }
  }
}

// Usage: process 100K rows without ever holding them all in memory
async function exportTenantLogs(tenantId: string, writeFn: (rows: AuditLogRow[]) => Promise<void>) {
  for await (const batch of streamAuditLogs(tenantId)) {
    await writeFn(batch);  // write to S3, CSV, etc. batch by batch
  }
}
```

## When to Use
1. **Memoize permission checks** — `checkPermission(userId, tenantId, 'read')` is called many times per request; a request-scoped cache saves dozens of DB round-trips.
2. **Memoize feature flag evaluation** — `isEnabled('new_checkout', ctx)` checks Redis; memoize per request with a 30-second TTL to avoid Redis saturation.
3. **Lazy streaming for exports** — when a tenant requests all their data, stream from the DB in batches via async generators; never load 1M rows into memory.
4. **Trampoline for tree traversal** — if you traverse a tenant permission tree or build a nested menu structure recursively, use a trampoline to avoid stack overflows on deeply nested structures.
5. **Thunks for deferred initialization** — wrap expensive one-time setup (DB connection, S3 client) in a thunk: `const getClient = () => client ?? (client = buildClient())`.

## Common Mistakes
- **Memoizing impure functions** — if `checkPermission` can change because a role was revoked, your memoized result is stale. Always scope memoization to a request or use Redis with a short TTL.
- **Using JSON.stringify as a memoization key for objects** — `JSON.stringify({ a: 1, b: 2 })` and `JSON.stringify({ b: 2, a: 1 })` produce different strings. Sort keys or use a stable serializer.
- **Unbounded memoization caches** — a module-level `new Map()` that grows forever is a memory leak. Use an LRU cache (e.g., `lru-cache` npm package) with a max size.
- **Forgetting that async generators are pull-based** — if you use `for await...of` and break early, the generator's remaining code never runs. If you have cleanup (closing a cursor), use a `try/finally` block inside the generator.

## Further Reading
- MDN — Iterators and Generators: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_Generators
- `lru-cache` npm package for bounded memoization: https://github.com/isaacs/node-lru-cache
- Functional Programming in JavaScript (Kyle Simpson — "Functional-Light JavaScript"): https://github.com/getify/Functional-Light-JS
