# 422. Electron: Preload Scripts and Context Isolation

## What It Is
Three `webPreferences` flags form the non-negotiable baseline for every `BrowserWindow` in this stack, and they work as independent walls rather than one combined setting: `contextIsolation: true` keeps the page's JavaScript and the preload script in separate global contexts, so a compromised page can't monkey-patch the bridge or reach into Electron's internals; `sandbox: true` runs the renderer inside an OS-level sandbox, so a Chromium remote-code-execution bug doesn't hand the attacker direct OS access; `nodeIntegration: false` keeps `require`, `process`, and `Buffer` out of the page entirely, closing the most direct escalation path. Any one of these being off is treated as a hard security failure, not a style preference — a renderer showing hostile or compromised web content with `nodeIntegration: true` is a straight line to remote code execution on the user's machine.

Given `sandbox: true`, a preload script is far more constrained than a normal Node file: it can `require` `electron` and a small polyfilled subset, but not arbitrary Node modules like `fs` or `path`. This forces the preload to stay genuinely thin — its only responsibility is a minimal, explicit, typed `contextBridge.exposeInMainWorld` call with named methods, never a loop over channel names, never a raw primitive, and never real business logic. Anything the preload can't do under the sandbox (reading a file, touching a database) delegates to main over `invoke`/`handle` instead of trying to work around the sandbox restriction.

The bridge's shape becomes the renderer's entire contract with the outside world, and that contract should be typed once and reused everywhere rather than re-declared. Exporting `type AppApi = typeof api` from the preload and declaring `declare global { interface Window { api: AppApi } }` in the renderer means `window.api.users.list(1)` is fully type-checked, and removing or renaming a channel surfaces as a compile error in every renderer file that used it — a refactor safety net that a loosely-typed `any` bridge would silently swallow. The last piece of the boundary is navigation: a locked-down preload is moot if the renderer can simply navigate itself (or open a new window) to an arbitrary remote origin, so the window factory denies `will-navigate` to anything outside the packaged app's own origin and routes `setWindowOpenHandler` to the OS browser via `shell.openExternal` rather than ever opening a second in-app window.

## Key Concepts
- **Three independent walls, all mandatory**: `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` — losing any one is a security defect, not a style nit
- **`webSecurity: true` stays on** — it enforces same-origin and CSP; disabling it to work around a loading issue reopens exactly the class of exploit the sandbox exists to prevent
- **A sandboxed preload (`sandbox: true`) can only `require('electron')`**, not arbitrary Node modules like `fs` — real work that needs Node delegates to main via IPC instead
- **The bridge is a minimal, explicit, named allow-list** — no business logic in the preload, no loops over channel names, no raw primitives exposed
- **Type the bridge once, from the preload's own export** (`export type AppApi = typeof api`), and declare it globally in the renderer — a removed channel becomes a compile error everywhere it was used, not a runtime surprise
- **Navigation must be locked down at the window-factory level**: `will-navigate` denies anything off the app's own origin, and `setWindowOpenHandler` routes external links to the OS browser and always returns `{ action: "deny" }` for in-app windows
- **`sandbox: false` is a reviewed exception, never a default** — permitted only when a preload genuinely needs a Node module that truly cannot move to main, documented in the security checklist, with `contextIsolation` still on
- **Dev-server content over `http://localhost` is fine in development; production must load only packaged content** (`app://`/`file://`) — never a remote URL, even for convenience

## Example Code
```typescript
// main/windows/createMainWindow.ts (excerpt) — the only acceptable webPreferences baseline
import { BrowserWindow, shell } from "electron";
import path from "node:path";

export function createMainWindow(): BrowserWindow {
  const win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,   // ✅ page JS and preload run in separate contexts
      sandbox: true,            // ✅ renderer process is OS-sandboxed
      nodeIntegration: false,   // ✅ no require/process/Buffer in the page
      webSecurity: true,        // ✅ same-origin + CSP stay enforced
    },
  });

  // Lock down navigation — the preload boundary is moot if the renderer can drift to a remote origin
  win.webContents.on("will-navigate", (e, url) => {
    if (!url.startsWith("app://")) e.preventDefault();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);   // open the OS browser, not a new in-app window
    return { action: "deny" };
  });

  return win;
}

// ❌ any of these on a shipped window is a hard security failure
// new BrowserWindow({ webPreferences: { nodeIntegration: true } })
// new BrowserWindow({ webPreferences: { contextIsolation: false } })
// new BrowserWindow({ webPreferences: { webSecurity: false } })

// preload/index.ts — sandbox-safe: only `electron` is required, everything else delegates to main
import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipc-contract";

// ❌ breaks under sandbox: true — fs isn't available in a sandboxed preload
// import fs from "node:fs";
// contextBridge.exposeInMainWorld("api", { readConfig: () => fs.readFileSync(...) });

const api = {
  users: { list: (page: number) => ipcRenderer.invoke(IPC.usersList, page) },
  config: { read: () => ipcRenderer.invoke(IPC.configRead) },   // ✅ delegate to main instead
  window: {
    minimize: () => ipcRenderer.send(IPC.windowMinimize),
    onMaximizeChange: (cb: (max: boolean) => void) => {
      const handler = (_e: unknown, max: boolean) => cb(max);
      ipcRenderer.on(IPC.windowMaxChange, handler);
      return () => ipcRenderer.removeListener(IPC.windowMaxChange, handler);
    },
  },
} as const;

contextBridge.exposeInMainWorld("api", api);
export type AppApi = typeof api;   // ✅ single source of truth for the renderer's types

// renderer/global.d.ts — type the bridge once, use everywhere
import type { AppApi } from "../../preload";
declare global { interface Window { api: AppApi } }
export {};

// renderer usage — fully type-checked; a removed channel is a compile error here
const users = await window.api.users.list(1);
```

## When to Use
- Creating any `BrowserWindow` in the app — always through the one factory that sets all four `webPreferences` flags together, never a one-off `new BrowserWindow(...)` elsewhere
- Writing or extending a preload script — check first whether the needed capability requires a Node module; if so, it belongs in main behind an IPC channel, not in the preload
- Adding a new bridge method — export the updated `AppApi` type immediately so the renderer's type errors surface any call sites that need updating
- Any window that can load a link the user didn't author (an external URL in fetched content, a support link) — route it through `setWindowOpenHandler` to `shell.openExternal`, never an in-app navigation
- Reviewing a PR that touches `webPreferences` on any window — treat any deviation from the four-flag baseline as a blocking security review item, not a style comment

## Common Mistakes
- **Setting `nodeIntegration: true` "just for this one window"** — a single insecure window is a single successful exploit away from full Node access on the user's machine; there is no safe scope for this flag.
- **Exposing `fs`, `path`, or another Node module directly through `contextBridge`** (`contextBridge.exposeInMainWorld("electron", { ipcRenderer, fs: require("fs") })`) — hands the renderer the exact filesystem access the sandbox exists to prevent.
- **Trying to `require` a Node module inside a sandboxed preload** — it silently fails or throws at runtime because `sandbox: true` only polyfills `electron` and a small subset; the fix is delegating that work to main, not disabling the sandbox.
- **Leaving `setWindowOpenHandler` unset or defaulting to `{ action: "allow" }`** — any link clicked in the renderer, including one from untrusted fetched content, opens a new full-privilege Electron window instead of the OS browser.
- **Re-declaring `window.api`'s shape by hand in the renderer instead of importing the preload's exported type** — the two definitions drift, and a channel rename in the preload no longer produces a compile error where it's used.
- **Loading `http://localhost` in a production build "to save time"** — production must load only packaged local content; even a temporary remote load defeats the entire sandboxed-local-content security model.

## Further Reading
- Electron — Security: https://www.electronjs.org/docs/latest/tutorial/security
- Electron — Context Isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
- Electron — Process Sandboxing: https://www.electronjs.org/docs/latest/tutorial/sandbox
- Electron — `contextBridge` API: https://www.electronjs.org/docs/latest/api/context-bridge
