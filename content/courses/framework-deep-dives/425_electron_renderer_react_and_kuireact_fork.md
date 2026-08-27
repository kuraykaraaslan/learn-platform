# 425. Electron: Renderer Architecture — React, Client Routing, and the KUIreact Fork

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_Electron material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
The Electron renderer is a plain Vite + client React single-page app — explicitly *not* Next.js. None of the App Router, RSC, `next/image`, `next/link`, `next/navigation`, `next/font`, or server actions apply here, and `Code_Structure_Rules_Next` simply does not govern this process; `Common` + the TypeScript house style do. This distinction matters practically, not just semantically: a packaged Electron app is loaded over `file://` (or a custom `app://` scheme), where history-based routing breaks entirely, because there's no server to serve arbitrary deep paths on a reload. The fix is routing with **hash** or **memory** history — `createHashRouter` from `react-router-dom`, or TanStack Router configured the same way — never `createBrowserRouter`, which 404s the instant a user reloads on any route other than the root.

Data never flows into the renderer through a fetch call or a server component; it flows exclusively through `window.api`, the typed surface exposed by the preload script covered in the process-model lesson. A thin `renderer/libs/api.ts` re-exports `window.api` so Zustand stores and components have one canonical import path, and the components themselves stay fetch-agnostic — they receive data and handlers as props and render, with the actual `window.api` call living in a store or a screen-level effect. This is exactly the seam that makes KUIreact's copy/fork model work at all: since `DataTable`, `Modal`, and every other component library primitive were already designed to take data as props rather than fetch it themselves, they slot into an IPC-driven renderer with zero changes to how they're built, only to where the data comes from.

KUIreact itself — a private, 145-component Next.js showcase library — is deliberately **copied and forked** into `src/renderer/components/`, not consumed as a workspace dependency, because a single-repo desktop app has no monorepo wiring to make a package import practical, and 144 of the 145 components are already pure `'use client'` React + Tailwind v4 with no Next-specific imports. The one component that does need a change is `modules/ui/lazy.tsx`, which uses `next/dynamic` and gets swapped for `React.lazy` + `Suspense` — a small, deliberate, documented deviation rather than a silent divergence. Every fork carries a `_FORK.md` recording the source commit and the local changes, specifically so that re-syncing a KUIreact update later is a mechanical diff against a known baseline instead of an archaeology project. What never gets copied: `modules/showcase/**` (the component browser, Next-coupled and demo-only) and any routing-coupled shell component — those exist to demo the library on the web, not to ship inside a product.

## Key Concepts
- **The renderer is Vite + client React, not Next.js** — no App Router, RSC, `next/image`/`next/link`/`next/navigation`, no server actions; `Common` + TS rules govern it, not `Code_Structure_Rules_Next`
- **Routing must use hash or memory history**, never history-based routing — `file://` (or `app://`) has no server to resolve a deep-path reload, so `createBrowserRouter` 404s on any reload past the root
- **All data flows through `window.api`**, never a direct fetch — wrap it once in `renderer/libs/api.ts` so stores and components share one import path
- **Components stay fetch-agnostic**, receiving data/handlers as props — this is the exact seam that lets KUIreact's already-presentational components work unchanged in an IPC-driven app
- **KUIreact is copied/forked into `src/renderer/components/`, not installed as a package** — no monorepo wiring is needed for a single-repo desktop app, and the components are already Next-independent
- **The one required code change during the fork**: `modules/ui/lazy.tsx`'s `next/dynamic` becomes `React.lazy` + `Suspense` — everything else ports over unmodified
- **Never copy `modules/showcase/**` or routing-coupled shell components** — they're Next-coupled, demo-only, and have no role inside a shipped product
- **Fork provenance is mandatory**: a `_FORK.md` recording the source commit and local changes turns a future re-sync into a mechanical diff instead of a guessing game

## Example Code
```typescript
// renderer/main.tsx — hash router, survives file:// and reloads on any route
import { createHashRouter, RouterProvider } from "react-router-dom";
import { Home } from "@/modules/home/ui/Home";
import { Settings } from "@/modules/settings/ui/Settings";

const router = createHashRouter([
  { path: "/", element: <Home /> },
  { path: "/settings", element: <Settings /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}

// ❌ 404s on reload/deep-link under file:// — there's no server to resolve the path
// import { createBrowserRouter } from "react-router-dom";

// renderer/libs/api.ts — one canonical import path for the IPC bridge
export const api = window.api;   // typed via the preload's exported AppApi

// renderer/modules/users/users.store.ts — Zustand store is the only thing that calls window.api
import { create } from "zustand";
import { api } from "@/libs/api";

type UsersState = {
  rows: { id: string; name: string }[];
  loading: boolean;
  load: (page: number) => Promise<void>;
};

export const useUsers = create<UsersState>((set) => ({
  rows: [],
  loading: false,
  load: async (page) => {
    set({ loading: true });
    const res = await api.users.list({ page });               // IPC → main → service
    set({ rows: res.ok ? (res.data as any) : [], loading: false });
  },
}));

// renderer/modules/users/ui/UsersList.tsx — component is presentational, fetch-agnostic
import { DataTable } from "@/components/ui";
import { useUsers } from "../users.store";
import { useEffect } from "react";

export function UsersList() {
  const { rows, loading, load } = useUsers();
  useEffect(() => { load(1); }, [load]);

  return <DataTable rows={rows} loading={loading} onPage={load} />;   // ✅ same component KUIreact ships
}

// components/ui/lazy.tsx — the one required fork edit: next/dynamic → React.lazy
// ❌ from KUIreact (Next)
// import dynamic from "next/dynamic";
// export const LazyDataTable = dynamic(() => import("./DataTable"), { ssr: false });

// ✅ renderer (Vite)
import { lazy } from "react";
export const LazyDataTable = lazy(() =>
  import("./DataTable").then((m) => ({ default: m.DataTable }))
);
// usage: <Suspense fallback={<Spinner/>}><LazyDataTable/></Suspense>
```

```markdown
<!-- src/renderer/components/ui/_FORK.md -->
Forked from: $KUIREACT_ROOT @ 8f2c1e4 on 2026-06-05
Local changes: next/dynamic → React.lazy (lazy.tsx); dropped modules/showcase.
Re-sync: diff upstream modules/ui against this folder each KUIreact minor; re-apply the lazy patch.
```

## When to Use
- Setting up routing in any new Electron renderer — `createHashRouter` (or TanStack Router with hash/memory history) from the start, since retrofitting history mode later means re-testing every deep-link and reload path
- Building any screen that needs data — write a Zustand store (or a screen-level effect) that calls `window.api`, and keep the rendered component itself free of any `window.api` reference
- Bringing a KUIreact component into the app for the first time — copy it, don't reference it from `$KUIREACT_ROOT` directly, and record the copy in `_FORK.md`
- Encountering `modules/ui/lazy.tsx` during a fork — apply the `React.lazy` swap immediately rather than deferring it, since every lazy-loaded component in the app depends on it
- Re-syncing after a KUIreact update — diff upstream against the fork using `_FORK.md`'s recorded commit as the baseline, and re-apply only the documented local changes

## Common Mistakes
- **Using `createBrowserRouter` in the renderer** — works perfectly in development against the Vite dev server, then 404s on any reload past `/` the moment the app is packaged and loaded over `file://`.
- **Calling `window.api` directly from inside a presentational component** — couples the component to IPC, breaking the fetch-agnostic seam that makes KUIreact's components portable in the first place.
- **Trying to `npm install` KUIreact as if it were a published package** — it's a private Next.js showcase repo, not a registry package; the only supported path is copy/fork.
- **Copying `modules/showcase/**` along with the primitives** — pulls in `next/navigation`/`next/link`/`next/image` dependencies that have no renderer equivalent and won't build under Vite.
- **Editing a forked KUIreact component's styling locally instead of wrapping it** — causes silent visual drift from the source library that a future re-sync can't distinguish from an intentional change.
- **Skipping `_FORK.md`** — the next re-sync has no record of what was changed and why, turning a mechanical diff into a manual re-discovery of every past deviation.

## Further Reading
- React Router — Hash Router: https://reactrouter.com/en/main/routers/create-hash-router
- React — `lazy` and `Suspense`: https://react.dev/reference/react/lazy
- Vite — Building for Production: https://vite.dev/guide/build
- TanStack Router documentation: https://tanstack.com/router/latest
