# 7. Idempotency Key Pattern

## What It Is
An idempotency key is a client-supplied unique identifier attached to a mutating request. If the same key is presented again, the server returns the cached result of the original request without re-executing the operation. This means the operation is idempotent: calling it once and calling it ten times with the same key produce the same state. The pattern exists because retries are unavoidable in distributed systems — network timeouts, client reconnects, BullMQ job retries, and webhook redeliveries all mean that your server may receive the same logical request more than once.

The critical insight is that idempotency is a server-side concern, not just something you handle at the Stripe SDK level. When your BullMQ worker retries a failed job, every external call within that job needs idempotency protection. When your API route for tenant provisioning is retried by a client after a timeout, your handler must detect the duplicate and return the same response. The idempotency key becomes a first-class concept that flows through your entire mutation layer.

Implementation requires a durable store (PostgreSQL is ideal — Redis can lose data) that maps the key to the result of the operation. The window for retaining keys depends on your retry policy: if a client might retry up to 24 hours later, you need to retain keys for at least that long. The store must handle the concurrent case — two simultaneous requests with the same key must not both execute the operation; one should win and the other should wait for the result.

## Key Concepts
- **Idempotency key**: A client-generated UUID attached to each mutating request; server uses it to deduplicate
- **Idempotency store**: A persistent table/cache mapping keys to their stored responses; PostgreSQL preferred over Redis for durability
- **Natural idempotency**: Some operations are naturally idempotent (upserts, setting a value to a fixed target); others are not (incrementing a counter, charging a card)
- **At-least-once delivery**: Message queues and webhook systems deliver at least once; idempotency on the consumer makes this safe
- **Exactly-once semantics**: The combination of at-least-once delivery + consumer idempotency = effectively exactly-once processing
- **Concurrent duplicate handling**: Two requests with the same key arriving simultaneously must not both execute; use a DB unique constraint or lock on the key
- **Key expiry**: Keys should expire after your maximum retry window — indefinite retention grows the store unboundedly
- **Response caching**: Store the full HTTP response (status + body) so retries get an identical response, not just "already processed"

## Example Code
```typescript
// Cross-cutting idempotency middleware for Next.js API routes
// Stores key → response in PostgreSQL with a unique constraint

// Schema (add to your Prisma schema):
// model IdempotencyKey {
//   id          String    @id @default(uuid())
//   key         String    @unique
//   status      String    // 'pending' | 'complete'
//   statusCode  Int?
//   responseBody Json?
//   createdAt   DateTime  @default(now())
//   expiresAt   DateTime
// }

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/db';

export async function withIdempotency(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const idempotencyKey = request.headers.get('idempotency-key');

  if (!idempotencyKey) {
    // Idempotency key is optional — if not provided, just execute
    return handler(request);
  }

  // Try to find an existing record for this key
  const existing = await db.idempotencyKey.findUnique({
    where: { key: idempotencyKey },
  });

  if (existing) {
    if (existing.status === 'pending') {
      // Another request is in-flight — return 409 asking client to wait
      return NextResponse.json(
        { error: 'Request in progress', retryAfterMs: 1000 },
        { status: 409 }
      );
    }
    // Return the cached response from the original request
    return NextResponse.json(existing.responseBody, { status: existing.statusCode! });
  }

  // Create a 'pending' record — unique constraint prevents double-insert
  try {
    await db.idempotencyKey.create({
      data: {
        key: idempotencyKey,
        status: 'pending',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h TTL
      },
    });
  } catch (err: any) {
    if (err.code === 'P2002') {
      // Unique constraint violation: concurrent request beat us here
      return NextResponse.json(
        { error: 'Duplicate request' },
        { status: 409 }
      );
    }
    throw err;
  }

  // Execute the actual handler
  let response: NextResponse;
  try {
    response = await handler(request);
  } catch (err) {
    // On error: delete the pending record so the client can retry
    await db.idempotencyKey.delete({ where: { key: idempotencyKey } });
    throw err;
  }

  // Persist the response and mark as complete
  const body = await response.json();
  await db.idempotencyKey.update({
    where: { key: idempotencyKey },
    data: {
      status: 'complete',
      statusCode: response.status,
      responseBody: body,
    },
  });

  return NextResponse.json(body, { status: response.status });
}
```

## When to Use
- All payment and billing mutations — charges, refunds, subscription changes; pass idempotency keys to Stripe AND enforce them in your own handlers
- Tenant provisioning and onboarding — a partial provision followed by a retry must not create duplicate database schemas
- Email and notification dispatch — a retry after a timeout must not send the same welcome email twice
- BullMQ job handlers for external API calls — BullMQ retries are at-least-once, so every job that calls a non-idempotent external API needs this pattern

## Common Mistakes
- **Using Redis as the idempotency store**: Redis (without AOF/RDB persistence) can lose data on restart; a double-charge caused by a lost Redis key is worse than a slightly slower PostgreSQL lookup
- **Not handling the concurrent case**: Two simultaneous requests with the same key both see "not found", both execute the operation — use a unique constraint + catch the unique violation
- **Key scope too broad**: An idempotency key should be scoped to one operation type; don't reuse the same key across different endpoints
- **Not returning the original response**: Returning `{ error: 'already processed' }` with status 200 is not idempotency — the client needs the original response body and status code to behave correctly

## Further Reading
- **Stripe API documentation — "Idempotent Requests"** — The best real-world description of how to implement and use idempotency keys correctly; shows exactly what to store and return
- **"The Idempotency-Key HTTP Header Field" (IETF draft)** — The emerging standard for how to communicate idempotency keys in HTTP; useful if you expose a public API
- **"Building reliable reprocessing and dead letter queues with Amazon SQS" (AWS blog)** — Though AWS-specific, the concepts apply directly to BullMQ: idempotency at the consumer side to make at-least-once queues effectively exactly-once
