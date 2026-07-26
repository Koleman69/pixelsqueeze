# iOS Conversion Guide — PixelSqueeze

This project ships as **both a website (Vite/React PWA) and a native iOS app**
via Capacitor. The iOS app bundles the compiled production build from `dist/`
directly inside the app — it is **not** a webview pointed at the live site.

---

## 1. Prerequisites

- macOS with **Xcode 15+** and Command Line Tools
- **Node 20+** and **Bun** (or npm) matching the project lockfile
- **CocoaPods 1.15+**  (`sudo gem install cocoapods`)
- An Apple Developer account with a valid Team ID
- App Store Connect app record for bundle ID `com.pixelsqueeze.app`

## 2. Packages installed

Native platform:
- `@capacitor/core`, `@capacitor/cli`, `@capacitor/ios`

Runtime plugins (all wired into `src/lib/native.ts`):
- `@capacitor/app` — deep-link `appUrlOpen` handling
- `@capacitor/status-bar` — style + safe-area overlay
- `@capacitor/splash-screen` — programmatic hide after hydration
- `@capacitor/keyboard` — publishes `--keyboard-height` CSS var
- `@capacitor/haptics` — `haptic()` helper
- `@capacitor/network` — `onNetworkChange()` helper
- `@capacitor/browser` — external links open in SFSafariViewController

### Optional (install only if the feature is added)

| Feature | Plugin |
| --- | --- |
| In-app camera capture beyond `<input capture>` | `@capacitor/camera` |
| Native gallery / file picker | `@capacitor/filesystem` + `@capacitor/camera` |
| Push notifications | `@capacitor/push-notifications` + APNs certificate |
| Local notifications | `@capacitor/local-notifications` |
| Apple Sign-In | `@capacitor-community/apple-sign-in` |
| Share sheet | `@capacitor/share` |

## 3. Environment variables

The web `.env` is baked into `dist/` at build time and travels with the app:

```
VITE_SUPABASE_URL=…
VITE_SUPABASE_PUBLISHABLE_KEY=…    # anon key, safe to ship
VITE_SUPABASE_PROJECT_ID=…
```

**Never ship the service-role key.** Supabase edge functions read it from
their own env at runtime.

## 4. Build & sync commands

```bash
# 1. Web production build (outputs to dist/, matches capacitor.config webDir)
bun run build

# 2. Copy dist/ + plugins into the ios/ project
npx cap sync ios

# 3. Open in Xcode
npx cap open ios
```

After **any** web change you re-run `bun run build && npx cap sync ios`.

## 5. Xcode instructions

1. `App > Signing & Capabilities`: set your Team, bundle ID
   `com.pixelsqueeze.app`, and enable **Associated Domains** (for Universal
   Links) + **Push Notifications** (only if you install the plugin).
2. Under **Associated Domains**, add: `applinks:pixelsqueeze.app`.
3. Set the deployment target to **iOS 14.0** or higher.
4. `Product > Archive` → **Distribute App** → **App Store Connect**.

## 6. Permissions in `Info.plist`

Already added (with human-friendly copy):

- `NSCameraUsageDescription`
- `NSPhotoLibraryUsageDescription`
- `NSPhotoLibraryAddUsageDescription`
- `NSMicrophoneUsageDescription`
- `NSFaceIDUsageDescription`
- `NSAppTransportSecurity` (arbitrary loads = false)
- `CFBundleURLTypes` → custom scheme `pixelsqueeze://`

## 7. Deep-link configuration

Two mechanisms are wired:

1. **Custom scheme** `pixelsqueeze://…` — configured in `Info.plist`
   (`CFBundleURLTypes`). Example: `pixelsqueeze://auth/callback?code=…`.
2. **Universal Links** on `https://pixelsqueeze.app/…` — enable the
   Associated Domains capability in Xcode and host
   `/.well-known/apple-app-site-association` on the domain with your Team ID
   + bundle ID.

Both are received by `App.addListener('appUrlOpen', …)` in
`src/lib/native.ts`, which strips the origin and pushes the pathname into
react-router.

## 8. Authentication callback configuration

Supabase auth persistence works out of the box in WKWebView because the
Supabase JS client uses `localStorage`, which WKWebView persists across app
restarts. Nothing to change client-side.

For OAuth / magic-link / password-reset, set the following Supabase
**Redirect URLs** so callbacks work both on web and inside the app:

```
https://pixelsqueeze.app/**
https://pixelsqueeze.app/auth/callback
pixelsqueeze://auth/callback
```

Password-reset emails should point to
`https://pixelsqueeze.app/reset-password` (Universal Link) — iOS will open
the app if installed and fall back to the site otherwise.

Apple Sign-In (optional) requires the **Sign In with Apple** capability in
Xcode plus a Services ID configured in Supabase's Apple provider.

## 9. Testing checklist

- [ ] Launch app cold → splash hides, no white flash
- [ ] Status bar shows dark content on light background, no overlap with UI
- [ ] Every screen scrolls only vertically (no horizontal scroll) on iPhone
      SE (375×667), iPhone 15 (393×852), iPhone 15 Pro Max (430×932)
- [ ] Bottom nav sits above the home indicator (safe-area respected)
- [ ] Fixed headers clear the Dynamic Island / notch
- [ ] Landscape orientation on iPhone renders without clipping
- [ ] All tap targets ≥ 44×44 pt
- [ ] Keyboard pushes inputs into view; sticky bars lift with keyboard
- [ ] Photo picker opens the native library and returns an image
- [ ] External links (docs, social) open in SFSafariViewController, not the
      main webview
- [ ] Sign in, close the app, reopen — still signed in
- [ ] `pixelsqueeze://` and Universal Link both route correctly
- [ ] Offline: airplane mode shows the offline banner, does not crash
- [ ] Supabase edge functions succeed from the device (not just simulator)

## 10. App Store submission checklist

- [ ] App icon set complete (`Assets.xcassets/AppIcon.appiconset`)
- [ ] Launch storyboard renders on all device sizes
- [ ] Version and build number bumped
- [ ] Screenshots for 6.7", 6.5", 5.5" devices
- [ ] Privacy policy URL: `https://pixelsqueeze.app/privacy`
- [ ] App Privacy questionnaire completed (Photos, Camera, User Content)
- [ ] Export compliance answered (uses only HTTPS + Apple crypto → exempt)
- [ ] TestFlight build validated with at least one external tester
- [ ] Reviewer notes explain that the account uses email magic-link auth

## 11. Notes on preserved web behavior

- No source code paths were changed to depend on native-only APIs. Every
  Capacitor call lives behind `Capacitor.isNativePlatform()` in
  `src/lib/native.ts`, so `bun run dev` and the published PWA at
  `pixelsqueeze.app` continue to work unchanged.
- Nothing in the production database, Stripe account, Supabase project,
  custom domains, or edge functions was modified by this conversion.
