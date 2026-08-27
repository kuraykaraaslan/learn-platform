# 421. Electron: Process Model and Typed IPC Channels

## What It Is
Electron ships three distinct processes, and the single most important architectural decision in a desktop app is treating the boundary between them as a real trust boundary rather than an implementation detail. The **main** process is Node — it owns the app lifecycle, windows, the filesystem, the network, the OS keychain — and it must never trust input from the renderer without validating it. The **renderer** is Chromium, sandboxed, and treated exactly like an untrusted web page: it never touches Node, `fs`, a database, or outbound HTTP to internal services directly. The **preload** script is the sole bridge between them, and its only job is to expose a small, explicit, typed API via `contextBridge` — never business logic, and never the raw `ipcRenderer` object itself. This is a fundamentally different mental model than a web app's client/server split: in Electron, the "client" (renderer) runs on the same machine as the "server" (main), which makes it *more* tempting to skip the validation a real network boundary would force — and exactly why skipping it is more dangerous, not less.

Every feature that needs privileged access crosses this boundary through exactly one typed channel, defined once in `shared/ipc-contract.ts` and imported by all three processes as types and Zod schemas only — no runtime side effects, no Node imports, nothing that would pull Node code into the renderer bundle. `ipcRenderer.invoke` paired with `ipcMain.handle` is the default shape for anything with a return value: promise-based, and validated with `Schema.parse(raw)` inside the handler, because the renderer is capable of sending anything, malicious or malformed, and main has to treat every payload as hostile input regardless of how trusted the UI code appears. The narrower `send`/`on` pair (fire-and-forget) is reserved for renderer→main commands with no return value, like `window:minimize` — the moment a result or acknowledgment is needed, it's `invoke`/`handle`, not `send`/`on`.

Two failure modes are common enough to call out explicitly. First, validating the payload isn't enough on its own — a handler also has to validate the *sender*, checking `event.senderFrame.url` against an allow-list, because a hijacked sub-frame or injected content could otherwise call a privileged channel even with a perfectly-shaped payload. Second, a thrown error inside `ipcMain.handle` rejects the renderer's promise but loses its shape entirely across the boundary — the fix is to never let a domain error propagate as a throw; catch it, convert it to a serializable envelope (`{ ok: true, data } | { ok: false, error }`), and let the renderer branch on `res.ok` with the full typed error intact.

## Key Concepts
- **Three processes, three trust levels**: main (Node, privileged, trusts nothing from the renderer), renderer (Chromium, sandboxed, treated as untrusted web content), preload (the only bridge, minimal and typed)
- **`shared/ipc-contract.ts` is types + Zod only** — imported by all three processes, zero runtime side effects, zero Node imports, so it can safely land in the renderer bundle
- **`invoke`/`handle` is the default** for anything with a return value — promise-based, and the payload is `Schema.parse()`-validated inside the `handle` callback, never trusted as-is
- **`send`/`on` is narrow, fire-and-forget only** — acceptable for commands with no return value (`window:minimize`); anything needing a result or ack uses `invoke`/`handle` instead
- **Every handler validates two independent things**: the payload (Zod, since the renderer can send anything) and the sender (`event.senderFrame.url` against an allow-list, since a hijacked frame could call the channel with a valid-looking payload)
- **Never expose raw `ipcRenderer` or a generic `invoke` wrapper** on `window` — that re-opens the entire attack surface `contextIsolation` was meant to close; the bridge is an explicit, named allow-list of operations
- **One-way main→renderer events use a wrapped, unsubscribable listener** in preload — `webContents.send` in main, and the preload strips the raw `IpcRendererEvent` (which leaks `sender`) before handing the callback to the renderer
- **Errors cross the boundary as data, not as thrown exceptions** — a thrown error in `handle` loses its shape; return a discriminated `Result<T>` envelope instead so the renderer can branch on `res.ok` with full type information

## Example Code
```tsx
// shared/ipc-contract.ts — imported by main, preload, AND renderer; types + Zod only
import { z } from "zod";

export const IPC = { usersList: "users:list", settingsSet: "settings:set" } as const;

export const UsersListReq = z.object({ page: z.number().int().min(1) });
export type UsersListReq = z.infer<typeof UsersListReq>;

export type Result<T> = { ok: true; data: T } | { ok: false; error: { code: string; userMessage: string } };

// main/ipc/guard.ts — sender validation, independent of payload validation
export function assertSender(e: Electron.IpcMainInvokeEvent) {
  const url = e.senderFrame?.url ?? "";
  if (!url.startsWith("app://") && !url.startsWith("file://")) {
    throw new Error("IPC rejected: untrusted sender");
  }
}

// main/ipc/users.ipc.ts — invoke/handle, validated payload + sender, errors as data
import { ipcMain } from "electron";
import { IPC, UsersListReq, type Result } from "../../shared/ipc-contract";
import { UsersService } from "../services/users.service";
import { toAppError } from "../libs/app-error";

ipcMain.handle(IPC.usersList, async (e, raw): Promise<Result<unknown[]>> => {
  assertSender(e);
  try {
    const input = UsersListReq.parse(raw);            // ✅ hostile input, validated at the boundary
    return { ok: true, data: await UsersService.list(input.page) };
  } catch (err) {
    const ae = toAppError(err);
    return { ok: false, error: { code: ae.code, userMessage: ae.userMessage } };
  }
});

// preload/index.ts — the ONLY bridge; small, named, typed; never raw ipcRenderer
import { contextBridge, ipcRenderer } from "electron";
import { IPC, type UsersListReq, type Result } from "../shared/ipc-contract";

const api = {
  users: {
    list: (req: UsersListReq): Promise<Result<unknown[]>> => ipcRenderer.invoke(IPC.usersList, req),
  },
  window: {
    minimize: () => ipcRenderer.send("window:minimize"),      // ✅ send/on — no return value needed
  },
  onUpdateStatus: (cb: (s: { state: string }) => void) => {
    const handler = (_e: unknown, s: { state: string }) => cb(s);
    ipcRenderer.on("update:status", handler);
    return () => ipcRenderer.removeListener("update:status", handler);  // ✅ always return an unsubscribe
  },
};

contextBridge.exposeInMainWorld("api", api);
export type AppApi = typeof api;

// ❌ never do this — defeats the entire security boundary
// contextBridge.exposeInMainWorld("api", { invoke: ipcRenderer.invoke.bind(ipcRenderer) });

// renderer — typed, can reach nothing else
const res = await window.api.users.list({ page: 1 });
if (!res.ok) showToast("error", res.error.userMessage);
```

## When to Use
- Any renderer feature that needs Node, the filesystem, the network, or the OS keychain — reach it through a new typed IPC channel, never by relaxing `nodeIntegration`
- Adding a value-returning operation between renderer and main — `invoke`/`handle`, always validated on both payload and sender
- A simple renderer→main command with nothing to return (minimize, close, a fire-and-forget log line) — `send`/`on` is appropriate here, but stop reaching for it the moment a result is needed
- Pushing state changes from main to the renderer (update progress, theme changes) — the wrapped-listener-with-unsubscribe pattern, never a raw `ipcRenderer.on` handed to the renderer
- Any place a domain error can occur inside a handler — wrap it in a `Result<T>` envelope instead of letting it throw across the boundary

## Common Mistakes
- **Exposing `ipcRenderer` (or a generic `invoke` passthrough) on `window`** — the renderer can now call any channel with any payload, collapsing the entire boundary the three-process model exists to create.
- **Validating the payload but not the sender** — a handler that only calls `Schema.parse(raw)` is still reachable by a hijacked sub-frame or injected content sending a perfectly valid-looking payload.
- **Letting a thrown error propagate out of `ipcMain.handle`** — the renderer's promise rejects, but the rich `AppError` shape (code, user message, retryability) is lost; return it as data instead.
- **Using `send`/`on` for anything that needs a return value** — there's no way to get a typed response back through fire-and-forget; the moment an ack or result matters, it should have been `invoke`/`handle` from the start.
- **Passing the raw `IpcRendererEvent` through to a renderer callback** — it leaks `sender` and other internals the renderer has no legitimate reason to see; strip it in the preload wrapper.
- **Forgetting to return the unsubscribe function from a wrapped listener** — every `useEffect` that subscribes leaks a listener on unmount, and listeners accumulate across window reloads.

## Further Reading
- Electron — Inter-Process Communication: https://www.electronjs.org/docs/latest/tutorial/ipc
- Electron — Context Isolation: https://www.electronjs.org/docs/latest/tutorial/context-isolation
- Electron — Process Model: https://www.electronjs.org/docs/latest/tutorial/process-model
- Zod documentation: https://zod.dev/
