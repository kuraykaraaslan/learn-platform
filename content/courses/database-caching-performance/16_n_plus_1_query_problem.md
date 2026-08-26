# 16. N+1 Query Problem

## Coverage Level
**Not Covered** — There is no query logging, no query count instrumentation, and no mention of eager loading strategies in your codebase. In a multi-tenant app where listing endpoints return collections of related objects, N+1 queries are almost certainly present and silently degrading performance.

## What It Is
The N+1 query problem occurs when code fetches a list of N items (1 query), then for each item individually fetches related data (N additional queries) — producing N+1 total database round trips. The result is functionally correct but catastrophically inefficient: fetching 50 tenants with their owners fires 51 queries instead of 1. At small scale, this is invisible. At moderate scale (a page that returns 100 records), it adds hundreds of milliseconds of unnecessary DB round trips.

The insidious thing about N+1 is that it looks correct in code reviews and tests. A `for` loop that calls `db.user.findUnique()` for each item in a list will work perfectly in your development environment with 5 users, but will hammer your database in production with 500. ORMs like Prisma make it easy to accidentally introduce N+1: accessing a relation on a model without pre-loading it triggers a lazy query per item in many ORM patterns.

The fix is almost always **eager loading** — telling the ORM to fetch related data in the initial query using JOINs or a second bulk query. In Prisma, this means using `include` or `select` with nested relations. In some cases, the correct fix is a **DataLoader** (batch loader): collect individual IDs from a request cycle, issue one batched query, and fan results back. DataLoader is the standard solution for GraphQL resolvers but is equally applicable to REST endpoints with complex relational data.

## Key Concepts
- **N+1 query**: 1 query to fetch a list, N queries to fetch related data per item — total N+1 round trips
- **Eager loading**: Pre-fetching related data in the initial query (via JOIN or a second bulk query) — Prisma's `include`
- **Lazy loading**: Fetching related data only when accessed — triggers per-item queries; often the root cause of N+1
- **DataLoader**: A batching and caching utility that collects individual load requests, batches them into one query, and fans results back
- **Query count assertion**: A test assertion that checks a code path issues no more than N queries — catches N+1 regressions before they reach production
- **`EXPLAIN ANALYZE`**: PostgreSQL command that shows the actual execution plan and query count; run this on your slow endpoints
- **Select only what you need**: Fetching all columns (`SELECT *`) when you need 3 columns wastes bandwidth and cache memory
- **JOIN vs two queries**: For large datasets, a single JOIN can be slower than two targeted queries; profile before assuming a JOIN is always better

## Example Code
```typescript
// ─── PROBLEM: N+1 in disguise ───
async function listTenantMembersNPlus1(tenantId: string) {
  const members = await db.tenantMember.findMany({ where: { tenantId } });
  // 1 query ✓

  const result = await Promise.all(
    members.map(async (member) => {
      const user = await db.user.findUnique({ where: { id: member.userId } });
      // N queries — one per member ✗
      return { ...member, user };
    })
  );
  return result;
  // For 50 members: 51 DB round trips
}

// ─── FIX 1: Eager loading with Prisma include ───
async function listTenantMembersEager(tenantId: string) {
  return db.tenantMember.findMany({
    where: { tenantId },
    include: {
      user: {
        select: { id: true, email: true, displayName: true }, // only needed fields
      },
    },
    // Prisma issues 2 queries: one for members, one bulk SELECT for all related users
    // NOT a JOIN — Prisma uses a batched second query for relations
  });
  // For 50 members: 2 DB round trips
}

// ─── FIX 2: DataLoader for batching across concurrent requests ───
// Useful when the same user might appear in multiple concurrent queries
// (common in GraphQL resolvers, also useful in complex REST handlers)

import DataLoader from 'dataloader';

// Create one DataLoader per request (not per-app — must not cache across requests)
function createUserLoader(db: PrismaClient) {
  return new DataLoader<string, User | null>(async (userIds) => {
    const users = await db.user.findMany({
      where: { id: { in: [...userIds] } },
    });
    // DataLoader requires results in the same order as keys
    const userMap = new Map(users.map((u) => [u.id, u]));
    return userIds.map((id) => userMap.get(id) ?? null);
  });
}

// In a Next.js API route handler, create the loader once per request
export async function GET(req: NextRequest) {
  const userLoader = createUserLoader(db);
  const members = await db.tenantMember.findMany({ where: { tenantId: '...' } });

  // These all batch into ONE query, regardless of how many members:
  const users = await Promise.all(members.map((m) => userLoader.load(m.userId)));
  return NextResponse.json(members.map((m, i) => ({ ...m, user: users[i] })));
}

// ─── Query count test (using Prisma's $on event logging) ───
async function assertQueryCount(
  db: PrismaClient,
  label: string,
  expectedMax: number,
  fn: () => Promise<void>
) {
  let count = 0;
  const listener = () => count++;
  db.$on('query', listener);
  await fn();
  db.$off('query', listener);

  if (count > expectedMax) {
    throw new Error(`${label}: expected ≤${expectedMax} queries, got ${count}`);
  }
}

// Usage in a test:
// await assertQueryCount(db, 'listTenantMembers', 2, () => listTenantMembersEager(tenantId));
```

## When to Use
- Before optimizing any slow listing endpoint — profile query count first; N+1 is often the culprit
- During code review — any `map` + `await db.entity.findUnique` pattern inside a loop is a red flag
- When writing integration tests for read endpoints — assert a maximum query count to prevent regression
- In any endpoint that returns a list with related entities (members with users, sessions with tenants, posts with authors)

## Common Mistakes
- **Fixing N+1 with `Promise.all` (parallel N queries)**: `Promise.all(items.map(id => db.user.findUnique(...)))` still fires N queries in parallel — faster than sequential, but still N queries; use `include` or batch with `findMany({ where: { id: { in: ids } } })` instead
- **Over-including relations**: Fixing N+1 by `include`-ing everything results in huge payloads and slow JOIN-heavy queries; select only the fields and relations the endpoint actually uses
- **No query logging in development**: Without Prisma's query logging or a tool like Prisma Studio, N+1 problems are invisible; add `log: ['query']` to your dev PrismaClient to see every query
- **Assuming Prisma's `include` uses JOINs**: Prisma uses a batched second query, not a JOIN, for relations; this means two queries, not N+1 — but for very large datasets, a raw SQL JOIN might be more efficient

## Further Reading
- **Prisma documentation — "Select fields and include relations"** — Explains how Prisma batches included relations and how to use `select` to minimize data transfer
- **"The N+1 Problem" by Dataloader GitHub README (github.com/graphql/dataloader)** — The DataLoader README explains batching and caching clearly; applies equally to REST and GraphQL
- **"Solving the N+1 Problem in Rails" by thoughtbot** — Though Rails-specific, the conceptual explanation is language-agnostic and includes clear diagrams; the SQL patterns translate directly to PostgreSQL
