# 10. Backward/Forward Compatibility — Schema Evolution

## What It Is
Schema evolution is the discipline of changing your data structures — database schemas, API response shapes, message formats — without breaking existing consumers. Backward compatibility means old consumers can read data written by a newer system. Forward compatibility means new consumers can read data written by an older system. In practice, you need both: your database migration runs first on the new schema, but old application instances may still be running during a rolling deploy, reading and writing data.

The most dangerous moment in any deployment is the overlap window: the new schema is live, but both old and new application versions are running simultaneously. A migration that renames a column from `full_name` to `display_name` will break every old instance that still reads `full_name`. The safe approach is expand-then-contract: (1) add the new column, (2) write to both, (3) backfill, (4) switch reads to the new column, (5) stop writing to the old column, (6) drop the old column — each step as a separate, safe deployment.

In API and message schemas, the same principle applies. The Robustness Principle (Postel's Law) is useful here: be conservative in what you send, liberal in what you accept. A good API consumer ignores unknown fields; a good API producer never removes a field without a deprecation period. Tools like Protobuf, Avro, and JSON Schema (with `additionalProperties: false` removed) encode these rules explicitly. Even without changing your serialization format, applying the expand-then-contract mindset to every Prisma migration prevents a category of production incidents.

## Key Concepts
- **Backward compatibility**: New code can read data written by old code — old records remain readable after a schema change
- **Forward compatibility**: Old code can read data written by new code — crucial during rolling deployments
- **Expand-then-contract**: The safe migration pattern: add before removing, backfill while both exist, then clean up
- **Additive-only changes**: Adding optional fields/columns is always safe; removing or renaming fields breaks consumers
- **Default values**: New required fields must have a default for existing rows; NOT NULL without DEFAULT on an existing table is a blocking migration
- **Blue-green / rolling deployments**: During deployment, both old and new app versions run simultaneously; your schema must be compatible with both
- **Consumer-driven contract testing**: Consumers define what they need from a provider's API; Pact is the standard tool
- **Deprecation workflow**: Mark fields as deprecated in docs/schema, communicate removal timeline, then remove — minimum 1 API version gap

## Example Code
```typescript
// Expand-then-contract migration example for renaming a column
// "full_name" → "display_name" in the users table

// ─── Step 1: Migration — Add new column (backward compatible) ───
// prisma migration SQL:
// ALTER TABLE users ADD COLUMN display_name VARCHAR(255);
// UPDATE users SET display_name = full_name;  -- backfill existing rows
// ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;

// ─── Step 2: App code — Write to BOTH columns during transition ───
async function updateUserDisplayName(userId: string, name: string) {
  await db.$executeRaw`
    UPDATE users
    SET full_name = ${name}, display_name = ${name}
    WHERE id = ${userId}
  `;
  // Old instances read full_name ✓
  // New instances read display_name ✓
}

// ─── Step 3: App code — Read from new column, old column as fallback ───
// This is the "read from new, fall back to old" pattern for the transition period
function resolveDisplayName(user: { display_name?: string; full_name: string }): string {
  return user.display_name ?? user.full_name;
}

// ─── Step 4: After all instances are on new code — drop old column ───
// ALTER TABLE users DROP COLUMN full_name;

// ─────────────────────────────────────────────────────────────────────────
// API response schema evolution: never remove, only add & deprecate

interface UserResponseV1 {
  id: string;
  full_name: string;          // DEPRECATED — remove in v2
  display_name: string;       // NEW — added in this version
  email: string;
}

// Serialize for v1 clients: include BOTH old and new field names
// The row as the ORM hands it back — camelCase properties over snake_case
// columns. Both names exist at once here, which is the whole point of the
// expand phase: nothing may be dropped while old instances are still running.
type DbUser = {
  id: string;
  email: string;
  fullName: string;      // the old column, still written during the transition
  displayName: string;   // the new column
};

function serializeUserV1(user: DbUser): UserResponseV1 {
  return {
    id: user.id,
    full_name: user.displayName,    // backwards compat alias
    display_name: user.displayName, // new canonical name
    email: user.email,
  };
}

// ─────────────────────────────────────────────────────────────────────────
// Message schema evolution with JSON: handle unknown fields gracefully

// BAD: throws if event has new fields your old code doesn't know about
function processBadEvent(event: { type: string; userId: string }) {
  const { type, userId } = event; // fine
  // but if event has { type, userId, tenantId } — TypeScript OK, but
  // strict validators like Zod with .strict() will throw
}

// GOOD: accept known fields, ignore unknown ones
import { z } from 'zod';

const UserCreatedEventSchema = z.object({
  type: z.literal('UserCreated'),
  userId: z.string(),
  email: z.string(),
  // No .strict() — future fields (tenantId, etc.) are silently ignored
}).passthrough(); // explicitly allow extra fields → forward compatible

function processGoodEvent(rawEvent: unknown) {
  const event = UserCreatedEventSchema.parse(rawEvent); // safe
  // New producers can add fields; this consumer won't break
}
```

## When to Use
- Every Prisma migration that modifies an existing column (rename, type change, add NOT NULL) — apply expand-then-contract
- When removing or renaming an API response field that external clients or webhook consumers depend on
- When publishing events to a message queue that multiple consumers read — schema changes break all consumers simultaneously without a compatibility strategy
- When deploying with zero-downtime rolling deployments — old and new instances overlap, so both must handle the schema state

## Common Mistakes
- **`NOT NULL` without `DEFAULT` on an existing table**: PostgreSQL must validate every existing row at migration time — this locks the table; always provide a DEFAULT or backfill first
- **Removing fields in the same migration that adds replacements**: The expand step (add new) and the contract step (remove old) must be separate deployments with at least one full deploy cycle in between
- **`.strict()` on Zod schemas for incoming event/message data**: Makes your consumer brittle against any new field the producer adds; remove `.strict()` from external message schemas
- **Assuming migrations are instantaneous**: Long-running migrations (backfills on large tables) hold locks; use `pg_repack` or batched background updates for tables with millions of rows

## Further Reading
- **"Designing Data-Intensive Applications" by Martin Kleppmann** — Chapter 4 (Encoding and Evolution) is the definitive treatment of schema evolution for both storage and messaging
- [**"Evolutionary Database Design" by Martin Fowler & Pramod Sadalage](https://martinfowler.com)** — The original article on expand-then-contract and the full catalog of database refactoring patterns; free online
- **Prisma documentation — "Customizing migrations"** — Covers how to write custom SQL in Prisma migrations, which is necessary for multi-step expand-then-contract migrations that Prisma's auto-generator can't express
