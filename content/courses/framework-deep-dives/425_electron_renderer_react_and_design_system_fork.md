# 425. Electron: Renderer Architecture — React, Client Routing, and Vendoring a Design System

## What It Is
The Electron renderer is a plain Vite + client React single-page app — explicitly *not* Next.js. None of the App Router, RSC, `next/image`, `next/link`, `next/navigation`, `next/font`, or server actions apply here, so whatever structure rules your Next.js app follows simply do not govern this process — only your framework-independent TypeScript conventions do. This distinction matters practically, not just semantically: a packaged Electron app is loaded over `file://` (or a custom `app://` scheme), where history-based routing breaks entirely, because there's no server to serve arbitrary deep paths on a reload. The fix is routing with **hash** or **memory** history — `createHashRouter` from `react-router-dom`, or TanStack Router configured the same way — never `createBrowserRouter`, which 404s the instant a user reloads on any route other than the root.

Data never flows into the renderer through a fetch call or a server component; it flows exclusively through `window.api`, the typed surface exposed by the preload script covered in the process-model lesson. A thin `renderer/libs/api.ts` re-exports `window.api` so Zustand stores and components have one canonical import path, and the components themselves stay fetch-agnostic — they receive data and handlers as props and render, with the actual `window.api` call living in a store or a screen-level effect. This is exactly the seam that makes vendoring a web design system work at all: if `DataTable`, `Modal`, and the rest of your primitives were already designed to take data as props rather than fetch it themselves, they slot into an IPC-driven renderer with zero changes to how they are built — only to where the data comes from. A library whose components fetch their own data does not survive this move, which is the real test of whether your design system is presentational.

A design system that lives in your web repo — call it `@acme/ui` — is often better **copied and vendored** into `src/renderer/components/` than consumed as a workspace dependency, because a single-repo desktop app has no monorepo wiring to make a package import practical, and a presentational library is usually already pure `'use client'` React + Tailwind with no Next-specific imports. The exceptions are worth finding before you start: typically a single `lazy.tsx` that uses `next/dynamic` and gets swapped for `React.lazy` + `Suspense` — a small, deliberate, documented deviation rather than a silent divergence. Every vendored copy carries a `_FORK.md` recording the source commit and the local changes, specifically so that pulling in a later upstream release is a mechanical diff against a known baseline instead of an archaeology project. What never gets copied: the library's own showcase or demo routes (Next-coupled, demo-only) and any routing-coupled shell component — those exist to demo the library on the web, not to ship inside a product.

## Key Concepts
- **The renderer is Vite + client React, not Next.js** — no App Router, RSC, `next/image`/`next/link`/`next/navigation`, no server actions; your framework-independent TypeScript conventions govern it, not your Next.js structure rules
- **Routing must use hash or memory history**, never history-based routing — `file://` (or `app://`) has no server to resolve a deep-path reload, so `createBrowserRouter` 404s on any reload past the root
- **All data flows through `window.api`**, never a direct fetch — wrap it once in `renderer/libs/api.ts` so stores and components share one import path
- **Components stay fetch-agnostic**, receiving data/handlers as props — this is the exact seam that lets an already-presentational web design system work unchanged in an IPC-driven app
- **The design system is vendored into `src/renderer/components/`, not installed as a package** — no monorepo wiring is needed for a single-repo desktop app, and presentational components are already framework-independent
- **Find the Next-coupled exceptions before you start**: typically only `lazy.tsx`'s `next/dynamic`, which becomes `React.lazy` + `Suspense` — everything presentational ports over unmodified
- **Never copy the library's showcase/demo routes or routing-coupled shell components** — they are framework-coupled, demo-only, and have no role inside a shipped product
- **Vendoring provenance is mandatory**: a `_FORK.md` recording the source commit and local changes turns a future re-sync into a mechanical diff instead of a guessing game

## Example Code
```tsx
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
import { api } from "@/lib/api";

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

  return <DataTable rows={rows} loading={loading} onPage={load} />;   // ✅ the same component the web app ships
}

// components/ui/lazy.tsx — the one required vendoring edit: next/dynamic → React.lazy
// ❌ as written for Next.js
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
Vendored from: @acme/ui @ 8f2c1e4 on 2026-06-05
Local changes: next/dynamic → React.lazy (lazy.tsx); dropped the showcase routes.
Re-sync: diff upstream ui/ against this folder each @acme/ui minor; re-apply the lazy patch.
```

## When to Use
- Setting up routing in any new Electron renderer — `createHashRouter` (or TanStack Router with hash/memory history) from the start, since retrofitting history mode later means re-testing every deep-link and reload path
- Building any screen that needs data — write a Zustand store (or a screen-level effect) that calls `window.api`, and keep the rendered component itself free of any `window.api` reference
- Bringing a design-system component into the app for the first time — copy it, don't reach into the web repo directly, and record the copy in `_FORK.md`
- Encountering a `next/dynamic` usage during vendoring — apply the `React.lazy` swap immediately rather than deferring it, since every lazy-loaded component in the app depends on it
- Re-syncing after an upstream design-system release — diff upstream against the vendored copy using `_FORK.md`'s recorded commit as the baseline, and re-apply only the documented local changes

## Common Mistakes
- **Using `createBrowserRouter` in the renderer** — works perfectly in development against the Vite dev server, then 404s on any reload past `/` the moment the app is packaged and loaded over `file://`.
- **Calling `window.api` directly from inside a presentational component** — couples the component to IPC, breaking the fetch-agnostic seam that makes the design system portable in the first place.
- **Trying to `npm install` a design system that was never published** — an internal library living in another repo is not a registry package; either publish it properly or vendor it deliberately, but do not invent an install path that does not exist.
- **Copying the showcase/demo routes along with the primitives** — pulls in `next/navigation`/`next/link`/`next/image` dependencies that have no renderer equivalent and won't build under Vite.
- **Editing a vendored component's styling in place instead of wrapping it** — causes silent visual drift from the source library that a future re-sync can't distinguish from an intentional change.
- **Skipping `_FORK.md`** — the next re-sync has no record of what was changed and why, turning a mechanical diff into a manual re-discovery of every past deviation.

## Further Reading
- React Router — Hash Router: https://reactrouter.com/en/main/routers/create-hash-router
- React — `lazy` and `Suspense`: https://react.dev/reference/react/lazy
- Vite — Building for Production: https://vite.dev/guide/build
- TanStack Router documentation: https://tanstack.com/router/latest
