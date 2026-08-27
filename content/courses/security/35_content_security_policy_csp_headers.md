# 35. Content Security Policy (CSP) Headers

## What It Is
Content Security Policy is an HTTP response header that tells the browser which content sources are allowed for the current page. It is delivered as a header (`Content-Security-Policy: ...`) and the browser enforces it: scripts from unlisted domains are blocked, inline `<script>` tags are blocked unless explicitly allowed, and any violation can be reported to a URL you control. CSP is the browser-side complement to server-side input sanitization: even if an attacker injects a `<script>` tag into your database, CSP prevents the browser from executing it.

The most important directive is `script-src`, which controls JavaScript execution. `default-src 'self'` blocks all content not from your own origin. `script-src 'nonce-{random}'` allows only script tags that carry a matching nonce attribute — this is the modern approach that allows inline scripts without `'unsafe-inline'`. Each request generates a fresh nonce (a cryptographically random value), which is passed to both the CSP header and to the scripts that need it. An attacker who injects a `<script>` tag cannot know the nonce for that request, so their script is blocked.

Getting CSP right is iterative. Start with `Content-Security-Policy-Report-Only` mode: the policy is evaluated but not enforced, and violations are sent to your report endpoint. This lets you discover what your own application depends on before you start blocking things. Third-party scripts (Stripe.js, Google Analytics, Intercom) each require additions to your policy. The goal is to progressively tighten the policy until you can enforce it without breaking the application.

## Key Concepts
- **`default-src`** — Fallback for all resource types not explicitly specified; set to `'self'` as a baseline
- **`script-src`** — Controls JavaScript execution; most important directive; avoid `'unsafe-inline'` and `'unsafe-eval'`
- **`style-src`** — Controls CSS; inline styles require either `'unsafe-inline'` (avoid) or nonces/hashes
- **`connect-src`** — Controls `fetch()`, XHR, WebSocket; must include your API domain and any third-party APIs your frontend calls
- **`frame-ancestors`** — Controls who can embed your page in an `<iframe>`; prefer this over the deprecated `X-Frame-Options`
- **Nonce-based CSP** — A per-request random value added to the header and to `<script nonce="...">` tags; blocks injected scripts
- **Report-Only mode** — `Content-Security-Policy-Report-Only` enforces nothing but sends violation reports to your `report-uri`; use this during rollout
- **`strict-dynamic`** — Allows scripts loaded by a nonce-trusted script to also load further scripts; simplifies policies for SPAs with dynamic imports

## Example Code
```tsx
// next.config.ts — CSP with nonce support via middleware

// middleware.ts — generate a nonce per request and set the CSP header
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');

  // Build the CSP policy
  // Start restrictive; expand as you discover violations via report-uri
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://js.stripe.com`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' data: https:`,
    `font-src 'self'`,
    `connect-src 'self' https://api.stripe.com https://*.your-saas.com`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com`,
    `frame-ancestors 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    // Report violations to your endpoint (use report-uri.com or self-host)
    `report-uri /api/csp-report`,
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  // Pass nonce to the page via a request header (read it in layout.tsx)
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Enforce in production, report-only in development
  const headerName =
    process.env.NODE_ENV === 'production'
      ? 'Content-Security-Policy'
      : 'Content-Security-Policy-Report-Only';

  response.headers.set(headerName, csp);
  return response;
}

export const config = {
  matcher: ['/((?!api/csp-report|_next/static|_next/image|favicon.ico).*)'],
};

// ─────────────────────────────────────────────────────────────────────────────

// app/layout.tsx — read the nonce and pass it to Next.js Script and style tags
import { headers } from 'next/headers';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = headers().get('x-nonce') ?? '';

  return (
    <html>
      <head>
        {/* Inline scripts must carry the nonce */}
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: 'window.__NONCE__ = "' + nonce + '"' }} />
      </head>
      <body>
        {children}
        {/* Third-party scripts use nonce strategy */}
        <Script
          src="https://js.stripe.com/v3/"
          strategy="afterInteractive"
          nonce={nonce}
        />
      </body>
    </html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

// app/api/csp-report/route.ts — collect CSP violations for analysis
import { NextRequest, NextResponse } from 'next/server';
import Logger from '@/libs/logger';

export async function POST(req: NextRequest) {
  try {
    const report = await req.json();
    Logger.warn('[CSP Violation]', report['csp-report'] ?? report);
  } catch {
    // Malformed report — ignore
  }
  return new NextResponse(null, { status: 204 });
}
```

## When to Use
- Every Next.js application that renders user-generated content (tenant names, profile data, any markdown or HTML content)
- Before enabling stored content that users can format or embed (rich text editors, user-uploaded HTML)
- As part of a security hardening pass before launching to enterprise customers
- Start with Report-Only mode on any existing application to discover violations before enforcing

## Common Mistakes
- **`'unsafe-inline'` in `script-src`** — This negates most of the protection CSP offers; use nonces or hashes instead, even if it requires more setup
- **Setting CSP in `next.config.ts` headers array** — This works for static responses but does not support nonces (which require a per-request value); use middleware for nonce-based CSP
- **Forgetting `connect-src` for your API domain** — Your frontend's `fetch()` calls to `/api/...` will be blocked by CSP if `connect-src` only has `'self'` and your API is on a different subdomain
- **One policy for all routes** — Some pages (the admin panel, the marketing site) have different third-party script needs; consider per-route CSP via middleware path matching

## Further Reading
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Next.js CSP documentation with nonce support](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Google CSP Evaluator](https://csp-evaluator.withgoogle.com/)
