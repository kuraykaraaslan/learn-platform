# 418. React Native: NativeWind Styling, Design Tokens, and Dark Mode

## What It Is
NativeWind v4 brings Tailwind's `className` syntax to React Native, and it is the default styling method for every static style in this stack — `<View className="flex-1 bg-white px-4 py-6">` instead of a `style={{ ... }}` object. `StyleSheet.create` is not banned, but it's reserved for three specific cases where `className` genuinely can't do the job: a style that depends on a runtime value (a computed width from `useWindowDimensions`), a platform-specific override (`Platform.select`), or a complex `Animated.View` style object. Mixing `className` and `style` on the same element is fine — NativeWind merges them — so the two systems aren't in tension, just scoped to what each does well.

Color values never appear as hardcoded hex or as raw Tailwind palette steps like `text-blue-600` — every color is a semantic token (`bg-primary`, `text-text-secondary`, `bg-surface-raised`) resolved through `tailwind-tokens.js`, the same naming convention as the web/Next.js layer so a design conversation about "the surface-raised color" means the same thing on every platform. There are two valid token-delivery mechanisms — NativeWind classes for new projects, or `StyleSheet` constants pulled from a `getTokens(scheme)` function for brownfield or performance-critical list code — and a project picks one and stays consistent rather than mixing both.

Dark mode has no CSS media query to lean on, so it's built from `useColorScheme()` (reads the OS setting), the `Appearance` API (fires when the OS setting changes without a restart), and NativeWind's `dark:` class variant, which resolves automatically once the root layout is wrapped correctly. The persisted user preference — `light` / `dark` / `system` — lives under an `AsyncStorage` key (dark mode preference is not sensitive, unlike the auth tokens covered in the state-management lesson) with `system` as the default, meaning the app respects the OS unless the user has explicitly overridden it. Responsive design follows the same "no media query" reality: `useWindowDimensions()` drives breakpoint decisions at three widths (`sm` < 480, `md` 480–767, `lg` ≥ 768), most visibly in `FlatList`'s `numColumns`, which requires a `key={columns}` prop to force a re-render when the column count itself changes — omitting it produces a `FlatList` that silently ignores the new column count.

## Key Concepts
- **NativeWind `className` is the default; `StyleSheet.create` is scoped to three cases**: runtime-dependent values, `Platform.select` overrides, and `Animated.View` style objects — mixing `className` + `style` on one element is fine
- **Every color is a semantic token, never a hardcoded hex or a raw palette step**: `bg-primary` / `text-text-secondary`, not `#2563eb` or `text-blue-600` — resolved via `tailwind-tokens.js`, matching the web layer's naming
- **Pick one token-delivery mechanism per project**: NativeWind classes, or `StyleSheet` constants from `getTokens(scheme)` — never mix both in the same codebase
- **Dark mode = `useColorScheme()` + `Appearance` + NativeWind `dark:` variant**, with the user's `light`/`dark`/`system` choice persisted (not sensitive — `AsyncStorage` is fine here, unlike tokens)
- **`useColorScheme()` re-renders automatically on OS theme change**; `Appearance.addChangeListener` is only needed for imperative side effects like analytics, not for re-rendering UI
- **Responsive breakpoints**: `< 480px` phone portrait, `480–767px` phone landscape/small tablet, `≥ 768px` tablet — driven by `useWindowDimensions()`, no CSS media queries exist
- **`FlatList` `numColumns` needs `key={columns}`** to force Metro/React to remount the list when the column count itself changes — otherwise the new layout silently doesn't apply
- **Platform-specific component files** (`UserCard.ios.tsx` / `UserCard.android.tsx`) are Metro-resolved automatically — never barrel-export them, since the barrel would break the platform resolution
- **`SafeAreaView` or `useSafeAreaInsets()` wraps every screen root** — a raw `View` at the top level ignores notches, status bars, and home indicators

## Example Code
```typescript
// tailwind.config.js — tokens come from one file, never inline hex in components
module.exports = {
  content: ["./app/**/*.{tsx,ts}", "./components/**/*.{tsx,ts}"],
  presets: [require("nativewind/preset")],
  theme: { extend: { colors: require("./libs/utils/tailwind-tokens") } },
  darkMode: "class",
};

// libs/utils/tailwind-tokens.js
module.exports = {
  primary:          { DEFAULT: "#2563eb", subtle: "#eff6ff", fg: "#ffffff" },
  "surface-base":   "#f8fafc",
  "surface-raised": "#ffffff",
  "text-primary":   "#0f172a",
  "text-secondary": "#475569",
  border:           "#e2e8f0",
  error:            { DEFAULT: "#dc2626", subtle: "#fef2f2", fg: "#991b1b" },
};

// app/_layout.tsx — root layout wires dark mode + persisted preference
import "../global.css";
import { useColorScheme } from "react-native";
import { useAppStore } from "@/stores/appStore";
import { Slot } from "expo-router";
import { View } from "react-native";

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const preference = useAppStore((s) => s.colorScheme);     // "light" | "dark" | "system"
  const scheme = preference === "system" ? systemScheme : preference;

  return (
    <View className={scheme === "dark" ? "dark flex-1" : "flex-1"}>
      <Slot />
    </View>
  );
}

// components/UserCard.tsx — semantic tokens, dark: variant, NativeWind + StyleSheet mixed correctly
import { View, Text, useWindowDimensions } from "react-native";

export function UserCard({ name, email }: { name: string; email: string }) {
  const { width } = useWindowDimensions();
  const cardWidth = width >= 768 ? 400 : width - 32;         // runtime value → needs a style prop

  return (
    <View
      className="bg-surface-raised dark:bg-surface-raised border border-border rounded-xl p-4"
      style={{ width: cardWidth }}                            // ✅ mixing className + style is fine
    >
      <Text className="text-text-primary dark:text-text-primary font-semibold">{name}</Text>
      <Text className="text-text-secondary dark:text-text-secondary text-sm mt-1">{email}</Text>
    </View>
  );
}

// components/ResponsiveGrid.tsx — breakpoint-driven FlatList columns, key forces remount
import { FlatList } from "react-native";
import { useWindowDimensions } from "react-native";

export function ResponsiveGrid({ items }: { items: { id: string }[] }) {
  const { width } = useWindowDimensions();
  const columns = width >= 768 ? 3 : width >= 480 ? 2 : 1;

  return (
    <FlatList
      key={columns}                                            // ✅ forces re-layout when columns change
      numColumns={columns}
      data={items}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <View className="flex-1 p-2"><UserCard name={item.id} email="" /></View>}
    />
  );
}
```

## When to Use
- Any static style on any component — reach for `className` first; drop to `StyleSheet.create` only when the value is computed, platform-specific, or drives an `Animated.View`
- Introducing a new color anywhere in the UI — add or reuse a semantic token in `tailwind-tokens.js` rather than writing a hex value inline
- Building any layout that must adapt to phone vs tablet — use `useWindowDimensions()` against the three documented breakpoints, not a hardcoded pixel guess
- Adding a dark-mode-aware screen — pair every `bg-`/`text-` token class with its `dark:` variant and verify the root layout applies the `dark` class correctly
- Changing a `FlatList`'s `numColumns` based on width — always include `key={columns}` alongside it

## Common Mistakes
- **Hardcoding a hex value or a raw Tailwind palette class (`text-blue-600`) instead of a semantic token** — breaks dark mode (raw palette classes don't have a `dark:` counterpart wired to the token system) and diverges from the web layer's color language.
- **Inline style objects for styles that don't depend on a runtime value** — defeats the entire point of NativeWind and produces inconsistent spacing since the Tailwind scale is bypassed.
- **Mixing the NativeWind and `StyleSheet`-constants token strategies in the same project** — some components read `bg-primary` classes, others read `getTokens(scheme).primary`, and a rebrand now requires updating two systems instead of one.
- **Forgetting `key={columns}` on a `FlatList` with dynamic `numColumns`** — the list keeps the old column layout after a rotation or window resize even though the computed `columns` value is correct.
- **Relying on `Appearance.addChangeListener` to trigger a re-render** — it's meant for imperative side effects; `useColorScheme()` already re-renders the component tree on OS theme change, so a hand-rolled listener duplicates work and can drift out of sync.
- **A raw `View` at a screen's top level instead of `SafeAreaView`/`useSafeAreaInsets`** — content renders under the status bar or behind the home indicator on notched devices.

## Further Reading
- NativeWind v4 documentation: https://www.nativewind.dev/
- React Native — `useWindowDimensions`: https://reactnative.dev/docs/usewindowdimensions
- React Native — `useColorScheme` and `Appearance`: https://reactnative.dev/docs/appearance
- React Native — Platform-Specific Code: https://reactnative.dev/docs/platform-specific-code
