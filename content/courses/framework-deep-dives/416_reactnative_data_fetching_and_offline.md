# 416. React Native: Data Fetching, Loading States, and Offline Detection

## What It Is
This stack deliberately does not use React Query or SWR. Every screen's data comes from a custom hook that owns `data`/`loading`/`error` state directly and calls `axiosInstance` inside a `useCallback`, wired to a `useEffect` for the initial load. This is a simpler baseline than a caching data-fetching library, and the tradeoff is explicit: no automatic background refetching, no built-in cache invalidation — but also no library-specific mental model to learn, and a shape simple enough that every hook in the codebase looks the same. The pipeline is always Screen → Hook → `axiosInstance` → REST API; screens own no async logic at all, they call a hook and render what it returns.

Three hook shapes cover almost every screen. A list-fetch hook (`useUsers`) exposes `{ data, loading, error, refresh }`. A single-item hook (`useUser(userId)`) additionally needs a `cancelled` flag inside its `useEffect` cleanup, specifically to prevent a `setState` call on an unmounted component if the `userId` prop changes (or the screen unmounts) before the request resolves — a real bug in React Native where navigation can unmount a screen mid-request far more often than on the web. A mutation hook (`useUserMutations`) wraps create/update/delete calls, and pairs every mutation with both haptic feedback (`expo-haptics`) and a toast (`sonner-native`) — on mobile, a state change with no haptic or visual confirmation reads as "did that actually work?"

Two mobile-specific concerns have no real web equivalent. Offline detection via `NetInfo.addEventListener` should be wired once, at the root layout, into a single ambient banner — not duplicated per screen, and not blocking the UI, since a desktop-class app expects continued read access to already-loaded data while offline. And error messages are always extracted through one shared `extractErrorMessage(err)` helper that knows how to unwrap an Axios error's `response.data.message`, rather than reaching into `err.response.data` inline at every call site — the same "one error-shaping function" discipline used by the `AppError`/error-handling conventions in the backend lessons.

```quiz
- q: "Why does `useUser(userId)` need a `cancelled` flag in its useEffect cleanup when `useUsers()` does not?"
  anchor: "to prevent a `setState` call on an unmounted component if the `userId` prop changes"
  options:
    - text: "To abort the in-flight request and save bandwidth"
      correct: false
      why: "The flag does not cancel the request. It stops the resolved response from writing state into a component that is already gone."
    - text: "To stop a setState landing on an unmounted component when userId changes or the screen unmounts mid-request"
      correct: true
      why: "Navigation in React Native unmounts screens mid-request far more often than on the web, which is what makes it a real bug rather than a theoretical one."
    - text: "Because single-item hooks re-render more often than list hooks"
      correct: false
      why: "Render frequency is not the issue — the prop dependency and the navigation timing are."

- q: "Where does offline detection belong in this stack?"
  anchor: "wired once, at the root layout, into a single ambient banner"
  options:
    - text: "In each screen's hook, so every screen can react in its own way"
      correct: false
      why: "Duplicating it per screen is explicitly what the lesson rules out."
    - text: "Once at the root layout, as a single ambient banner that does not block the UI"
      correct: true
      why: "A desktop-class app is expected to keep read access to already-loaded data while offline."
    - text: "In a blocking modal, so nobody acts on stale data"
      correct: false
      why: "Blocking the UI contradicts the expectation that already-loaded data stays readable while offline."

- q: "Every mutation in `useUserMutations` is paired with two things. Which two?"
  anchor: "pairs every mutation with both haptic feedback (`expo-haptics`) and a toast (`sonner-native`)"
  options:
    - text: "A retry and a timeout, since mobile networks are unreliable"
      correct: false
      why: "Reasonable instincts, but not what this stack pairs with a mutation."
    - text: "Haptic feedback and a toast"
      correct: true
      why: "On mobile, a state change with no haptic or visual confirmation reads as \"did that actually work?\""
    - text: "A loading spinner and a cache invalidation"
      correct: false
      why: "There is no cache to invalidate — this stack deliberately does not use React Query or SWR."
```

## Key Concepts
- **No React Query/SWR — a hook owns `data`/`loading`/`error` directly**: `useState` plus a `useCallback` fetcher plus a `useEffect` for the initial load is the whole pattern
- **Pipeline is always Screen → Hook → `axiosInstance` → API**: screens hold zero async logic; hooks hold zero JSX
- **List hook**: `{ data, loading, error, refresh }` — `refresh` is the same fetcher function, reused for pull-to-refresh
- **Single-item hook needs a `cancelled` flag**: prevents `setState` on an unmounted screen when navigation unmounts it before the request resolves
- **Mutation hooks pair every action with haptic + toast feedback**: `expo-haptics` for tactile confirmation, `sonner-native` for the visual one — a silent mutation reads as broken on mobile
- **`extractErrorMessage(err)`**: one shared helper unwraps `err.response?.data?.message` from an Axios error — never inline `err.response.data` access at the call site
- **Offline detection is ambient, wired once at the root layout**: `NetInfo.addEventListener`, surfaced as a single non-blocking banner, not duplicated per screen and never a full-screen blocker
- **Pagination hooks track `page`/`hasMore` and append rather than replace** on subsequent pages, driven by `FlatList`'s `onEndReached`

## Example Code
```tsx
// hooks/useUser.ts — single-item fetch with the cancelled-flag pattern
import { useState, useEffect } from "react";
import { axiosInstance } from "@/lib/axios";
import { extractErrorMessage } from "@/lib/errorUtils";
import type { UserResponse } from "@/types/user.types";

export function useUser(userId: string) {
  const [data, setData] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const res = await axiosInstance.get<UserResponse>(`/users/${userId}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(extractErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };   // guards against setState after unmount/param change
  }, [userId]);

  return { data, loading, error };
}

// libs/errorUtils.ts — one shared unwrap helper
import { isAxiosError } from "axios";

export function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err)) return err.response?.data?.message ?? err.message ?? "An error occurred";
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
}

// hooks/useUserMutations.ts — haptic + toast on every mutation outcome
import { useState } from "react";
import { axiosInstance } from "@/lib/axios";
import { extractErrorMessage } from "@/lib/errorUtils";
import * as Haptics from "expo-haptics";
import { toast } from "sonner-native";
import type { CreateUserDTO, UserResponse } from "@/types/user.types";

export function useUserMutations(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);

  const createUser = async (dto: CreateUserDTO): Promise<UserResponse | null> => {
    setLoading(true);
    try {
      const res = await axiosInstance.post<UserResponse>("/users", dto);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Created", { description: "User created successfully." });
      onSuccess?.();
      return res.data;
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error("Error", { description: extractErrorMessage(err) });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createUser, loading };
}

// hooks/useOfflineStatus.ts — wired once at the root layout, not per screen
import { useState, useEffect } from "react";
import NetInfo from "@react-native-community/netinfo";

export function useOfflineStatus() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => setIsOffline(!state.isConnected));
    return unsubscribe;
  }, []);

  return isOffline;
}
```

## When to Use
- Fetching any list or single resource for a screen — write a dedicated hook following the `{ data, loading, error }` shape rather than reaching for a data-fetching library
- A single-item hook's parameter can change while a request is in flight (navigating between user detail screens, for example) — always include the `cancelled` cleanup flag
- Any mutation the user triggers directly (save, delete, submit) — pair it with both a haptic and a toast, not just a toast
- Building anything that reads `err.response.data` — stop and route it through `extractErrorMessage` instead

## Common Mistakes
- **Omitting the `cancelled` flag in a single-item fetch hook** — causes a "Can't perform a React state update on an unmounted component" warning (or worse, a stale overwrite) when the screen unmounts mid-request.
- **Reaching for `fetch()` or a new axios instance instead of the shared `axiosInstance`** — loses the auth header injection and 401-refresh interceptor every other request in the app relies on.
- **A mutation with only a toast and no haptic** — on a physical device, haptic feedback is what makes an action feel confirmed; a toast alone is easy to miss if the user has already looked away from the screen.
- **Duplicating offline-detection `NetInfo` listeners per screen** — wastes native listener overhead and risks each screen showing a slightly different offline UI; wire it once at the root and let a single banner reflect it everywhere.
- **Inline `err.response?.data?.message` access at each call site** — when the Axios error shape changes (a new API error envelope, for instance), every call site has to be found and updated instead of one shared helper.

## Further Reading
- Axios documentation — "Handling Errors": https://axios-http.com/docs/handling_errors
- React Native — `NetInfo` (`@react-native-community/netinfo`): https://github.com/react-native-netinfo/react-native-netinfo
- Expo Haptics documentation: https://docs.expo.dev/versions/latest/sdk/haptics/

```recall
- q: "State the data pipeline and what a screen is allowed to own."
  must:
    - "Screen → Hook → axiosInstance → REST API"
    - "screens own no async logic at all"
    - "they call a hook and render what it returns"

- q: "Name the three hook shapes and what each exposes or additionally needs."
  must:
    - "list fetch (useUsers) — { data, loading, error, refresh }"
    - "single item (useUser(userId)) — the same, plus a cancelled flag in the useEffect cleanup"
    - "mutations (useUserMutations) — create/update/delete, each paired with haptics and a toast"

- q: "This stack skips React Query and SWR. State the trade-off in both directions."
  must:
    - "given up: automatic background refetching and built-in cache invalidation"
    - "gained: no library-specific mental model to learn"
    - "gained: a shape simple enough that every hook in the codebase looks the same"

- q: "Why does error extraction go through one shared helper?"
  must:
    - "extractErrorMessage(err) knows how to unwrap an Axios error's response.data.message"
    - "rather than reaching into err.response.data inline at every call site"
    - "the same one-error-shaping-function discipline as the backend AppError conventions"
```
