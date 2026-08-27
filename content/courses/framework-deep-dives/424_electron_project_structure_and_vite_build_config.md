# 424. Electron: Project Structure and electron-vite Build Configuration

## What It Is
An electron-vite project has three source roots that map directly onto the three processes — `src/main/`, `src/preload/`, `src/renderer/` — plus a fourth folder, `src/shared/`, that sits outside the process split entirely. `shared/` is described as "sacred" in this ruleset because it's the *only* code imported by more than one process, and that privilege comes with a strict constraint: types and Zod schemas only, zero runtime side effects, zero Node imports, zero React. The moment a `shared/` file imports `fs` or `electron`, it can no longer safely land in the renderer bundle, which defeats the entire reason the folder exists — a shared IPC contract that both the type-checker and the runtime can trust identically in all three processes.

Each build target gets its own `@/`-style alias (`@main`, `@shared` for main; `@` and `@shared` for the renderer) specifically so that a renderer file *cannot* accidentally import main-process code — there's no path that resolves to it. This is enforced by the alias configuration itself, not just convention: a renderer file that tries `import { UsersService } from "@main/services/users.service"` simply has nowhere for that import to resolve to, forcing the renderer back through the bridge (`window.api.users.list(1)`) the way it's supposed to reach main in the first place. Inside `src/renderer/modules/` and `src/main/`, the project reuses the same `modules/[domain]` convention from the TypeScript house style rather than inventing an Electron-specific structure — a "users" domain spans a UI component in the renderer, a Zustand store in the renderer, a shared Zod contract, an IPC handler in main, and a service in main, each recognizable by the same domain name across all three locations.

The build itself is `electron-vite`, which gives first-class main/preload/renderer separation, renderer HMR in development, and correct dependency externalization out of the box — `externalizeDepsPlugin()` keeps `dependencies` external in main and preload (resolved from `node_modules` at runtime or unpacked from the asar archive) while the renderer bundles normally like any Vite SPA. Development and production diverge specifically in how the renderer's content is loaded: `electron-vite` sets `ELECTRON_RENDERER_URL` in dev, so the window factory calls `win.loadURL(...)` against the live Vite dev server with HMR; production has no such variable, so the same code path falls through to `win.loadFile(...)` against the packaged local HTML — and this distinction matters because loading a remote URL in production, even accidentally, breaks the sandboxed-local-content security model covered in the preload/context-isolation lesson. Env handling follows the same asymmetry: Vite only exposes `VITE_`-prefixed variables to the renderer, and only at build time, which means a secret accidentally prefixed `VITE_` ships inside the renderer bundle permanently — real secrets stay as plain `process.env.X` reads in main, never in anything the renderer's bundler touches.

## Key Concepts
- **Three source roots map to the three processes**: `src/main/`, `src/preload/`, `src/renderer/` — plus `src/shared/`, which sits outside the split
- **`shared/` is types + Zod schemas only** — zero runtime side effects, zero Node imports, zero React; anything else in there risks pulling Node code into the renderer bundle
- **Per-process `@/` aliases make a cross-process import impossible by construction**: a renderer file has no alias that resolves to `src/main/`, so it's forced through `window.api` instead
- **`modules/[domain]` convention is reused from the TS house style**, spanning processes — a domain's UI/store live in `renderer/modules/<domain>/`, its contract in `shared/`, its IPC handler and service in `main/`
- **electron-vite is the mandated build tool** — three-target config (`main`/`preload`/`renderer`), first-class HMR, correct native-dependency externalization via `externalizeDepsPlugin()`
- **Dev loads `ELECTRON_RENDERER_URL` (live Vite server); production loads the packaged local file** — the window factory branches on whether that env var is set, never hardcodes one path
- **Only `VITE_`-prefixed vars reach the renderer, and only at build time** — a secret prefixed `VITE_` is baked into the shipped bundle permanently; real secrets stay in main's `process.env`
- **Native dependencies must be externalized, not bundled**, so they can be rebuilt against Electron's ABI and unpacked from asar at package time rather than inlined into a Vite chunk

## Example Code
```
my-app/
├── electron.vite.config.ts
├── electron-builder.yml
├── src/
│   ├── main/
│   │   ├── index.ts
│   │   ├── windows/
│   │   ├── ipc/            ← *.ipc.ts handlers
│   │   ├── services/       ← *.service.ts — owns fs, HTTP, keychain, DB
│   │   └── libs/
│   ├── preload/
│   │   └── index.ts
│   ├── renderer/
│   │   ├── main.tsx
│   │   ├── modules/        ← feature modules: modules/users/ui, modules/users/users.store.ts
│   │   ├── components/     ← forked KUIreact
│   │   └── stores/
│   └── shared/              ← types + Zod ONLY — imported by all three processes
│       └── ipc-contract.ts
└── out/                     ← electron-vite build output (gitignored)
```

```typescript
// electron.vite.config.ts — three targets, per-process aliases, native deps externalized
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: { alias: { "@main": resolve("src/main"), "@shared": resolve("src/shared") } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: "src/renderer",
    resolve: { alias: { "@": resolve("src/renderer"), "@shared": resolve("src/shared") } },
    plugins: [react()],
    build: { rollupOptions: { input: resolve("src/renderer/index.html") } },
  },
});

// src/shared/ipc-contract.ts — ✅ safe in all three processes
import { z } from "zod";
export const IPC = { usersList: "users:list" } as const;
export const UsersListReq = z.object({ page: z.number().int().min(1) });

// ❌ never in shared/ — pulls Node into the renderer bundle
// import fs from "node:fs";
// import { app } from "electron";

// src/main/windows/createMainWindow.ts (excerpt) — dev vs prod content loading
import { join } from "node:path";

export function loadRendererContent(win: Electron.BrowserWindow) {
  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);              // ✅ dev: Vite server + HMR
  } else {
    win.loadFile(join(__dirname, "../renderer/index.html"));      // ✅ prod: packaged local file only
  }
}

// Per-process env access
// renderer — public, non-secret, build-time only
const flag = import.meta.env.VITE_FEATURE_BETA === "true";

// main — real env / secrets
const apiBase = process.env.API_BASE_URL;

// ❌ never — a secret prefixed VITE_ ships permanently inside the renderer bundle
// const key = import.meta.env.VITE_STRIPE_SECRET;
```

## When to Use
- Scaffolding a new Electron app — start from the three-process `src/` layout and the `shared/` contract folder rather than a flat structure
- Adding a new domain feature — mirror the `modules/[domain]` shape across `renderer/modules/`, `shared/`, and `main/services` + `main/ipc` so the same domain name is greppable everywhere
- Adding any dependency with native bindings — configure it as externalized rather than letting Vite try to bundle it into the main or preload chunk
- Debugging a renderer that shows a blank window in the packaged build but works in dev — check whether `loadFile` vs `loadURL` branching is correct and whether the build actually emitted `renderer/index.html`
- Adding a new public, non-secret config flag for the renderer — prefix it `VITE_` deliberately, and treat that prefix as a public-by-design marker, not a formality

## Common Mistakes
- **Putting a Node import or a React component inside `shared/`** — breaks the guarantee that lets all three processes safely import from it; the renderer bundle can end up trying to include Node-only code.
- **A renderer file reaching for main-process code via a relative path** (`../../../main/services/users.service`) instead of the bridge — even though the per-process aliases don't offer this path directly, a long relative path can still technically resolve and quietly reintroduces the exact coupling the alias split was meant to prevent.
- **Prefixing a secret with `VITE_`** — it's baked into the shipped renderer bundle at build time and is trivially recoverable from the packaged app; there's no way to "unship" it after release.
- **Bundling a native dependency into the main or preload chunk instead of externalizing it** — the native binary can't be resolved at runtime, and `electron-rebuild`/ABI matching can't operate on a bundled reference the way it can on a real `node_modules` entry.
- **Hardcoding `loadFile` (or `loadURL`) instead of branching on `ELECTRON_RENDERER_URL`** — either breaks HMR in development or risks a production build accidentally pointing at a dev server address.
- **Reinventing a folder structure per Electron project instead of reusing `modules/[domain]`** — loses the searchability benefit of a domain name meaning the same file layout in every project across the stack.

## Further Reading
- electron-vite documentation: https://electron-vite.org/
- Vite — Env Variables and Modes: https://vite.dev/guide/env-and-mode
- Electron — Using Native Node Modules: https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules
- electron-builder — `asarUnpack`: https://www.electron.build/configuration/configuration#configuration-asarUnpack
