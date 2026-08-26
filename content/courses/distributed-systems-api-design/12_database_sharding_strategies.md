# 12. Database Sharding Strategies

## Coverage Level
**Not Covered** — Your boilerplate separates tenant databases (a form of vertical partitioning by tenant), which is an excellent foundation. But there is no horizontal sharding within a tenant's dataset, and the system database has no sharding strategy for high-cardinality tables like events, sessions, or audit logs.

## What It Is
Sharding is the practice of horizontally partitioning data across multiple independent database instances (shards), where each shard holds a subset of the total dataset. Unlike replication (where every node has all the data), sharding means each node has only a portion. This allows you to scale write throughput and storage beyond what a single server can handle.

The critical decision is the **shard key** — the field used to determine which shard a row belongs to. A good shard key distributes data evenly (no hotspots), allows most queries to target a single shard (avoiding fan-out), and rarely needs to change. `tenantId` is an excellent shard key for a multi-tenant SaaS: all tenant data is co-located on one shard, queries are naturally scoped, and cross-tenant queries (which are rare) are the only fan-out case. `userId` works well for user-data tables. Timestamp-based sharding (range sharding by month) is common for append-heavy tables like events and logs.

The uncomfortable truth about sharding is that it forces you to give up most of what makes relational databases convenient: JOINs across shards are impossible (or very expensive), foreign key constraints can't span shards, and distributed transactions require 2PC or sagas. Most SaaS applications don't need sharding at all — a well-indexed single PostgreSQL primary can handle hundreds of thousands of users. The point of learning this topic is to recognize the signals that indicate you're approaching the limit, and to know that your current per-tenant database architecture already gives you one dimension of horizontal scale for free.

## Key Concepts
- **Shard key**: The field used to route data to a specific shard; choosing it wrong means re-sharding later, which is painful
- **Range sharding**: Shards hold contiguous key ranges (e.g., tenantId A–M on shard 1, N–Z on shard 2); simple but prone to hotspots on the high end
- **Hash sharding**: Apply a hash function to the shard key; even distribution but range queries fan out to all shards
- **Directory-based sharding**: A lookup service maps each key to its shard; flexible but the lookup service is a single point of failure
- **Consistent hashing**: A hash ring where adding/removing shards redistributes only a fraction of data; used by Cassandra, DynamoDB
- **Hotspot**: A shard that receives disproportionately more traffic — often caused by a bad shard key (e.g., using `createdAt` as a shard key means all inserts go to the latest shard)
- **Cross-shard query (fan-out)**: A query that must execute on multiple shards and merge results; avoid these in hot paths
- **Rebalancing**: Moving data between shards when one shard becomes too large; operationally expensive

## Example Code
```typescript
// Illustrating tenant-based sharding — conceptually matching your per-tenant DB architecture
// This shows a shard router that maps tenantId → DataSource

interface ShardConfig {
  id: string;
  connectionString: string;
  tenantIdRange: [number, number]; // For range-based assignment
}

const SHARDS: ShardConfig[] = [
  { id: 'shard-1', connectionString: process.env.SHARD_1_URL!, tenantIdRange: [0, 999] },
  { id: 'shard-2', connectionString: process.env.SHARD_2_URL!, tenantIdRange: [1000, 1999] },
  { id: 'shard-3', connectionString: process.env.SHARD_3_URL!, tenantIdRange: [2000, 2999] },
];

// Map of shardId → connection pool (initialized lazily)
const shardConnections = new Map<string, PrismaClient>();

function getShardForTenant(tenantSequentialId: number): ShardConfig {
  const shard = SHARDS.find(
    (s) => tenantSequentialId >= s.tenantIdRange[0] && tenantSequentialId <= s.tenantIdRange[1]
  );
  if (!shard) throw new Error(`No shard found for tenant ID ${tenantSequentialId}`);
  return shard;
}

function getDbForTenant(tenantSequentialId: number): PrismaClient {
  const shard = getShardForTenant(tenantSequentialId);
  if (!shardConnections.has(shard.id)) {
    shardConnections.set(
      shard.id,
      new PrismaClient({ datasourceUrl: shard.connectionString })
    );
  }
  return shardConnections.get(shard.id)!;
}

// Usage: completely transparent to the business logic
async function getTenantUsers(tenantId: string, tenantSeqId: number) {
  const db = getDbForTenant(tenantSeqId);
  return db.user.findMany({ where: { tenantId } });
}

// ─── Hash-based sharding for an events/audit log table ───
// When you have one large table that needs to be split across shards

function hashShardKey(key: string, shardCount: number): number {
  // FNV-1a hash — fast and well-distributed
  let hash = 2166136261;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = (hash * 16777619) >>> 0; // 32-bit unsigned
  }
  return hash % shardCount;
}

async function insertAuditEvent(tenantId: string, event: AuditEvent) {
  const shardIndex = hashShardKey(tenantId, SHARDS.length);
  const shard = SHARDS[shardIndex];
  const db = shardConnections.get(shard.id)!;
  return db.auditEvent.create({ data: { ...event, tenantId } });
}

// Fan-out query: must query all shards (avoid in hot paths)
async function getRecentEventsAcrossAllTenants(since: Date): Promise<AuditEvent[]> {
  const results = await Promise.all(
    SHARDS.map((shard) =>
      shardConnections.get(shard.id)!.auditEvent.findMany({
        where: { createdAt: { gte: since } },
      })
    )
  );
  return results.flat().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}
```

## When to Use
- When a single PostgreSQL primary can no longer handle your write throughput (typically 10,000+ writes/second sustained) — this is a very high bar; most SaaS never reaches it
- When your dataset size exceeds the storage capacity of a single server (multi-TB datasets with hot data that can't be archived)
- When you need geographic distribution — tenant data must live in a specific region (data residency laws); your per-tenant database architecture is already a form of this
- When you're designing an append-heavy table (events, logs, metrics) that will grow indefinitely — consider PostgreSQL table partitioning (not full sharding) as a lighter-weight first step

## Common Mistakes
- **Sharding prematurely**: Most SaaS applications at $1M ARR don't need sharding; PostgreSQL with proper indexing and a read replica handles enormous scale; sharding adds enormous operational complexity for a problem you likely don't have
- **Using a timestamp as the shard key**: All inserts go to the "latest" shard, which becomes a hotspot while all other shards are idle
- **Forgetting about cross-shard JOINs**: If you shard users and they have foreign keys to other tables in a different shard, you've lost referential integrity — this must be handled in application code
- **Conflating sharding with partitioning**: PostgreSQL table partitioning (`PARTITION BY RANGE`) splits one logical table into multiple physical storage files within a single database instance — much simpler than sharding, and often sufficient for large append-only tables

## Further Reading
- **"Designing Data-Intensive Applications" by Martin Kleppmann** — Chapter 6 covers partitioning (sharding) in depth; explains consistent hashing, hot spots, and secondary indexes on sharded data
- **PostgreSQL documentation — "Table Partitioning"** — Explains RANGE, LIST, and HASH partitioning within a single database; consider this before full sharding
- **"How Notion Sharded Their Postgres" (Notion Engineering blog)** — A detailed real-world account of when and how a production SaaS chose to shard; excellent signal for recognizing the right time to make the decision
