# 429. Electron: Window Chrome, Multi-Window UX, and Desktop Layout

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' UI_Interface_Rules_Electron material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
A desktop app's window frame is the first thing that signals whether it feels native or foreign, and the default choice is the OS's own native frame (`frame: true`) — a custom, frameless title bar is a deliberate opt-in for when the app genuinely needs a branded toolbar or tab strip in that space, not a cosmetic default. Going frameless means taking on three specific responsibilities per OS: a draggable region (`-webkit-app-region: drag` on the bar itself, with every interactive child explicitly marked `no-drag`, since a fully-draggable bar makes its own buttons unclickable), a reserved inset for macOS's native traffic-light controls (`titleBarStyle: "hiddenInset"` keeps them while hiding the rest of the bar), and correct control placement — macOS traffic lights stay left and native, Windows/Linux controls are drawn on the right when frameless. Getting any one of these wrong reads as broken specifically on the platform that got it wrong, which is what makes cross-platform QA on real macOS, Windows, and Linux machines non-negotiable for a frameless design.

Multi-window decisions default toward *not* opening a new window: a single window with in-app client routing handles the common case, and a genuinely separate `BrowserWindow` is reserved for side-by-side document comparison, a detached inspector/tool palette, or a multi-monitor workflow where the user benefits from two contexts visible at once. Most things that look like they need a modal window are better served by an in-window KUIreact `Modal` — a native modal child window blocking its parent is the rare case, while a modeless secondary window (an inspector that stays open alongside the main window) is the common one when multiple windows are used at all. When more than one window does exist, state scope has to be explicit: a global setting change broadcasts to every open window through the same wrapped IPC event pattern used elsewhere, while per-document state (a zoom level, a scroll position) stays local to its own window's store — the failure mode to avoid is two windows editing what's supposed to be the same data with silently diverging local copies.

Desktop layout differs from web layout in density and resilience to resizing, not in its component vocabulary — the same KUIreact primitives compose into tighter chrome (28–32px control heights and compact list rows instead of the touch-friendly 40–44px web defaults) while keeping keyboard focus rings and a comfortable mouse hit target, since "denser" is not license to drop accessibility. A desktop window resizes freely by design, so layouts are built as flexible grid regions (title bar/toolbar, scrollable content, status bar) rather than a fixed pixel canvas, with a sensible minimum window size enforced at the window-factory level so the layout has a floor it can't be squeezed past. The same resilience extends across monitors: a window can be dragged to a display with a different DPI/scale at any time, so layouts use scalable units and `@2x`/SVG assets rather than fixed pixel values, and a window's last position is validated against the currently connected displays before being restored — the layout-and-restoration half of the same problem the window-management lesson's state-persistence code solves.

## Key Concepts
- **Native frame is the default; frameless is an opt-in for a branded toolbar/tab strip**, not a cosmetic choice — going frameless means owning drag regions, traffic-light insets, and per-OS control placement yourself
- **A custom title bar needs three things right**: an explicit drag region with `no-drag` interactive children, a macOS traffic-light inset (`titleBarStyle: "hiddenInset"`), and OS-correct control placement (macOS left/native, Windows/Linux right/custom)
- **Default to one window with client routing** — reach for a second `BrowserWindow` only for side-by-side comparison, a detached tool palette, or a genuine multi-monitor workflow
- **Most "modals" should be in-window KUIreact `Modal`s, not separate OS windows** — a true modal child window is the rare case; a modeless secondary window is the common one when multiple windows exist at all
- **State scope must be explicit across windows**: a global setting broadcasts to all windows via IPC; per-document state (zoom, scroll position) stays local — never let two windows silently diverge on what's meant to be shared data
- **Desktop density is tighter than web, but accessibility floors don't move** — 28–32px control heights and compact rows are fine; keyboard focus rings and comfortable mouse hit targets are not optional
- **Layouts are fluid grid regions, not a fixed canvas** — a window resizes freely, so chrome (toolbar/sidebar/status bar) stays pinned while content scrolls, bounded by a sensible minimum window size
- **Multi-monitor/HiDPI resilience is a layout concern, not just a persistence concern** — scalable units and `@2x`/SVG assets survive a drag to a different-DPI display; restored window position must be validated against currently connected displays

## Example Code
```tsx
// A custom title bar done correctly: explicit drag region, no-drag children, traffic-light spacer
function TitleBar() {
  return (
    <header
      className="h-10 flex items-center bg-surface-base"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}   // ✅ the bar itself is draggable
    >
      <div style={{ width: 78 }} />                                  {/* reserve macOS traffic-light inset */}
      <span className="px-3 text-sm">My App</span>
      <div className="ml-auto" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <WindowControls />                                           {/* ✅ buttons stay clickable */}
      </div>
    </header>
  );
}

// main/windows/createMainWindow.ts (excerpt) — per-OS title bar style + a real minimum size
import { BrowserWindow } from "electron";

const isMac = process.platform === "darwin";

export function createMainWindow() {
  return new BrowserWindow({
    minWidth: 960, minHeight: 600,                                   // ✅ layout has a floor
    titleBarStyle: isMac ? "hiddenInset" : undefined,                 // native traffic lights, hidden bar
    titleBarOverlay: !isMac ? { color: "#0f172a", symbolColor: "#fff" } : undefined,
    webPreferences: { /* secure defaults from the preload/context-isolation lesson */ },
  });
}

// Fluid desktop layout: chrome pinned, content scrolls, status bar anchored
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] h-screen">
      <Toolbar />
      <main className="overflow-auto">{children}</main>
      <StatusBar />
    </div>
  );
}

// ❌ a fixed 1280x800 layout that clips or letterboxes on resize
// <div style={{ width: 1280, height: 800 }}>...</div>

// Per-window vs global state — the failure mode to avoid is silent divergence
// ✅ global theme broadcasts to every window (main → wrapped IPC event, per the process-model lesson)
useEffect(() => window.api.onThemeChanged((dark) => applyTheme(dark)), []);

// ✅ per-document zoom stays local to this window's own store
const useDocumentStore = create<{ zoom: number }>(() => ({ zoom: 1 }));

// Multi-window: prefer a modeless inspector over a blocking modal child window
function openInspector() {
  const win = new BrowserWindow({ width: 360, height: 600, parent: mainWindow, modal: false });  // ✅ modeless
  win.loadFile("inspector.html");
}
```

## When to Use
- Deciding on window chrome for a new app — start with the native frame; move to frameless only when a toolbar/tab-strip genuinely needs to live in the title bar area, and budget real per-OS QA time for it
- Any feature that seems to want a second window — check first whether in-app routing or an in-window `Modal` covers the need before creating a new `BrowserWindow`
- A setting that should apply everywhere the user has a window open — broadcast it via IPC rather than expecting each window to independently stay in sync
- Laying out any desktop screen, especially data-dense tools — use the tighter end of the spacing scale for chrome, but verify focus rings and hit targets still meet the accessibility floor
- Restoring a window's position on launch — validate it against currently connected displays, not just the saved coordinates, so a window can't reopen on a monitor that's no longer attached

## Common Mistakes
- **Going frameless purely for visual branding without budgeting per-OS QA** — a title bar that's fine on macOS and broken on Windows (wrong control side, no drag region) reads as unfinished, not stylish.
- **A full-width drag region with no `no-drag` zones carved out** — every button, input, and interactive element inside the title bar becomes unclickable.
- **Building a native modal child window for an in-content confirmation** — heavier than necessary and visually inconsistent with the rest of the app; a KUIreact `Modal` handles the vast majority of "modal" needs in-window.
- **Letting two open windows edit the same underlying data with independent local state** — produces silent divergence where neither window's view is authoritative, and whichever saves last wins with no warning to the user.
- **Shrinking control heights and hit targets below the accessible floor while chasing desktop density** — density is about tighter spacing and more visible rows, not about dropping below a comfortable, keyboard-and-mouse-accessible minimum.
- **Assuming the primary display's size and DPI for every layout decision** — a window can be dragged to any connected monitor at any time; fixed-pixel layouts and low-res raster assets look broken the moment that happens.
- **Restoring a window's last position without validating against currently connected displays** — the window can reopen entirely off-screen if a monitor was disconnected since the last session.

## Further Reading
- Electron — Custom Window Title Bar: https://www.electronjs.org/docs/latest/tutorial/custom-title-bar
- Electron — `BrowserWindow` (titleBarStyle, minWidth/minHeight): https://www.electronjs.org/docs/latest/api/browser-window
- Electron — Multiple Windows: https://www.electronjs.org/docs/latest/tutorial/multiple-windows
- Apple Human Interface Guidelines — Windows: https://developer.apple.com/design/human-interface-guidelines/windows
