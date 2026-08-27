# 413. React Native: File Organization and Banned Patterns for Expo Apps

## What It Is
An Expo Router app organizes files around two axes that don't exist together in an Express or Spring Boot backend: a routing tree (`app/`) that the filesystem itself defines, and a set of concern-based top-level folders (`components/`, `hooks/`, `stores/`, `libs/`, `types/`) that hold everything the routes call into. The `app/` directory is Expo Router v4's file-based routing — every file is a screen, `(group)` folders create route groups that share a layout without adding a URL segment, `[param].tsx` is a dynamic segment, and `_layout.tsx` wraps its directory with navigation chrome. Screens are default exports; everything in `components/` is a named export. Hooks never live inside `components/` — even a hook used by exactly one component still belongs in `hooks/`, because the moment a second screen needs the same data-fetching logic, it's already in the right place.

This ruleset also carries a list of hard bans that matter more here than almost anywhere else in the stack, because getting them wrong doesn't just create inconsistency — it creates security or performance bugs specific to mobile. `AsyncStorage` is banned for anything sensitive (it's unencrypted) and banned for global state persistence (it's slow and synchronous-API-shaped in a way that doesn't fit Zustand's persist middleware well) — `SecureStore` and MMKV are the respective replacements. React Context and Redux are both banned for global state in favor of Zustand, not because they don't work, but because this shop standardizes on one tool everywhere rather than letting three state-management philosophies coexist in the same codebase. React Query and SWR are absent entirely — data fetching is `axiosInstance` plus `useState`/`useEffect` in a custom hook, a deliberately simpler baseline than a caching data-fetching library.

The `libs/` folder is where every piece of shared infrastructure lives, and each file has exactly one job: `axios.ts` is the singleton HTTP client, `env.ts` is the only place `process.env` is read (parsed once through a Zod schema), `secureStorage.ts` wraps `SecureStore`, `mmkv.ts` is the Zustand persist engine, and `utils/cn.ts` merges NativeWind class names. Reading `process.env` directly anywhere outside `env.ts`, or hitting `fetch()` directly in a screen instead of going through `axiosInstance`, are both flagged in review — not because they fail immediately, but because they route around the interceptors and env validation that make the rest of the app predictable.

## Key Concepts
- **`app/` is the route tree**: `(group)` folders share a layout with no URL segment, `[param].tsx` is dynamic, `_layout.tsx` wraps its directory, `+not-found.tsx` is the 404 screen
- **Screens are default exports; components are named exports** — a consistent, greppable distinction between "this file is a route" and "this file is reusable UI"
- **Hooks always live in `hooks/`, never co-located inside `components/`** — even single-use hooks, because reuse tends to arrive later
- **Banned**: `AsyncStorage` for anything sensitive or for global-state persistence, React Context or Redux for global state, React Query/SWR, raw `fetch()` in screens/hooks, `console.log` in production code, direct `process.env.X` access, `app.json` instead of `app.config.ts`
- **`libs/` holds all shared infrastructure**: `axios.ts` (HTTP singleton), `env.ts` (the only `process.env` read site, Zod-parsed), `secureStorage.ts`, `mmkv.ts`, `utils/cn.ts`
- **`app.config.ts` is TypeScript, never `app.json`** — the config file needs type safety and the ability to compute values dynamically
- **Route groups are mandatory for auth splitting**: `(auth)/` and `(tabs)/` (or `(drawer)/`) separate unauthenticated and authenticated flows, each with its own `_layout.tsx`
- **`EXPO_PUBLIC_*` is the only env prefix visible to the client bundle** — anything without that prefix silently resolves to `undefined` in Expo's client code

## Example Code
```
my-expo-app/
├── app/
│   ├── _layout.tsx           ← root layout: fonts, SafeAreaProvider, Toaster
│   ├── +not-found.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   └── (tabs)/
│       ├── _layout.tsx       ← tab navigator, reads useAuthStore for the guard
│       ├── index.tsx
│       └── profile.tsx
├── components/
│   ├── common/                ← Button, Input, Card — no routing logic
│   └── user/UserCard.tsx
├── hooks/
│   ├── useUsers.ts
│   └── useUserMutations.ts
├── stores/
│   └── authStore.ts
├── libs/
│   ├── axios.ts
│   ├── env.ts
│   ├── secureStorage.ts
│   ├── mmkv.ts
│   └── utils/cn.ts
├── types/user.types.ts
└── app.config.ts
```

```typescript
// libs/env.ts — the ONLY place process.env is read
import { z } from "zod";

const EnvSchema = z.object({
  API_URL: z.string().url(),
  APP_ENV: z.enum(["development", "staging", "production"]).default("development"),
});

export const ENV = EnvSchema.parse({
  API_URL: process.env.EXPO_PUBLIC_API_URL,   // only EXPO_PUBLIC_* reaches the client bundle
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
});

// ❌ banned anywhere else in the codebase
const url = process.env.EXPO_PUBLIC_API_URL;   // bypasses validation, no type safety
```

```typescript
// app.config.ts — TypeScript config, never app.json
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyApp",
  slug: "my-app",
  scheme: "myapp",
  plugins: ["expo-router", "expo-secure-store"],
});
```

```typescript
// hooks/useUsers.ts — hook lives in hooks/, not co-located inside components/
import { useState, useEffect, useCallback } from "react";
import { axiosInstance } from "@/libs/axios";
import type { UserResponse } from "@/types/user.types";

export function useUsers() {
  const [data, setData] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    const res = await axiosInstance.get<UserResponse[]>("/users");   // never raw fetch()
    setData(res.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { data, loading, refresh: fetch };
}
```

## When to Use
- Scaffolding a new Expo screen — decide first whether it's an authenticated or unauthenticated flow, and place it under the matching `(group)` before writing any UI
- Adding any piece of shared logic used by more than one screen — a hook goes in `hooks/`, never inside a `components/` subfolder, regardless of how "component-specific" it currently feels
- Reaching for `AsyncStorage`, `fetch()`, `console.log`, or a Context provider for global state — stop and use the mandated replacement (`SecureStore`/MMKV, `axiosInstance`, `@/libs/logger`, Zustand) instead
- Adding a new environment variable — add it to the Zod schema in `libs/env.ts` first, with the `EXPO_PUBLIC_` prefix if the client bundle needs it

## Common Mistakes
- **Reading `process.env.X` directly in a component or hook** — bypasses the Zod validation in `libs/env.ts` and loses type safety; every env value should flow through `ENV`.
- **Storing a JWT in `AsyncStorage`** — it's unencrypted and readable by anything with filesystem access on a rooted/jailbroken device; use `SecureStore` for any token.
- **Co-locating a hook inside `components/[Feature]/useFeature.ts`** — the convention here is `hooks/` for all hooks, so a second screen that needs the same data doesn't have to guess where to import it from.
- **Calling `fetch()` directly in a screen** — skips the auth header injection and 401-refresh interceptor that `axiosInstance` provides, silently producing unauthenticated requests.
- **Shipping `app.json` instead of `app.config.ts`** — loses the ability to type-check config and compute values (like reading `EAS_PROJECT_ID`) at build time.

## Further Reading
- Expo Router documentation: https://docs.expo.dev/router/introduction/
- Expo — "App config" (app.config.ts): https://docs.expo.dev/workflow/configuration/
- Expo SecureStore documentation: https://docs.expo.dev/versions/latest/sdk/securestore/
