# 88. Email Deliverability — SPF, DKIM, DMARC, Bounce Management

## What It Is
Email deliverability is the probability that an email you send will arrive in the recipient's inbox rather than their spam folder or nowhere at all. It is a separate concern from email sending: you can have a working mail service that sends emails successfully, and still have a deliverability problem that causes 30–40% of your emails to hit spam. Most developers discover this when a client complains that they never received a password reset email — and by then, your sending domain's reputation may already be damaged.

The foundational layer of deliverability is DNS authentication: three records that prove to receiving mail servers that your email is legitimately sent from your domain and that nobody is spoofing it. SPF (Sender Policy Framework) lists which mail servers are authorized to send email on behalf of your domain. DKIM (DomainKeys Identified Mail) adds a cryptographic signature to every outgoing email that the receiving server verifies. DMARC (Domain-based Message Authentication, Reporting, and Conformance) tells receiving servers what to do with emails that fail SPF or DKIM checks, and sends you reports about who is sending email using your domain.

Beyond DNS authentication, the two factors that degrade deliverability over time are bounces and complaints. A bounce rate above 2% signals to inbox providers that you are sending to bad email addresses — which looks like spam behavior. A complaint rate above 0.08% (Postmaster Tools threshold) puts you at risk of being blocked entirely by Gmail. Handling bounces and complaints requires processing feedback webhooks from your email service provider (Resend, SendGrid, SES), suppressing bounced addresses automatically, and never sending to an address that marked your email as spam.

## Key Concepts
- **SPF record**: DNS TXT record listing authorized sending IP addresses; receiving servers reject mail from IPs not on the list; only one SPF record allowed per domain
- **DKIM**: Two keys — private key held by your email provider signs each outgoing message; public key in DNS is used by receivers to verify the signature; each selector can be different per provider
- **DMARC**: DNS TXT record specifying policy (`p=none`, `p=quarantine`, `p=reject`) and reporting email; start with `p=none` to observe before enforcing
- **DMARC alignment**: Either SPF or DKIM must align with the From domain for DMARC to pass; misalignment is a common misconfiguration when using third-party senders
- **Hard bounce**: Email address does not exist — permanently undeliverable; must be suppressed immediately and never retried
- **Soft bounce**: Temporary failure (mailbox full, server down) — can retry with backoff, but after 3–5 soft bounces treat as hard bounce
- **Complaint/spam report**: Recipient marked your email as spam; suppress immediately and never send to that address again
- **Warm-up**: When starting a new sending domain or IP, send low volumes first and increase gradually; sudden high volume from a new domain triggers spam filters
- **Email subdomains for transactional**: Use a subdomain (mail.yourdomain.com or notifications.yourdomain.com) for transactional email so a reputation problem does not affect your main domain

## Example Code or Template

```typescript
// Bounce and complaint webhook handler
// Provider: Resend (resend.com) — adapt for SendGrid or SES

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/libs/db';

// Resend webhook event types relevant to deliverability
type ResendWebhookEvent =
  | { type: 'email.bounced'; data: { email_id: string; to: string[]; bounce: { type: 'hard' | 'soft' } } }
  | { type: 'email.complained'; data: { email_id: string; to: string[] } }
  | { type: 'email.delivery_delayed'; data: { email_id: string; to: string[] } };

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify webhook signature (Resend sends Svix-Signature header)
  const svixSignature = request.headers.get('svix-signature');
  if (!svixSignature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
  }

  const body = await request.json() as ResendWebhookEvent;

  switch (body.type) {
    case 'email.bounced': {
      const addresses = body.data.to;
      const bounceType = body.data.bounce.type;

      for (const email of addresses) {
        if (bounceType === 'hard') {
          // Hard bounce: suppress permanently, mark in DB
          await db.emailSuppression.upsert({
            where: { email },
            create: {
              email,
              reason: 'hard_bounce',
              suppressedAt: new Date(),
              permanent: true,
            },
            update: {
              reason: 'hard_bounce',
              suppressedAt: new Date(),
              permanent: true,
            },
          });

          // Optionally mark user account for review
          const user = await db.user.findUnique({ where: { email } });
          if (user) {
            await db.user.update({
              where: { id: user.id },
              data: { emailBounced: true, emailBouncedAt: new Date() },
            });
          }
        } else {
          // Soft bounce: increment counter, suppress after threshold
          const record = await db.emailSuppression.upsert({
            where: { email },
            create: { email, reason: 'soft_bounce', softBounceCount: 1, suppressedAt: new Date(), permanent: false },
            update: { softBounceCount: { increment: 1 }, suppressedAt: new Date() },
          });

          if (record.softBounceCount >= 5) {
            await db.emailSuppression.update({
              where: { email },
              data: { reason: 'repeated_soft_bounce', permanent: true },
            });
          }
        }
      }
      break;
    }

    case 'email.complained': {
      // Complaint = user marked as spam: suppress immediately, no retries ever
      for (const email of body.data.to) {
        await db.emailSuppression.upsert({
          where: { email },
          create: {
            email,
            reason: 'spam_complaint',
            suppressedAt: new Date(),
            permanent: true,
          },
          update: {
            reason: 'spam_complaint',
            suppressedAt: new Date(),
            permanent: true,
          },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}

// ============================================================
// Email sending guard — check suppression list before every send
// ============================================================
async function isSuppressed(email: string): Promise<boolean> {
  const record = await db.emailSuppression.findUnique({ where: { email } });
  return record?.permanent === true;
}

// Wrap your notification_mail service with this check:
export async function sendTransactionalEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (await isSuppressed(params.to)) {
    console.warn(`Email suppressed for ${params.to} — skipping send`);
    return { sent: false, reason: 'suppressed' };
  }
  // ... your existing email sending logic
  return { sent: true };
}
```

```
# DNS Records Checklist for a new sending domain

Domain: yourdomain.com
Sending subdomain: mail.yourdomain.com (recommended)

## SPF Record
Type: TXT
Name: mail.yourdomain.com (or @ for root domain)
Value: "v=spf1 include:_spf.resend.com ~all"
       (replace _spf.resend.com with your provider's include)

## DKIM Record
Type: CNAME (for Resend) or TXT (for SES)
Name: resend._domainkey.mail.yourdomain.com
Value: (provided by your email service provider in their dashboard)

## DMARC Record
Type: TXT
Name: _dmarc.yourdomain.com
Value: "v=DMARC1; p=none; rua=mailto:dmarc-reports@yourdomain.com; pct=100"

Start with p=none (observe only).
After 2–4 weeks of clean reports, move to p=quarantine.
After another 2–4 weeks, move to p=reject.

## Verification commands
nslookup -type=TXT mail.yourdomain.com
dig TXT _dmarc.yourdomain.com
```

## When to Use
- Before launching any SaaS product that sends transactional email — set up SPF, DKIM, and DMARC before the first email is sent; retrofitting authentication to a domain with existing reputation problems is harder
- When password reset, email verification, or subscription notification emails are reported as going to spam — the first place to check is DMARC alignment and the second is bounce rate
- When adding a new email service provider or changing providers — DKIM selector and SPF includes must be updated; both old and new DKIM selectors should be active during the transition
- When a client asks you to set up their transactional email infrastructure — a DNS authentication setup is a billable deliverable that most agencies skip, creating future problems
- Monthly — review DMARC aggregate reports (sent to your `rua` address) for unexpected senders using your domain; this is also how you detect email spoofing attacks

## Common Mistakes
- **Using the root domain for transactional email**: If transactional email reputation suffers (one bad campaign), it can affect deliverability for human-sent emails from the same domain; use a subdomain (notifications.yourdomain.com) to isolate reputation
- **Setting DMARC to `p=reject` on day one**: If your SPF or DKIM is misconfigured (common), `p=reject` means legitimate emails are silently dropped; start with `p=none` and promote to quarantine and reject only after validating reports
- **Not processing bounce webhooks**: Your email provider suppresses bounced addresses in their system, but if your application retries a send (e.g., for a reminder email), you may be hitting hard-bounced addresses from your own logic — the suppression table in your own database is necessary
- **Forgetting email authentication when switching providers**: Each provider has its own DKIM key; switching from SendGrid to Resend requires adding new DKIM DNS records before removing old ones — gaps in DKIM coverage cause deliverability drops

## Further Reading
- [Resend: domain setup and authentication docs](https://resend.com/docs/dashboard/domains/introduction) — provider-specific but covers the universal principles; includes the SPF/DKIM/DMARC records you actually have to publish
- [**"Postmaster Tools" — Google](https://postmaster.google.com)** — Free tool from Google that shows your domain and IP reputation as Gmail sees it; sign up and verify your domain before your first real send
- [**MxToolbox](https://mxtoolbox.com/EmailHeaders.aspx)** — Free tool for testing SPF, DKIM, and DMARC configuration; paste an email header and see whether authentication passed or failed and why
