# 46. Full-Text Search — PostgreSQL tsvector vs Elasticsearch

## What It Is
Full-text search is the capability to search document content rather than exact field values. It supports stemming (searching "running" also matches "run", "runs"), stop words (ignoring "the", "and", "is"), relevance ranking (results ordered by how well they match), phrase queries ("exact phrase in quotes"), and Boolean operators (AND, OR, NOT). This is qualitatively different from `LIKE '%search%'`, which just checks if the string appears anywhere in the field.

PostgreSQL has built-in full-text search via `tsvector` and `tsquery`. A `tsvector` is a pre-processed representation of a document: tokens are extracted, reduced to lexemes (normalized forms), and stored with their position in the document. Queries use `tsquery`, which supports stemming, operators, and phrase matching. You create a `GIN` index on the `tsvector` column for fast lookups. This covers a wide range of search requirements without adding any external infrastructure, and for datasets up to a few million rows it is fast and capable.

Elasticsearch (and its managed equivalent, OpenSearch) is appropriate when your search requirements exceed what PostgreSQL can reasonably provide: very large datasets (tens or hundreds of millions of documents), relevance tuning via field boosting and custom scoring functions, faceted search (search + filter by category + count per category), autocomplete with suggestions, or cross-tenant search across all tenant databases simultaneously. The operational cost of Elasticsearch is significant — it is a separate cluster to manage, monitor, and keep in sync with your PostgreSQL data.

## Key Concepts
- **`tsvector`** — A PostgreSQL type storing a preprocessed document as lexemes with positions; created via `to_tsvector('english', text)`
- **`tsquery`** — A search query that matches against a `tsvector`; created via `to_tsquery('english', 'search:* & term:*')`
- **`@@` operator** — `tsvector @@ tsquery` — the match operator; returns true if the query matches the vector
- **`GIN` index** — Generalized Inverted Index; the correct index type for `tsvector` columns; enables fast full-text search
- **Stemming** — Reducing words to their root form; "searches", "searching", "searched" all match "search"
- **Text search rank** — `ts_rank(tsvector, tsquery)` returns a float representing match quality; use for `ORDER BY` to surface most relevant results first
- **Weighted columns** — Different parts of a document can carry different weight (`A` = title, `B` = body); title matches rank higher than body matches
- **Elasticsearch** — Distributed search engine based on Apache Lucene; document-oriented; supports complex queries, aggregations, and real-time indexing

## Example Code
```typescript
// ─── Option A: PostgreSQL full-text search ────────────────────────────────

// Migration: add a generated tsvector column
/*
ALTER TABLE users ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(email, '')), 'B')
  ) STORED;

CREATE INDEX CONCURRENTLY idx_users_search_vector
  ON users USING GIN (search_vector);

-- For tenant content (projects, notes, etc.) in tenant DB:
ALTER TABLE projects ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(tags, '')), 'A')
  ) STORED;

CREATE INDEX CONCURRENTLY idx_projects_search
  ON projects USING GIN (search_vector);
*/

// TypeORM query with full-text search
export async function searchProjects(
  tenantDs: DataSource,
  query: string,
  tenantId: string,
  limit = 20
): Promise<{ projectId: string; title: string; rank: number }[]> {
  // Convert user input to a tsquery (prefix matching with :*)
  // "project man" → "project:* & man:*"
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => `${word.replace(/[^a-zA-Z0-9]/g, '')}:*`)
    .join(' & ');

  if (!tsQuery) return [];

  const results = await tenantDs.query<{ projectId: string; title: string; rank: number }[]>(`
    SELECT
      project_id AS "projectId",
      title,
      ts_rank(search_vector, to_tsquery('english', $1)) AS rank
    FROM projects
    WHERE
      tenant_id = $2
      AND search_vector @@ to_tsquery('english', $1)
    ORDER BY rank DESC, created_at DESC
    LIMIT $3
  `, [tsQuery, tenantId, limit]);

  return results;
}

// ─── Option B: Prisma equivalent using $queryRaw ─────────────────────────

// A raw query returns the columns as PostgreSQL names them, plus whatever the
// SELECT computes — `rank` exists only on a search result, never on the table.
type User = {
  id: string;
  email: string;
  display_name: string;
  rank: number;
};

async function searchUsers(prisma: PrismaClient, query: string): Promise<User[]> {
  const tsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => `${w}:*`)
    .join(' & ');

  return prisma.$queryRaw<User[]>`
    SELECT user_id, email, name,
           ts_rank(search_vector, to_tsquery('english', ${tsQuery})) AS rank
    FROM users
    WHERE search_vector @@ to_tsquery('english', ${tsQuery})
    ORDER BY rank DESC
    LIMIT 20
  `;
}

// ─── When to add Elasticsearch: sync pattern ──────────────────────────────
// If you outgrow PostgreSQL FTS, sync to Elasticsearch via your audit log
// pattern: write to DB first, then index to Elasticsearch via a job queue

import { DataSource } from 'typeorm';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

const searchIndexQueue = new Queue('search-index');

// After creating/updating a project:
async function indexProject(projectId: string): Promise<void> {
  await searchIndexQueue.add('index', { type: 'project', id: projectId });
}

// Worker syncs to Elasticsearch:
// const project = await db.getProject(projectId);
// await esClient.index({ index: 'projects', id: projectId, document: project });
```

## When to Use
- **PostgreSQL FTS** — Searching within a single tenant's data (projects, documents, notes, users), datasets up to ~5-10 million rows, when you do not need real-time indexing with sub-100ms latency
- **Add `GIN` index immediately** — Any table you search with `LIKE '%term%'` today should get a `tsvector` column and GIN index; the query pattern barely changes and performance improves dramatically
- **Elasticsearch** — Cross-tenant search, large document corpora (100M+ items), autocomplete/suggestions, faceted filtering, or when your search product is a core differentiator
- **Hybrid** — PostgreSQL FTS for structured queries (find user by name), Elasticsearch for content search (find documents containing this phrase)

## Common Mistakes
- **`LIKE '%term%'` on large tables** — Cannot use any standard index; scans the full table for every query; replace with `tsvector` + GIN index
- **Not sanitizing user input for `tsquery`** — Special characters (`&`, `|`, `!`, `:`) have meaning in `tsquery`; strip or escape them before interpolation
- **Keeping Elasticsearch in sync with PostgreSQL manually** — Synchronous dual-writes fail silently; use a message queue (BullMQ) or CDC (Change Data Capture) to reliably sync
- **Using Elasticsearch for simple queries** — If all you need is case-insensitive name search, PostgreSQL FTS is much simpler to operate; Elasticsearch is a significant operational investment

## Further Reading
- [PostgreSQL Full Text Search documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [Prisma full-text search guide](https://www.prisma.io/docs/concepts/components/prisma-client/full-text-search)
- [Elasticsearch getting started (Node.js)](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/getting-started-js.html)
