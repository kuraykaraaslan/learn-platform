# 392. Data Architecture — Ownership, Source of Truth, and Lifecycle Strategy

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Technical_Architecture_Rules material (specifically `data-architecture.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Data architecture at the strategy level isn't schema design — that's an implementation skill covered elsewhere. It's answering, for every important data object, who owns it, where its source of truth lives, and what its lifecycle looks like, before a single table gets drawn. The source-of-truth rule requires naming which system is authoritative for each entity: a customer profile is typically owned locally, a payment status is owned by the payment provider and only mirrored locally, an invoice number is owned by the accounting system. Duplicating ownership without an explicit sync strategy is how two systems quietly disagree about the same fact, and nobody notices until a customer complains.

Lifecycle strategy means defining, per core entity, who creates it, who updates it, who deletes or archives it, which states it can hold, what must be audited, and — the decision that carries the most downstream risk — the deletion strategy: hard delete, soft delete, archive, anonymization, or retention-based purge. The default has to be conservative: financial, audit, or operationally important records don't get hard-deleted without an explicit, documented reason, because "we deleted it" is a categorically worse conversation to have with a client than "it's archived and still recoverable." An order that has been paid, for example, typically cannot be hard-deleted afterward — it's retained for financial reporting, and every status transition on it needs to be auditable.

Indexing and migration planning are strategy decisions too, even though they sound like implementation details. Identifying the likely query patterns up front — list by tenant, filter by status, search by email or code, date-range reports, export queries — is what index decisions should be *derived from*, not something guessed at reactively after a slow-query complaint arrives. And every schema migration needs a plan before it needs code: migration order, backward compatibility if the change can't ship atomically, seed data, a rollback path, and — for anything destructive — a backup taken immediately beforehand. (The mechanics of executing a zero-downtime migration safely are a separate, deeper technical skill; this lesson is the upfront ownership and planning discipline that decides whether a given migration is even safe to attempt in the first place.)

## Key Concepts
- **Source-of-truth rule**: name the authoritative system per data object explicitly; never duplicate ownership without a stated sync strategy
- **Relational modeling default**: appropriate when the system depends on transactions, joins, reporting, constraints, role-based access, or financial/order workflows — a strong default for most custom business platforms
- **Data lifecycle fields per entity**: created by, updated by, deleted/archived by, allowed states, audit needs, retention period, export needs
- **Deletion strategy spectrum**: hard delete, soft delete, archive, anonymization, retention-based purge — with a conservative default against hard-deleting financial, audit, or operationally important records
- **Query-pattern-first indexing**: identify real workflows (tenant listing, status filtering, date-range reporting, search, exports) before adding indexes, rather than guessing at complexity that isn't there
- **Migration planning checklist**: migration order, backward compatibility, seed data, rollback consideration, data transformation, pre-migration backup for destructive changes
- **Explicit boundary**: this lesson covers the ownership and lifecycle decision layer; schema implementation, index tuning, and zero-downtime migration execution mechanics are separate technical skills covered elsewhere in this curriculum

## Example Code
```markdown
## Data Architecture — Crew Scheduler

### Source of Truth
| Data object | Source of truth | Notes |
|---|---|---|
| Job, Assignment | This system | Core business data, fully owned |
| SMS delivery status | SMS provider | Mirrored locally via webhook; provider is authoritative |
| Technician contact info | This system | Client-provided at onboarding, editable by coordinator |

### Lifecycle — Job Entity
- **Created by:** Coordinator, via job creation form
- **Updated by:** Coordinator (reassignment), system (conflict recomputation)
- **Deleted/archived by:** Never hard-deleted once assigned; archived after
  completion + 90 days
- **Allowed states:** DRAFT → SCHEDULED → COMPLETED / CANCELLED
- **Audit needs:** Every reassignment and cancellation logged with who/when/
  from-to
- **Retention:** Retained for 1 year for dispute resolution and reporting
- **Export needs:** CSV export of completed jobs for client's own record-keeping

### Deletion Strategy Decision
Soft delete for Job and Assignment (status = CANCELLED, never removed from
the table); no hard delete supported in the product. Retention-based purge for
anything older than 2 years, run manually by an admin, not automated, until
volume justifies automation.

### Query Patterns Driving Indexes
- List jobs by coordinator + date range → index on (coordinator_id, date)
- Detect conflicts for a technician → index on (technician_id, date, time_window)
- Export completed jobs → index on (status, completed_at)

### Migration Plan Note
Adding a `region_id` column ahead of multi-region support: backward-compatible
(nullable, defaults to the single existing region), seeded for all existing
rows, no destructive change — no pre-migration backup required beyond the
standard daily backup already in place.
```

## When to Use
- During requirements-to-architecture translation (lesson 388), as soon as a data object with cross-system relevance (payments, identity, accounting) is identified
- Before finalizing a database schema — the source-of-truth and lifecycle decisions should be settled first, not discovered while writing migrations
- Whenever a "just delete it" request comes up for financial, audit, or operationally important records — apply the conservative default and propose soft delete or archive instead
- Before adding an index reactively in response to a performance complaint — check whether it matches an identified query pattern or is a guess

## Common Mistakes
- Creating database tables before domain terms and ownership are clear, producing schema that encodes technical convenience instead of business meaning
- Storing payment secrets or full card data locally instead of relying on the payment provider as the source of truth for that data
- Hard-deleting business-critical records by default because it's the simplest code path, without considering audit or reporting consequences
- Duplicating a data object's ownership across two systems with no defined sync strategy, so the two systems drift out of agreement silently
- Adding indexes speculatively instead of deriving them from actual identified query patterns

## Further Reading
- Martin Kleppmann — "Designing Data-Intensive Applications" (source-of-truth and consistency framing across systems)
- Scott W. Ambler & Pramod J. Sadalage — "Refactoring Databases" (migration planning as a first-class discipline, not an afterthought)
- DAMA International — "DAMA-DMBOK" (Data Management Body of Knowledge — the formal version of the ownership/lifecycle framing this lesson compresses)
