# 428. Electron: Error Handling, Crash Reporting, Performance, and Testing

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_Electron material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
Electron has three genuinely distinct failure channels, and conflating them produces the wrong response to each: an expected, handled error (a validation failure inside an IPC handler) is not a crash and shouldn't be logged or reported like one; an unhandled JS exception (`uncaughtException` in main, `window.onerror` in the renderer) means a bug slipped past normal error handling and needs investigation; and a native or V8 crash (the process actually died) is a `crashReporter` minidump, a different category entirely from either JS-level failure. The handled-error path reuses the `AppError` concept from the TypeScript house style, but crossing the IPC boundary strips a thrown error of its shape entirely — so a handler never lets a domain error propagate as a throw, catching it and returning a discriminated `Result<T>` envelope instead, with the renderer branching on `res.ok` and reading a `userMessage` field that's deliberately never a raw stack trace or internal file path.

Renderer errors need their own capture path since anything logged only in the renderer's DevTools console is lost the moment the window reloads — a React error boundary's `componentDidCatch` and a `window.onerror` handler both forward through `window.api.log.error(...)` so the failure lands in main's persistent log rather than vanishing. Logging itself runs through `electron-log` rather than `console.log`, specifically because `console.log` in a production build leaks to DevTools with no rotation and no durable file, while `electron-log` writes to the OS-correct per-user log directory with a size cap that prevents unbounded growth — and secrets, tokens, and full PII are never logged by either path, mirroring the same logging discipline that applies to a backend service.

Startup performance is treated as a real acceptance gate, not a nice-to-have: the cold-start budget separates what must happen before first paint (acquire the single-instance lock, create and show the main window, register IPC handlers, load the packaged renderer) from what can be deferred until after `ready-to-show` (the auto-updater check, tray/global-shortcut registration, analytics, background sync, DB migrations) — code that blocks `app.whenReady()` on slow work delays the very first thing the user sees. `show: false` until `ready-to-show`, paired with a `backgroundColor` matching the app's theme, prevents the white-flash-before-paint problem, and frequently-toggled windows (a settings panel, a quick-open palette) are hidden and shown rather than destroyed and recreated, since constructing a `BrowserWindow` is measurably expensive. Memory leaks in a long-running desktop app tend to come from a small, recurring set of sources — IPC listeners never unsubscribed, `webContents.send` calls to a window that's already been destroyed, a tray icon or global shortcut never released on quit — each with a specific, narrow fix rather than a general "watch for leaks" instruction.

Testing follows a pyramid shaped by the process model itself: most coverage is Vitest, run against main-process services and Zod schemas as plain functions with no Electron runtime needed, and against renderer components/stores in jsdom with `window.api` stubbed — since components are already fetch-agnostic, mocking the bridge is clean and doesn't require faking IPC itself. A thin layer of Playwright `_electron` E2E tests proves the process boundary actually works end-to-end, launching the real packaged build (not a dev server) so preload wiring, window configuration, and real IPC round-trips are what's under test. Spectron, the older Electron testing tool, is banned outright — deprecated since 2022 and broken on modern Electron versions, with Playwright's `_electron` support as the only supported replacement.

## Key Concepts
- **Three distinct failure channels, never conflated**: expected/handled errors (`AppError` envelope, not a throw), unhandled JS exceptions (`uncaughtException`/`window.onerror`, logged and investigated), native/V8 crashes (`crashReporter` minidumps)
- **A thrown error loses its shape across IPC** — handlers catch domain errors and return a `Result<T>` envelope; `userMessage` is user-facing and never contains a stack trace or internal path
- **Renderer errors must be forwarded to main to survive a reload** — a React error boundary and `window.onerror` both call `window.api.log.error(...)` rather than relying on the DevTools console alone
- **`electron-log` replaces `console.log` in production** — OS-correct log directory, size-capped rotation, and a level split between file and console; secrets/tokens/PII are never logged by either
- **Cold-start budget separates "before first paint" from "deferred after `ready-to-show`"** — single-instance lock, window creation, and IPC registration happen first; updater checks, tray setup, and migrations wait
- **`show: false` + matching `backgroundColor` until `ready-to-show`** prevents the white-flash-before-paint problem
- **Reuse windows via hide/show instead of destroy/recreate** for frequently-toggled windows — constructing a `BrowserWindow` is expensive enough to matter
- **Common leak sources have specific fixes**: unremoved IPC listeners (return an unsubscribe), sending to a destroyed window (guard with `isDestroyed()`), an unreleased tray/global shortcut (release on `will-quit`)
- **Test pyramid mirrors the process model**: Vitest for main services/schemas as plain functions and renderer components with `window.api` stubbed, a thin Playwright `_electron` E2E layer against the real packaged build — Spectron is banned outright

## Example Code
```typescript
// shared/result.ts + main/ipc/users.ipc.ts — errors cross IPC as typed data, never a throw
export type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; userMessage: string } };

ipcMain.handle(IPC.usersList, async (e, raw): Promise<Result<unknown[]>> => {
  assertSender(e);
  try {
    return { ok: true, data: await UsersService.list(UsersListReq.parse(raw)) };
  } catch (err) {
    const ae = toAppError(err);
    logger.warn(ae.code, ae.message);            // full detail logged internally
    return { ok: false, error: { code: ae.code, userMessage: ae.userMessage } };   // sanitized for the UI
  }
});

// main/index.ts — global handlers for genuinely unhandled failures
process.on("uncaughtException", (err) => logger.error("uncaught", err));
process.on("unhandledRejection", (reason) => logger.error("unhandledRejection", reason));

// renderer error boundary — forwarded to main so it survives a reload
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }> {
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    window.api.log.error("renderer", { message: error.message, stack: error.stack, info });
  }
  render() { return this.props.children; }
}

// main/libs/logger.ts — electron-log with rotation, never console.log in production
import log from "electron-log/main";
log.transports.file.level = "info";
log.transports.file.maxSize = 5 * 1024 * 1024;              // rotate at 5MB
log.transports.console.level = process.env.NODE_ENV === "development" ? "debug" : false;
export const logger = log;

// main/index.ts — cold-start budget: paint first, defer everything else
app.whenReady().then(() => {
  registerIpc();
  createMainWindow();                                        // ✅ nothing slow blocks this
});

function onMainWindowReady(win: Electron.BrowserWindow) {
  win.once("ready-to-show", () => {
    win.show();
    queueMicrotask(initDeferredServices);                    // ✅ updater check, tray, migrations — after paint
  });
}

// main/libs/broadcast.ts — guard against sending to a destroyed window (a real leak source)
import { BrowserWindow } from "electron";
export function broadcast(channel: string, payload: unknown) {
  for (const w of BrowserWindow.getAllWindows()) {
    if (!w.isDestroyed()) w.webContents.send(channel, payload);    // ✅ guarded
  }
}

// __tests__/users.service.test.ts — Vitest, no Electron runtime needed
import { describe, expect, test } from "vitest";
import { UsersService } from "@main/services/users.service";

test("list rejects a non-positive page", () => {
  expect(() => UsersService.list(0)).toThrow();
});

// __tests__/UsersScreen.test.tsx — renderer test with window.api stubbed
beforeEach(() => {
  (globalThis as any).window.api = {
    users: { list: vi.fn().mockResolvedValue({ ok: true, data: [{ id: "1" }] }) },
  };
});

// e2e/launch.spec.ts — Playwright _electron against the packaged build, not a dev server
import { test, expect, _electron as electron } from "@playwright/test";

test("launches and completes an IPC round-trip", async () => {
  const app = await electron.launch({ args: ["out/main/index.js"] });
  const win = await app.firstWindow();
  await expect(win.getByRole("heading", { name: "Users" })).toBeVisible();
  await app.close();
});
```

## When to Use
- Any IPC handler that can fail — catch the error and return a `Result<T>` envelope rather than letting a throw cross the process boundary unshaped
- Wrapping the renderer's React tree — add an error boundary that forwards to `window.api.log.error` so failures survive a reload instead of vanishing from the DevTools console
- Anywhere `console.log` would normally go in main or the renderer — use `electron-log` (or the equivalent renderer-to-main forward) instead, in both development and production
- Reviewing app startup time before a release — audit what runs before `ready-to-show` versus what's deferred, and treat a regression here as a release blocker, not a follow-up
- Deciding what test layer a new piece of logic belongs to — plain-function Vitest for services/schemas, `window.api`-stubbed Vitest for renderer components, Playwright `_electron` only for the thin end-to-end layer

## Common Mistakes
- **Treating a validation failure inside a handler as a crash-reportable event** — conflating the three failure channels means noisy crash dashboards full of ordinary, expected errors.
- **Letting a thrown error cross `ipcMain.handle` unshaped** — the renderer's promise rejects with none of the `AppError`'s code, user message, or retryability information intact.
- **Leaving `userMessage` as (or including) a raw stack trace** — leaks internal file paths and implementation details to end users, and is a genuine information-disclosure concern, not just an unpolished UX issue.
- **Relying on the renderer DevTools console for error visibility** — every log line is gone the instant the window reloads or the app restarts; nothing was ever forwarded to main's persistent log.
- **Blocking `app.whenReady()` on migrations or an update check before creating the window** — the user stares at nothing while slow work that could have run after first paint finishes first.
- **Destroying and recreating a settings or palette window on every toggle** — `BrowserWindow` construction is expensive enough that hide/show is the correct default for anything toggled repeatedly.
- **Forgetting to guard `webContents.send` with `isDestroyed()`** — throws when broadcasting to a window that closed mid-operation, a bug that only appears under timing conditions that are easy to miss in manual testing.
- **Using Spectron for E2E on a new project** — it's been unmaintained since 2022 and breaks on modern Electron; Playwright's `_electron` support is the only supported path.

## Further Reading
- Electron — `crashReporter`: https://www.electronjs.org/docs/latest/api/crash-reporter
- electron-log documentation: https://github.com/megahertz/electron-log
- Electron — Performance: https://www.electronjs.org/docs/latest/tutorial/performance
- Playwright — Electron Testing: https://playwright.dev/docs/api/class-electron
