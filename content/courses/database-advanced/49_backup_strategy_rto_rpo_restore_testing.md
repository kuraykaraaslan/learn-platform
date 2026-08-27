# 49. Backup Strategy — RTO, RPO, Real Restore Testing

## What It Is
A backup strategy is the combination of: what you back up, how often, where you store it, how long you keep it, and how you restore it. The two governing metrics are RPO and RTO. RPO (Recovery Point Objective) is the maximum amount of data loss you can tolerate: if your RPO is 1 hour, you need backups at least every hour. RTO (Recovery Time Objective) is the maximum time your service can be down before recovery: if your RTO is 2 hours, your restore process must complete in under 2 hours.

For your multi-tenant SaaS with a system database and N per-tenant databases, the backup problem is more complex than a single-database application. You need backups of the system database (user accounts, tenant metadata, subscriptions), backups of every tenant database (tenant-specific business data), and Redis backup if you use Redis for anything beyond an ephemeral cache (you do — session hashes are important enough to warrant Redis persistence). If you are using a managed database service (AWS RDS, Supabase, Neon, Railway) you get automated backups, but "automated backups are configured" is different from "we have tested restoring from a backup."

The part most developers skip — and the part that matters most — is restore testing. A backup you have never restored from is untested. Compressed backups can be corrupted. Automated backup jobs can silently fail. Restore procedures documented two years ago can be outdated. The industry standard is to test restores regularly (monthly for production, whenever the restore procedure changes) and to keep evidence that you did.

## Key Concepts
- **RPO (Recovery Point Objective)** — Maximum acceptable data loss; a 4-hour RPO means you can lose up to 4 hours of data
- **RTO (Recovery Time Objective)** — Maximum acceptable downtime; a 2-hour RTO means you must be operational within 2 hours of a disaster
- **Full backup** — A complete copy of the database at a point in time; slowest to create, simplest to restore
- **Incremental backup** — Only changes since the last backup; faster to create, more complex to restore (requires applying increments in order)
- **WAL archiving** — PostgreSQL's Write-Ahead Log (WAL) records every change; archiving WAL enables Point-in-Time Recovery (PITR) — restore to any second in the past
- **PITR (Point-in-Time Recovery)** — Restore a base backup, then apply WAL logs up to a specific timestamp; enables sub-second RPO
- **3-2-1 rule** — 3 copies of data, on 2 different media, 1 offsite; the minimum standard for serious backup strategies
- **`pg_dump` / `pg_dumpall`** — PostgreSQL's built-in backup tools; `pg_dump` for individual databases, `pg_dumpall` for the entire cluster

## Example Code
```bash
#!/bin/bash
# scripts/backup/backup-all-databases.sh
# Run as a cron job or BullMQ scheduled job

set -euo pipefail

BACKUP_DIR="/var/backups/postgres"
S3_BUCKET="${BACKUP_S3_BUCKET}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# System database backup
echo "[Backup] Starting system database backup..."
pg_dump \
  --no-password \
  --format=custom \
  --compress=9 \
  "${SYSTEM_DATABASE_URL}" \
  > "${BACKUP_DIR}/system_${TIMESTAMP}.pgdump"

# Verify the dump is not empty
if [ ! -s "${BACKUP_DIR}/system_${TIMESTAMP}.pgdump" ]; then
  echo "[Backup] ERROR: System database backup is empty!"
  exit 1
fi

# Upload to S3 with server-side encryption
aws s3 cp \
  "${BACKUP_DIR}/system_${TIMESTAMP}.pgdump" \
  "s3://${S3_BUCKET}/system/${TIMESTAMP}.pgdump" \
  --sse AES256

echo "[Backup] System database backed up: ${TIMESTAMP}"

# Per-tenant database backups (assuming you have a way to enumerate them)
# In your architecture, you know all tenant DB URLs from the system DB
TENANT_IDS=$(psql "${SYSTEM_DATABASE_URL}" -t -c "SELECT tenant_id FROM tenants WHERE status = 'ACTIVE'")

for TENANT_ID in $TENANT_IDS; do
  TENANT_DB_URL=$(psql "${SYSTEM_DATABASE_URL}" -t -c \
    "SELECT database_url FROM tenants WHERE tenant_id = '${TENANT_ID}'" | xargs)

  if [ -n "${TENANT_DB_URL}" ]; then
    pg_dump \
      --no-password \
      --format=custom \
      --compress=9 \
      "${TENANT_DB_URL}" \
      > "${BACKUP_DIR}/tenant_${TENANT_ID}_${TIMESTAMP}.pgdump"

    aws s3 cp \
      "${BACKUP_DIR}/tenant_${TENANT_ID}_${TIMESTAMP}.pgdump" \
      "s3://${S3_BUCKET}/tenants/${TENANT_ID}/${TIMESTAMP}.pgdump" \
      --sse AES256

    echo "[Backup] Tenant ${TENANT_ID} backed up"
    rm "${BACKUP_DIR}/tenant_${TENANT_ID}_${TIMESTAMP}.pgdump"
  fi
done

# Clean up local files
find "${BACKUP_DIR}" -name "*.pgdump" -mtime +1 -delete

# Lifecycle policy on S3 handles old backup deletion (set via AWS console or Terraform)
echo "[Backup] All backups complete: ${TIMESTAMP}"
```

```typescript
// scripts/backup/test-restore.ts
// Run monthly: verifies backups are restorable

import { execSync } from 'child_process';

async function testRestoreLatestBackup(): Promise<void> {
  const timestamp = new Date().toISOString();
  const testDbName = `restore_test_${Date.now()}`;

  console.log(`[RestoreTest] Starting restore test at ${timestamp}`);

  try {
    // 1. Download the most recent backup from S3
    execSync(
      `aws s3 cp s3://${process.env.BACKUP_S3_BUCKET}/system/ /tmp/latest_backup.pgdump ` +
      `--exclude "*" --include "*.pgdump" --recursive --include "$(aws s3 ls ` +
      `s3://${process.env.BACKUP_S3_BUCKET}/system/ | sort | tail -1 | awk '{print $4}')"`,
      { stdio: 'inherit' }
    );

    // 2. Create a fresh test database
    execSync(`createdb ${testDbName}`, { stdio: 'inherit' });

    // 3. Restore into the test database
    execSync(
      `pg_restore --dbname=${testDbName} --no-owner --no-privileges /tmp/latest_backup.pgdump`,
      { stdio: 'inherit' }
    );

    // 4. Run basic integrity checks
    const result = execSync(
      `psql ${testDbName} -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM tenants;"`,
      { encoding: 'utf8' }
    );
    console.log(`[RestoreTest] Integrity check:\n${result}`);

    console.log(`[RestoreTest] PASS: Backup restored successfully at ${timestamp}`);

    // 5. Log the successful restore test to your audit log
    // await AuditLogService.log({ action: 'BACKUP_RESTORE_TEST_PASSED', metadata: { timestamp } });

  } catch (err) {
    console.error(`[RestoreTest] FAIL: Restore test failed!`, err);
    // Alert the on-call engineer (email, PagerDuty, etc.)
    throw err;
  } finally {
    // 6. Drop the test database
    try { execSync(`dropdb ${testDbName}`); } catch {}
    try { execSync(`rm -f /tmp/latest_backup.pgdump`); } catch {}
  }
}

testRestoreLatestBackup();
```

## When to Use
- Set up automated backups before your first paid customer — data loss with paying customers is a business-ending event
- Run restore tests monthly — automate them and alert if they fail
- Use managed database services (AWS RDS, Supabase) for automated backups with point-in-time recovery — they solve the backup creation problem, but you still need to test restores
- Define your RPO and RTO explicitly and measure whether your backup schedule meets them — for most SaaS apps, RPO of 1 hour and RTO of 4 hours are reasonable starting targets

## Common Mistakes
- **Storing backups in the same location as the database** — If the server dies, the backups die with it; always store backups off-site (S3, different region)
- **Never testing restores** — A backup that has never been restored is not a backup; schedule monthly restore tests and treat test failures as incidents
- **Backing up only the system database** — Your per-tenant databases contain your customers' data; each tenant database needs its own backup schedule
- **Not accounting for Redis** — Your Redis session hashes are important; if Redis loses data (restart without persistence), active sessions are invalidated; enable Redis AOF persistence or accept the tradeoff explicitly

## Further Reading
- [PostgreSQL backup and restore documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS RDS automated backups and point-in-time recovery](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_WorkingWithAutomatedBackups.html)
- [Barman — PostgreSQL Backup and Recovery Manager](https://www.pgbarman.org/)
- [PostgreSQL: continuous archiving and PITR](https://www.postgresql.org/docs/current/continuous-archiving.html) — what point-in-time recovery actually requires you to have set up in advance
