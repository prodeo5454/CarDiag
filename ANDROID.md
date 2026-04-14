# CarDiag on Android (Capacitor)

The Android app is the same **Next.js** UI running inside a **Capacitor** WebView, packaged with **Android Studio**.

## Prerequisites

- **Node.js** 18+ and npm  
- **Android Studio** (SDK, platform tools, an emulator or USB device)  
- **JDK 17** (matches current Capacitor / AGP defaults)

## One-time setup

From the project root:

```bat
npm install
npm run android:init
```

`android:init` runs `npx cap add android` and creates the `android/` Gradle project (commit this folder to git).

The app includes **`@capacitor-community/bluetooth-le`**. After changing native dependencies, run:

```bat
npx cap sync android
```

## Build and sync web assets

Whenever you change the web app:

```bat
npm run android:build
```

This runs a **static Next export** (`STATIC_EXPORT=1`) into `out/`, then `cap sync` copies it into `android/`.

## Open in Android Studio

```bat
npm run android:open
```

Use **Run** to install on a device or emulator.

## Bluetooth and USB (important)

| Feature | Web (desktop) | Android app (Capacitor) |
|--------|----------------|-------------------------|
| **USB serial (ELM327)** | Web Serial API | **Not supported** on typical phones |
| **Bluetooth LE** | Web Bluetooth (Chrome/Edge) | **Native BLE** via `@capacitor-community/bluetooth-le` (same GATT UUIDs as the web path) |

`BleClient.initialize` uses **`androidNeverForLocation: true`**. For Android 12+ you should assert **no location from BLE** in `AndroidManifest.xml` (see [Android BLE permissions](https://developer.android.com/guide/topics/connectivity/bluetooth/permissions#declare-android12-or-higher)): add `BLUETOOTH_SCAN` with `neverForLocation`, and keep **location permissions only for API ≤ 30** if you still target older devices. Sync `compileSdkVersion` / `targetSdkVersion` with Capacitor’s `android/variables.gradle` before publishing.

## Cleartext / Wi‑Fi OBD

`capacitor.config.ts` enables **`server.cleartext`** and **`android.allowMixedContent`** so `ws://` / `http://` WiFi adapters can be tried from the WebView. Some adapters still need firewall or adapter-specific URLs.

## Release signing

Use Android Studio **Build → Generate Signed Bundle / APK**, or configure signing in `android/app/build.gradle`. Do not commit keystore files (see `.gitignore`).

## Web vs Android builds

- **`npm run build`** — normal Next production build (SSR/static hybrid, `next start` on a server).  
- **`npm run android:build`** — static export only, for embedding in the APK.

If you add Next features that **cannot** be statically exported, adjust the app or split a mobile-only route tree before running `android:build`.

## Android manifest (BLE)

After `npm run android:init`, merge the permission lines from:

`android-templates/AndroidManifest-permissions-snippet.txt`

into `android/app/src/main/AndroidManifest.xml`. This matches `BleClient.initialize({ androidNeverForLocation: true })` and avoids requiring location on Android 12+ for BLE scan.

## iOS (optional)

To ship the same Capacitor shell on iOS:

1. `npx cap add ios`
2. In `ios/App/App/Info.plist`, add **`NSBluetoothAlwaysUsageDescription`** (required or the app crashes when using BLE).
3. Run `npx cap sync ios` after dependency changes.

Bluetooth must be tested on a **physical device** (not the simulator).

## Repo hygiene (web + mobile)

- **`npm run lint`** — ESLint via Next (`eslint-config-next`, see `.eslintrc.json`).
- **GitHub Actions** — `.github/workflows/ci.yml` runs `npm ci`, lint, and build on pushes/PRs to `main` or `master` (rename the branch in the workflow file if yours differs).
