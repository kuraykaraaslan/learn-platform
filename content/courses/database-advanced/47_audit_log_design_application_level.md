# 47. Audit Log Design — Application-Level

## What It Is
An audit log is an append-only record of who did what to which resource and when. At its core it answers four questions: who (actor), what (action), which (resource), when (timestamp). Your implementation answers all four with additional context (IP address, user agent, impersonation metadata). This is the right foundation.

The properties that distinguish a compliance-grade audit log from a simple event log are: immutability (audit records must not be modifiable or deletable, even by admins), completeness (every state-changing operation produces an entry, with no gaps), integrity verification (you can prove that the log has not been tampered with), and queryability (the compliance team can retrieve "all actions by user X between dates Y and Z" without writing custom SQL). Your current implementation handles completeness and queryability reasonably, but immutability and integrity verification are not addressed.

For immutability, the database-level approach is to revoke `UPDATE` and `DELETE` privileges on the audit log table from your application's database user. The application can only `INSERT`. Even if your application is compromised, the attacker cannot erase their tracks. For integrity, append a hash chain: each entry includes a hash of the previous entry, so any deletion or modification of a historical record invalidates all subsequent records' hashes — detectable by a periodic integrity check.

## Key Concepts
- **Append-only** — Audit records are inserted, never updated or deleted; enforced at the database permission level, not just application logic
- **Immutability via DB permissions** — Application DB user has `INSERT` only on audit log tables; `UPDATE` and `DELETE` are revoked
- **Hash chain** — Each entry includes `previousHash = SHA256(previousEntry)`; tampering with any entry invalidates all subsequent hashes
- **Structured action names** — Consistent naming like `USER_CREATED`, `TENANT_MEMBER_INVITED`, `PAYMENT_CAPTURED` enables programmatic filtering; your `audit_log.enums.ts` should define an exhaustive enum
- **JSONB metadata** — Captures the diff (before/after values) or relevant context without requiring schema changes per event type
- **Retention policy** — Compliance standards (GDPR, PCI-DSS) specify minimum and maximum retention periods; implement automated archival
- **Impersonation flagging** — Your `actorType` and JWT impersonation metadata already support this; every action taken during impersonation should be visibly attributed to the impersonator
- **Query interface** — A structured API for retrieving audit records: filter by actor, action, resource, tenant, date range; essential for support and compliance teams

## Example Code
```typescript
// ─── What you have (solid foundation) ────────────────────────────────────
// modules/audit_log/entities/audit_log.entity.ts (your existing structure)
// AuditLog: auditLogId, actorId, actorType, action, resourceType, resourceId,
//           metadata (JSONB), ipAddress, userAgent, createdAt
// TenantAuditLog: same + tenantId

// ─── Upgrade 1: Immutability via DB permissions ───────────────────────────
// Run these as a superuser migration, NOT as your app's DB user:
/*
  -- Revoke UPDATE and DELETE from the application user
  REVOKE UPDATE, DELETE ON audit_logs FROM app_user;
  REVOKE UPDATE, DELETE ON tenant_audit_logs FROM app_user;

  -- app_user retains INSERT and SELECT
  -- Admins can still query; no one can modify

  -- Optional: prevent even the table owner from deleting (requires superuser)
  CREATE RULE no_delete_audit AS ON DELETE TO audit_logs DO INSTEAD NOTHING;
  CREATE RULE no_update_audit AS ON UPDATE TO audit_logs DO INSTEAD NOTHING;
*/

// ─── Upgrade 2: Hash chain for tamper detection ──────────────────────────
import crypto from 'crypto';

interface AuditLogEntry {
  auditLogId: string;
  action: string;
  actorId?: string;
  resourceId?: string;
  metadata?: unknown;
  createdAt: Date;
  previousHash?: string;
  entryHash?: string;
}

function computeEntryHash(entry: Omit<AuditLogEntry, 'entryHash'>): string {
  const canonical = JSON.stringify({
    auditLogId: entry.auditLogId,
    action: entry.action,
    actorId: entry.actorId ?? null,
    resourceId: entry.resourceId ?? null,
    metadata: entry.metadata ?? null,
    createdAt: entry.createdAt.toISOString(),
    previousHash: entry.previousHash ?? 'GENESIS',
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export class AuditLogService {
  static async log(params: {
    actorId?: string;
    actorType: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: unknown;
    ipAddress?: string;
    tenantId?: string;  // if present, writes to tenant DB; else system DB
  }): Promise<void> {
    const ds = params.tenantId
      ? await getTenantDataSource(params.tenantId)
      : await getSystemDataSource();

    const repo = ds.getRepository(AuditLog);

    // Get the hash of the most recent entry for the hash chain
    const latest = await repo.findOne({
      where: params.tenantId ? { tenantId: params.tenantId } as any : {},
      order: { createdAt: 'DESC' },
    });

    const auditLogId = crypto.randomUUID();
    const entry = {
      auditLogId,
      action: params.action,
      actorId: params.actorId,
      resourceId: params.resourceId,
      metadata: params.metadata,
      createdAt: new Date(),
      previousHash: latest?.entryHash ?? 'GENESIS',
    };

    const entryHash = computeEntryHash(entry);

    await repo.save({
      ...entry,
      actorType: params.actorType,
      resourceType: params.resourceType,
      ipAddress: params.ipAddress,
      entryHash, // store for next entry's previousHash
    });
  }

  // ─── Integrity verification (run as a scheduled check) ─────────────────
  static async verifyIntegrity(ds: DataSource, limit = 1000): Promise<{ valid: boolean; firstTamperedId?: string }> {
    const entries = await ds.getRepository(AuditLog).find({
      order: { createdAt: 'ASC' },
      take: limit,
    });

    let previousHash = 'GENESIS';
    for (const entry of entries) {
      const expected = computeEntryHash({ ...entry, previousHash });
      if (entry.entryHash !== expected) {
        return { valid: false, firstTamperedId: entry.auditLogId };
      }
      previousHash = entry.entryHash!;
    }

    return { valid: true };
  }
}

// ─── Structured query API ─────────────────────────────────────────────────
export async function queryAuditLog(params: {
  tenantId?: string;
  actorId?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}) {
  const ds = params.tenantId
    ? await getTenantDataSource(params.tenantId)
    : await getSystemDataSource();

  return ds.getRepository(AuditLog)
    .createQueryBuilder('log')
    .where(params.actorId ? 'log.actorId = :actorId' : '1=1', { actorId: params.actorId })
    .andWhere(params.action ? 'log.action = :action' : '1=1', { action: params.action })
    .andWhere(params.resourceId ? 'log.resourceId = :resourceId' : '1=1', { resourceId: params.resourceId })
    .andWhere(params.startDate ? 'log.createdAt >= :start' : '1=1', { start: params.startDate })
    .andWhere(params.endDate ? 'log.createdAt <= :end' : '1=1', { end: params.endDate })
    .orderBy('log.createdAt', 'DESC')
    .skip(((params.page ?? 1) - 1) * (params.pageSize ?? 50))
    .take(params.pageSize ?? 50)
    .getManyAndCount();
}
```

## When to Use
- Every state-changing operation (create, update, delete, permission change, login, payment) should produce an audit entry
- Any operation involving impersonation: the audit log is the paper trail that makes impersonation safe
- Before enterprise sales: enterprise customers will ask "can I export an audit log of all actions in my workspace?" — your existing implementation can answer yes
- Add immutability (DB permission revocation) before any compliance certification; it is a one-line SQL change that should have been there from day one

## Common Mistakes
- **Logging in the same transaction as the operation** — If the transaction rolls back, the audit entry rolls back too; you miss logging the failed attempt; log audit entries in a separate transaction or a dedicated queue
- **Not logging failures** — A failed login attempt is more valuable than a successful one from a security monitoring perspective
- **Including raw secrets in metadata** — Never log passwords, tokens, or PII in the audit metadata; log the action and non-sensitive identifiers only
- **Forgetting impersonation attribution** — When an admin impersonates a user, the audit log should show both the impersonator and the target user; your JWT payload already carries this information

## Further Reading
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
- [Designing audit logs for compliance (AWS)](https://docs.aws.amazon.com/prescriptive-guidance/latest/logging-monitoring-for-application-owners/logging-best-practices.html)
- [Hash chains and tamper evidence in audit logs](https://csrc.nist.gov/publications/detail/sp/800-92/final)
