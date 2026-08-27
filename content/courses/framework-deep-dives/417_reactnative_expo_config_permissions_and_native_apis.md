# 417. React Native: Expo Config, Permissions, and Native Device APIs

## What It Is
Every Expo app needs a config file that describes its identity to both app stores and to Expo's own tooling — app name, bundle identifiers, icons, splash screen, permission strings, and the list of config plugins that patch native project files during prebuild. This stack mandates `app.config.ts` over `app.json` for one reason: `app.json` is static JSON, while `app.config.ts` is a TypeScript function that receives the existing config and returns a typed `ExpoConfig`, which means values can be computed (reading `process.env.EAS_PROJECT_ID` into `extra.eas.projectId`, for instance) and a typo in a key name is caught at build time instead of silently producing an app with no icon.

Device APIs — camera, media library, push notifications, haptics — all follow the same two-step shape: request permission explicitly, then check the result before touching the API, never assume a previous grant still holds. `ImagePicker.requestMediaLibraryPermissionsAsync()` and `useCameraPermissions()` both return a status the caller must branch on; skipping the check and calling `launchImageLibraryAsync()` directly produces a silent no-op or a native crash depending on platform, not a clean error. Permission-request functions belong in `libs/permissions.ts` or a domain service file, never inline inside a component, so the same request logic isn't duplicated at every call site that happens to need a photo.

Push notifications add a layer most backend-only engineers haven't dealt with: the device token has to be registered with `expo-notifications`, gated behind `Device.isDevice` (simulators/emulators can't receive real pushes and `getExpoPushTokenAsync` will misbehave on them), and the resulting token is sent to the backend — deliberately *after* login, not on cold start, since an anonymous token is useless to associate with a user. Android additionally requires an explicit notification channel (`setNotificationChannelAsync`) or notifications silently fail to show with any priority. Haptics (`expo-haptics`) close the loop on user-triggered actions — success/warning/error variants for outcomes, a light `impactAsync` for taps — and belong exclusively inside event handlers, never inside a `useEffect` that could fire without a user gesture behind it.

## Key Concepts
- **`app.config.ts`, never `app.json`**: a typed `(config: ConfigContext) => ExpoConfig` function — enables computed values (`extra.eas.projectId` from an env var) and catches config typos at compile time
- **Permission request, then branch on status — never assume granted**: `requestMediaLibraryPermissionsAsync()` / `useCameraPermissions()` both return a status that must be checked before the device API is touched
- **Permission-request functions live in `libs/permissions.ts` or a service file**, not inline in components — one place to change the prompt copy or add a fallback
- **SecureStore holds exactly two keys**: `accessToken` and `refreshToken` — every other preference goes to MMKV; SecureStore falls back to unencrypted storage on simulators/emulators, so don't treat simulator behavior as proof of encryption
- **Push token registration is gated on `Device.isDevice` and happens after login**, not on app cold start — an anonymous token can't be associated with a user, and simulators return `null`
- **Android requires an explicit notification channel** (`setNotificationChannelAsync`) or notifications silently fail to display regardless of priority
- **Haptics belong in event handlers, never in a bare `useEffect`** — a haptic with no preceding user gesture feels like a bug, not a confirmation
- **Native code changes go through config plugins only** — `android/`/`ios/` are gitignored in the managed workflow and any manual edit there is lost on the next prebuild
- **`expo-image` replaces React Native's `<Image>`** for all user-facing images (caching, blurhash placeholder); remote images never belong in the bundled `assets/` folder

## Example Code
```typescript
// app.config.ts — typed, computed config; never app.json
import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "MyApp",
  slug: "my-app",
  scheme: "myapp",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.company.myapp",
    infoPlist: {
      NSCameraUsageDescription: "Used to take profile photos.",
      NSPhotoLibraryUsageDescription: "Used to select profile photos.",
    },
  },
  android: {
    package: "com.company.myapp",
    permissions: ["CAMERA", "READ_EXTERNAL_STORAGE"],
  },
  extra: {
    eas: { projectId: process.env.EAS_PROJECT_ID },   // computed — impossible in app.json
  },
  plugins: ["expo-router", "expo-secure-store", ["expo-notifications", { icon: "./assets/notification-icon.png" }]],
});

// libs/permissions.ts — permission requests centralized, never inline in a component
import * as ImagePicker from "expo-image-picker";
import { Alert } from "react-native";

export async function pickProfileImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("Permission Required", "Allow photo access to set a profile picture.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, aspect: [1, 1], quality: 0.8 });
  return result.canceled ? null : result.assets[0].uri;
}

// libs/notifications.ts — token registration, gated on a real device, called AFTER login
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) return null;                              // simulators can't receive pushes

  const { status: existing } = await Notifications.getPermissionsAsync();
  const status = existing === "granted" ? existing : (await Notifications.requestPermissionsAsync()).status;
  if (status !== "granted") return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", { name: "default", importance: Notifications.AndroidImportance.MAX });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data;
}

// hooks/useAuthMutations.ts (excerpt) — register the push token only after a successful login
async function onLoginSuccess(userId: string) {
  const pushToken = await registerForPushNotificationsAsync();
  if (pushToken) await axiosInstance.post("/users/push-token", { userId, pushToken });
}

// A confirm action — haptic fires from the event handler, never from a useEffect
import * as Haptics from "expo-haptics";

async function handleDelete() {
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  // proceed with the delete mutation
}
```

## When to Use
- Scaffolding or reconfiguring any Expo app's identity, permissions strings, or plugin list — `app.config.ts`, never `app.json`
- Any feature touching camera, media library, contacts, or location — request the permission immediately before that specific action, not eagerly at app start
- Adding push notifications — register the token after login succeeds, and add the Android notification channel before assuming delivery works
- Any destructive or confirming user action (delete, submit, toggle) — pair it with a haptic call from inside the handler
- Needing a native code change (a new native module, an Info.plist entry) — write or extend a config plugin instead of editing `android/`/`ios/` directly

## Common Mistakes
- **Keeping `app.json` instead of migrating to `app.config.ts`** — loses type safety and the ability to compute values like the EAS project ID from an environment variable.
- **Calling a device API without checking the permission result first** — produces an inconsistent no-op on iOS and a hard crash on some Android versions instead of a clean, user-facing message.
- **Registering for push notifications on cold start instead of after login** — the resulting token has no user to attach to, and simulators return `null`, so testing this path only in a simulator hides the bug entirely.
- **Skipping the Android notification channel setup** — notifications silently never appear on Android even though the exact same code works on iOS.
- **Calling haptics inside a `useEffect` with no user gesture** — a vibration with no visible cause reads as a bug, not a confirmation, and erodes trust in the rest of the app's feedback.
- **Editing `android/` or `ios/` directly in a managed Expo workflow** — the directories are gitignored and regenerated on the next prebuild, silently discarding the change.

## Further Reading
- Expo — App Config (`app.config.ts`): https://docs.expo.dev/workflow/configuration/
- Expo — Permissions: https://docs.expo.dev/guides/permissions/
- Expo Notifications documentation: https://docs.expo.dev/versions/latest/sdk/notifications/
- Expo — Config Plugins: https://docs.expo.dev/config-plugins/introduction/
