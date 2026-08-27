# 38. Penetration Testing Process

## What It Is
Penetration testing (pentest) is the practice of attacking your own application with the explicit goal of finding security vulnerabilities before real attackers do. It differs from a security audit (reviewing code and architecture) in that it involves actually attempting to exploit vulnerabilities, not just identifying them theoretically. A pentest tells you not just what could go wrong, but what an attacker can actually achieve against your current deployment.

A pentest has a defined scope (what is in-scope to test), a methodology (black-box/white-box/grey-box), and a report format (findings, severity ratings, reproduction steps, remediation recommendations). Black-box testing simulates an attacker with no prior knowledge of your system — they get a URL and nothing else. White-box testing provides the tester with source code, architecture diagrams, and credentials — it is more thorough and finds more vulnerabilities. Grey-box is in between: the tester gets user-level credentials and knows the general technology stack.

For a solo developer, the practical path is: (1) self-pentest using OWASP-aligned checklists and free tools (Burp Suite Community, OWASP ZAP, sqlmap); (2) bug bounty program (invite security researchers to find vulnerabilities in exchange for recognition or payment); (3) professional pentest before major enterprise sales or compliance certifications. Professional pentests for a SaaS of your size typically cost $5,000–$20,000 and take 1–2 weeks.

## Key Concepts
- **Scope definition** — Which URLs, APIs, and features are in-scope; what attack types are permitted (no DDoS, no social engineering of employees); defines what the tester can legally do
- **Black-box testing** — Tester has no prior knowledge; closest to a real external attacker; misses internal vulnerabilities
- **White-box testing** — Full source code and architecture provided; most thorough; good for finding logic flaws and authorization bugs
- **Reconnaissance** — Mapping the attack surface: discovering API endpoints, identifying technologies, finding exposed admin panels
- **OWASP WSTG (Web Security Testing Guide)** — The standard methodology checklist for web application pentests; maps to the Top 10 categories
- **Burp Suite** — The industry-standard proxy tool for intercepting, replaying, and fuzzing HTTP requests; Community edition is free
- **CVSS score** — Common Vulnerability Scoring System; standardized 0-10 severity rating used in pentest reports
- **Rules of Engagement** — Written agreement defining what the tester is allowed to do; required before any testing to avoid legal issues

## Example Code
```typescript
// This section focuses on tools and process rather than code.
// The "code" here is a self-pentest checklist you can run against your own app.

/*
SELF-PENTEST CHECKLIST FOR YOUR SAAS
Run these manually using Burp Suite Community or curl.
Check each item against your deployed staging environment.

═══ AUTHENTICATION ══════════════════════════════════════════════════════════
[ ] Brute force: can you make unlimited login attempts without lockout?
    Test: POST /api/auth/login 100 times with wrong password
    Expected: rate limiter triggers (your libs/limiter/ should handle this)

[ ] Password reset token: is it guessable or predictable?
    Test: request two reset tokens; check if they follow a pattern
    Expected: cryptographically random (crypto.randomBytes(32))

[ ] JWT tampering: modify the token payload without changing the signature
    Test: decode JWT, change userId, re-encode with 'none' algorithm
    Expected: signature verification rejects the tampered token

[ ] Session fixation: can you set a session ID before login and have it
    persist after login?
    Expected: new session created on login, old one invalidated

═══ AUTHORIZATION ═══════════════════════════════════════════════════════════
[ ] IDOR (Insecure Direct Object Reference): access another tenant's data
    Test: as tenant A, request GET /api/tenant/{tenantB_id}/members
    Expected: 403 Forbidden — not tenant A's resources

[ ] Privilege escalation: can a MEMBER perform ADMIN actions?
    Test: as tenant MEMBER, call DELETE /api/tenant/{id}/members/{userId}
    Expected: 403 Forbidden — insufficient role

[ ] Impersonation abuse: can a tenant ADMIN impersonate a system admin?
    Test: call the impersonation endpoint with a system admin's userId
    Expected: impersonation only works for system admins

═══ INPUT VALIDATION ════════════════════════════════════════════════════════
[ ] Mass assignment: add extra fields to registration
    Test: POST /api/auth/register with {"email":"...","password":"...","userRole":"ADMIN"}
    Expected: userRole ignored (Zod strips unknown keys)

[ ] XSS: inject script tags into user-controlled fields
    Test: set name to '<script>alert(1)</script>'
    Expected: stored as literal text, never executed

[ ] Path traversal: try ../../etc/passwd in file path parameters
    Expected: 400 or 404, no file system access

═══ BUSINESS LOGIC ══════════════════════════════════════════════════════════
[ ] Free tier abuse: can you create unlimited tenants / bypass subscription limits?
[ ] Invitation abuse: can you accept an invitation meant for another email?
[ ] Payment bypass: can you access paid features without a valid subscription?

═══ INFRASTRUCTURE ══════════════════════════════════════════════════════════
[ ] Exposed admin panels: check /admin, /_next, /phpmyadmin, /.env
    Expected: all return 404 or 403
[ ] HTTP security headers: check with securityheaders.com
    Expected: HSTS, X-Frame-Options, X-Content-Type-Options all present
[ ] TLS: check with ssllabs.com/ssltest
    Expected: A or A+ rating
*/

// Automated scan you can run today — OWASP ZAP baseline scan
// docker run -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py \
//   -t https://your-staging-url.com \
//   -r zap-report.html
```

## When to Use
- Before your first enterprise customer signs a contract (they often require it in the security questionnaire)
- Before applying for SOC 2 Type II or ISO 27001 certification
- After any major new feature that handles payments, personal data, or cross-tenant operations
- As a self-review exercise: run the checklist above against your staging environment quarterly

## Common Mistakes
- **Pentesting production** — Always test on staging; a successful injection or privilege escalation in production affects real users and real data
- **Not having a written scope/rules of engagement** — Without a document signed by you authorizing the tester, a pentest is legally indistinguishable from unauthorized access; even self-testing should be documented
- **Treating a clean pentest as permanent security** — A clean pentest on today's codebase says nothing about tomorrow's; new features introduce new attack surface
- **Hiring the cheapest option** — Automated scanner results sold as a "pentest" do not find business logic flaws, authorization bypasses, or race conditions; the value is in the human tester's creativity

## Further Reading
- [OWASP Web Security Testing Guide (WSTG)](https://owasp.org/www-project-web-security-testing-guide/)
- [PortSwigger Burp Suite Community Edition](https://portswigger.net/burp/communitydownload)
- [OWASP ZAP — free automated scanner](https://www.zaproxy.org/)
