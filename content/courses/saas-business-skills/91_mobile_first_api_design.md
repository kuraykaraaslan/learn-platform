# 91. Mobile-First API Design — Bandwidth, Offline-First Thinking

## What It Is
Mobile-first API design is the practice of designing server-side APIs with the constraints of mobile clients as a primary concern rather than an afterthought. Mobile clients differ from browser clients in three significant ways: bandwidth is limited and expensive, network connectivity is intermittent (users go through tunnels, elevators, and weak signal areas), and battery life means you cannot afford to keep a WebSocket open or poll every 30 seconds. APIs designed without these constraints in mind work fine in development but degrade significantly in real-world mobile conditions.

Bandwidth-conscious design means sending exactly the data a client needs for a given view — no more, no less. The standard REST approach (one resource endpoint that always returns the full representation) is wasteful when a mobile list view needs only id, name, and thumbnail but the endpoint returns 40 fields. GraphQL solves this by design; REST solves it through response shaping (sparse fieldsets, query parameters for field selection), separate list and detail endpoints, or server-driven UI patterns. The most pragmatic solution for an existing REST API is to add a `fields` query parameter that lets clients request specific fields, reducing response size by 60–80% for list views.

Offline-first thinking is the design philosophy that the client should function (at least partially) without a network connection, and that synchronization happens in the background when connectivity is restored. It requires designing APIs around the synchronization primitives: optimistic updates (client applies the change immediately and rolls back if the server rejects it), conflict resolution (what happens when the same record is modified on two devices while offline), and delta sync (returning only records that changed since a timestamp rather than the full dataset). Your current JWT-based stateless design is compatible with offline-first; it just needs the specific sync endpoints and client-side patterns layered on top.

## Key Concepts
- **Sparse fieldsets**: `GET /api/tenants?fields=id,name,plan` returns only requested fields; reduces bandwidth by 60–80% for list views
- **Pagination with cursors**: Offset-based pagination (`?page=2&limit=20`) is inconsistent when records are inserted between pages; cursor-based (`?after=cursor_token`) is stable and more efficient for mobile
- **Response compression**: gzip or Brotli compression reduces JSON response size by 70–80%; enable it at the Next.js or reverse proxy level — not in application code
- **ETag and conditional requests**: `If-None-Match: "etag-value"` lets the client re-validate cached data without re-downloading it if unchanged; server returns 304 Not Modified
- **Optimistic updates**: Client applies state change immediately (e.g., marks todo as complete), sends the request to the server, and only shows an error if the server rejects it; avoids waiting for network round-trip
- **Delta sync endpoint**: `GET /api/sync?since=2025-01-01T00:00:00Z` returns all records modified after the timestamp; client applies the delta to its local state
- **Conflict resolution strategy**: Last-write-wins (simplest), server-wins, client-wins, or merge (most complex); choose per entity type based on business importance of the data
- **Webhook vs. polling vs. SSE**: Server-Sent Events (SSE) is the best balance for mobile real-time updates — lower overhead than WebSocket, works over HTTP/2, and clients can reconnect after disconnection

## Example Code or Template

```typescript
// Bandwidth-conscious API patterns for Next.js App Router

// ============================================================
// 1. SPARSE FIELDSETS — reduce response size for list views
// ============================================================
// GET /api/tenants?fields=id,name,plan_id,created_at

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/db';

const ALLOWED_TENANT_FIELDS = new Set([
  'id', 'name', 'plan_id', 'status', 'created_at', 'member_count',
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fieldsParam = searchParams.get('fields');

  // Parse and validate requested fields
  const requestedFields = fieldsParam
    ? fieldsParam
        .split(',')
        .map((f) => f.trim())
        .filter((f) => ALLOWED_TENANT_FIELDS.has(f))
    : Array.from(ALLOWED_TENANT_FIELDS); // default: all allowed fields

  const selectClause = Object.fromEntries(
    requestedFields.map((f) => [f, true])
  );

  const tenants = await db.tenant.findMany({
    select: selectClause,
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ data: tenants });
}

// ============================================================
// 2. CURSOR-BASED PAGINATION — stable pagination for mobile
// ============================================================
// GET /api/notifications?limit=20&after=eyJpZCI6IjEyMyJ9

interface CursorPayload { id: string }

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeCursor(cursor: string): CursorPayload {
  return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
}

export async function getNotificationPage(limit: number, after?: string) {
  const cursor = after ? decodeCursor(after) : undefined;

  const items = await db.notification.findMany({
    take: limit + 1, // fetch one extra to determine if there's a next page
    ...(cursor && { cursor: { id: cursor.id }, skip: 1 }),
    orderBy: { createdAt: 'desc' },
  });

  const hasNextPage = items.length > limit;
  const data = hasNextPage ? items.slice(0, limit) : items;
  const nextCursor = hasNextPage ? encodeCursor({ id: data[data.length - 1].id }) : null;

  return { data, nextCursor, hasNextPage };
}

// ============================================================
// 3. DELTA SYNC ENDPOINT — for offline-first mobile clients
// ============================================================
// GET /api/sync?since=2025-05-01T00:00:00Z&tenant_id=abc

export async function GET_delta(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const since = searchParams.get('since');
  const tenantId = searchParams.get('tenant_id');

  if (!since || !tenantId) {
    return NextResponse.json({ error: 'since and tenant_id required' }, { status: 400 });
  }

  const sinceDate = new Date(since);
  if (isNaN(sinceDate.getTime())) {
    return NextResponse.json({ error: 'Invalid since timestamp' }, { status: 400 });
  }

  const [updatedMembers, deletedMemberIds, updatedSettings] = await Promise.all([
    db.tenantMember.findMany({
      where: { tenantId, updatedAt: { gte: sinceDate } },
    }),
    db.deletedRecord.findMany({
      where: { tenantId, entity: 'tenant_member', deletedAt: { gte: sinceDate } },
      select: { entityId: true },
    }),
    db.tenantSetting.findMany({
      where: { tenantId, updatedAt: { gte: sinceDate } },
    }),
  ]);

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    delta: {
      tenant_members: {
        updated: updatedMembers,
        deleted: deletedMemberIds.map((r) => r.entityId),
      },
      tenant_settings: {
        updated: updatedSettings,
        deleted: [], // settings are upserted, not deleted in this model
      },
    },
  });
}

// ============================================================
// 4. ETAG SUPPORT — avoid re-downloading unchanged resources
// ============================================================

import crypto from 'crypto';

export async function getTenantWithETag(request: NextRequest, tenantId: string) {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const etag = `"${crypto
    .createHash('sha256')
    .update(JSON.stringify(tenant))
    .digest('hex')
    .slice(0, 16)}"`;

  const ifNoneMatch = request.headers.get('if-none-match');
  if (ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304, headers: { ETag: etag } });
  }

  return NextResponse.json(tenant, {
    headers: { ETag: etag, 'Cache-Control': 'private, max-age=0, must-revalidate' },
  });
}
```

## When to Use
- When a client's SaaS will have a mobile or PWA client — design the API with sparse fieldsets and cursor pagination from the start, not after the mobile team reports slowness
- When your list endpoints return more than 10 fields — add field selection; it costs little to implement and can reduce mobile data consumption by 60%+
- When building features that users will access on unreliable connections (travel, field work) — design those features with optimistic updates and local state that syncs when online
- When API response times are acceptable on WiFi but unacceptable on 4G/LTE — the issue is almost always response size, not server latency; add compression and sparse fieldsets before adding caching infrastructure
- When building a React Native or Flutter client against your existing API — audit every list endpoint for response size and add field selection before the mobile team writes a single screen

## Common Mistakes
- **Using offset pagination for mobile**: `page=2&limit=20` skips 20 records — if one new record was inserted before your first request, page 2 duplicates a record; cursor-based pagination is immune to this and more efficient for the database
- **Returning full objects in list views**: An endpoint that powers a list of 50 tenants and returns 2KB per tenant sends 100KB; with sparse fieldsets requesting only id, name, and status, the same list is 5KB — a 20× bandwidth reduction
- **No compression**: Next.js enables gzip by default in production, but if you are behind a custom proxy or running on edge runtimes, verify compression is active; 70–80% bandwidth reduction for JSON is essentially free performance
- **Designing sync as "full re-download"**: A mobile app that fetches the full dataset every time it reconnects will be slow and drain battery; design delta sync endpoints from the start, even if the client does not use them immediately

## Further Reading
- [**"Offline First" — Alex Feyerke and others](https://offlinefirst.org)** — The community resource that popularized offline-first design; includes case studies, patterns, and a curated reading list
- **"HTTP APIs for Mobile" — Stripe Engineering Blog** — Stripe's internal guidelines for designing APIs that work well under mobile constraints; covers response shaping, pagination, and retry semantics
- **"Building Offline-First Apps" — Nolan Lawson** — The most practical deep-dive into the technical challenges of offline-first: conflict resolution, sync protocols, and local storage options; originally a web article but fully applicable to PWA and mobile web
