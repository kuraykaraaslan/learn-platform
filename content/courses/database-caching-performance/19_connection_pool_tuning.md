# 19. Connection Pool Tuning (pgBouncer, HikariCP)

## What It Is
A database connection is an expensive resource — PostgreSQL allocates roughly 5–10 MB of memory per connection, and establishing a new connection involves a TCP handshake, authentication, and session setup taking ~10–50ms. Connection pooling maintains a set of pre-established connections that application instances share, amortizing connection overhead and capping the total connection count presented to PostgreSQL.

Prisma has a built-in connection pool (using the Prisma Query Engine). The default `connection_limit` is calculated as `num_physical_cpus * 2 + 1`. For a Next.js app deployed serverlessly (Vercel, Netlify), this is problematic: each serverless function instance creates its own Prisma client with its own pool. With 100 concurrent invocations, you're presenting 100 pools to PostgreSQL — potentially hundreds or thousands of connections. PostgreSQL's default `max_connections` is 100. This is the most common production crisis for serverless Next.js apps.

**pgBouncer** is a connection pooler that sits between your application and PostgreSQL. Application instances connect to pgBouncer (cheap and unlimited), and pgBouncer maintains a small pool of real connections to PostgreSQL. In **transaction mode** (the recommended mode), a real DB connection is borrowed from the pool for the duration of a transaction and then returned. This multiplexes thousands of application connections through a small pool of 10–20 real PostgreSQL connections. The tradeoff in transaction mode is that session-level features (prepared statements, advisory locks, `SET` commands, temporary tables) don't work reliably — they depend on session state that pgBouncer doesn't preserve across transactions.

```quiz
- q: "You put pgBouncer in session mode to fix connection exhaustion. Did it work?"
  anchor: "equivalent to direct connections, no restrictions; doesn't solve the connection count problem"
  options:
    - text: "Yes — pooling is what pgBouncer is for"
      correct: false
      why: "In session mode each client holds one server connection for the whole session, which is equivalent to connecting directly."
    - text: "No — session mode does not reduce the connection count; transaction mode does"
      correct: true
      why: "Transaction mode borrows a server connection per transaction and returns it, at the cost of session-level features."
    - text: "Yes, but only for read queries"
      correct: false
      why: "The mode does not distinguish reads from writes."

- q: "`connection_limit=5` on a serverless function running 50 concurrent instances. How many connections?"
  anchor: "in serverless, multiply by number of concurrent function instances"
  options:
    - text: "5 — the limit applies to the application"
      correct: false
      why: "It is per Prisma client instance, and serverless gives each concurrent invocation its own."
    - text: "Up to 250 — the pool size multiplies by concurrent instances"
      correct: true
      why: "Against PostgreSQL's default `max_connections` of 100, that exhausts the server outright."
    - text: "50 — one connection per instance, whatever the limit says"
      correct: false
      why: "Each instance opens its own pool of up to 5, not a single connection."

- q: "Why not simply raise `max_connections` to 5000?"
  anchor: "each connection uses ~5–10 MB of shared memory"
  options:
    - text: "You can — it is just a configuration ceiling"
      correct: false
      why: "Each connection costs roughly 5-10 MB of shared memory, so 5000 is tens of gigabytes before a single query runs."
    - text: "Each connection costs ~5-10 MB, so the ceiling is really a memory budget"
      correct: true
      why: "Pooling exists because connections are expensive objects, not because the number was picked arbitrarily."
    - text: "PostgreSQL caps it at 100 and ignores larger values"
      correct: false
      why: "100 is the default, not a hard cap."
```

## Key Concepts
- **Connection limit**: The maximum number of real PostgreSQL connections; PostgreSQL's default is 100; each connection uses ~5–10 MB of shared memory
- **Connection pool**: A set of pre-established connections shared across requests; reduces connection overhead
- **Pool exhaustion**: When all connections are in use and a new request can't get one; results in timeout or 500 error
- **pgBouncer session mode**: Each client gets one server connection for the entire session — equivalent to direct connections, no restrictions; doesn't solve the connection count problem
- **pgBouncer transaction mode**: Server connection is borrowed per transaction and returned; solves connection count problem; breaks session-level features
- **Prisma's connection_limit**: The pool size per Prisma client instance; in serverless, multiply by number of concurrent function instances
- **`DATABASE_URL` pool configuration**: Prisma reads pool settings from the connection string: `?connection_limit=5&pool_timeout=30`
- **Prisma Accelerate**: Prisma's managed connection pooler — similar to pgBouncer in transaction mode, deployed as an edge proxy

## Example Code
```typescript
// ─── 1. Prisma connection limit for serverless ───
// In serverless environments, keep connection_limit low (1–3)
// pgBouncer multiplexes the rest

// libs/db.ts — singleton pattern for Next.js (prevents re-creation on hot reload)
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
        // For serverless: connection_limit=2 means each function instance
        // uses at most 2 real connections. With pgBouncer handling the multiplexing,
        // this is sufficient.
        // Append to DATABASE_URL: ?connection_limit=2&pool_timeout=10
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

// DATABASE_URL format with pool settings:
// postgresql://user:pass@pgbouncer-host:6432/dbname?connection_limit=2&pool_timeout=10
//                                         ^^^^^ pgBouncer port, not PostgreSQL's 5432

// ─── 2. pgBouncer configuration (pgbouncer.ini) ───
/*
[databases]
mydb = host=postgres-primary port=5432 dbname=mydb

[pgbouncer]
listen_port = 6432
listen_addr = 0.0.0.0
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt

# Transaction mode: recommended for serverless + Prisma
pool_mode = transaction

# Max real connections to PostgreSQL per database
default_pool_size = 20
max_client_conn = 1000          # How many app connections pgBouncer accepts

# Timeouts
server_connect_timeout = 5
query_timeout = 30
client_idle_timeout = 300

# Required: Prisma uses prepared statements; disable them in transaction mode
# (or use ?pgbouncer=true in the connection string to tell Prisma)
ignore_startup_parameters = extra_float_digits

# In Prisma: set `?pgbouncer=true` in DATABASE_URL to disable prepared statements
# postgresql://user:pass@pgbouncer:6432/db?pgbouncer=true&connection_limit=2
*/

// ─── 3. Monitoring pool health ───
async function checkPoolHealth() {
  // Query pgBouncer admin database for pool stats
  // Connect to pgBouncer on port 6432 with user 'pgbouncer' to the 'pgbouncer' database
  const stats = await pgBouncerAdminClient.query('SHOW POOLS');
  /*
  Interesting columns:
  - cl_active: clients currently executing queries
  - cl_waiting: clients waiting for a connection (bad if consistently > 0)
  - sv_active: server connections in use
  - sv_idle: server connections available
  - sv_used: server connections used and waiting for next query
  */
  const waitingClients = stats.rows.reduce((sum: number, r: any) => sum + r.cl_waiting, 0);
  if (waitingClients > 0) {
    console.warn(`pgBouncer: ${waitingClients} clients waiting for connections — consider increasing pool size`);
  }
}

// ─── 4. Prisma + TypeORM connection limit calculation ───
// Rule of thumb for max_connections in postgresql.conf:
// max_connections = (num_cores * 4) + num_disks
// For a 4-core RDS instance: 16 + 2 disks = 18 real connections
// pgBouncer default_pool_size should be 80% of max_connections
// Prisma connection_limit per instance should be 1-3 when pgBouncer is in front
```

The serverless arithmetic from What It Is. The defaults are the crisis the
lesson describes — Prisma's default `connection_limit` on a 2-CPU instance,
multiplied by 100 concurrent invocations, against PostgreSQL's default
`max_connections` of 100.

```calc
inputs:
  - { id: cpus, label: "Physical CPUs per instance", type: number, default: 2, min: 1 }
  - { id: instances, label: "Concurrent instances (serverless invocations)", type: number, default: 100, min: 1 }
  - { id: max_conn, label: "PostgreSQL max_connections", type: number, default: 100, min: 1 }
  - { id: reserved, label: "Connections reserved for superuser / admin", type: number, default: 3, min: 0 }
outputs:
  - { label: "Prisma default connection_limit per instance", expr: "cpus * 2 + 1", format: number }
  - { label: "Connections presented to PostgreSQL", expr: "instances * (cpus * 2 + 1)", format: number }
  - { label: "Headroom against max_connections", expr: "max_conn - reserved - instances * (cpus * 2 + 1)", format: number }
  - { label: "Connections actually available per instance", expr: "(max_conn - reserved) / instances", format: number }
```

At the defaults the headroom is negative by several hundred, and the last line
is below one — there is not a single connection per invocation to hand out,
let alone five. That is the shape of the problem: no `connection_limit` value
fixes it, because the multiplier is the instance count. A pooler in front of
PostgreSQL is what changes the arithmetic.

## When to Use
- Any time your Next.js app is deployed to a serverless platform (Vercel, Netlify, AWS Lambda) — pgBouncer or Prisma Accelerate is mandatory, not optional
- When you see "Connection pool timeout" errors in production — the pool is exhausted; investigate before increasing limits (the cause might be slow queries holding connections)
- When adding a read replica — each replica needs its own pool configuration
- When running BullMQ workers alongside Next.js API routes — workers need their own pool budget; don't let workers starve API handlers of connections

## Common Mistakes
- **Creating a new PrismaClient on every request**: In Next.js, if you instantiate `new PrismaClient()` at the module level without the singleton pattern, each hot-reload in dev creates a new pool and exhausts connections
- **Using pgBouncer transaction mode with session-level features**: Advisory locks (`pg_advisory_lock`), prepared statements, and `SET` variables require session mode or direct connections; using them in transaction mode causes silent misbehavior
- **Not adding `?pgbouncer=true` to the connection string**: Without this flag, Prisma uses named prepared statements that pgBouncer can't multiplex correctly in transaction mode; always add this flag when using pgBouncer
- **Setting `connection_limit` too high on serverless**: A Vercel app with 200 concurrent functions and `connection_limit=10` presents 2,000 connections to pgBouncer or directly to PostgreSQL; use `connection_limit=1` or `2` on serverless and let the pooler do the multiplexing

## Further Reading
- [**pgBouncer documentation](https://pgbouncer.org)** — The official configuration reference; the FAQ section explains transaction mode limitations clearly
- **Prisma documentation — "Connection management"** — Covers `connection_limit`, `pool_timeout`, serverless deployment recommendations, and the `?pgbouncer=true` flag
- [**"Why your Prisma app is failing in production" by Lee Robinson](https://leerob.io)** — Next.js + Prisma + serverless connection pool exhaustion; walks through the exact problem and solutions including Prisma Accelerate

```recall
- q: "What is pool exhaustion, and what does it look like from outside?"
  must:
    - "all connections are in use and a new request cannot get one"
    - "it results in a timeout or a 500 error"

- q: "How does Prisma read its pool settings?"
  must:
    - "from the connection string: `?connection_limit=5&pool_timeout=30`"

- q: "What is Prisma Accelerate?"
  must:
    - "Prisma's managed connection pooler"
    - "similar to pgBouncer in transaction mode"
    - "deployed as an edge proxy"
```
