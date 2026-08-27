# 87. Payment Integration Depth — Webhook Idempotency, Dispute Handling

## What It Is
Payment integrations have two layers: the happy path (customer pays, you record it, you unlock access) and the adversarial path (webhook retries, duplicate events, chargebacks, fraud, network timeouts, provider outages). Most developers implement the happy path competently and leave the adversarial path to chance. The adversarial path is where real money is lost.

Webhook idempotency is the guarantee that processing the same webhook event twice produces exactly the same outcome as processing it once. Payment providers retry webhook delivery — Stripe retries up to 25 times over 72 hours. If your handler is not idempotent, a transient failure followed by a successful retry can result in double-charged subscriptions, double-sent confirmation emails, or double-provisioned access. The idempotency key pattern solves this at the database level: before processing any event, attempt to insert the event ID into an idempotency log; if the insert fails (unique constraint violation), the event was already processed and you return 200 without re-processing.

Dispute handling (chargebacks) is the part of payment processing that most integrations ignore completely until the first chargeback arrives. A chargeback occurs when a cardholder disputes a charge with their bank. The bank reverses the payment and the merchant loses the funds plus a dispute fee ($15–$35 per dispute from Stripe). You have a response window (typically 7–21 days depending on the card network) to submit evidence. Automating the evidence collection — subscription records, login logs, IP addresses, email confirmations — is the difference between a dispute you win and one you lose by default.

## Key Concepts
- **Webhook signature verification**: Every incoming webhook should have its signature verified against your provider's secret before any processing; skipping this allows attackers to forge payment events
- **Idempotency key**: A unique identifier per logical operation (Stripe uses `Idempotency-Key` header; your own operations need equivalent protection) — guarantees at-most-once or exactly-once semantics
- **Event deduplication log**: A database table storing processed event IDs with a unique constraint; the insert attempt is the idempotency check
- **Stripe event types to handle**: `payment_intent.succeeded`, `payment_intent.payment_failed`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted`, `charge.dispute.created`, `charge.dispute.updated`, `charge.refunded`
- **Dispute state machine**: `charge.dispute.created` → evidence submitted → `charge.dispute.closed` (won/lost/withdrawn); automate evidence gathering on creation
- **Retry-safe handlers**: Every webhook handler must be designed assuming it may be called multiple times for the same event; side effects (emails, provisioning, database writes) must be guarded
- **Payment failure dunning**: When a subscription renewal fails, the dunning sequence (automatic retry + email sequence) determines how much MRR you recover; configure this in Stripe's retry settings, not in custom code
- **Provider abstraction for dispute handling**: If your provider abstraction pattern covers payments, it should also cover dispute webhooks — otherwise dispute handling becomes provider-specific siloed code

## Example Code or Template

```typescript
// Webhook handler with signature verification, idempotency, and dispute handling
// File: app/api/webhooks/stripe/route.ts

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ============================================================
// 1. SIGNATURE VERIFICATION
// ============================================================
async function verifyStripeSignature(request: NextRequest): Promise<Stripe.Event> {
  const body = await request.text(); // must be raw body, not parsed JSON
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    throw new Error('Missing stripe-signature header');
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET! // set this in Stripe dashboard -> Webhooks
  );
}

// ============================================================
// 2. IDEMPOTENCY KEY — event deduplication
// ============================================================
async function markEventProcessed(eventId: string): Promise<boolean> {
  try {
    await db.webhookEvent.create({
      data: {
        eventId,
        processedAt: new Date(),
        provider: 'stripe',
      },
    });
    return true; // event was not previously processed
  } catch (error: any) {
    // Unique constraint violation — event already processed
    if (error.code === 'P2002') {
      return false;
    }
    throw error; // unexpected error — rethrow
  }
}

// ============================================================
// 3. DISPUTE EVIDENCE AUTOMATION
// ============================================================
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const chargeId = dispute.charge as string;

  // Gather evidence from your own database
  const charge = await stripe.charges.retrieve(chargeId, {
    expand: ['customer', 'payment_intent'],
  });

  const customerId = charge.customer as string;
  const tenantSubscription = await db.tenantSubscription.findFirst({
    where: { stripeCustomerId: customerId },
    include: { tenant: true },
  });

  if (!tenantSubscription) {
    console.error(`No subscription found for disputed charge ${chargeId}`);
    return;
  }

  // Collect access logs for the disputed period
  const disputedPeriodStart = new Date(dispute.created * 1000);
  disputedPeriodStart.setMonth(disputedPeriodStart.getMonth() - 1);

  const accessLogs = await db.userSession.findMany({
    where: {
      tenantId: tenantSubscription.tenantId,
      createdAt: { gte: disputedPeriodStart },
    },
    select: { createdAt: true, ipAddress: true, userAgent: true },
    take: 50,
  });

  // Format evidence string
  const evidenceSummary = [
    `Subscription ID: ${tenantSubscription.id}`,
    `Plan: ${tenantSubscription.planId}`,
    `Started: ${tenantSubscription.startedAt.toISOString()}`,
    `Login count in billing period: ${accessLogs.length}`,
    `First login: ${accessLogs[0]?.createdAt.toISOString() ?? 'N/A'}`,
    `Last login: ${accessLogs.at(-1)?.createdAt.toISOString() ?? 'N/A'}`,
  ].join('\n');

  // Submit evidence to Stripe immediately (before the deadline)
  await stripe.disputes.update(dispute.id, {
    evidence: {
      customer_name: tenantSubscription.tenant.name,
      customer_email_address: tenantSubscription.tenant.email ?? '',
      service_documentation: evidenceSummary,
      refund_policy_disclosure:
        'Service was actively used during the billing period as evidenced by session logs.',
      uncategorized_text: evidenceSummary,
    },
    submit: false, // set to true when you are confident in your evidence template
  });

  // Alert yourself
  await db.auditLog.create({
    data: {
      action: 'DISPUTE_CREATED',
      tenantId: tenantSubscription.tenantId,
      metadata: { disputeId: dispute.id, amount: dispute.amount, reason: dispute.reason },
    },
  });
}

// ============================================================
// 4. MAIN WEBHOOK HANDLER
// ============================================================
export async function POST(request: NextRequest): Promise<NextResponse> {
  let event: Stripe.Event;

  try {
    event = await verifyStripeSignature(request);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check — return 200 if already processed
  const isNew = await markEventProcessed(event.id);
  if (!isNew) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.updated':
        // Log outcome when dispute closes
        const dispute = event.data.object as Stripe.Dispute;
        if (dispute.status === 'lost' || dispute.status === 'won') {
          await db.auditLog.create({
            data: {
              action: `DISPUTE_${dispute.status.toUpperCase()}`,
              metadata: { disputeId: dispute.id, amount: dispute.amount },
            },
          });
        }
        break;

      default:
        // Unhandled event type — log and return 200 (do NOT return 4xx for unknown events)
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (error) {
    // Return 500 to trigger Stripe's retry mechanism
    console.error(`Failed to process event ${event.id}:`, error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// Stub implementations referenced above
async function handleSubscriptionCancelled(_sub: Stripe.Subscription) { /* ... */ }
async function handlePaymentFailed(_invoice: Stripe.Invoice) { /* ... */ }
```

## When to Use
- Every new payment provider integration — implement signature verification and idempotency before implementing any business logic; these are not optional
- When setting up a new Stripe webhook endpoint in the dashboard — register all event types you intend to handle; test with the Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`)
- When a production payment incident occurs — the audit log and event deduplication table are your diagnostic tools; design them to be queryable before you need them
- When reviewing a contractor's payment integration — check for idempotency handling and signature verification first; these are the most common critical omissions
- When adding a new event type to an existing webhook handler — always check whether the handler is idempotent for the new type before deploying

## Common Mistakes
- **Using `request.json()` for webhook body**: Stripe signature verification requires the raw request body; using `request.json()` parses it first and the bytes do not match the signature — always use `request.text()` or `request.arrayBuffer()`
- **Returning 4xx for unhandled event types**: Returning 4xx tells Stripe the webhook failed and triggers retries; return 200 for unhandled event types and log them — only return 500 when you want a retry
- **Idempotency at the application level only (not database)**: Race conditions between concurrent webhook deliveries can bypass application-level checks; the unique constraint at the database level is the only reliable guard
- **Waiting to collect dispute evidence**: The dispute window (7–21 days) feels long but Stripe requires evidence before the deadline; automate evidence collection on `charge.dispute.created` so the evidence is always ready when you need to submit

## Further Reading
- [**Stripe Webhook Documentation](https://stripe.com/docs/webhooks)** — The canonical reference; the "Best practices" section covers idempotency, retry handling, and signature verification with production-grade examples
- **"Stripe's Approach to Idempotency" — stripe.com/blog/idempotency** — Stripe's own engineering blog post explaining the full theory of idempotency keys and how they implement it at scale; directly applicable to your own API design
- [**PayPal Webhook Verification Documentation](https://developer.paypal.com)** — The equivalent reference for PayPal; their verification approach differs from Stripe (certificate-based rather than HMAC) — worth reading if you extend your PayPal integration
- [Stripe: idempotent requests](https://docs.stripe.com/api/idempotent_requests) — how a payment provider actually implements the guarantee you are relying on
