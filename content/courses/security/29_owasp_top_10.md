# 29. OWASP Top 10 — Practical Application

## Coverage Level
**Partial** — You have Zod validation on inputs (A03: Injection), bcrypt for passwords (A07: Identification Failures), Prisma/TypeORM parameterized queries (A03: SQL Injection), CSRF token handling in your Axios client, and impersonation audit trails. The gaps are structural: there is no systematic checklist applied across the codebase, and several categories (A08: Software and Data Integrity, A09: Logging/Monitoring Failures, A05: Security Misconfiguration) have no specific mitigations visible.

## What It Is
The OWASP Top 10 is a consensus document published by the Open Web Application Security Project that lists the ten most critical web application security risk categories. It is not a law or certification requirement, but it has become the de facto baseline checklist that security auditors, enterprise clients, and bug bounty programs use when evaluating a web application. As a SaaS selling to businesses, you will eventually encounter a customer security review questionnaire that maps directly to these categories.

The value of the OWASP Top 10 is not the specific rankings (they shift between editions) but the framing: each category is a class of vulnerability with a common root cause. A01 (Broken Access Control) has one root cause: authorization checks are applied inconsistently. A02 (Cryptographic Failures) has one root cause: sensitive data is not adequately protected in transit or at rest. Once you understand the root cause, you can audit your own codebase systematically rather than playing whack-a-mole with individual bugs.

For your specific stack, the highest-risk categories to address systematically are A01 (missing authorization checks on multi-tenant endpoints — does every tenant API route verify the user belongs to that tenant?), A05 (security headers — CSP, HSTS, X-Frame-Options are not set), and A09 (your Winston logger writes events but there is no alerting on suspicious patterns like repeated failed logins or abnormal impersonation usage).

## Key Concepts
- **A01 Broken Access Control** — Functions are accessible to users who should not be allowed to call them; the most common finding in real audits
- **A02 Cryptographic Failures** — Sensitive data exposed due to weak/missing encryption: HTTP instead of HTTPS, weak ciphers, secrets in logs
- **A03 Injection** — User input reaches an interpreter (SQL, shell, LDAP) without sanitization; Prisma + TypeORM + Zod covers this for you
- **A04 Insecure Design** — Architecture-level flaws that cannot be patched away; requires threat modeling at design time
- **A05 Security Misconfiguration** — Default settings, missing headers, verbose error messages in production, open S3 buckets
- **A06 Vulnerable Components** — Outdated npm packages with known CVEs; `npm audit` catches these
- **A07 Authentication Failures** — Weak passwords, no MFA, credential stuffing; your TOTP/WebAuthn work addresses this
- **A08 Software and Data Integrity** — No integrity checks on CI/CD pipeline, unsigned packages, auto-updating without verification
- **A09 Logging and Monitoring Failures** — Attacks succeed silently; no alerting on anomalous patterns
- **A10 SSRF** — Server fetches attacker-controlled URLs, reaching internal services; your `libs/axios/` has no SSRF mitigations

## Example Code
```typescript
// A01 — Tenant authorization guard: apply this to every tenant-scoped route
// modules/tenant/guards/tenant-auth.guard.ts
import { NextRequest, NextResponse } from 'next/server';
import TenantSessionNextService from '@/modules/tenant_session/tenant_session.service.next';

type Handler = (req: NextRequest, ctx: { tenantId: string; userId: string }) => Promise<NextResponse>;

export function withTenantAuth(
  requiredRole: 'USER' | 'ADMIN' | 'OWNER',
  handler: Handler
) {
  return async (req: NextRequest, { params }: { params: { tenantId: string } }) => {
    try {
      const session = await TenantSessionNextService.authenticateForTenant(
        req,
        params.tenantId,
        requiredRole
      );
      return handler(req, { tenantId: params.tenantId, userId: session.user.userId });
    } catch {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  };
}

// Usage: every tenant route MUST use this wrapper — not just some of them
// app/api/tenant/[tenantId]/members/route.ts
export const GET = withTenantAuth('USER', async (req, { tenantId }) => {
  const members = await TenantMemberService.getAll(tenantId);
  return NextResponse.json(members);
});

// ─────────────────────────────────────────────────────────────────────────────

// A05 — Security headers middleware (Next.js next.config.ts)
const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Content-Security-Policy — see item 35 for the full treatment
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
];

// next.config.ts
export default {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

// ─────────────────────────────────────────────────────────────────────────────

// A09 — Anomaly detection in your audit log
// Trigger an alert when a user fails login more than N times
async function checkLoginAnomalies(userId: string): Promise<void> {
  const recentFailures = await AuditLogService.countRecentByActorAndAction({
    actorId: userId,
    action: 'AUTH_LOGIN_FAILED',
    withinSeconds: 300,
  });
  if (recentFailures >= 5) {
    Logger.warn('[Security] Repeated login failures detected', { userId, count: recentFailures });
    // Enqueue alert email to security team / account owner
  }
}
```

## When to Use
- Before launching to paying customers: run through the checklist once end-to-end
- When adding a new module or data type: check A01 (is it properly tenant-scoped?) and A03 (are inputs validated?)
- Before a customer security review or SOC 2 audit: map your existing controls to each category
- When onboarding a new developer: use the Top 10 as a shared vocabulary for code review comments

## Common Mistakes
- **Treating OWASP as a one-time exercise** — New code introduces new risks; security review should be part of your PR template
- **Focusing only on A03 (Injection)** — SQL injection is well-understood and your ORM covers it; A01 (access control) is statistically the most common real-world finding
- **Verbose error messages in production** — Stack traces and internal identifiers in API error responses are an A05 misconfiguration; return generic messages to clients
- **Assuming HTTPS = cryptographic safety** — A02 also covers secrets in logs, unencrypted PII at rest, and weak JWT signing keys; HTTPS is just one layer

## Further Reading
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS (Application Security Verification Standard)](https://owasp.org/www-project-application-security-verification-standard/)
- [PortSwigger Web Security Academy — free labs for each category](https://portswigger.net/web-security)
