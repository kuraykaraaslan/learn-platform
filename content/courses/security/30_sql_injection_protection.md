# 30. SQL Injection Protection

## What It Is
SQL injection is the vulnerability class where user-controlled input is concatenated into a SQL string and interpreted by the database engine as SQL syntax rather than data. The canonical example is `email = '' OR 1=1 --` turning a login query into one that always returns true. It has been on the OWASP Top 10 for over 20 years because it is easy to introduce and catastrophic when exploited: a successful injection gives an attacker read access to all tables, often write access, and sometimes operating system access via `xp_cmdshell` or `COPY TO/FROM`.

Parameterized queries — also called prepared statements — prevent injection by separating the SQL structure from the data. The database driver sends the SQL template and the parameter values as separate protocol messages. The database engine compiles the query plan using the template, then binds the parameter values purely as data. There is no code path where the parameter value can alter the query structure. Both Prisma and TypeORM use this mechanism for every standard query method (`findOne`, `create`, `update`, repository methods, etc.).

The gap that remains after adopting an ORM is raw query usage. Prisma's `$queryRaw` and `$executeRaw`, and TypeORM's `query()` and `createQueryBuilder()`, can both be used correctly (with parameters) or incorrectly (with string concatenation). These are the only places in an ORM-driven codebase where SQL injection is still possible, and they deserve the same level of scrutiny you would give any security-critical code.

## Key Concepts
- **Parameterized query** — SQL template with `$1`, `?`, or `:name` placeholders; values passed separately as an array/object, never interpolated
- **Prepared statement** — A query sent to the server for compilation before values are bound; provides both security and performance benefits
- **ORM query builder** — High-level API that generates parameterized SQL under the hood; covers ~95% of CRUD needs safely
- **`$queryRaw` (Prisma)** — Tagged template literal `Prisma.sql\`...\`` is safe; plain string with template literals is not
- **`createQueryBuilder` (TypeORM)** — `.where('email = :email', { email })` is safe; `.where(\`email = '${email}'\`)` is not
- **`LIKE` injection** — `%` and `_` in user input alter LIKE pattern behavior; sanitize wildcard characters before using in LIKE clauses
- **Second-order injection** — Data stored safely but later used in a dynamic query without re-parameterization; rare with ORMs but possible in raw queries
- **Column/table name injection** — Parameterization only protects values, not identifiers; dynamic column/table names must use an allowlist

## Example Code
```typescript
// Everything below starts from untrusted request values. Naming them once
// makes the point of the whole lesson visible: the SAFE and UNSAFE versions
// receive exactly the same input.
const { email: userInput, tenantId, actorId, action } = req.body as {
  email: string;
  tenantId: string;
  actorId: string;
  action: string;
};

// ─── SAFE: Standard ORM methods — fully parameterized ──────────────────────

// Prisma — safe
const user = await prisma.user.findFirst({
  where: { email: userInput }, // parameterized automatically
});

// TypeORM — safe
const user = await repo.findOne({ where: { email: userInput } });

// ─── SAFE: Raw queries with proper parameterization ────────────────────────

// Prisma raw — use tagged template literal (Prisma.sql), NEVER string concat
import { Prisma } from '@prisma/client';

const result = await prisma.$queryRaw<{ count: bigint }[]>(
  Prisma.sql`SELECT COUNT(*) as count FROM users WHERE tenant_id = ${tenantId}`
  //         ^^^ tagged template: Prisma wraps each ${} as a bound parameter
);

// TypeORM raw — use named parameters
const result = await dataSource.query(
  `SELECT * FROM audit_logs WHERE actor_id = $1 AND action = $2`,
  [actorId, action] // parameters passed separately — safe
);

// TypeORM QueryBuilder — use :param syntax
const logs = await dataSource
  .getRepository(AuditLog)
  .createQueryBuilder('log')
  .where('log.actorId = :actorId', { actorId }) // safe
  .andWhere('log.action = :action', { action })  // safe
  .getMany();

// ─── DANGEROUS: What NOT to do ─────────────────────────────────────────────

// Prisma — DO NOT concatenate into a raw template string
// const result = await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
// ^^^ $queryRawUnsafe with user input = SQL injection

// TypeORM — DO NOT interpolate into the where string
// repo.createQueryBuilder().where(`email = '${email}'`) // UNSAFE

// ─── LIKE injection mitigation ─────────────────────────────────────────────

function escapeLikePattern(input: string): string {
  // Escape PostgreSQL LIKE special characters: % _ \
  return input.replace(/[%_\\]/g, '\\$&');
}

async function searchUsersByName(nameQuery: string) {
  const safe = escapeLikePattern(nameQuery);
  return await prisma.user.findMany({
    where: {
      name: { contains: safe }, // Prisma wraps this in LIKE '%safe%'
    },
  });
}

// ─── Column name allowlist (dynamic ORDER BY) ─────────────────────────────

const ALLOWED_SORT_COLUMNS = ['createdAt', 'email', 'name'] as const;
type SortColumn = typeof ALLOWED_SORT_COLUMNS[number];

function validateSortColumn(col: string): SortColumn {
  if (!ALLOWED_SORT_COLUMNS.includes(col as SortColumn)) {
    throw new Error(`Invalid sort column: ${col}`);
  }
  return col as SortColumn;
}

// Safe: column name comes from an allowlist, not raw user input
const sortCol = validateSortColumn(req.query.sort as string);
const users = await prisma.user.findMany({ orderBy: { [sortCol]: 'asc' } });
```

## When to Use
- Always — parameterized queries should be the default and raw query concatenation should be treated as a code smell that requires a comment justifying it
- When adding a search or filter feature: audit the query construction path end-to-end
- When reviewing PRs: flag any `$queryRawUnsafe`, `.query(...)` with template literals, or `.where(\`...\`)` with interpolated variables
- When adding a dynamic sort/filter API endpoint: implement an explicit allowlist for column names before touching the query builder

## Common Mistakes
- **Using `$queryRawUnsafe` for convenience** — Prisma's `$queryRaw` tagged template is equally convenient and completely safe; there is almost never a reason to use `Unsafe`
- **Forgetting LIKE wildcards** — Your app allows user search input? `%` in the search term alters the pattern without being an injection vulnerability, but it is still unintended behavior
- **Dynamic ORDER BY without an allowlist** — `ORDER BY ${req.query.sort}` is injection even with an ORM; the parameterization only applies to values, not SQL keywords and identifiers
- **Trusting previously sanitized data** — Second-order injection: a value stored safely from input A is later used in a raw query for operation B without re-parameterization; trace every raw query's inputs to their source

## Further Reading
- [Prisma raw queries and SQL injection](https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access#sql-injection)
- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [TypeORM QueryBuilder documentation](https://typeorm.io/select-query-builder)
