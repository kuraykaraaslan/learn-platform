import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // WebContainer (P9, docs/phases/09-webcontainer.md) needs real cross-origin
  // isolation (SharedArrayBuffer + a Service Worker), which only exists under
  // COOP/COEP. The phase's own instructions are to add these SITE-WIDE first,
  // walk all 412 pages, and only fall back to scoping them if something
  // breaks — deliberately not done here: that walk needs a real browser, and
  // no browser automation was available in the session that wrote this.
  // Scoped to exactly the route ProjectRunner.tsx renders on instead, so the
  // other ~30 routes (home, course overview pages, the API route) are
  // unaffected regardless of what a full site-wide check would have found.
  // Revisit once someone has actually done that walk.
  async headers() {
    return [
      {
        source: '/courses/:courseSlug/:lessonSlug',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        ],
      },
    ];
  },
};

export default nextConfig;
