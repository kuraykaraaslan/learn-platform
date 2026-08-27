# 427. Electron: Environment, Secrets, Auto-Updates, and Packaging

## What It Is
A shipped Electron binary is not a private server — the asar archive and the renderer bundle are trivially extracted with `npx asar extract`, so anything placed inside them has to be treated as public the instant it ships, with no way to "unship" it after release. This reframes the entire secrets question: there is no client-side hiding place for a long-lived secret, so the architecture has to route around the problem rather than obscure it. The desktop app authenticates a user and receives a short-lived token from a backend rather than embedding a service credential directly, and whatever it does need to persist — that short-lived session token — goes through `safeStorage`, which encrypts with an OS-provided key (Keychain on macOS, DPAPI on Windows, libsecret on Linux) rather than sitting in a plaintext JSON file on disk. Per-process env access follows the same asymmetry covered in the build-config lesson: main reads real `process.env` values through a single Zod-validated `env.ts`, the renderer only ever sees `VITE_`-prefixed public config, and the preload avoids reading env directly, requesting values from main instead when it needs one.

Once the app can update itself, `electron-updater` (paired with `electron-builder`) verifies the new package's signature against the publisher's key before applying it, which only works at all if releases are code-signed and, on macOS, notarized — an unsigned or unnotarized build simply can't self-update, full stop. The lifecycle is surfaced to the renderer through the same wrapped-event IPC pattern used for any other main-to-renderer push: `update-available`, `download-progress`, and `update-downloaded` events drive a `broadcast("update:status", ...)` call, and the renderer subscribes via `onUpdateStatus` the same way it would subscribe to any other one-way main event. `autoDownload` defaults to `false` deliberately — asking before consuming a user's bandwidth on a background download is a UX choice, not a technical requirement — and the distinction between optional and mandatory updates is driven by metadata in the release feed, never a hardcoded branch, since a security-critical mandatory update needs a different (silent-download, insistent-restart-prompt) flow than a routine feature release.

Packaging ties both of these together: `electron-builder` is the primary tool (Forge is an acceptable alternative, but the two are never mixed in the same project since their responsibilities overlap and conflict), and its config specifies per-OS targets (`nsis` for Windows, `dmg` with `hardenedRuntime: true` for macOS notarization, `AppImage`/`deb` for Linux), asar bundling with the native-module unpacking from the previous lesson, and a block of "secure fuses" flipped at package time — `runAsNode: false`, `onlyLoadAppFromAsar: true`, `enableEmbeddedAsarIntegrityValidation: true` — that harden the shipped binary against tampering and "living-off-the-app" abuse patterns that don't require finding a code vulnerability at all, just creative reuse of the app's own signed binary.

## Key Concepts
- **A shipped binary is public** — the asar archive and renderer bundle are trivially extracted; there is no client-side hiding place for a long-lived secret, so the architecture has to route around the problem, not obscure it
- **Prefer short-lived tokens issued by a backend** over embedding any service secret in the app — the desktop app authenticates the user and gets a token with a real expiry, never a static credential
- **`safeStorage` encrypts at-rest secrets with an OS-provided key** (Keychain / DPAPI / libsecret) — this is where a session token lives, never in a plaintext file
- **Per-process env access mirrors the build-config asymmetry**: main reads real `process.env` through one Zod-validated `env.ts`; the renderer only sees `VITE_`-prefixed public config; preload avoids env entirely, asking main when it needs a value
- **`electron-updater` verifies package signatures against the publisher's key** — this only functions if releases are code-signed (and macOS-notarized); an unsigned build cannot self-update regardless of configuration
- **Update lifecycle is surfaced via the same wrapped-event IPC pattern as any other main→renderer push** — `update-available`/`download-progress`/`update-downloaded` broadcast to a subscribed renderer listener
- **`autoDownload: false` by default** — downloading an update silently consumes the user's bandwidth without consent; asking first is the deliberate UX default
- **Mandatory vs optional updates are driven by feed metadata, not a hardcoded branch** — a security-critical update needs a different, more insistent flow than a routine release
- **electron-builder (primary tool) sets per-OS targets and flips secure fuses at package time** — `runAsNode: false`, `onlyLoadAppFromAsar: true`, `enableEmbeddedAsarIntegrityValidation: true` close common tampering paths that don't require an actual code vulnerability

## Example Code
```typescript
// main/libs/secret-store.ts — safeStorage encrypts with an OS-provided key
import { safeStorage, app } from "electron";
import { writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";

const file = join(app.getPath("userData"), "secrets.bin");   // ✅ userData, never next to the executable

export const SecretStore = {
  async set(value: string) {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("no OS encryption available");
    await writeFile(file, safeStorage.encryptString(value));   // ✅ ciphertext on disk
  },
  async get() {
    const buf = await readFile(file).catch(() => null);
    return buf ? safeStorage.decryptString(buf) : null;
  },
};

// ❌ plaintext token on disk
// writeFileSync("token.json", JSON.stringify({ token }));

// main/services/auth.service.ts — short-lived token from a backend, never a bundled service secret
export async function login(creds: { email: string; password: string }) {
  const { accessToken, refreshToken } = await AuthApi.login(creds);   // 15-min token + refresh
  await SecretStore.set(JSON.stringify({ accessToken, refreshToken }));
  return { ok: true };
}

// main/services/updater.service.ts — lifecycle surfaced via the standard wrapped-event pattern
import { autoUpdater } from "electron-updater";
import { logger } from "../libs/logger";

export function initUpdater(broadcast: (channel: string, payload: unknown) => void) {
  if (process.env.NODE_ENV === "development") return;         // ✅ no-op in dev — never hit the feed locally
  autoUpdater.logger = logger;
  autoUpdater.autoDownload = false;                            // ✅ ask before consuming bandwidth
  autoUpdater.on("update-available", (i) => broadcast("update:status", { state: "available", version: i.version }));
  autoUpdater.on("download-progress", (p) => broadcast("update:status", { state: "downloading", percent: p.percent }));
  autoUpdater.on("update-downloaded", () => broadcast("update:status", { state: "ready" }));
  autoUpdater.checkForUpdates();
}

// main/ipc/update.ipc.ts
ipcMain.handle("update:download", (e) => { assertSender(e); return autoUpdater.downloadUpdate(); });
ipcMain.handle("update:install", (e) => { assertSender(e); autoUpdater.quitAndInstall(); });

// ❌ never — disables the integrity guarantee electron-updater exists to provide
// autoUpdater.verifyUpdateCodeSignature = false;
```

```yaml
# electron-builder.yml — per-OS targets, asar unpacking, and secure fuses at package time
appId: com.kuray.myapp
directories: { output: dist, buildResources: build }
files: ["out/**/*"]
asar: true
asarUnpack: ["**/*.node"]
win:   { target: [nsis], icon: build/icon.ico }
mac:   { target: [dmg], icon: build/icon.icns, hardenedRuntime: true }   # required for notarization
linux: { target: [AppImage, deb], category: Utility, icon: build/icon.png }

electronFuses:
  runAsNode: false
  enableNodeOptionsEnvironmentVariable: false
  enableEmbeddedAsarIntegrityValidation: true
  onlyLoadAppFromAsar: true
```

## When to Use
- Storing any user credential, session token, or API key the app must persist between launches — `safeStorage`, never a plain JSON file, never `localStorage` in the renderer
- Designing how the app authenticates against a backend — issue short-lived tokens from the backend rather than embedding any long-lived service secret in the client
- Adding self-update capability — wire `electron-updater` behind the same wrapped-event IPC pattern used for any other main-to-renderer push, and confirm the release pipeline actually code-signs (and, on macOS, notarizes) builds first
- Deciding between an optional and a mandatory update flow — drive the distinction from release/feed metadata, not a hardcoded version check in the client
- Configuring how the app is packaged for the first time — set per-OS targets, `asarUnpack` for native binaries, and the secure fuses together, not as an afterthought once the app is otherwise "done"

## Common Mistakes
- **Storing a token or credential in a plain file or in `localStorage`** — both are trivially readable from a shipped, extracted app; only `safeStorage` (or a vetted OS keychain wrapper) is appropriate.
- **Prefixing a real secret with `VITE_` "just to get it into the renderer quickly"** — it's permanently baked into the shipped bundle at build time with no way to revoke it after release.
- **Shipping an unsigned or unnotarized macOS build and expecting auto-update to work** — `electron-updater`'s signature verification simply fails; there is no configuration flag that makes updates work without proper signing.
- **Setting `autoUpdater.verifyUpdateCodeSignature = false`** — removes the one guarantee that a downloaded update is genuinely from the app's publisher, turning the update channel into a remote-code-execution vector if the feed is ever compromised.
- **Downloading an update silently without `autoDownload: false`** — consumes the user's bandwidth without their awareness, which is especially poor behavior on metered or slow connections.
- **Mixing electron-builder and Electron Forge in the same project** — the two tools have overlapping responsibilities (packaging, updater integration, fuses) and conflict when both try to own the same build step.
- **Writing app data next to the installed executable instead of `app.getPath("userData")`** — the install directory is often read-only for a non-admin user and is shared machine-wide rather than per-user.

## Further Reading
- Electron — `safeStorage` API: https://www.electronjs.org/docs/latest/api/safe-storage
- electron-updater documentation: https://www.electron.build/auto-update
- electron-builder — Configuration: https://www.electron.build/configuration/configuration
- Electron — Fuses: https://www.electronjs.org/docs/latest/tutorial/fuses
