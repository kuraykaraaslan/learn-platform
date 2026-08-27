# 415. React Native: Zustand + MMKV State Management

## What It Is
Global state in this Expo stack has exactly one home — a Zustand store — and exactly one persistence engine behind it — MMKV, a fast synchronous key-value store backed by a native module. Redux is banned outright as unnecessary overhead Zustand already covers, and React Context is banned specifically for global state (it remains acceptable for narrow dependency-injection cases, like swapping an `axiosInstance` in tests) because Context re-renders every consumer on any change, where Zustand's selector pattern lets a component subscribe to exactly the slice it needs. The decision of *where* a given piece of state lives is made once per state type, not once per feature: server data (users, posts) stays as local `useState` inside a data-fetching hook; auth session and app preferences go in persisted Zustand stores; form state and UI-only flags (a modal's open/closed state) stay as plain `useState` in the component that owns them.

The one rule that overrides all the others: access tokens and refresh tokens never enter Zustand state, persisted or not. Tokens live exclusively in `SecureStore`, which is hardware-backed encryption on both iOS and Android; MMKV, while fast, is not encrypted the way `SecureStore` is, and a Zustand `persist` middleware backed by MMKV would put a JWT within reach of anything that can read the app's storage. What Zustand's `authStore` *does* hold is `isAuthenticated: boolean` and a lightweight, non-sensitive `user` profile object — enough for the UI (and the Expo Router auth guard from the previous lesson) to react to login state, without ever touching the token itself.

Reading from a store correctly matters as much as writing to it. `useAuthStore((s) => s.user)` subscribes a component to re-render only when `user` changes; calling `useAuthStore()` with no selector subscribes to the entire store, so the component re-renders on every single state change anywhere in it — a bug pattern that quietly degrades performance across a whole screen without ever throwing an error.

## Key Concepts
- **State placement decision, made once per state type**: server data → hook `useState`; auth session and preferences → persisted Zustand; form/UI-only flags → component `useState`; cross-screen ephemeral (toast) → `sonner-native`, no store needed at all
- **Zustand + MMKV persist, not Redux or Context**: `persist(store, { storage: createJSONStorage(() => zustandMMKVStorage) })` — MMKV is the storage engine, never `AsyncStorage` (slower, API-mismatched with the sync `StateStorage` interface Zustand expects)
- **Tokens never enter Zustand state**: `accessToken`/`refreshToken` live only in `SecureStore`; the auth store persists `isAuthenticated` and a lightweight `user` profile, nothing sensitive
- **`partialize` trims what actually gets persisted**: exclude function fields (actions) from the MMKV-backed snapshot — only plain data needs to survive a relaunch
- **Selector subscriptions, always**: `useAuthStore((s) => s.user)` re-renders only on that slice changing; `useAuthStore()` with no selector re-renders on every store change
- **React Context survives only for dependency injection**, not global state — e.g. providing a test-only `axiosInstance` override; it is not an acceptable substitute for a Zustand store
- **`sonner-native` replaces a hand-rolled toast queue store** — cross-screen ephemeral UI feedback doesn't need Zustand at all once a dedicated library handles it
- **MMKV requires a native module**: it doesn't work inside Expo Go — development requires an `expo-dev-client` build

## Example Code
```typescript
// libs/mmkv.ts
import { MMKV } from "react-native-mmkv";
export const mmkv = new MMKV({ id: "app-storage" });

// libs/zustandStorage.ts — adapts MMKV's sync API to Zustand's StateStorage interface
import { StateStorage } from "zustand/middleware";
import { mmkv } from "@/lib/mmkv";

export const zustandMMKVStorage: StateStorage = {
  getItem: (key) => mmkv.getString(key) ?? null,
  setItem: (key, value) => mmkv.set(key, value),
  removeItem: (key) => mmkv.delete(key),
};

// stores/authStore.ts — tokens NEVER enter this store; only isAuthenticated + a lightweight profile
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandMMKVStorage } from "@/lib/zustandStorage";
import { setToken, clearAllTokens } from "@/lib/secureStorage";
import type { UserResponse } from "@/types/user.types";

type AuthState = {
  isAuthenticated: boolean;
  user: UserResponse | null;
  login: (user: UserResponse, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: async (user, accessToken, refreshToken) => {
        await setToken("accessToken", accessToken);     // ✅ token → SecureStore
        await setToken("refreshToken", refreshToken);
        set({ isAuthenticated: true, user });            // ✅ non-sensitive data → Zustand/MMKV
      },

      logout: async () => {
        await clearAllTokens();
        set({ isAuthenticated: false, user: null });
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),   // functions excluded
    }
  )
);

// ❌ Banned — token stored in Zustand/MMKV state
type BadAuthState = {
  accessToken: string;   // never do this — MMKV is fast, but not encrypted like SecureStore
};

// Correct usage in a component — selector subscription
function ProfileHeader() {
  const user = useAuthStore((s) => s.user);        // ✅ re-renders only when `user` changes
  const logout = useAuthStore((s) => s.logout);
  // const authStore = useAuthStore();              // ❌ re-renders on EVERY store change

  return <Text>{user?.fullName ?? "Guest"}</Text>;
}
```

## When to Use
- Adding any state that must survive an app relaunch and isn't a token — a persisted Zustand store backed by MMKV
- Storing a JWT or refresh token — `SecureStore` only, never Zustand/MMKV, regardless of how convenient it would be to have it alongside `isAuthenticated`
- Reading from any store inside a component — always pass a selector function; reserve the no-argument call for rare cases that genuinely need the whole store
- Cross-screen transient feedback (a save confirmation, an error banner) — reach for `sonner-native` directly rather than building a Zustand-backed toast queue

## Common Mistakes
- **Storing `accessToken`/`refreshToken` in Zustand state, persisted or not** — even in-memory-only Zustand state is one bug away from ending up in a MMKV-backed persist config; keep tokens exclusively in `SecureStore`.
- **Calling `useAuthStore()` with no selector** — subscribes the component to every field in the store, causing unrelated state changes elsewhere to trigger unnecessary re-renders.
- **Using `AsyncStorage` as the Zustand persist backend** — its async API doesn't match Zustand's synchronous `StateStorage` interface well and is measurably slower than MMKV.
- **Reaching for React Context for a new piece of global state** — Context is reserved for dependency injection (e.g. a test double); any state visible across unrelated screens belongs in a Zustand store.
- **Building a custom toast queue in Zustand** — `sonner-native` already solves this; a hand-rolled store duplicates functionality and needs its own root-level renderer wiring.

## Further Reading
- Zustand documentation: https://zustand.docs.pmnd.rs/
- react-native-mmkv documentation: https://github.com/mrousavy/react-native-mmkv
- Expo SecureStore documentation: https://docs.expo.dev/versions/latest/sdk/securestore/
