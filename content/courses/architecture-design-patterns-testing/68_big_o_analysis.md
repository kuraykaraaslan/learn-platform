# 68. Big O Analysis — Analyzing Your Own Code

## What It Is
Big O notation describes how an algorithm's runtime (or memory usage) grows as the input size grows. It is not about how fast an algorithm runs on your machine today — it is about what happens as the data scales. An O(n²) operation that takes 10ms on 100 rows takes 10 seconds on 10,000 rows, not 100ms. That factor is invisible in development and catastrophic in production.

As a developer you already know Big O conceptually. The skill this file addresses is applying it to your own production code, not to textbook sorting algorithms. Every database query you write has a complexity. Every loop over a collection has a complexity. The question is: what is n, and how big can n realistically get?

In a multi-tenant SaaS, n is rarely just "number of rows." It is "number of tenants × number of users per tenant × number of events per user × number of event types." A nested loop that looks harmless with 5 tenants and 10 users each is suddenly O(n²) when you have 500 tenants and 1,000 users each — 500,000 iterations instead of 50.

The practical skill is: (1) identify every loop, recursive call, and database query in a hot path; (2) estimate the worst-case n for each; (3) multiply nested complexities; (4) decide if the result is acceptable or if a different data structure or a database query should replace the loop.

## Key Concepts
- **O(1)** — constant time; hash map lookups, array index access; ideal for hot paths
- **O(log n)** — tree operations, binary search; PostgreSQL B-tree index lookup is effectively O(log n)
- **O(n)** — linear scan; iterating an array, `SELECT * FROM table` without an index
- **O(n log n)** — sorting (`Array.sort`, `ORDER BY` with an index); acceptable for most sizes
- **O(n²)** — nested loops; the most common performance bug in application code
- **Space complexity** — memory usage growth; loading 1M rows into memory to filter them in JavaScript is O(n) space — usually avoidable with a WHERE clause
- **Amortized complexity** — some operations are occasionally expensive but cheap on average; `Array.push` is O(1) amortized despite occasional O(n) resizes
- **n in context** — always ask "what is n in production?" — not the test data size, but the realistic worst case per tenant per day

## Example Code
```typescript
// Analyzing real code patterns from your stack

// ── O(n²) bug: nested loop over tenants and users ────────────────────────────
// Scenario: admin dashboard shows "active users per tenant this week"
// You might write this innocently:

// Only the field the complexity argument turns on: every algorithm below is
// counted in terms of how many times it touches this id.
type Tenant = { id: string };

async function getActiveUsersBad(tenants: Tenant[]): Promise<Map<string, number>> {
  const result = new Map<string, number>();

  // Outer loop: O(n) tenants
  for (const tenant of tenants) {
    // Inner query per tenant: n queries total — this is O(n) queries, not O(1)!
    // If you have 500 tenants, this fires 500 individual SQL queries.
    const count = await db.query(
      `SELECT COUNT(*) FROM user_sessions WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
      [tenant.id],
    );
    result.set(tenant.id, parseInt(count.rows[0].count));
  }

  return result;  // O(n) queries — N+1 problem
}

// O(1) query solution: one SQL query replaces the entire loop
async function getActiveUsersBetter(): Promise<Map<string, number>> {
  const rows = await db.query(`
    SELECT tenant_id, COUNT(DISTINCT user_id) AS active_count
    FROM user_sessions
    WHERE created_at > NOW() - INTERVAL '7 days'
    GROUP BY tenant_id
  `);

  // Build the map in O(n) time with O(n) space — but only 1 DB round-trip
  return new Map(rows.rows.map((r) => [r.tenant_id, parseInt(r.active_count)]));
}

// ── O(n²) in JavaScript: the "find in array" inside a loop anti-pattern ─────
interface Permission { userId: string; action: string }
interface User { id: string; name: string }

// Bad: O(n × m) — for each user, scan the whole permissions array
function getUsersWithPermissionBad(users: User[], permissions: Permission[], action: string) {
  return users.filter((user) =>
    permissions.find((p) => p.userId === user.id && p.action === action) !== undefined
    // Array.find is O(m) and it runs for each of n users → O(n × m)
  );
}

// Better: O(n + m) — pre-build a Set for O(1) lookups
function getUsersWithPermissionBetter(users: User[], permissions: Permission[], action: string) {
  // Build the Set once: O(m)
  const allowedIds = new Set(
    permissions.filter((p) => p.action === action).map((p) => p.userId)
  );

  // Filter users: O(n) with O(1) Set.has() per user
  return users.filter((user) => allowedIds.has(user.id));
}

// ── Measuring actual complexity: count loop iterations ─────────────────────
function analyzePermissions(tenants: Tenant[], usersPerTenant: User[][], permissions: Permission[]) {
  let iterations = 0;

  for (const tenant of tenants) {              // n1 = tenant count
    for (const user of usersPerTenant[0]) {    // n2 = users per tenant
      for (const perm of permissions) {         // n3 = permission count
        iterations++;
        // Three nested loops: O(n1 × n2 × n3)
        // With 100 tenants, 1000 users, 50 permissions: 5,000,000 iterations
      }
    }
  }

  console.log(`Total iterations: ${iterations}`);
}
// Rule: if you have 3 nested loops over collections that grow with user data,
// look for a way to flatten it using a Map/Set or a single SQL query.
```

## When to Use
1. **Before writing any loop over a database result set** — ask "should this loop be a SQL query instead?" Most nested loops over collections are O(n) avoidable queries.
2. **When a feature works fine in dev but is slow in production** — the data in dev is tiny. Run complexity analysis on the dev code and estimate production n.
3. **During code review of data-heavy features** — bulk operations, report generation, batch processing, and import/export features all need complexity scrutiny.
4. **When choosing a data structure** — if you look up by key > once, use a Map (O(1)) not `array.find()` (O(n)). If you test membership > once, use a Set.
5. **For multi-tenant operations** — any operation that touches all tenants multiplies complexity by tenant count. This is the most common source of O(n²) bugs in SaaS.

## Common Mistakes
- **Conflating Big O with benchmark speed** — O(n log n) with a constant of 1000 can be slower than O(n²) with a constant of 1 for n < 100. Big O describes growth, not absolute speed.
- **Ignoring the N+1 query problem** — a loop with a DB query inside is the most common O(n) problem in web apps; it hides because each query is fast, but 500 queries × 20ms = 10 seconds.
- **Sorting when you need a single max/min** — `array.sort()[0]` is O(n log n); `Math.min(...array)` or `array.reduce` is O(n). Use the right tool.
- **Loading all rows to count them in JavaScript** — `const count = (await db.getAll()).length` is O(n) memory. Use `SELECT COUNT(*)` which is O(1) to your application code.

## Further Reading
- Big O Cheat Sheet: https://www.bigocheatsheet.com/
- "Designing Data-Intensive Applications" — Chapter 3 (data structure choices in databases)
- AlgoExpert / LeetCode — practical Big O exercises; even a few dozen problems builds strong intuition
