# 44. Soft Delete Pattern — Problems and Alternatives

## What It Is
Soft delete is the practice of marking records as deleted (via a `deletedAt` timestamp or `isDeleted` boolean) rather than issuing a `DELETE` statement. The row stays in the database, but queries filter it out. The appeal is obvious: you can undo deletions, audit history is preserved, and foreign key references remain valid. The tradeoff is that you are conflating two distinct states — "this record exists" and "this record has been logically removed" — in a single table.

The problems emerge at scale and across features. First: unique constraints. If a user deletes their account and re-registers with the same email, your unique index on `(email)` will conflict with the soft-deleted row. You need a partial unique index: `UNIQUE (email) WHERE deleted_at IS NULL`. Second: query performance. Every query for active records needs `WHERE deleted_at IS NULL`. If you forget this filter anywhere — and you will, eventually — you expose deleted data. Third: GDPR/KVKK compliance. If a user exercises their right to erasure, soft-deleted records still contain their PII. "Soft deleted" is not "erased."

The alternatives are not "don't soft delete" but "use soft delete deliberately with its implications understood." For compliance, implement a real deletion pipeline that anonymizes or hard-deletes records after a retention period. For unique constraints, use partial indexes. For query reliability, enforce the `deleted_at IS NULL` filter at the ORM model layer, not at the individual query level.

```quiz
- q: "A user deletes their account, then re-registers with the same email. The insert fails. Why?"
  anchor: "your unique index on `(email)` will conflict with the soft-deleted row"
  options:
    - text: "The application is still holding the old session"
      correct: false
      why: "The conflict is at the database level — the soft-deleted row is still a row."
    - text: "The unique index on email still sees the soft-deleted row"
      correct: true
      why: "The fix is a partial unique index: UNIQUE (email) WHERE deleted_at IS NULL."
    - text: "The ORM's global query scope is filtering the insert"
      correct: false
      why: "The global scope filters reads. It is the constraint that rejects this write."

- q: "A user exercises their right to erasure and you soft-delete the record. Is that compliant?"
  anchor: "\"Soft deleted\" is not \"erased.\""
  options:
    - text: "Yes — the record is no longer visible to the application"
      correct: false
      why: "Visibility is not erasure. The soft-deleted row still holds their PII."
    - text: "No — the row still contains their PII, and soft deleted is not erased"
      correct: true
      why: "Anonymization is the pattern that reconciles the two: replace PII with placeholders so the row survives for referential integrity while carrying no personal data."
    - text: "Yes, as long as the row is excluded from backups"
      correct: false
      why: "The live row's contents are the problem, not only the backups."

- q: "What does soft delete conflate, and what does that cost?"
  anchor: "conflating two distinct states — \"this record exists\" and \"this record has been logically removed\" — in a single table"
  options:
    - text: "Read and write paths, which is why it needs a global query scope"
      correct: false
      why: "The global scope is a consequence of the conflation, not the conflation itself."
    - text: "\"This record exists\" and \"this record has been logically removed\", in one table"
      correct: true
      why: "Which is why every query for active records needs WHERE deleted_at IS NULL — and you will forget it somewhere eventually."
    - text: "Current and historical data, which is what the archive table fixes"
      correct: false
      why: "An archive table is one alternative, but the conflation named here is between two states, not two time periods."
```

## Key Concepts
- **Soft delete** — `deletedAt TIMESTAMP NULL` column; `NULL` = active, non-null = deleted; queries filter on `WHERE deletedAt IS NULL`
- **Partial unique index** — `CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL` — allows the same email on a soft-deleted row and an active row simultaneously
- **Global query scope** — ORM-level filter applied to all queries automatically; TypeORM `@DeleteDateColumn` + `find()` automatically adds `WHERE deleted_at IS NULL`
- **Paranoid mode** — Sequelize term for soft delete; the ORM analogue in TypeORM is `@DeleteDateColumn` combined with `softRemove()`
- **Hard delete with archive table** — Alternative: `DELETE` from the main table and `INSERT` into an `archive_users` table; main table stays lean, history preserved separately
- **Anonymization** — For GDPR compliance: replace PII fields with `[deleted]` placeholders; the row stays for referential integrity but contains no personal data
- **Restore** — `softRemove()` counterpart is `restore()`; set `deletedAt = NULL`; requires authorization controls (who can restore?)
- **Cascade behavior** — If a user is soft-deleted, should their sessions, audit logs, and tenant memberships also be soft-deleted? Define and enforce this explicitly

## Example Code
```typescript
// ─── TypeORM soft delete with @DeleteDateColumn ────────────────────────────

import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn, Index
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId!: string;

  @Column({ unique: false }) // NOT unique — partial index handles uniqueness
  email!: string;

  @Column()
  password!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date | null;
}

// Partial unique index — create via migration, not TypeORM decorator
// Migration SQL:
// CREATE UNIQUE INDEX CONCURRENTLY idx_users_email_active
//   ON users (email)
//   WHERE deleted_at IS NULL;

// ─── Service layer with TypeORM soft delete ────────────────────────────────

import { DataSource } from 'typeorm';

export class UserService {
  static async softDelete(userId: string, ds: DataSource): Promise<void> {
    const repo = ds.getRepository(User);
    // Sets deletedAt = NOW(); TypeORM's find() will now exclude this row automatically
    await repo.softRemove(await repo.findOneOrFail({ where: { userId } }));
  }

  static async restore(userId: string, ds: DataSource): Promise<void> {
    const repo = ds.getRepository(User);
    // Requires withDeleted: true to find soft-deleted rows
    const user = await repo.findOne({ where: { userId }, withDeleted: true });
    if (!user) throw new Error('User not found');
    await repo.restore(userId); // Sets deletedAt = NULL
  }

  // Audit query: see all records including soft-deleted
  static async getAllIncludingDeleted(ds: DataSource): Promise<User[]> {
    return ds.getRepository(User).find({ withDeleted: true });
  }
}

// ─── Handling cascades explicitly ──────────────────────────────────────────

export class UserDeletionService {
  static async deleteUserAccount(userId: string, ds: DataSource): Promise<void> {
    await ds.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const sessionRepo = manager.getRepository(UserSession);

      // 1. Hard delete active sessions (no reason to keep them)
      await sessionRepo.delete({ userId });

      // 2. Soft delete tenant memberships (preserve history)
      await manager.softDelete(TenantMember, { userId });

      // 3. Anonymize audit log actor (GDPR: keep the event, remove PII)
      await manager.update(AuditLog, { actorId: userId }, {
        actorId: null,
        actorType: 'DELETED_USER',
      });

      // 4. Soft delete the user record
      await userRepo.softRemove(
        await userRepo.findOneOrFail({ where: { userId } })
      );
    });
  }
}

// ─── Hard-delete with archive — alternative approach ─────────────────────

export class UserArchiveService {
  static async archiveAndDelete(userId: string, ds: DataSource): Promise<void> {
    await ds.transaction(async (manager) => {
      const user = await manager.findOneOrFail(User, { where: { userId } });

      // Copy to archive with PII intact (for legal hold / business records)
      await manager.save(UserArchive, {
        originalUserId: userId,
        email: user.email,
        createdAt: user.createdAt,
        archivedAt: new Date(),
        archivedBy: 'user_request',
      });

      // GDPR erasure: remove PII from the live record before deletion
      // (archive is protected by a separate retention policy)
      await manager.delete(User, { userId });
    });
  }
}
```

## When to Use
- **Soft delete** — Tenant data, documents, projects — anything users might want to recover, or anything that has referential integrity requirements from other tables
- **Hard delete** — Sessions, temporary records, processed job results — data that has no value after its purpose is served
- **Anonymization instead of deletion** — Audit log entries, financial records, anything with regulatory retention requirements where the event must be preserved but the PII must not be
- **Archive table** — When you want the benefits of hard delete (lean main table, no filter overhead) with the benefits of soft delete (data recovery); add a scheduled job to purge the archive after the retention period

## Common Mistakes
- **Unique index on soft-deletable columns** — A `UNIQUE` constraint on `email` will block re-registration after a soft delete; always use partial indexes `WHERE deleted_at IS NULL`
- **`WHERE deleted_at IS NULL` in some queries but not all** — One missed filter in an admin endpoint exposes deleted data; enforce at the ORM model level with `@DeleteDateColumn` so TypeORM handles it automatically
- **Treating soft delete as GDPR compliance** — "Soft deleted" means the data is still in the database; GDPR right to erasure requires actual deletion or anonymization of personal data
- **Growing table size from never cleaning up** — Soft-deleted rows accumulate indefinitely; table scans get slower; implement a scheduled hard-delete or archival job for rows older than your retention period

## Further Reading
- [TypeORM Soft Delete documentation](https://typeorm.io/soft-delete)
- [Partial indexes in PostgreSQL for soft deletes](https://www.postgresql.org/docs/current/indexes-partial.html)
- [GDPR and the right to erasure in a soft-delete world](https://gdpr.eu/right-to-be-forgotten/)

```recall
- q: "Name the three problems soft delete creates at scale."
  must:
    - "unique constraints — a soft-deleted row still conflicts, so you need a partial unique index"
    - "query correctness — every active-record query needs WHERE deleted_at IS NULL, and you will forget it somewhere"
    - "GDPR/KVKK — soft-deleted records still contain PII, and soft deleted is not erased"

- q: "Give the partial unique index, and say what it buys."
  must:
    - "CREATE UNIQUE INDEX ON users (email) WHERE deleted_at IS NULL"
    - "it lets the same email exist on a soft-deleted row and an active row at once"

- q: "Name two alternatives to plain soft delete."
  must:
    - "hard delete with an archive table — DELETE from the main table, INSERT into archive_users"
    - "the main table stays lean while history is preserved separately"
    - "anonymization — replace PII fields with [deleted] placeholders"
    - "the row survives for referential integrity but holds no personal data"

- q: "What has to be decided explicitly about cascade behaviour?"
  must:
    - "whether a soft-deleted user's sessions, audit logs and tenant memberships are also soft-deleted"
    - "the answer has to be defined and enforced, not left implicit"
```
