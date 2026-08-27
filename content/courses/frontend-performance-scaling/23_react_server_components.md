# 23. React Server Components — When Client vs Server

## What It Is
React Server Components (RSC) represent a fundamental change in where React renders. Server Components run exclusively on the server — they can access databases, read environment variables, and import heavy server-only libraries — but they produce no client-side JavaScript bundle. They can't use `useState`, `useEffect`, browser APIs, or event handlers. Client Components run on the server (for the initial render, like classic SSR) and then hydrate and run on the client — they have access to browser APIs and React hooks but add to the client bundle.

The key mental shift is that RSC is not just about performance — it's about where computation *belongs*. A component that reads from the database, formats data, and renders a table is fundamentally a server concern. A component that responds to user interaction is a client concern. When you conflate these, you end up sending database query logic to the client (impossible with RSC) or creating unnecessary client components that carry large dependencies into the user's browser.

The subtlest and most impactful optimization is **client component boundary placement**. In a page that is mostly static with one interactive widget, the client boundary should be drawn tightly around the widget — not at the page level. A `"use client"` directive at the page level converts the entire subtree to client components, negating the RSC benefit. Drawing the boundary at a leaf component (a `<LikeButton>`, a `<FilterDropdown>`) keeps the server-rendering benefit for all the surrounding static content. Streaming with `<Suspense>` allows the page shell to render immediately while slow data fetches complete in the background, dramatically improving TTFB and LCP.

## Key Concepts
- **Server Component (RSC)**: Renders on server only; no client JS; can directly access DB/filesystem; no hooks, no browser APIs
- **Client Component (`"use client"`)**: Rendered on server for initial HTML, then hydrated on client; has full React hook/event API; adds to client bundle
- **Client boundary**: A `"use client"` directive marks a component and all its imports as client-side; it "waterfalls down" the import tree
- **Interleaving**: You can import a Client Component inside a Server Component (passes children as props); you cannot import a Server Component inside a Client Component
- **Streaming**: `<Suspense>` boundaries allow Next.js to stream HTML progressively — the page shell renders instantly, data-dependent sections arrive as they complete
- **`loading.tsx`**: Next.js route-level Suspense boundary; renders a skeleton while the page's async server component fetches data
- **`"use server"` (Server Actions)**: Functions that run on the server but can be called from Client Components — replaces API routes for form submissions and mutations
- **Bundle analysis**: Server Components have zero bundle cost; every Client Component import adds to the JS delivered to the browser

## Example Code
```typescript
// ─── 1. Correct client boundary placement ───
// BAD: "use client" at the page level converts everything to client
// app/dashboard/page.tsx
'use client'; // ← Entire page subtree is now client-side; RSC benefit gone
export default function DashboardPage() {
  const [filter, setFilter] = useState('all'); // This is why it's client
  // But all these data fetches now run client-side, adding to the bundle:
  const data = useDashboardData(filter);
  return <DashboardLayout data={data} filter={filter} onFilterChange={setFilter} />;
}

// GOOD: narrow the client boundary to only the interactive part
// app/dashboard/page.tsx — Server Component (default)
import { FilterDropdown } from './filter-dropdown'; // ← Client Component (small)
import { DashboardStats } from './dashboard-stats';  // ← Server Component (large data)

export default async function DashboardPage() {
  // This runs on the server — no bundle cost, direct DB access
  const initialData = await getDashboardStats();
  return (
    <main>
      <FilterDropdown /> {/* Only this is client-side */}
      <DashboardStats data={initialData} /> {/* Server Component — no JS shipped */}
    </main>
  );
}

// components/filter-dropdown.tsx
'use client'; // ← Narrow boundary: only the dropdown is a client component
import { useState } from 'react';
export function FilterDropdown() {
  const [value, setValue] = useState('all');
  return <select value={value} onChange={(e) => setValue(e.target.value)}>{/* ... */}</select>;
}

// ─── 2. Streaming with Suspense for progressive page loading ───
// app/tenant/[id]/page.tsx
import { Suspense } from 'react';

export default async function TenantPage({ params }: { params: { id: string } }) {
  // Fast: tenant name loads immediately (lightweight query)
  const tenant = await getTenant(params.id);

  return (
    <div>
      <h1>{tenant.name}</h1>

      {/* Shell renders immediately; stats stream in when ready */}
      <Suspense fallback={<StatsSkeleton />}>
        <TenantStats tenantId={params.id} /> {/* Slow query — streamed in */}
      </Suspense>

      <Suspense fallback={<MembersSkeleton />}>
        <MemberList tenantId={params.id} /> {/* Medium query — streamed in */}
      </Suspense>
    </div>
  );
}

// components/tenant-stats.tsx — Server Component
async function TenantStats({ tenantId }: { tenantId: string }) {
  // This runs independently, doesn't block the page shell
  const stats = await getExpensiveTenantAnalytics(tenantId);
  return <StatsGrid data={stats} />;
}

// ─── 3. Server Actions for mutations (replaces many API routes) ───
// app/settings/actions.ts
'use server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const UpdateDisplayNameSchema = z.object({ displayName: z.string().min(1).max(50) });

export async function updateDisplayName(formData: FormData) {
  const session = await getServerSession();
  const { displayName } = UpdateDisplayNameSchema.parse({
    displayName: formData.get('displayName'),
  });

  await db.user.update({ where: { id: session.userId }, data: { displayName } });
  revalidatePath('/settings'); // Invalidate the cached settings page
}

// components/display-name-form.tsx
'use client';
import { updateDisplayName } from '../actions';
export function DisplayNameForm() {
  return (
    <form action={updateDisplayName}> {/* Server Action — no useEffect, no fetch */}
      <input name="displayName" />
      <button type="submit">Save</button>
    </form>
  );
}

// ─── 4. Decision guide ───
// Use Server Component when:
//   - Fetching data directly from DB or an internal service
//   - Rendering static or infrequently-changing content
//   - Using a heavy library that should not be in the client bundle (e.g., syntax highlighter, markdown renderer)
//   - The component has no user interactivity

// Use Client Component when:
//   - Using useState, useEffect, useRef, useContext
//   - Responding to user events (onClick, onChange, onSubmit)
//   - Using browser APIs (window, localStorage, navigator)
//   - Using third-party client libraries (charts, drag-and-drop, rich text editors)
```

## When to Use
- Draw client boundaries at the **leaves** of your component tree, not at page or layout level — this is the single highest-leverage RSC optimization
- Use `<Suspense>` to parallelize slow data fetches instead of awaiting them sequentially in the parent component
- Use Server Actions for form submissions and simple mutations to eliminate boilerplate API routes and client-side fetch code
- Run bundle analysis (`ANALYZE=true next build`) quarterly to check that large libraries haven't crept into client components unintentionally

## Common Mistakes
- **Importing a heavy library in a Client Component accidentally**: If `app/layout.tsx` has `"use client"`, every import in the layout is client-side; `lodash`, charting libraries, and markdown renderers all end up in the bundle
- **Fetching in sequence instead of in parallel in Server Components**: `const a = await fetchA(); const b = await fetchB()` takes `latency(A) + latency(B)` ms; use `Promise.all([fetchA(), fetchB()])` or parallel `<Suspense>` boundaries
- **Using Server Actions for everything**: Server Actions are excellent for form submissions and simple mutations; for complex API contracts (pagination, filtering, external consumers), a proper API route is still the right tool
- **Context providers at the root breaking RSC**: A `ThemeProvider` or `QueryClientProvider` at the root layout with `"use client"` will make the entire app a client component if it wraps children incorrectly; use the "pass children as props" pattern to preserve Server Component rendering for the children

## Further Reading
- **Next.js documentation — "Server Components" and "Client Components"** — The official docs now include excellent decision flow charts and the "passing Server Components to Client Components as props" pattern
- **"Making Sense of React Server Components" by Josh Comeau (joshwcomeau.com)** — The clearest conceptual explanation of RSC mental model; covers the rendering lifecycle with diagrams
- **"React Server Components From Scratch" by Dan Abramov (GitHub: reactjs/server-components-demo)** — The original demo repository with detailed explanations; reading the commit history shows the design rationale
