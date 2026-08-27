# 48. Data Retention and GDPR/KVKK Deletion Flow

## What It Is
GDPR (General Data Protection Regulation, EU) and KVKK (Kişisel Verileri Koruma Kanunu, Turkey) are data protection regulations that grant users rights over their personal data: the right to access what you hold, the right to correct it, and the right to erasure ("right to be forgotten"). As a SaaS serving users from these jurisdictions, these rights are obligations, not suggestions. A user can formally request deletion of their data, and you must respond within a defined timeframe (GDPR: 30 days, KVKK: 30 days with possible extensions) with either confirmation of deletion or a legal basis for retention.

Data retention policy is the flip side: some data must be kept for a minimum period regardless of user requests. Financial records (invoices, payment transactions) must typically be retained for 5-7 years for tax purposes. Audit logs may need to be kept for compliance or security incident investigation. The tension between "delete my data" and "we must keep this for legal reasons" is resolved by separating personal identifiers from the records: you retain the financial record but anonymize the personal data within it.

The operational challenge is that "delete my data" in a multi-tenant SaaS is not a single `DELETE` statement. A user's personal data is spread across: the `users` table, their profile, security settings, session records, social accounts, audit log entries, team memberships, and potentially data they created within tenants (projects, documents, comments). Some of this data belongs to them, some belongs to tenants they were a member of. Building a deletion pipeline that handles all of these correctly, with a documented response to a data subject request, requires explicit design.

## Key Concepts
- **GDPR Article 17 — Right to Erasure** — "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay"
- **Legitimate retention basis** — Legal obligation (tax records), contractual necessity (active subscription), or legitimate interest (fraud prevention) can override erasure requests
- **Data minimization** — Collect only the PII necessary for the stated purpose; less data collected = less data to delete
- **Anonymization** — Replace PII with placeholder values; the record is retained for referential integrity or legal requirements but no longer identifies a natural person
- **Pseudonymization** — Replace direct identifiers with tokens; reversible (with the key); less privacy-protective than anonymization
- **Data Subject Access Request (DSAR)** — A formal user request to see all personal data held; you must respond within 30 days
- **Data Processing Agreement (DPA)** — Contract required when sharing user data with processors (Stripe, SendGrid); your payment providers and email providers should have DPAs with you
- **KVKK** — Turkish equivalent of GDPR; applies to any service processing data of Turkish citizens; same practical requirements as GDPR for most operational purposes

## Example Code
```typescript
// modules/user/user_deletion.service.ts
// Implements the Right to Erasure deletion pipeline

import { DataSource } from 'typeorm';
import crypto from 'crypto';

export interface DeletionReport {
  userId: string;
  requestedAt: Date;
  completedAt: Date;
  stepsCompleted: string[];
  dataRetained: string[]; // with legal basis
}

export class UserErasureService {
  /**
   * Process a GDPR/KVKK erasure request.
   * This is an async operation — queue it as a job for reliability.
   * Each step is idempotent and logged.
   */
  static async processErasureRequest(
    userId: string,
    systemDs: DataSource
  ): Promise<DeletionReport> {
    const report: DeletionReport = {
      userId,
      requestedAt: new Date(),
      completedAt: new Date(),
      stepsCompleted: [],
      dataRetained: [],
    };

    await systemDs.transaction(async (manager) => {
      // Step 1: Revoke all active sessions
      await manager.delete(UserSession, { userId });
      report.stepsCompleted.push('sessions_deleted');

      // Step 2: Delete social accounts (OAuth connections)
      await manager.delete(UserSocialAccount, { userId });
      report.stepsCompleted.push('social_accounts_deleted');

      // Step 3: Remove from all tenant memberships
      await manager.softDelete(TenantMember, { userId });
      report.stepsCompleted.push('tenant_memberships_removed');

      // Step 4: Anonymize audit log entries
      // RETAIN the events (for security audit trail) but remove PII
      await manager.update(
        AuditLog,
        { actorId: userId },
        {
          actorId: null,
          actorType: 'DELETED_USER',
          // ipAddress removed — PII
          ipAddress: null,
          userAgent: null,
        }
      );
      report.stepsCompleted.push('audit_log_anonymized');

      // Step 5: Anonymize the user record (do not delete — referenced by tenant records)
      const anonymizedEmail = `deleted_${crypto.randomBytes(8).toString('hex')}@deleted.invalid`;
      await manager.update(User, { userId }, {
        email: anonymizedEmail,
        password: '', // unusable
        phone: null,
        name: null,
        avatarUrl: null,
        deletedAt: new Date(),
        // Keep: userId (referential integrity), createdAt (needed for business analytics)
      });
      report.stepsCompleted.push('user_record_anonymized');

      // Step 6: Identify data retained with legal basis
      const activeSubscriptions = await manager.count(TenantSubscription, {
        where: { userId, status: 'ACTIVE' },
      });
      if (activeSubscriptions > 0) {
        report.dataRetained.push(
          'subscription_records (legal basis: contractual necessity, tax records — 7 years)'
        );
      }

      const invoices = await manager.count(Invoice, { where: { userId } });
      if (invoices > 0) {
        report.dataRetained.push(
          'payment_invoices (legal basis: legal obligation — tax law requires 5-7 year retention)'
        );
      }
    });

    report.completedAt = new Date();

    // Step 7: Log the erasure event in the audit log
    await AuditLogService.log({
      actorType: 'SYSTEM',
      action: 'USER_ERASURE_COMPLETED',
      resourceType: 'USER',
      resourceId: userId,
      metadata: { stepsCompleted: report.stepsCompleted, dataRetained: report.dataRetained },
    });

    return report;
  }
}

// ─── Data retention schedule: scheduled cleanup job ──────────────────────

export class DataRetentionService {
  /**
   * Scheduled daily: clean up data that has exceeded its retention period.
   * Run via BullMQ with a repeating job.
   */
  static async runRetentionPolicies(): Promise<void> {
    const ds = await getSystemDataSource();

    // 1. Hard-delete sessions expired > 30 days ago
    const sessionCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { affected: sessionsDeleted } = await ds.getRepository(UserSession)
      .createQueryBuilder()
      .delete()
      .where('expires_at < :cutoff', { cutoff: sessionCutoff })
      .execute();

    Logger.info(`[Retention] Deleted ${sessionsDeleted} expired sessions`);

    // 2. Hard-delete anonymized (deleted) user records older than 7 years
    // (after 7 years there is no legal basis to retain even the anonymized record)
    const userCutoff = new Date(Date.now() - 7 * 365 * 24 * 60 * 60 * 1000);
    await ds.getRepository(User)
      .createQueryBuilder()
      .delete()
      .where('deleted_at IS NOT NULL AND deleted_at < :cutoff', { cutoff: userCutoff })
      .execute();
  }
}
```

## When to Use
- Before accepting your first paying EU or Turkish customer — you need a privacy policy, DPA with your processors, and an erasure pipeline
- When adding new PII fields to any entity: document what data is collected, why, and how long it is retained
- When a user contacts you requesting account deletion: do not manually delete rows ad hoc; run the documented pipeline and send the deletion report
- For compliance certifications (ISO 27001, SOC 2): a documented and operational data retention policy is a required control

## Common Mistakes
- **Hard-deleting users who have associated financial records** — You cannot delete invoice or payment records you are legally required to retain; anonymize the personal data, keep the record
- **Not logging erasure requests in the audit log** — The erasure itself is a system event that should be audited; you need to demonstrate you processed the request
- **Treating all tenant data as the user's own data** — Data a user created within a tenant workspace (documents, comments, projects) belongs to the tenant, not the user; your deletion pipeline must respect this boundary
- **No DSAR (Data Subject Access Request) response process** — Erasure is only one right; users can also request a copy of all their data; you need a way to export `JOIN` across all tables for a given userId

## Further Reading
- [GDPR Article 17 — Right to erasure](https://gdpr.eu/right-to-be-forgotten/)
- [KVKK official website (Kişisel Verileri Koruma Kurumu)](https://www.kvkk.gov.tr/)
- [GDPR.eu developer guide to compliance](https://gdpr.eu/developers/)
