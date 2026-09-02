# 411. Spring Boot: Flyway Migrations and Zero-Downtime Schema Changes

## What It Is
Schema evolution in this Spring Boot stack is owned entirely by Flyway, never by Hibernate's `ddl-auto`. This is a deliberate architectural choice: Hibernate can infer a schema from your entity annotations and apply it automatically, but that inference is invisible, unreviewable, and impossible to roll back in a controlled way — exactly the properties you don't want for something as consequential as a production schema change. Flyway inverts the relationship: you write the SQL by hand, commit it as a versioned file, and Flyway applies pending migrations in order on application startup, tracking exactly which ones have run in a metadata table. `spring.jpa.hibernate.ddl-auto` is set to `validate` — Hibernate checks that the entities match the schema Flyway produced, and fails fast at startup if they've drifted apart, but it never writes DDL itself.

The file naming convention is load-bearing, not cosmetic: `V{14-digit-timestamp}__{PascalCaseDescription}.sql`, with exactly two underscores separating the version from the description. Flyway checksums every migration it has already applied, and modifying a committed migration file — even a whitespace change — causes a checksum mismatch and a hard startup failure in any environment that already ran it. The fix for "I need to change something I already migrated" is always a new migration file, never an edit to an old one. A `R__` prefix (repeatable migration) is the one exception, reserved for views, stored procedures, and seed data that are meant to re-apply whenever their content changes.

For schema changes on a table with live traffic, a single migration that adds a `NOT NULL` column outright will lock or fail against existing rows. The safe sequence is: add the column nullable with no default, deploy code that writes to it going forward, backfill existing rows in batches (a separate script or migration), then add the `NOT NULL` constraint once every row is filled — and only drop an old column in a later migration, after every code reference to it is gone. This zero-downtime discipline is what separates a migration strategy that works in a side project from one that works against a table nobody can afford to lock.

```quiz
- q: "You spot a typo in a migration that has already run in staging. Fix it in place?"
  anchor: "any change to an already-run file causes a startup failure everywhere that file has executed"
  options:
    - text: "Yes — it never reached production, so no harm done"
      correct: false
      why: "It ran in staging, and staging will now fail to start on the checksum mismatch."
    - text: "No — write a new migration; the checksum makes an in-place edit fatal"
      correct: true
      why: "Flyway checksums applied migrations, and any change fails startup everywhere the file has executed."
    - text: "Yes, after deleting the `flyway_schema_history` row by hand"
      correct: false
      why: "That hides the divergence instead of resolving it, and the environments now differ silently."

- q: "What is Hibernate's role in schema changes here?"
  anchor: "Hibernate checks the schema matches, Flyway is the only thing that changes it"
  options:
    - text: "It applies the entity changes, and Flyway records them"
      correct: false
      why: "Inverted. Flyway owns schema changes; Hibernate never makes them."
    - text: "None — `ddl-auto: validate` means it only checks that the schema matches"
      correct: true
      why: "Flyway is the only thing that changes the schema."
    - text: "It creates tables in test, and Flyway handles production"
      correct: false
      why: "Test databases run the same Flyway migrations, through TestContainers."

- q: "You need a new `NOT NULL` column with a backfill. How many migrations, across how many deploys?"
  anchor: "add nullable (no default) → deploy writer code → backfill in batches → add `NOT NULL` → drop the old column in a later migration"
  options:
    - text: "One — add the column with a default and backfill in the same statement"
      correct: false
      why: "That is exactly the all-in-one-step case the sequence exists to replace."
    - text: "Several, across multiple deploys — nullable, writer code, batched backfill, then `NOT NULL`"
      correct: true
      why: "And any old column is dropped in a later migration again, never in this one."
    - text: "Two — add it nullable, then immediately alter it to `NOT NULL`"
      correct: false
      why: "The writer deploy and the batched backfill both have to land in between."
```

## Key Concepts
- **Flyway owns schema changes; Hibernate never does**: `spring.jpa.hibernate.ddl-auto: validate` — Hibernate checks the schema matches, Flyway is the only thing that changes it
- **Migration filename format**: `V{yyyyMMddHHmmss}__{PascalCaseDescription}.sql` — 14-digit timestamp, double underscore, no exceptions
- **Migrations run automatically on startup**: Flyway applies every pending versioned migration, in order, before the application context finishes initializing
- **Never edit a committed migration**: Flyway checksums applied migrations; any change to an already-run file causes a startup failure everywhere that file has executed — write a new migration instead
- **Repeatable migrations (`R__` prefix)**: for views, stored procedures, and seed data that should re-run whenever the file's content changes, applied after all versioned migrations
- **Zero-downtime column changes**: add nullable (no default) → deploy writer code → backfill in batches → add `NOT NULL` → drop the old column in a later migration, never all in one step
- **Never rename a column or drop one still referenced by running code** in a single migration — both require a multi-step, multi-deploy sequence
- **Test databases mirror production schema exactly**: TestContainers runs the same Flyway migrations at test startup — never H2 in-memory, which doesn't support Postgres-specific features and gives false confidence

## Example Code
```sql
-- src/main/resources/db/migration/V20260504120000__AddEmailVerifiedAtToUsers.sql
-- Step 1 of a zero-downtime column addition: nullable, no default, safe on a live table
ALTER TABLE users
    ADD COLUMN email_verified_at TIMESTAMP NULL;
```

```sql
-- V20260504130000__CreateTenantMembersTable.sql
CREATE TABLE tenant_members (
    member_id   UUID        NOT NULL DEFAULT gen_random_uuid(),
    tenant_id   UUID        NOT NULL REFERENCES tenants(tenant_id),
    user_id     UUID        NOT NULL REFERENCES users(user_id),
    member_role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    joined_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
    PRIMARY KEY (member_id),
    UNIQUE (tenant_id, user_id)
);

CREATE INDEX idx_tenant_members_tenant_id ON tenant_members(tenant_id);
CREATE INDEX idx_tenant_members_user_id   ON tenant_members(user_id);
```

```sql
-- V20260601090000__BackfillEmailVerifiedAt.sql
-- Step 3: backfill existing rows in batches (illustrative — a real backfill may run outside a single migration)
UPDATE users SET email_verified_at = created_at WHERE email_verified_at IS NULL;
```

```sql
-- V20260615090000__MakeEmailVerifiedAtNotNull.sql
-- Step 4: constraint added only after every row is backfilled
ALTER TABLE users
    ALTER COLUMN email_verified_at SET NOT NULL;
```

```yaml
# application.yml — Flyway owns schema, Hibernate only validates
spring:
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    locations: classpath:db/migration
```

```java
// TestContainers — real Postgres + real Flyway migrations, never H2
@TestConfiguration
public class TestDatabaseConfig {
    @Bean
    @ServiceConnection
    PostgreSQLContainer<?> postgres() {
        return new PostgreSQLContainer<>("postgres:16-alpine");   // Flyway runs on startup, same as prod
    }
}
```

## When to Use
- Any change to an `@Entity` class's schema — write the Flyway migration in the same commit as the entity change, never rely on Hibernate to infer it
- Adding a `NOT NULL` column to a table with live traffic — always the four-step nullable → backfill → constrain → (later) drop-old-column sequence, never a single migration
- Discovering a bug in an already-applied migration — write a new migration that corrects it; editing the old file breaks Flyway's checksum in every environment that already ran it
- Setting up integration tests for anything touching the database — use TestContainers with the same Flyway migrations as production, not H2 or a hand-maintained test schema

## Common Mistakes
- **Setting `ddl-auto: update` "temporarily" in dev** — this lets the schema silently drift from what Flyway tracks, and the drift surfaces as a confusing failure the moment `validate` catches it in a shared environment.
- **Editing a migration file that has already run somewhere** — Flyway's checksum validation will fail startup in every environment where the old checksum was recorded; always add a new migration instead.
- **Adding a `NOT NULL` column with no default directly to a live table** — this either fails outright (existing rows violate the constraint) or requires a full-table rewrite/lock; use the nullable → backfill → constrain sequence.
- **Renaming a column referenced by running code in one migration** — this breaks any instance still running the old code during a rolling deploy; add the new column, migrate reads/writes, then drop the old one in a later migration.
- **Testing against H2 in-memory instead of the real database engine** — H2 doesn't support Postgres-specific types, functions, or constraints, and passing tests there can hide bugs that only appear against real Postgres.

## Further Reading
- Flyway documentation — "Migrations": https://documentation.red-gate.com/fd/migrations-184127470.html
- Testcontainers — "Database containers": https://testcontainers.com/modules/postgresql/
- PlanetScale — "Safe database migrations" (zero-downtime patterns, engine-agnostic): https://planetscale.com/blog/safely-making-database-schema-changes

```recall
- q: "Give the migration filename format."
  must:
    - "`V{yyyyMMddHHmmss}__{PascalCaseDescription}.sql`"
    - "a 14-digit timestamp, a double underscore, and no exceptions"

- q: "What are repeatable migrations for?"
  must:
    - "the `R__` prefix"
    - "views, stored procedures and seed data that should re-run whenever the file's content changes"
    - "applied after all versioned migrations"

- q: "Why TestContainers rather than H2?"
  must:
    - "test databases mirror the production schema exactly by running the same Flyway migrations at test startup"
    - "H2 in-memory does not support Postgres-specific features and gives false confidence"
```
