# 414. React Native: Expo Router Navigation and Protected Routes

## What It Is
Expo Router v4 maps the filesystem directly to routes, the same mental model as Next.js's App Router but built for `Stack`/`Tabs`/`Drawer` navigators instead of HTML pages. `app/index.tsx` is `/`, `app/user/[id].tsx` is `/user/:id`, and a `(group)` folder like `(tabs)/` groups screens under a shared layout without adding a URL segment — so `app/(tabs)/index.tsx` is still just `/`. There is no manually configured `NavigationContainer` anywhere in the app; the root `_layout.tsx` renders a single `<Slot />` and nothing else, letting the matched child route (and its own `_layout.tsx`, if any) take over from there.

The auth guard pattern is the part most worth internalizing, because it's structured deliberately to avoid a common mistake: the guard lives in the group's `_layout.tsx`, not in individual screens, and it redirects using the declarative `<Redirect>` component rather than an imperative `router.push()` call. `app/(auth)/_layout.tsx` checks `isAuthenticated` from the Zustand auth store and redirects *into* the tabs if the user is already logged in; `app/(tabs)/_layout.tsx` does the mirror check and redirects *out* to login if not. This means no individual screen ever needs to check auth state itself — by the time a screen under `(tabs)/` renders at all, the layout above it has already guaranteed the user is authenticated.

Two different tools handle "user causes navigation" depending on whether the trigger is visible UI or a side effect of async code. `<Link>` is for anything a user taps that's inherently a navigation affordance — it supports deep linking and gets accessibility semantics for free. `router.push()`/`router.replace()` are for programmatic navigation *after* something else finishes — a successful login, a form submission — and `router.replace()` specifically is what's used post-login/post-logout, because it doesn't leave a back-stack entry that would let the user swipe back into a screen they just left (the login screen after successfully logging in, for example).

## Key Concepts
- **Filesystem maps to routes**: `app/index.tsx` → `/`, `app/(tabs)/index.tsx` → `/` (group adds no segment), `app/user/[id].tsx` → `/user/:id`, `app/+not-found.tsx` → the 404 fallback
- **No manual `NavigationContainer`**: the root `_layout.tsx` renders `<Slot />`; child group layouts render `<Stack>`, `<Tabs>`, or `<Drawer>` as needed
- **Auth guard lives in the group `_layout.tsx`, never in individual screens**: `(auth)/_layout.tsx` redirects to `(tabs)` if already authenticated; `(tabs)/_layout.tsx` redirects to `(auth)/login` if not
- **`<Redirect>` for guard logic, not `router.push()`**: declarative, evaluated on every render of the layout — the correct tool for "send the user elsewhere based on current state"
- **`<Link>` for visible navigation elements**: tappable text/buttons that are inherently navigation — gets deep-link and accessibility support for free
- **`router.push()`/`router.replace()` for programmatic navigation**: only after an async operation completes (login success, form submit) — `router.replace()` specifically for post-login/post-logout so there's no back-stack entry to the screen just left
- **`useLocalSearchParams<T>()`**: the way to read dynamic route params inside a screen — never read from a `route.params` object directly
- **Modal screens**: added as a normal route with `presentation: "modal"` in its `Stack.Screen`/`Tabs.Screen` options, closed via `router.back()`

## Example Code
```typescript
// app/_layout.tsx — root: no NavigationContainer, just Slot
import { Slot } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}

// app/(auth)/_layout.tsx — redirect AWAY from auth screens if already logged in
import { Stack, Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function AuthLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (isAuthenticated) return <Redirect href="/(tabs)" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

// app/(tabs)/_layout.tsx — redirect TO auth if not logged in; no screen below needs its own check
import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/stores/authStore";

export default function TabsLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#4F46E5" }}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

// app/(auth)/login.tsx — post-login uses router.replace(), not <Link> or push()
import { View, TextInput, Pressable, Text } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export default function LoginScreen() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    const result = await AuthService.login(email, password);
    await login(result.user, result.accessToken, result.refreshToken);
    router.replace("/(tabs)");   // no back-stack entry to the login screen
  }

  return (
    <View className="flex-1 justify-center p-4 gap-3">
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" className="border p-3 rounded" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry className="border p-3 rounded" />
      <Pressable onPress={handleSubmit} className="bg-indigo-600 rounded-xl py-3 items-center">
        <Text className="text-white font-semibold">Sign In</Text>
      </Pressable>
    </View>
  );
}

// app/user/[id].tsx — dynamic segment, read via useLocalSearchParams
import { useLocalSearchParams, Link } from "expo-router";

export default function UserDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Link href={`/user/${id}/edit`}>Edit user {id}</Link>;
}
```

## When to Use
- Structuring a new Expo app's navigation — split `(auth)` and `(tabs)`/`(drawer)` route groups from the very first screen, not as a later refactor
- Implementing "only logged-in users can see this" — put the check in the group's `_layout.tsx` as a `<Redirect>`, never as a `useEffect` inside each individual screen
- A tap should take the user somewhere — use `<Link>`; a successful async action should take the user somewhere — use `router.push()`/`router.replace()`
- Reading a dynamic route parameter — always `useLocalSearchParams<T>()`, typed to match the route's `[param]` segments

## Common Mistakes
- **Putting the auth check in every screen instead of the group layout** — duplicates the same `useEffect`/redirect logic across every screen and risks a screen that forgets to check, briefly rendering protected content.
- **Using `router.push()` for a visible tappable link** — loses the deep-linking and accessibility semantics `<Link>` provides for free; reserve `router.push()` for post-async navigation.
- **Using `router.push()` instead of `router.replace()` after login** — leaves a back-stack entry that lets the user swipe/back-button their way back to the login screen after successfully authenticating.
- **Reading `route.params` directly** — Expo Router's typed `useLocalSearchParams<T>()` is the supported API; reaching into a raw `route` object bypasses type safety and can break across Expo Router versions.
- **Manually configuring `NavigationContainer`** — Expo Router owns this; a hand-rolled `NavigationContainer` alongside it produces duplicate/conflicting navigation state.

## Further Reading
- Expo Router — "Authentication" guide: https://docs.expo.dev/router/advanced/authentication/
- Expo Router — "Navigation" reference: https://docs.expo.dev/router/basics/navigation/
- React Navigation — "Redirect" concepts (underlying Expo Router): https://reactnavigation.org/docs/redirecting-unauthenticated-users/
