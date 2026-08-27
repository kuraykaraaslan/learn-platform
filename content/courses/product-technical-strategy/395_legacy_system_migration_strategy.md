# 395. Legacy System Assessment and Migration Strategy

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Technical_Architecture_Rules material (specifically `legacy-and-migration-strategy.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
A large share of client projects aren't greenfield — they replace a spreadsheet, an aging admin panel, a WordPress site standing in for a real product, or a previous vendor's failed attempt — and in that kind of project the risk almost never lives in the new system's code. It lives in the migration. Before proposing a replacement, the strategist has to assess the current system honestly: what exists today, what data actually has to move, who owns that data, how clean it really is (not how clean the client believes it is), which fields are mandatory, which historical records genuinely matter versus can be archived instead of migrated, what downtime is acceptable, and who is responsible for validating that the migrated data is correct.

The migration type is a deliberate choice matched to risk, not a default reached for out of habit: manual migration for small, low-risk data; CSV import for structured spreadsheet data; API migration when the existing system has a reliable API; direct database migration only with safe, controlled source access; a parallel-run strategy when the business genuinely cannot risk an immediate cutover; or a phased migration when distinct modules can move gradually. Whichever type is chosen, every migrated data object needs an explicit mapping — source field, target field, transformation rule, validation rule, and a named owner for whatever doesn't map cleanly. A legacy status field of "done" maps to COMPLETED, a blank value maps to PENDING_REVIEW, and anything that doesn't fit either rule gets exported to a review file for a human to resolve — never silently dropped and never silently guessed at.

The cutover itself is a planned event, not a moment of hope: a freeze time, a backup taken immediately before migration, the migration execution itself, validation checks run against the mapping rules, an explicit go/no-go decision, a defined rollback condition, and client sign-off before the old system is retired. The single most common failure in this category isn't technical at all — it's promising a clean migration before anyone has actually looked at the real data, and then discovering during execution that the spreadsheet has three different date formats and a status column with three different capitalizations depending on which employee entered each row.

## Key Concepts
- **Legacy assessment questions**: current system/process, data ownership, data quality (verified, not assumed), mandatory fields, which historical records must migrate vs. can be archived, acceptable downtime, who validates migrated data
- **Migration type selection**: manual (small/low-risk), CSV import (structured spreadsheets), API migration (reliable existing API), direct database migration (safe controlled access only), parallel run (business can't risk immediate cutover), phased migration (modules move gradually) — matched to risk profile, not chosen by convenience
- **Data mapping rule**: source field, target field, transformation rule, validation rule, owner for unclear/unmapped data
- **Archive vs. migrate distinction**: not every historical record needs to move into the new system — some can be archived and referenced only if needed
- **Cutover plan fields**: freeze time, pre-migration backup, execution, validation checks against mapping rules, go/no-go decision, rollback condition, client sign-off
- **Named anti-pattern**: promising a clean migration before seeing the actual data — "assume spreadsheets are clean" is explicitly forbidden as a planning basis
- **Client-facing discipline**: this is as much a trust and expectation-setting exercise with the client as it is a technical plan — sign-off and validated go/no-go criteria protect both sides

## Example Code
```markdown
## Migration Plan — Crew Scheduler (Replacing Shared Spreadsheet)

### Legacy Assessment
- **Current system:** Shared Google Sheet, manually updated by the coordinator
- **Data to migrate:** Technician roster (name, phone, region), active job
  list for the current week only (historical jobs archived, not migrated)
- **Data owner:** Coordinator maintains the sheet; no other stakeholder edits it
- **Data quality:** Sample export requested and reviewed — found inconsistent
  phone number formats and two technicians listed under nicknames, not legal
  names
- **Mandatory fields:** Technician name, phone, region — all present but
  inconsistently formatted
- **Historical records:** Past jobs (6+ months of history) archived as a
  read-only CSV export, not migrated into the live system
- **Acceptable downtime:** Coordinator can tolerate a single-day freeze over
  a weekend
- **Validator:** Coordinator personally reviews migrated technician list
  against the original sheet before go-live

### Migration Type
CSV import for the technician roster, manual reconciliation for the two
nickname mismatches — matches the low data volume and moderate data-quality
risk found during assessment.

### Data Mapping
| Source field | Target field | Transformation | Validation | Owner for unclear data |
|---|---|---|---|---|
| `Tech Name` | `technician.full_name` | Trim whitespace, title-case | Must be non-empty | Coordinator resolves nickname mismatches |
| `Phone` | `technician.phone` | Normalize to E.164 format | Must match phone regex | Flagged rows exported to `migration_review.csv` |
| `Region` | `technician.region_id` | Map region name to id | Must match known region list | Coordinator confirms unmapped regions |

### Cutover Plan
- **Freeze time:** Friday 6:00 PM — no further edits to the spreadsheet
- **Backup:** Spreadsheet exported and archived before import begins
- **Execution:** CSV import run Saturday morning
- **Validation:** Coordinator cross-checks technician count and phone numbers
  against the original sheet
- **Go/no-go decision:** Sunday — coordinator confirms all technicians present
  and correctly assigned to regions
- **Rollback condition:** Any missing or duplicated technician record triggers
  a full rollback to the spreadsheet and a re-run of the import
- **Sign-off:** Coordinator confirms in writing (email) before Monday go-live
```

## When to Use
- Whenever a client project is described as "replacing" an existing tool, spreadsheet, or vendor system — before any estimate is given
- Before promising a migration timeline or calling a migration "simple" — request a sample data export first and verify data quality directly
- When deciding whether historical records need to migrate at all, versus being archived as a read-only reference
- Before any destructive cutover step — confirm a backup exists and a rollback condition is defined in writing

## Common Mistakes
- Promising a clean migration before seeing an actual sample of the real data, then discovering format inconsistencies mid-execution
- Migrating every historical record by default instead of asking which ones the business actually needs versus can archive
- Skipping a pre-migration backup before a destructive operation because the migration "should just work"
- Treating the cutover as an informal step instead of a planned event with a defined go/no-go decision and rollback condition
- Cutting over without explicit client sign-off, leaving ambiguity later about whether the client actually approved the final migrated state

## Further Reading
- Michael Feathers — "Working Effectively with Legacy Code" (the mindset of treating an existing system's behavior as a spec to be understood, not assumed)
- Martin Fowler — "StranglerFigApplication" (martinfowler.com — the pattern behind phased and parallel-run migrations)
- David H. Maister, Charles H. Green, Robert M. Galford — "The Trusted Advisor" (on the client-communication and sign-off discipline that makes a migration a shared decision, not a unilateral technical act)
