# 430. Electron: Menus, Shortcuts, Tray, Dialogs, and File/Offline UX

## What It Is
Desktop apps expose two visually and functionally different kinds of menu, and confusing them produces a UI that feels subtly wrong even when nothing is technically broken. The **application menu** is the OS-level menu bar — a global bar at the top of the screen on macOS, an in-window bar on Windows/Linux — built from native `Menu` in main and structured around OS-standard top-level items (macOS needs its own app menu with About/Settings/Quit; every platform needs a proper Edit menu with Undo/Redo/Cut/Copy/Paste using OS modifiers). The **context menu** is whatever appears on right-click, and it can be either a native `Menu.popup` or an in-window `DropdownMenu` from your design system positioned at the cursor — the native app menu should never be replaced by an in-window substitute, since macOS users specifically expect the real global menu bar to exist. Every menu item that has a keyboard shortcut displays it, using the platform's own notation, and a trailing ellipsis (`"Export…"`) is reserved specifically for items that open a dialog or need more input before completing — a small convention that, applied consistently, lets users predict an item's behavior before clicking it.

Keyboard shortcuts split into local (menu accelerators, active only while the app or window is focused — Save, New, Find, essentially everything) and global (`globalShortcut`, active system-wide even when the app is unfocused — reserved for the rare case of a summon/quick-capture hotkey). Registering a global shortcut for something as common as Save would hijack that combination for every other app on the user's machine, which is why global shortcuts are treated as a scarce, shared resource: at most one or two per app, ideally configurable, and always unregistered on quit. Every shortcut is labeled in the OS's own modifier notation (`⌘S` on macOS, `Ctrl+S` on Windows/Linux) using `CommandOrControl` in the underlying accelerator string so the same code produces the right binding and the right displayed glyph on each platform, and shortcuts are defined in exactly one registry consumed by the menu, any tooltips, and a shortcuts cheat-sheet — never re-declared per surface, which is how a shortcut list and the actual bindings drift out of sync over time.

The tray icon is an earned feature, not a default one — it belongs on an app that does something meaningful in the background (sync, monitoring, a global hotkey listener) or that benefits from always-available quick actions, and click semantics differ by platform (macOS conventionally opens the menu on left-click; Windows/Linux often open the main window instead). Closing to tray is the single UX decision in this whole area most likely to surprise a user if handled silently: a window's close button quietly keeping a background process alive reads as a bug or a leak unless the app treats it as an explicit setting and explains it the first time it happens. Native dialogs and OS notifications follow the same underlying principle as the menu distinction: native `dialog` is for picking or saving files (never a hand-built HTML file browser) and for hard-blocking decisions before a window exists; your design system's `Modal`/`Toast` covers in-content confirmations and transient feedback; and an OS `Notification` is reserved for when the app is unfocused — while the user is actively looking at the app, an in-app toast or alert banner says the same thing without the interruption of an OS-level notification. Drag-and-drop, file associations, and offline-first behavior round out the "feels like a real desktop citizen" checklist: a visible drop-active state with type validation, a launched-by-the-OS-to-open-a-file path that focuses the right window instead of spawning a duplicate, and a subtle non-blocking offline indicator rather than a full-screen network blocker for an app that has perfectly usable local data.

## Key Concepts
- **Application menu (native, OS-level) vs context menu (native or an in-window `DropdownMenu`)** — never replace the native app menu with an in-window substitute; macOS users specifically expect the real global menu bar
- **Menu items use `role`s for correct per-OS behavior**, show their accelerator inline, and use a trailing `…` consistently to mean "opens a dialog or needs more input"
- **Local shortcuts (menu accelerators) cover almost everything; `globalShortcut` is reserved for a rare summon/quick-capture hotkey** — global shortcuts are a scarce shared resource, always unregistered on quit
- **Shortcuts are labeled in OS-correct notation from one single registry** — the same list drives the menu, tooltips, and any shortcuts cheat-sheet, never re-declared per surface
- **A tray icon is earned by real background behavior**, not added by default — click semantics (menu vs open-window) differ by OS and should be chosen deliberately, not left to accident
- **Closing to tray must never be silent** — make it an explicit setting and explain it (a one-time toast) the first time the window closes while it's enabled
- **Native `dialog` is for file pick/save and hard-blocking pre-window decisions; your design system's `Modal`/`Toast` is for everything in-content; OS `Notification` is only for when the app is unfocused** — don't notify for something the user is actively watching
- **Drag-and-drop, file-open-from-OS, and offline states all need a visible, non-silent affordance** — a drop target with clear active/reject states, single-instance-aware file opening, and an ambient (not blocking) offline indicator

## Example Code
```typescript
// main/menu.ts — application menu with roles, correct top-level order per OS
import { Menu, app } from "electron";
const isMac = process.platform === "darwin";

const template: Electron.MenuItemConstructorOptions[] = [
  ...(isMac ? [{ role: "appMenu" as const }] : []),               // macOS-only app menu (About/Settings/Quit)
  { role: "fileMenu" },
  { role: "editMenu" },                                            // Undo/Redo/Cut/Copy/Paste, OS modifiers
  { label: "Export…", accelerator: "CommandOrControl+E", click: exportDocument },  // "…" = opens a dialog
];
Menu.setApplicationMenu(Menu.buildFromTemplate(template));

// libs/shortcuts.ts — ONE registry, consumed by the menu, tooltips, and the cheat-sheet
export const SHORTCUTS = {
  save:   { accelerator: "CommandOrControl+S", label: "Save" },
  find:   { accelerator: "CommandOrControl+F", label: "Find" },
} as const;

// A local accelerator (menu-bound) vs the rare global shortcut
import { globalShortcut, app } from "electron";

// ✅ Save is local — bound in the menu template, active only when focused
// ❌ never: globalShortcut.register("CommandOrControl+S", save) — hijacks Ctrl+S system-wide

// ✅ a summon hotkey is the legitimate global-shortcut use case
app.whenReady().then(() => globalShortcut.register("CommandOrControl+Shift+Space", focusMainWindow));
app.on("will-quit", () => globalShortcut.unregisterAll());          // always release on quit

// Rendering the platform-correct modifier glyph from the same registry
function ShortcutHint({ shortcutKey }: { shortcutKey: keyof typeof SHORTCUTS }) {
  const isMac = window.api.platform === "darwin";
  const keys = SHORTCUTS[shortcutKey].accelerator.replace("CommandOrControl", isMac ? "⌘" : "Ctrl");
  return <kbd className="text-xs text-text-secondary">{keys}</kbd>;
}

// main/tray.ts — tray earned by real background behavior, explicit close-to-tray messaging
import { Tray, Menu, nativeImage, BrowserWindow } from "electron";
let tray: Tray;
let hasShownCloseToTrayHint = false;

export function createTray(iconPath: string) {
  tray = new Tray(nativeImage.createFromPath(iconPath));
  tray.setContextMenu(Menu.buildFromTemplate([{ label: "Open", click: focusMainWindow }, { role: "quit" }]));
}

export function handleWindowClose(win: BrowserWindow, closeToTrayEnabled: boolean) {
  if (!closeToTrayEnabled) return;                                  // default: normal close/quit behavior
  if (!hasShownCloseToTrayHint) {
    win.webContents.send("toast:show", { title: "Still running in the tray", body: "Quit from the tray menu to exit fully." });
    hasShownCloseToTrayHint = true;                                  // ✅ explained once, not silent
  }
}

// Native file dialog vs in-app confirm — chosen by purpose, not convenience
const path = await window.api.dialog.openFile();                    // ✅ file picking is always native
// <ConfirmModal open title="Delete project?" confirmLabel="Delete" onConfirm={remove} />  ✅ in-app confirm

// OS notification only while unfocused; in-app toast while the user is looking
function notifyExportComplete(isFocused: boolean, filePath: string) {
  if (isFocused) {
    showToast("success", "Export complete", `${filePath} is ready`);   // ✅ in-app, no OS interruption
  } else {
    window.api.notify({ title: "Export complete", body: `${filePath} is ready`, onClickPath: filePath });
  }
}

// Ambient, non-blocking offline indicator — never a full-screen blocker
function StatusBarOnlineState({ online }: { online: boolean }) {
  return <span className="text-xs text-text-secondary">{online ? "Synced" : "Offline — changes will sync"}</span>;
}
```

## When to Use
- Building the app's top-level menu bar — use native `Menu` with `role`-based items, and reserve an in-window `DropdownMenu` for in-content, right-click context menus
- Adding any keyboard shortcut — default to a local menu accelerator; reach for `globalShortcut` only for a genuine summon/quick-capture case, and register it against the same single shortcuts registry used elsewhere
- Deciding whether the app needs a tray icon — only if it does something meaningful while unfocused or in the background; if it adds one, decide close-to-tray behavior explicitly and communicate it once
- Picking or saving a file, or showing a hard-blocking pre-window error — native `dialog`; everything else in-content — your design system's `Modal`/`Toast`
- Notifying the user of something that finished — OS `Notification` only if the app is unfocused; an in-app toast if they're already looking at it
- Handling dropped files, OS-triggered file opens, or a lost network connection — always with a visible, explained affordance, never a silent or blocking one

## Common Mistakes
- **Replacing the native macOS application menu with an in-window substitute** — macOS users specifically expect the real global menu bar; an in-window replacement reads as broken even if it's functionally complete.
- **Registering a global shortcut for a common action like Save** — hijacks that key combination system-wide for every other application the user runs, not just this one.
- **Re-declaring the same shortcut list separately for the menu, a tooltip, and a cheat-sheet** — the three surfaces drift out of sync the first time one of them is updated without touching the others.
- **Adding a tray icon to an app with no real background behavior** — an unearned tray icon is just clutter that outlives its usefulness the moment the user realizes it does nothing while the window is closed.
- **Closing to tray silently, with no explanation** — the user assumes quitting via the window's close button actually quit the app, and either thinks it's a bug or that the process is a leak.
- **Building a custom HTML file browser instead of the native `dialog`** — loses OS-level file-system integration (recent locations, search, correct permissions handling) that users already rely on.
- **Sending an OS notification for something the user is actively watching happen in the app** — an unnecessary interruption; that's exactly what an in-app toast is for.
- **A full-screen "No internet" blocker in an app that has usable local data** — desktop users expect to keep working offline; block only the specific action that genuinely requires the network.

## Further Reading
- Electron — Menus: https://www.electronjs.org/docs/latest/api/menu
- Electron — `globalShortcut`: https://www.electronjs.org/docs/latest/api/global-shortcut
- Electron — `Tray`: https://www.electronjs.org/docs/latest/api/tray
- Electron — `dialog` and `Notification`: https://www.electronjs.org/docs/latest/api/dialog
