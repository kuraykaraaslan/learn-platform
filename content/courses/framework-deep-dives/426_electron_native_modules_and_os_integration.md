# 426. Electron: Native Modules and OS API Integration

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_Electron material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
The default answer to "do we need a native module" is no. Most needs that seem to demand native code — SQLite, crypto, JSON parsing — have a pure-JS or WASM equivalent that skips the entire native-build problem: no ABI rebuilds, no per-platform CI matrix, cross-platform by construction. A native addon is justified only for OS APIs Electron doesn't expose, genuinely performance-critical native libraries, or direct hardware access — and when one is justified, it lives exclusively in main (or a spawned `utilityProcess`), never the sandboxed renderer, which can't load native modules regardless of intent since `sandbox: true` blocks arbitrary `require` calls at the process level.

Electron ships its own bundled Node and V8, which means a native module compiled against the system's Node version is binary-incompatible with the version actually running inside the app — the telltale symptom is "the module was compiled against a different Node.js version" at runtime. `electron-builder install-app-deps` (or `@electron/rebuild`) recompiles native dependencies against Electron's specific ABI, and this has to run as a `postinstall` step so it happens automatically rather than depending on a developer remembering to run it manually after every `npm install`. Modules that ship prebuilt binaries via `prebuild-install` sidestep the local-toolchain requirement entirely and are strongly preferred when a choice exists. Once built, the resulting `.node` binary can't be loaded from inside an asar archive at all — `dlopen` can't reach into a virtual archive — so it has to be explicitly unpacked via `asarUnpack: ["**/*.node"]` in the packaging config, and referenced through Electron's `app.asar.unpacked` path resolution rather than a hardcoded `app.asar/...` path that would break the moment the unpacking configuration changes.

The same "main owns privileged access" principle extends past native modules to the desktop-native UI surface: `Menu`, `Tray`, `dialog`, `Notification`, and `globalShortcut` are main-process-only APIs that the renderer can never construct directly — it requests them over IPC exactly like any other privileged operation. Building the application menu with role-based items (`{ role: "fileMenu" }`, `{ role: "editMenu" }`) rather than hand-wiring every accelerator and click handler is what makes menu items behave correctly per-OS with almost no extra code — a manually-built "Copy" menu item doesn't automatically get the right keyboard shortcut or the right enabled/disabled state the way `{ role: "copy" }` does. `shell.openExternal` deserves the same scrutiny as any other command-execution-adjacent API: opening an unvalidated URL is a real code-execution risk (a `file:` or custom-scheme URL can do far more than a browser tab), so every call goes through a scheme allow-list first, exactly the same discipline applied to the `will-navigate` handler in the window factory.

## Key Concepts
- **Default to not adding a native module** — check for a WASM or pure-JS alternative first; only OS APIs Electron doesn't expose, real performance needs, or hardware access justify one
- **Native code runs in main (or a `utilityProcess`), never the renderer** — `sandbox: true` blocks arbitrary native `require` calls regardless of intent, so this isn't just a convention, it's enforced
- **Modules must be rebuilt against Electron's ABI**, not the system Node's — `electron-builder install-app-deps` as a `postinstall` script automates this; the "compiled against a different Node.js version" error means it didn't run
- **Prefer modules shipping prebuilds** (`prebuild-install`) over ones requiring a local native toolchain — faster CI, no per-developer build environment drift
- **`.node` files must be `asarUnpack`'d** — native binaries can't `dlopen` from inside an asar archive; reference them via `app.asar.unpacked` resolution, never a hardcoded path
- **Heavy CPU work goes to a `utilityProcess`**, not the main event loop — main drives windows and IPC, and blocking it makes the whole app feel frozen
- **`Menu`, `Tray`, `dialog`, `Notification`, `globalShortcut` are main-only APIs** — the renderer requests them over IPC; it never imports or constructs them directly
- **Build menus with `role`s, not hand-wired accelerators** — role-based items get correct per-OS labels, shortcuts, and enabled states essentially for free
- **`shell.openExternal` always goes through a scheme allow-list** — an unvalidated URL (a custom scheme, a `file:` path) is a real code-execution risk, not a theoretical one

## Example Code
```jsonc
// package.json — rebuild native deps for Electron's ABI automatically after install
{ "scripts": { "postinstall": "electron-builder install-app-deps" } }
```

```yaml
# electron-builder.yml — native binaries can't load from inside asar
asar: true
asarUnpack: ["**/*.node"]
```

```typescript
// main/services/db.service.ts — native module confined to main
import Database from "better-sqlite3";                     // ✅ main owns it

// ❌ the renderer can't do this anyway (sandbox: true blocks it) — and shouldn't try
// import betterSqlite from "better-sqlite3";

// main — offload CPU-heavy work instead of blocking the event loop that drives windows/IPC
import { utilityProcess } from "electron";
import { join } from "node:path";

const worker = utilityProcess.fork(join(__dirname, "../workers/indexer.js"));
worker.postMessage({ cmd: "index", path: "/Users/me/Documents" });
worker.on("message", (msg) => broadcast("index:progress", msg));

// main/menu.ts — role-based application menu, correct per-OS behavior with minimal code
import { Menu, app } from "electron";

const isMac = process.platform === "darwin";
const template: Electron.MenuItemConstructorOptions[] = [
  ...(isMac ? [{ role: "appMenu" as const }] : []),
  { role: "fileMenu" },
  { role: "editMenu" },          // ✅ Copy/Paste/Undo get correct OS shortcuts and states for free
  { label: "View", submenu: [{ role: "reload" }, { role: "toggleDevTools" }] },
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

// main/tray.ts — keep a module-level reference; a local var is GC'd and the icon vanishes
import { Tray, Menu, nativeImage } from "electron";

let tray: Tray;
export function createTray(iconPath: string, onOpen: () => void) {
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setToolTip("My App");
  tray.setContextMenu(Menu.buildFromTemplate([{ label: "Open", click: onOpen }, { role: "quit" }]));
}

// main/libs/openExternal.ts — allow-list the scheme before ever touching shell.openExternal
import { shell } from "electron";

export function openExternal(url: string) {
  if (!/^https?:\/\//i.test(url)) throw new Error("blocked external url");   // ✅ allow-list first
  return shell.openExternal(url);
}

// ❌ never — file:, smb:, or a custom scheme can trigger far more than a browser tab
// shell.openExternal(userProvidedString);
```

## When to Use
- Considering a native dependency — check for a WASM build first, then a pure-JS option, and only reach for a native addon when neither exists and the need is genuine
- Any dependency with native bindings — confirm the `postinstall` rebuild step exists and prefer packages shipping prebuilds over ones requiring `node-gyp`
- Parsing, indexing, image processing, or any other CPU-bound task that could stall the main event loop — dispatch it to a `utilityProcess` and relay progress back over IPC
- Building the application menu, a tray icon, a native file dialog, or a desktop notification — always from main, exposed to the renderer only through a typed IPC call
- Opening any URL that didn't originate as a hardcoded, trusted string in your own code — route it through an allow-list check before `shell.openExternal`

## Common Mistakes
- **Reaching for a native module before checking for a WASM or pure-JS alternative** — takes on ABI rebuilds, per-platform CI complexity, and asar-unpacking overhead for a problem that often has a simpler, cross-platform answer.
- **Forgetting the `postinstall` rebuild step** — the app runs fine in a fresh `npm install` on the exact machine that built the native module, then throws "compiled against a different Node.js version" for every other developer or CI runner.
- **Leaving a `.node` file inside the asar archive** — `dlopen` can't reach into asar, so the native module fails to load only in the packaged build, never in development, which makes the bug easy to miss until release.
- **Doing CPU-heavy work directly in the main process** — blocks the event loop that also drives every window's IPC and rendering, making the whole app feel unresponsive during the operation.
- **Building the application menu with individual `click` handlers instead of `role`s** — loses the automatic per-OS keyboard shortcuts and enabled/disabled states that role-based items provide, and has to reimplement all of it by hand.
- **Calling `shell.openExternal` on a URL without validating its scheme** — a `file:`, `smb:`, or custom-scheme URL can trigger unintended OS behavior; this is a real code-execution-adjacent risk, not a defensive-programming nicety.
- **Keeping a `Tray` instance in a local variable inside a function** — it gets garbage-collected once the function returns, and the tray icon silently disappears with no error.

## Further Reading
- Electron — Native Node Modules: https://www.electronjs.org/docs/latest/tutorial/using-native-node-modules
- Electron — `utilityProcess`: https://www.electronjs.org/docs/latest/api/utility-process
- Electron — `Menu` API (roles): https://www.electronjs.org/docs/latest/api/menu-item#roles
- Electron — `shell` API: https://www.electronjs.org/docs/latest/api/shell
