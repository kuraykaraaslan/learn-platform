# 423. Electron: Main Process Lifecycle and Window Management

## What It Is
The main process entry point wires app lifecycle events in a fixed, deliberate order, and getting that order wrong produces bugs that only show up in specific, hard-to-reproduce scenarios: `app.requestSingleInstanceLock()` runs before anything else, because a second launch of the app should focus the existing window, not spawn a duplicate process fighting over the same user-data directory. `app.whenReady()` gates IPC registration and window creation. `activate` recreates a window on macOS when the dock icon is clicked with no windows open — a behavior unique to macOS's app-stays-alive-without-windows model. `window-all-closed` quits the app everywhere except macOS, where an app conventionally keeps running (in the dock, potentially in a tray) even with zero open windows. Getting this backwards — quitting on `window-all-closed` unconditionally — makes a macOS app behave like it crashed every time the user closes its last window.

Every `BrowserWindow` in the app is created by exactly one factory function, never scattered `new BrowserWindow(...)` calls across the codebase, because the factory is where the secure `webPreferences` baseline lives (covered in the preload/context-isolation lesson) and where window-state restoration is wired. State restoration means persisting bounds and maximized state to a main-side store — never `localStorage`, which is renderer-only and vanishes on relaunch — and validating the restored bounds against the currently connected displays before applying them, so a window doesn't try to reopen off-screen after a monitor gets unplugged between sessions. Windows are also created with `show: false` and shown only on the `ready-to-show` event, which avoids the white/blank flash that appears when a window paints before its content has loaded.

Deep links follow a parallel lifecycle concern: registering the app as the default protocol handler for a custom scheme (`myapp://`) means the OS routes those links to a running instance, but the *arrival* mechanism differs by platform — Windows and Linux deliver the URL as an argument in the `second-instance` event's `argv`, while macOS fires a dedicated `open-url` event. Whichever path it arrives through, the URL is untrusted external input exactly like any other external input and must be validated (scheme and an allow-listed host/path) before the app acts on it — a deep link is not inherently safer just because it came from the OS's own URL-routing mechanism rather than a network request.

## Key Concepts
- **Lifecycle order is fixed and deliberate**: single-instance lock first → `whenReady` → register IPC → create window → platform-specific quit rules
- **`app.on("activate")` recreates a window on macOS** when the dock is clicked with no windows open — this is a macOS-only behavior with no Windows/Linux equivalent
- **`window-all-closed` quits everywhere except macOS** (`process.platform !== "darwin"`) — macOS apps conventionally keep running without any open window
- **One window factory, never scattered `new BrowserWindow(...)`** — it's the single place secure `webPreferences` and window-state restoration live; drift here means some windows are insecure by omission
- **Window state (bounds, maximized) persists to a main-side store, never `localStorage`** — `localStorage` is renderer-scoped and doesn't survive a relaunch
- **Restored bounds are validated against currently connected displays** — prevents a window reopening off-screen after a monitor is disconnected between sessions
- **`show: false` + show-on-`ready-to-show`** avoids the white-flash-before-paint that a window shown immediately produces
- **Deep links arrive differently per OS**: Windows/Linux via `second-instance`'s `argv`, macOS via a dedicated `open-url` event — both paths carry untrusted external input that must be validated before use
- **Main mirrors the app's usual layering**: thin IPC handlers validate and delegate, services own the actual business logic and Node/fs/DB access — handlers are never where business logic lives

## Example Code
```typescript
// src/main/index.ts — the fixed lifecycle order
import { app, BrowserWindow } from "electron";
import { createMainWindow } from "./windows/createMainWindow";
import { registerIpc } from "./ipc";
import { focusMainWindow } from "./windows/windowRegistry";
import { handleDeepLink } from "./services/deepLink.service";

if (!app.requestSingleInstanceLock()) {
  app.quit();                                                    // ✅ before anything else
} else {
  app.on("second-instance", (_e, argv) => {
    focusMainWindow();
    const link = argv.find((a) => a.startsWith("myapp://"));      // Windows/Linux deep link arrival
    if (link) handleDeepLink(link);
  });

  app.on("open-url", (e, url) => { e.preventDefault(); handleDeepLink(url); });  // macOS deep link arrival

  app.whenReady().then(() => {
    registerIpc();                                                 // ✅ once, before any window exists
    createMainWindow();
    app.on("activate", () => {
      if (!BrowserWindow.getAllWindows().length) createMainWindow();  // macOS: dock click with no windows
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();                 // ✅ macOS apps survive with no windows
  });

  app.setAsDefaultProtocolClient("myapp");
}

// src/main/windows/createMainWindow.ts — the ONE window factory
import { BrowserWindow } from "electron";
import path from "node:path";
import { loadWindowState } from "../libs/windowState";
import { loadRendererContent } from "./loadRendererContent";
import { hardenNavigation } from "./hardenNavigation";

export function createMainWindow(): BrowserWindow {
  const state = loadWindowState("main");                          // restore persisted bounds

  const win = new BrowserWindow({
    ...state.bounds,
    show: false,                                                   // ✅ avoid the white-flash
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true, sandbox: true, nodeIntegration: false,
    },
  });

  state.track(win);                                                 // debounced save on move/resize
  hardenNavigation(win);
  win.once("ready-to-show", () => win.show());
  loadRendererContent(win);
  return win;
}

// src/main/services/deepLink.service.ts — untrusted input, validated regardless of arrival path
const ALLOWED_HOSTS = new Set(["open", "invite"]);

export function handleDeepLink(rawUrl: string) {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return; }                 // reject malformed input
  if (url.protocol !== "myapp:" || !ALLOWED_HOSTS.has(url.hostname)) return;  // allow-list, not a blind trust
  // route based on url.hostname / url.pathname
}

// main/ipc/users.ipc.ts — handler stays thin, delegates to the service layer
ipcMain.handle(IPC.usersList, (e, raw) => {
  assertSender(e);
  return UsersService.list(UsersListReq.parse(raw));                // business logic lives in the service
});
```

## When to Use
- Writing `src/main/index.ts` for a new app — wire lifecycle events in the documented order, don't improvise a different sequence even if it "seems to work" in manual testing
- Any place a new `BrowserWindow` might be needed — extend the existing factory (or add a second dedicated factory for a genuinely different window type) rather than instantiating one inline
- Adding a settings window, a quick-open palette, or any frequently-toggled window — persist and restore its bounds the same way the main window does
- Supporting `myapp://` links from outside the app — register the protocol once, and validate every incoming URL identically regardless of whether it arrived via `second-instance` or `open-url`
- Any IPC handler that's grown past a few lines of logic — that's the signal to extract a service function and keep the handler a thin, validated adapter

## Common Mistakes
- **Quitting on `window-all-closed` unconditionally** — makes a macOS build feel broken, since users expect the app (and its dock icon) to persist after closing the last window.
- **Skipping `app.requestSingleInstanceLock()`** — a second launch spawns a competing process against the same user-data directory instead of focusing the window that's already open.
- **Scattering `new BrowserWindow(...)` calls across multiple files** — secure `webPreferences` drift between windows, and window-state restoration has to be reimplemented (or forgotten) at every call site.
- **Persisting window bounds to `localStorage`** — it's renderer-scoped and gone on the next launch; window state has to live in a main-side store.
- **Restoring saved bounds without checking connected displays** — a window can silently open off-screen (fully unreachable) after the user unplugs the monitor it was last positioned on.
- **Treating a deep link URL as trusted because it came from the OS** — it's still attacker-influenced external input; skipping scheme/host validation opens the same class of bug as an unvalidated query parameter.

## Further Reading
- Electron — App Lifecycle Events: https://www.electronjs.org/docs/latest/api/app
- Electron — Single Instance Lock: https://www.electronjs.org/docs/latest/api/app#apprequestsingleinstancelock
- Electron — Deep Linking / Custom Protocols: https://www.electronjs.org/docs/latest/tutorial/launch-app-from-url-in-another-app
- Electron — `BrowserWindow`: https://www.electronjs.org/docs/latest/api/browser-window
