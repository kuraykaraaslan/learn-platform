# kui-react — Copied Components (Provenance)

Everything under this `kui/` folder is **copied**, not installed, from
`/home/kuray/kui-react` (`@kuraykaraaslan/kui-react`, v1.0.1), per the
company rule: "Reuse, don't reinvent: build React UI from the forked
KUIreact component library... copy/adapt on demand and record provenance."

Copied 2026-08-26. Entry-point files (`app/AppShell.tsx`, `app/AppSidebar.tsx`,
`app/AppTopBar.tsx`, `ui/Badge.tsx`, `ui/Drawer.tsx`,
`ui/Overlays/Drawer/index.tsx`) carry an individual `// COPIED FROM:` header.

The following support files under `ui/Overlays/shared/` are copied verbatim,
unmodified, as a single internal implementation detail of `Drawer` (no `@/`
import rewrites were needed — they only import React/relative siblings):
`useFocusTrap.ts`, `useScrollLock.ts`, `usePresence.ts`, `usePortal.ts`,
`useRouteClose.ts`, `useDismiss.ts`, `positioning.ts`.

## Import rewrite convention

kui-react's own internal imports use `@/modules/ui/*` and `@/modules/app/*`
(root-relative within kui-react's own repo). In this project those become
`@kui/ui/*` and `@kui/app/*` (see `tsconfig.json`'s `@kui/*` path alias →
`./modules/shared/ui/kui/*`), so copied files keep working without touching
their internal logic. `@/libs/utils/*` imports are left unchanged because
`libs/utils/cn.ts`, `libs/utils/isBrowser.ts`, and `libs/utils/polymorphic.ts`
are copied to the same relative path in this project.

## Updating

To pull in an upstream kui-react fix: re-copy the file from
`/home/kuray/kui-react`, redo the `@/modules/{ui,app}/` → `@kui/{ui,app}/`
rewrite, and keep the `// COPIED FROM:` header's date current. Do not patch
copied files with unrelated local changes — if this project needs different
behavior, that's a fork, and it should say so in the header.
