# 22. HTTP/2 Multiplexing and Effect on Next.js

## What It Is
HTTP/2 is a major revision of the HTTP protocol that fundamentally changes how browsers and servers communicate. The headline feature is **multiplexing**: multiple requests and responses can be in-flight simultaneously over a single TCP connection. In HTTP/1.1, the browser could make 6–8 connections per domain (depending on the browser) and each connection could carry one request at a time. This led to optimization techniques like bundling all JavaScript into a single file (to reduce requests), domain sharding (spreading assets across multiple domains to get more connections), and sprite sheets (combining many images to reduce requests). With HTTP/2, these techniques become counterproductive.

HTTP/2 also introduced **header compression** (HPACK), which significantly reduces the overhead of repetitive headers (like `Cookie`, `Authorization`, `Accept`) sent with every request. **Server push** allowed servers to proactively send assets the browser hadn't yet requested — but this feature was effectively abandoned due to poor performance in practice and was removed from Chrome. **Stream prioritization** allowed the server to signal which resources are more important — important for LCP (Largest Contentful Paint) optimization.

For a Next.js app specifically, HTTP/2 means you should prefer many small, precisely split chunks over one large bundle. The old advice "minimize the number of requests" applied to HTTP/1.1. Under HTTP/2, sending 20 small JS chunks is roughly as fast as sending 1 large one — and has the advantage that only changed chunks need to be re-downloaded on deploy. Vercel enables HTTP/2 by default. When self-hosting, you need nginx or Caddy with HTTP/2 configured.

## Key Concepts
- **Multiplexing**: Multiple request/response pairs in parallel over a single TCP connection; eliminates HTTP/1.1's head-of-line blocking at the HTTP layer
- **Stream**: One request/response pair within an HTTP/2 connection; streams are multiplexed, not serialized
- **HPACK compression**: HTTP/2 compresses headers using a shared context; repetitive headers (Cookie, Authorization) are compressed dramatically
- **Head-of-line blocking (HTTP layer)**: HTTP/1.1's problem — a slow response blocks subsequent responses on the same connection; HTTP/2 solves this at the HTTP layer (but not TCP layer)
- **HOL blocking (TCP layer)**: HTTP/2 over TCP still suffers from TCP head-of-line blocking if a packet is lost; HTTP/3 (over QUIC/UDP) fixes this
- **HTTP/3 / QUIC**: The successor; uses UDP instead of TCP to eliminate TCP HOL blocking; supported on Cloudflare, Vercel, and modern CDNs
- **Domain sharding**: HTTP/1.1 trick of using multiple domains to get more connections — counterproductive under HTTP/2, reduces header compression efficiency
- **Resource hints**: `<link rel="preload">` and `<link rel="modulepreload">` are the modern equivalent of server push — explicitly tell the browser what to fetch next

## Example Code
```typescript
// Practical HTTP/2 optimizations in Next.js

// ─── 1. next.config.ts: enable correct HTTP/2 features ───
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js App Router already does automatic code splitting per route — good HTTP/2 behavior
  // Don't disable it for the sake of "fewer requests" (that's HTTP/1.1 thinking)

  experimental: {
    // optimizeCss: true, // Enables CSS optimization (requires critters)
  },

  // HTTP headers — security + cache-control as discussed in item 21
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Tells browsers to use HTTP/2 or HTTP/3 for subsequent connections
          { key: 'Alt-Svc', value: 'h3=":443"; ma=2592000' }, // HTTP/3 advertisement
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        // Immutable assets (hashed filenames from Next.js build) — cache forever
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

export default nextConfig;

// ─── 2. Resource hints for HTTP/2 push substitute ───
// In your root layout.tsx — preload critical resources

import type { Metadata } from 'next';

export const metadata: Metadata = {
  // Next.js 14+ supports preload links via metadata
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Preload critical font — browser fetches this immediately, parallel with HTML parse */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        {/* Prefetch next page's data when user hovers a link (speculation) */}
        {/* Next.js Link component does this automatically — don't duplicate */}
      </head>
      <body>{children}</body>
    </html>
  );
}

// ─── 3. Checking if your server is actually using HTTP/2 ───
// Run in your terminal:
// curl -I --http2 https://yourdomain.com
// Look for: HTTP/2 200

// Or in Chrome DevTools → Network tab → right-click column header → "Protocol"
// Should show "h2" for HTTP/2 or "h3" for HTTP/3

// ─── 4. nginx configuration for HTTP/2 (self-hosted) ───
/*
server {
    listen 443 ssl http2;  # Enable HTTP/2 on HTTPS
    server_name yourdomain.com;

    ssl_certificate     /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # HTTP/2 push (limited usefulness — use <link rel="preload"> instead)
    # http2_push_preload on;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;  # Proxy to Next.js using HTTP/1.1 (internal)
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
*/

// ─── 5. Avoid HTTP/1.1-era anti-patterns ───

// BAD (HTTP/1.1 thinking): combining all icons into a sprite to reduce requests
// Under HTTP/2, individual SVG imports are fine — the browser fetches them in parallel

// GOOD (HTTP/2 thinking): import SVGs individually via bundler
// Each route's JS bundle is separately cacheable — only changed files re-download on deploy

// BAD: domain sharding for static assets
// const CDN_DOMAIN = Math.random() > 0.5 ? 'cdn1.example.com' : 'cdn2.example.com';
// This adds DNS lookups and breaks HTTP/2 header compression

// GOOD: single origin for all assets, let HTTP/2 multiplex
const ASSET_URL = 'https://cdn.yourdomain.com'; // One domain, HTTP/2 multiplexing handles concurrency
```

## When to Use
- When profiling your Next.js app's network waterfall and seeing unnecessary serialized requests — verify HTTP/2 is actually active (not just assumed)
- When self-hosting with nginx — HTTP/2 requires explicit configuration; it's not automatic over HTTP/1.1
- When optimizing for Core Web Vitals LCP — preload critical fonts and images using resource hints instead of relying on the browser to discover them
- When evaluating CDN providers — HTTP/3 support (Cloudflare, Vercel) can measurably reduce connection latency for users on mobile networks with packet loss

## Common Mistakes
- **Assuming HTTP/2 is enabled on all environments**: Vercel enables it automatically; a self-hosted nginx without `http2` in the `listen` directive is still HTTP/1.1
- **Still bundling everything into one chunk "to reduce requests"**: Next.js App Router's automatic code splitting is designed for HTTP/2; overriding it with a custom webpack chunk configuration that produces fewer, larger bundles is an HTTP/1.1 optimization applied incorrectly
- **Domain sharding for CDN assets**: Splitting assets across `cdn1.example.com` and `cdn2.example.com` defeats HTTP/2 connection reuse and header compression; use a single CDN origin
- **Relying on server push**: HTTP/2 server push was theoretically useful but performed poorly in practice (browsers would push-and-discard cached resources); use `<link rel="preload">` in HTML instead — it achieves the same goal more reliably

## Further Reading
- **"HTTP/2 in Action" by Barry Pollard** — The most thorough book on HTTP/2 for web developers; covers multiplexing, performance implications, and migration from HTTP/1.1
- **"HTTP/3 explained" (http3-explained.haxx.se)** — Free online book by Daniel Stenberg (curl author); covers QUIC and HTTP/3 clearly; relevant for understanding what comes after HTTP/2
- **Next.js documentation — "Optimizing: Lazy Loading"** — Documents `next/dynamic` and how Next.js manages code splitting; understanding this is prerequisite for taking advantage of HTTP/2 granular caching
