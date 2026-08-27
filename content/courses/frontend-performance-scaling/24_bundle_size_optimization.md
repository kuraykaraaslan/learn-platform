# 24. Bundle Size Optimization — Code Splitting, Tree Shaking

## What It Is
The JavaScript bundle delivered to the user is one of the most direct levers on perceived performance. Every kilobyte of JS must be downloaded, parsed, compiled, and executed before the page becomes interactive. Unlike images (which download in the background and don't block interactivity), render-blocking and interaction-blocking JS directly degrades LCP, TTI (Time to Interactive), and INP. For a SaaS, the dashboard and core app pages are the highest-traffic pages — bundle bloat there affects every user, every session.

**Tree shaking** is the process by which bundlers (Webpack, Turbopack) eliminate dead code — exported functions and values that are imported nowhere in the dependency tree. For this to work, the library must use ES modules (not CommonJS), the imports must be specific rather than namespace imports (`import { format } from 'date-fns'` vs `import * as dateFns from 'date-fns'`), and the code must be marked side-effect-free in `package.json`. Many popular libraries (lodash-es, date-fns, lucide-react) are well tree-shaken; others (moment.js, some UI component libraries) include all code regardless of what you import.

**Code splitting** divides your application into chunks that are loaded on demand rather than all at once. Next.js App Router does automatic per-route code splitting — the code for `/dashboard` is not sent when the user visits `/login`. Within a route, `next/dynamic` (which wraps React's `React.lazy`) allows you to lazily load heavy components: a rich text editor, a chart library, a data table. These components load only when they're about to be rendered, not on initial page load.

## Key Concepts
- **Tree shaking**: Dead code elimination — bundler removes exports that are never imported; requires ES modules
- **Code splitting**: Divides bundle into chunks loaded on demand; Next.js does this per route automatically
- **Dynamic import**: `next/dynamic(() => import('./HeavyComponent'))` — loads the component lazily on first render
- **Chunk**: A separate JS file produced by the bundler; loaded independently by the browser
- **`next/bundle-analyzer`**: Visualizes your bundle composition; identifies which libraries take the most space
- **Side effects**: Code that runs when a module is imported (even if nothing is explicitly called); prevents tree shaking; marked via `"sideEffects"` in `package.json`
- **Barrel files**: `index.ts` files that re-export from many modules — can prevent tree shaking by forcing the bundler to include the entire barrel; prefer direct imports
- **`import()` hint comments**: `/* webpackChunkName: "editor" */` gives a human-readable name to dynamic import chunks — helpful for debugging

## Example Code
```typescript
// ─── 1. Bundle analysis setup ───
// npm install @next/bundle-analyzer --save-dev
// next.config.ts

import withBundleAnalyzer from '@next/bundle-analyzer';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ... your config
};

export default process.env.ANALYZE === 'true'
  ? withBundleAnalyzer({ enabled: true })(nextConfig)
  : nextConfig;

// Run: ANALYZE=true next build
// Opens a browser visualization of each chunk's composition

// ─── 2. Dynamic imports for heavy components ───
import dynamic from 'next/dynamic';

// Load the rich text editor only when it's about to render
const RichTextEditor = dynamic(
  () => import(/* webpackChunkName: "rich-text-editor" */ '@/components/editor'),
  {
    loading: () => <div className="h-64 animate-pulse bg-muted rounded" />,
    ssr: false, // Editor uses browser APIs; don't render on server
  }
);

// Load charts only when the analytics tab is active
const AnalyticsChart = dynamic(
  () => import(/* webpackChunkName: "analytics-chart" */ '@/components/analytics-chart'),
  { ssr: false }
);

export function TenantSettings({ tab }: { tab: string }) {
  return (
    <div>
      {/* RichTextEditor chunk downloads only when this tab is shown */}
      {tab === 'description' && <RichTextEditor />}
      {tab === 'analytics' && <AnalyticsChart />}
    </div>
  );
}

// ─── 3. Tree-shaking-friendly imports ───

// BAD: imports the entire lodash library (~70KB)
import _ from 'lodash';
const grouped = _.groupBy(items, 'category');

// GOOD: import only what you use from lodash-es (tree-shakeable)
import { groupBy } from 'lodash-es';
const grouped = groupBy(items, 'category');

// BAD: date-fns namespace import — pulls in everything
import * as dateFns from 'date-fns';
const formatted = dateFns.format(new Date(), 'yyyy-MM-dd');

// GOOD: named import — tree shaker removes everything else
import { format } from 'date-fns';
const formatted = format(new Date(), 'yyyy-MM-dd');

// BAD: barrel file import — forces bundler to process the entire barrel
import { Button, Input, Modal } from '@/components/ui'; // index.ts re-exports 50 components

// GOOD: direct imports — bundler only processes what you need
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

// ─── 4. Identifying large dependencies ───
// After running ANALYZE=true next build, look for:
// - Any single library taking > 50KB gzipped
// - moment.js (replace with date-fns or Temporal API)
// - lodash (replace with lodash-es specific imports or native JS)
// - Full icon libraries (import only icons you use: import { Home } from 'lucide-react')

// ─── 5. Tracking bundle size in CI ───
// package.json scripts:
// "build:analyze": "ANALYZE=true next build",
// "size": "next build && bundlesize"

// .bundlesizerc.json (using bundlesize npm package):
// {
//   "files": [
//     { "path": ".next/static/chunks/pages/_app*.js", "maxSize": "80 kB" },
//     { "path": ".next/static/chunks/framework*.js", "maxSize": "45 kB" }
//   ]
// }
```

## When to Use
- Run bundle analysis (`ANALYZE=true next build`) whenever you add a new npm dependency that has client-side usage
- Apply `next/dynamic` to any component that imports a library over 50KB: chart libraries, rich text editors, PDF viewers, syntax highlighters, map libraries
- Replace barrel file imports with direct imports in your own codebase to improve tree shaking
- Set up bundle size CI checks when you have a team or when your Core Web Vitals scores start declining

## Common Mistakes
- **Not checking if a library is tree-shakeable**: Adding `import { oneThing } from 'huge-library'` with the assumption that tree shaking will eliminate the rest; check with the bundle analyzer whether the full library is included
- **`"use client"` on a component that imports a heavy library**: A Server Component that renders a chart should use `next/dynamic` — if it has `"use client"`, the chart library is included in the client bundle unconditionally
- **Ignoring the `ssr: false` option for browser-only libraries**: Components using `window`, `document`, or browser-only APIs will throw during server-side rendering without `ssr: false` in `next/dynamic`
- **Treating all `node_modules` as equal**: A library like `zod` is 13KB gzipped; `pdf-lib` is 300KB; the decision to use client-side vs server-side rendering depends heavily on the weight of the library involved

## Further Reading
- **Next.js documentation — "Optimizing: Bundle Analyzer"** — Official setup guide for `@next/bundle-analyzer`; the starting point for any bundle size investigation
- **"How We Reduced Our JavaScript Bundle Size by 33%" by Storybook Blog** — A real-world case study; the techniques (barrel file elimination, dynamic imports) apply directly to Next.js apps
- **"Bundlephobia" (bundlephobia.com)** — Check any npm package's bundle size, tree-shaking support, and whether it's ES module compatible before installing it
