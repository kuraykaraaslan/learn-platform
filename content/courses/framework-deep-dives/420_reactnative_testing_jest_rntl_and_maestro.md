# 420. React Native: Testing with Jest, React Native Testing Library, and Maestro

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Code_Structure_Rules_ReactNative material to build out the Framework Deep Dives course; no existing coverage data for your own practice.

## What It Is
Testing an Expo app starts with the `jest-expo` preset, which auto-mocks the native modules that would otherwise crash a plain Jest run — there's no real camera, no real `SecureStore`, no real filesystem in the test environment, so `jest-expo` swaps them for safe stand-ins automatically. Where the default mock isn't enough (a test needs to assert *what* was stored, not just that nothing crashed), an explicit mock file under `__mocks__/` at the project root overrides it; Jest resolves anything in that folder automatically, no per-test wiring required. `expo-router`'s navigation primitives (`router.push`, `Redirect`, `Slot`) get the same treatment — a screen test doesn't need a real navigator, just a mock that records calls.

The test pyramid has four layers, matching the app's own architecture: component tests render a single UI piece and assert on its output; screen tests render a full screen with `expo-router` and Zustand mocked, using MSW to intercept the `axiosInstance` calls a screen's hooks make so the test never touches the network; hook tests use `renderHook` to exercise a custom data-fetching hook in isolation, asserting on `data`/`loading`/`error` transitions the same way the hook itself is structured; and Zustand store tests reset state in `afterEach` (`useAuthStore.setState({...})`) since a persisted store's state otherwise leaks between test cases and produces order-dependent failures.

MSW (Mock Service Worker) intercepts HTTP at the network level rather than mocking `axiosInstance` itself, which means the same request/response contracts a real backend would need to satisfy are what the test enforces — a change to a response shape breaks the test the same way it would break a real device against a real API. E2E is a deliberately thin layer on top of all this: Maestro, not Jest, drives real user flows (login, checkout, onboarding) against the actual app via YAML scripts, because those flows cross screens, permissions, and native APIs in ways a component-level testing library was never meant to simulate. What's explicitly *not* tested: React Native's own core components (`Text`, `View`, `Pressable`), NativeWind `className` visual accuracy (that's a Storybook/visual-regression concern), and the exact internal arguments passed to `router.push` — outcomes (which screen rendered) are tested, not implementation details.

## Key Concepts
- **`jest-expo` preset auto-mocks native Expo modules**; override specific ones under `__mocks__/` at the project root when a test needs to assert on the mock's behavior, not just avoid a crash
- **Four test layers mirror the app's architecture**: component tests (render + assert), screen tests (full screen + `expo-router`/Zustand mocks + MSW), hook tests (`renderHook`), and store tests (reset via `afterEach`)
- **MSW intercepts at the network level**, not by mocking `axiosInstance` — the test enforces the same request/response contract a real backend would have to satisfy
- **Zustand stores must be reset in `afterEach`**: `useAuthStore.setState({ isAuthenticated: false, user: null })` — otherwise state persists across test cases and produces order-dependent failures
- **`react-native-mmkv` requires explicit mocking** (`jest.mock("react-native-mmkv")` in `jest.setup.ts`) since it's a native module with no JS fallback in the test environment
- **Maestro (YAML, not Jest) covers true E2E**: login, checkout, onboarding — flows that cross screens and native permissions, which a component-level tool was never designed to simulate
- **What's NOT tested**: RN's own core components, NativeWind visual accuracy (Storybook/visual regression instead), and `router.push`'s exact call arguments — test the rendered outcome, not the internal call
- **Spectron has no place here** — this is React Native, not Electron, but the same "test the packaged/real thing for E2E, unit-test the logic underneath" philosophy applies via Maestro against a real build

## Example Code
```typescript
// jest.config / package.json excerpt
{
  "jest": {
    "preset": "jest-expo",
    "setupFilesAfterFramework": ["@testing-library/jest-native/extend-expect"],
    "moduleNameMapper": { "^@/(.*)$": "<rootDir>/$1" }
  }
}

// __mocks__/expo-router.ts — override the auto-mock to record calls
export const router = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
export const useLocalSearchParams = jest.fn().mockReturnValue({});
export const Redirect = jest.fn(() => null);

// hooks/__tests__/useUsers.test.ts — hook test with MSW intercepting at the network level
import { renderHook, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { server } from "@/__mocks__/server";
import { useUsers } from "@/hooks/useUsers";

describe("useUsers", () => {
  it("fetches users and sets data", async () => {
    server.use(
      http.get("/users", () => HttpResponse.json([{ userId: "u1", fullName: "Ada Lovelace" }]))
    );

    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.error).toBeNull();
  });

  it("sets error on network failure", async () => {
    server.use(http.get("/users", () => HttpResponse.error()));

    const { result } = renderHook(() => useUsers());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).not.toBeNull();
  });
});

// app/(tabs)/__tests__/profile.test.tsx — screen test with auth store + router mocked
import { render, screen, waitFor } from "@testing-library/react-native";
import { http, HttpResponse } from "msw";
import { server } from "@/__mocks__/server";
import ProfileScreen from "@/app/(tabs)/profile";

jest.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: any) => any) =>
    selector({ isAuthenticated: true, user: { userId: "u1", fullName: "Ada Lovelace" } }),
}));

describe("ProfileScreen", () => {
  it("renders the authenticated user's profile", async () => {
    server.use(http.get("/users/me", () => HttpResponse.json({ userId: "u1", fullName: "Ada Lovelace" })));

    render(<ProfileScreen />);

    await waitFor(() => expect(screen.getByText("Ada Lovelace")).toBeTruthy());
  });
});

// stores/__tests__/authStore.test.ts — reset persisted store state between tests
import { useAuthStore } from "@/stores/authStore";

afterEach(() => {
  useAuthStore.setState({ isAuthenticated: false, user: null });   // ✅ prevents cross-test leakage
});

it("login sets authenticated state", async () => {
  await useAuthStore.getState().login({ userId: "u1", fullName: "Ada" }, "access-token", "refresh-token");
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
```

```yaml
# maestro/login-flow.yaml — E2E, not Jest, drives the real app
appId: com.company.myapp
---
- launchApp
- tapOn: "Email"
- inputText: "ada@example.com"
- tapOn: "Password"
- inputText: "correct-horse-battery-staple"
- tapOn: "Sign In"
- assertVisible: "Welcome back, Ada"
```

## When to Use
- Testing a custom hook's `data`/`loading`/`error` behavior — `renderHook` plus MSW handlers, not a mocked `axiosInstance`
- Testing a screen that reads from a Zustand store — mock the store's selector return value rather than trying to render a real provider tree
- Any test suite touching `react-native-mmkv` or another native module with no JS fallback — mock it explicitly in `jest.setup.ts`
- A critical, multi-screen user flow (login, checkout, onboarding) — write it as a Maestro script, not an attempted Jest simulation
- After any test run touching a shared Zustand store — verify `afterEach` resets it, especially before adding new test files that import the same store

## Common Mistakes
- **Mocking `axiosInstance` directly instead of intercepting with MSW** — the test no longer verifies the actual request/response shape, so a backend contract change can break production without breaking the test.
- **Forgetting to reset a Zustand store's state in `afterEach`** — a test that sets `isAuthenticated: true` leaks into the next test file, producing failures that only appear depending on run order.
- **Testing `router.push`'s exact call signature instead of the resulting screen** — couples the test to implementation details that can change without the user-visible behavior changing at all.
- **Trying to E2E-test a full login-to-checkout flow with `@testing-library/react-native`** — component-level tools aren't built for cross-screen, permission-crossing flows; that's what Maestro is for.
- **Skipping `jest.mock("react-native-mmkv")`** — the native module has no JS fallback in the Jest environment and the test suite crashes on import rather than failing a specific assertion.
- **Writing visual-accuracy assertions against NativeWind `className` output** — visual regression belongs to Storybook or a dedicated screenshot tool, not a component test's `toHaveClass`-style assertion.

## Further Reading
- Expo — Testing with Jest: https://docs.expo.dev/develop/unit-testing/
- `@testing-library/react-native` documentation: https://callstack.github.io/react-native-testing-library/
- Mock Service Worker (MSW) documentation: https://mswjs.io/
- Maestro — Mobile UI Testing: https://maestro.mobile.dev/
