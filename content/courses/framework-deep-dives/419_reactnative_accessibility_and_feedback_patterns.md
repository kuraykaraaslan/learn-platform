# 419. React Native: Accessibility and Feedback Patterns

## What It Is
React Native has no DOM, so every ARIA-equivalent is a props-based API instead of an HTML attribute: `accessibilityRole` replaces `role`, `accessibilityLabel` replaces an sr-only span, `accessibilityState` replaces `aria-*` state attributes, and `AccessibilityInfo.announceForAccessibility()` replaces `aria-live`. The mapping is not perfectly 1:1 — `accessibilityRole` has no direct equivalent for `role="dialog"`, for instance, because React Native's `Modal` component already handles focus trapping natively on both VoiceOver and TalkBack. The rule when a mapping doesn't exist cleanly: omit the prop rather than force an approximate one, since an incorrect role is worse than no role. Every custom `View` or `Image` standing in for a button needs `accessible={true}` to become a single focusable unit for screen readers, and every icon-only interactive element needs an explicit `accessibilityLabel` — without it, VoiceOver reads nothing meaningful and the control is effectively invisible to a screen-reader user.

Feedback in this stack maps a five-pattern taxonomy (toast, inline error, alert banner, error screen, confirmation) onto specific React Native implementations, and the timing is deliberate rather than aesthetic: `sonner-native` toasts auto-dismiss at 4 seconds for success/info, 5 seconds for warning, and never auto-dismiss for error — a failure message that disappears on its own before the user has read it is a worse experience than one they have to dismiss themselves. Every toast is paired with an `AccessibilityInfo.announceForAccessibility()` call, because a visual-only toast is invisible to a screen-reader user who isn't looking at the exact moment it appears and disappears.

Loading feedback follows a threshold rule inherited from the web layer: a spinner only appears after 100ms of load time, implemented with a `setTimeout` guarding a `showSpinner` boolean, so a fetch that resolves in 60ms never produces the flash-then-vanish spinner that makes an app feel jankier than it is. A loading list uses a skeleton — content-shaped placeholders rendered through the same `FlatList`/`SectionList` component the real data will use — rather than a spinner, and the skeleton list is marked `accessible={false}` since it's decorative and has nothing for a screen reader to announce.

## Key Concepts
- **`accessibilityRole` maps to ARIA roles but isn't 1:1** — `"button"`, `"link"`, `"checkbox"`, `"tab"`, `"header"` map cleanly; when no match exists (`role="dialog"`), omit the prop and rely on `Modal`'s native focus handling instead of forcing a wrong role
- **`accessibilityLabel` replaces sr-only text** — mandatory on every icon-only `Pressable` and on any `Image` that conveys information; decorative images get `accessible={false}` instead
- **`accessible={true}` on custom interactive `View`/`Image` elements** groups the subtree into one focusable unit — without it, a screen reader reads each child separately
- **`accessibilityState` maps `aria-*` state**: `{ disabled }`, `{ selected }`, `{ checked }`, `{ busy }` — set `busy: isLoading` alongside a visible loading indicator, not just a disabled state
- **`AccessibilityInfo.announceForAccessibility()` replaces `aria-live="polite"`** — call it alongside every toast and every form-submission result, since a screen-reader user may not be looking at the toast region when it appears
- **Toast auto-dismiss timing is deliberate, not decorative**: success/info at 4000ms, warning at 5000ms, error never (`Infinity`) — mirrors the web layer's feedback taxonomy exactly
- **Minimum touch target is 44×44px**, even when the visible icon is smaller — pad the `Pressable`, don't shrink the tap area to match the icon
- **Spinners wait for a 100ms threshold before appearing** (a `setTimeout` gate) — prevents a flash-then-vanish spinner on fast responses; skeletons are for content-shaped loading states and are marked `accessible={false}`

## Example Code
```tsx
// components/ui/IconButton.tsx — accessibilityRole, accessibilityLabel, and a real 44x44 touch target
import { Pressable } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";

export function DeleteButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel="Delete item"
      accessibilityHint="Permanently removes this item"
      accessibilityState={{ disabled: !!disabled }}
      style={{ minWidth: 44, minHeight: 44, alignItems: "center", justifyContent: "center" }}
    >
      <FontAwesomeIcon icon={faTrash} size={16} />
    </Pressable>
  );
}

// libs/feedback.ts — one function pairs the visual toast with a screen-reader announcement
import { AccessibilityInfo } from "react-native";
import { toast } from "sonner-native";

type ToastType = "success" | "error" | "warning" | "info";
const DURATIONS: Record<ToastType, number> = { success: 4000, info: 4000, warning: 5000, error: Infinity };

export function showFeedback(type: ToastType, title: string, body?: string) {
  toast[type](title, { description: body, duration: DURATIONS[type] });
  AccessibilityInfo.announceForAccessibility(`${title}${body ? ". " + body : ""}`);
}

// hooks/useDelayedSpinner.ts — 100ms threshold before a loading indicator appears
import { useEffect, useState } from "react";

export function useDelayedSpinner(isLoading: boolean, delayMs = 100): boolean {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!isLoading) { setShow(false); return; }
    const timer = setTimeout(() => setShow(true), delayMs);
    return () => clearTimeout(timer);
  }, [isLoading, delayMs]);
  return show;
}

// screens/UserList.tsx — skeleton grid while loading, decorative and hidden from screen readers
import { FlatList, View, Text } from "react-native";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { useUsers } from "@/hooks/useUsers";

export default function UserListScreen() {
  const { data, loading } = useUsers();

  if (loading) {
    return (
      <FlatList
        data={Array.from({ length: 6 })}
        keyExtractor={(_, i) => `skeleton-${i}`}
        renderItem={() => <SkeletonCard />}
        scrollEnabled={false}
        accessible={false}                       // ✅ decorative — nothing to announce
      />
    );
  }

  return (
    <FlatList
      data={data}
      accessibilityLiveRegion="polite"
      renderItem={({ item }) => (
        <View accessible accessibilityRole="text">
          <Text>{item.fullName}</Text>
        </View>
      )}
    />
  );
}

// components/ui/AlertBanner.tsx (excerpt) — dismissible, announced, correctly labeled as a group
import { View, Text, Pressable, AccessibilityRole } from "react-native";

export function AlertBanner({ title, description, onDismiss }: { title: string; description?: string; onDismiss?: () => void }) {
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole={"none" as AccessibilityRole}
      accessible={true}
      accessibilityLabel={`${title}${description ? ". " + description : ""}`}
      className="flex-row items-start gap-3 p-4 rounded-lg border bg-error-subtle border-error"
    >
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-error-fg">{title}</Text>
        {description && <Text className="text-sm text-error-fg">{description}</Text>}
      </View>
      {onDismiss && (
        <Pressable
          onPress={onDismiss}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Dismiss alert"
          style={{ minWidth: 32, minHeight: 32 }}
        />
      )}
    </View>
  );
}
```

## When to Use
- Any icon-only `Pressable`/`TouchableOpacity` — always add `accessibilityRole` and a descriptive `accessibilityLabel`
- Any custom `View` acting as a tappable card or button — set `accessible={true}` so a screen reader treats it as one unit, not a pile of separate text nodes
- Every toast or form-submission result — pair the visual feedback with `AccessibilityInfo.announceForAccessibility()`
- A list or screen that can take longer than ~100ms to load — gate the spinner behind the delay, and prefer a skeleton over a spinner when the content has a predictable shape
- Any `Modal` in the app — set `accessibilityViewIsModal={true}` and always wire `onRequestClose` for the Android back button

## Common Mistakes
- **An icon-only button with no `accessibilityLabel`** — VoiceOver/TalkBack announce nothing useful, and the control is effectively unusable for a screen-reader user even though it works visually.
- **Forcing an `accessibilityRole` that has no real match** (inventing one for a custom dialog instead of using `Modal`) — an incorrect role misleads assistive technology more than having no role at all.
- **A toast with no accompanying `AccessibilityInfo.announceForAccessibility()` call** — a sighted user sees the confirmation; a screen-reader user gets nothing unless they happen to be focused on the toast region.
- **Letting an error toast auto-dismiss on the same timer as success** — the user may not have finished reading the failure reason before it vanishes; error toasts stay until dismissed.
- **Showing a spinner immediately with no delay threshold** — a sub-100ms response produces a visible flash that reads as jank rather than smoothness.
- **Shrinking a touch target to match a small icon's visual size** — the 44×44px minimum is about the tappable area, not the icon's rendered size; pad the `Pressable`, don't shrink it.

## Further Reading
- React Native — Accessibility: https://reactnative.dev/docs/accessibility
- React Native — `AccessibilityInfo`: https://reactnative.dev/docs/accessibilityinfo
- WCAG 2.2 — Understanding Success Criteria: https://www.w3.org/WAI/WCAG22/Understanding/
- `sonner-native` documentation: https://www.npmjs.com/package/sonner-native
