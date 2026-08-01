# Android / Google Play Deployment Guide — PixelSqueeze

PixelSqueeze ships the compiled Vite build from `dist/` inside a Capacitor
Android app (`com.pixelsqueeze.app`). It is a real native container with
bundled assets — **not** a WebView pointed at the live site (Play rejects
"webview wrapper" submissions under policy 4.1).

---

## 1. Prerequisites

- **Node 20+** (or Bun) and **JDK 21**
- **Android Studio Ladybug+** with SDK Platform 36 and Build Tools 36
- A **Google Play Console** developer account ($25 one-time)
- An upload keystore (see §3)

## 2. Build & run locally

```bash
bun run build            # -> dist/
npx cap sync android     # copies dist/ + plugins into android/
npx cap open android     # opens Android Studio
# or straight to a device / emulator:
npx cap run android
```

After **any** web change, re-run `bun run build && npx cap sync android`.

## 3. Signing (automated)

Run once, on your own machine, with JDK 21 installed:

```bash
npm run android:keystore
```

This creates `~/.pixelsqueeze/pixelsqueeze-upload.jks` (PKCS12, RSA 4096,
10000-day validity), writes the git-ignored `android/keystore.properties`, and
prints the upload certificate's SHA-256 fingerprint. It never regenerates an
existing keystore and never takes the password on the command line.

The release build picks `android/keystore.properties` up automatically. CI can
instead supply `PS_KEYSTORE_PATH`, `PS_KEYSTORE_PASSWORD`, `PS_KEY_ALIAS`,
`PS_KEY_PASSWORD`. **Never commit the keystore or passwords** — `*.jks`,
`*.keystore` and `keystore.properties` are all git-ignored. Losing this file
means you can never update the app under the same listing.

Enable **Play App Signing** when you create the app in Play Console — Google
holds the release key and you only manage the upload key.

### App Links fingerprint

`public/.well-known/assetlinks.json` ships with a placeholder. Once the app
exists in Play Console, copy the SHA-256 from **Setup → App signing → App
signing key certificate** and run:

```bash
npm run android:assetlinks -- <PLAY_SHA256> [UPLOAD_SHA256]
```

Pass the upload fingerprint as a second argument too if you sideload
upload-key-signed APKs, otherwise links only verify for Play installs. The
script validates the input is a real 32-byte SHA-256 and refuses placeholders.
The Play-Store CI workflow now **fails the build** if the placeholder is still
present, so a non-verifying App Link can't reach the store.

## 4. Produce the Play artifact

Play requires an **AAB** (Android App Bundle):

```bash
npm run android:aab   # -> android/app/build/outputs/bundle/release/app-release.aab
npm run android:apk   # -> android/app/build/outputs/apk/release/app-release.apk (sideloading)
```

Both scripts run `vite build`, `npx cap sync android`, then Gradle. They require
JDK 21 and the Android SDK (Platform 36 + Build Tools 36) with `ANDROID_HOME`
set — neither is available in the Lovable sandbox, so the AAB must be produced
locally or by the Codemagic workflow below.

R8 minification + resource shrinking are enabled for release, with keep rules
for the Capacitor JS bridge in `android/app/proguard-rules.pro`. Upload
`mapping.txt` with the bundle so Play crash reports are deobfuscated.

## 5. Automated builds (Codemagic)

`codemagic.yaml` includes two Android workflows:

| Workflow | Output | Publishing |
| --- | --- | --- |
| `android-playstore` | signed AAB | Play `internal` track, as draft |
| `android-apk` | signed APK | artifact download only |

Codemagic setup:
1. Upload the keystore under **Teams → Code signing identities → Android
   keystores** with the reference name `pixelsqueeze_keystore`.
2. Create a Google Cloud service account with Play Console API access, add the
   JSON to an environment group named `google_play` as
   `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`.
3. Trigger `android-playstore`.

Version codes auto-increment from the latest Play internal-track build and are
injected via the `PS_VERSION_CODE` environment variable — `build.gradle` reads
it, so no file is rewritten by CI.


## 6. Version numbers

`android/app/build.gradle`:

- `versionName` — user-visible ("1.0"), keep in sync with iOS `MARKETING_VERSION`
- `versionCode` — integer, must strictly increase on every Play upload

## 7. Permissions declared

`android/app/src/main/AndroidManifest.xml`:

| Permission | Why |
| --- | --- |
| `INTERNET`, `ACCESS_NETWORK_STATE` | Supabase calls, offline banner |
| `CAMERA` (feature optional) | in-app photo capture |
| `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO` | Android 13+ photo/video picker |
| `READ_EXTERNAL_STORAGE` (maxSdk 32) | legacy gallery access |
| `VIBRATE` | haptic feedback |

`usesCleartextTraffic="false"` — all traffic is HTTPS.

## 8. Deep links (Android App Links)

Two mechanisms are wired in the manifest and handled by `appUrlOpen` in
`src/lib/native.ts`:

1. Custom scheme `pixelsqueeze://…`
2. Verified App Links on `https://pixelsqueeze.app` and `www.pixelsqueeze.app`
   (`android:autoVerify="true"`)

To finish verification, replace the placeholder fingerprint in
**`public/.well-known/assetlinks.json`** with the **SHA-256 of your Play App
Signing certificate** (Play Console → Setup → App signing), then publish the
site. Verify with:

```bash
curl https://pixelsqueeze.app/.well-known/assetlinks.json
```

Supabase **Redirect URLs** to add:

```
https://pixelsqueeze.app/**
pixelsqueeze://auth/callback
```

## 9. Android-specific behavior implemented

- **Hardware/gesture back button** navigates browser history and exits at the
  root (`App.addListener('backButton')` in `src/lib/native.ts`).
- **Status bar** is opaque `#FAFAFA` with dark icons and does not overlay the
  WebView, so headers never sit under the system clock.
- **Keyboard** uses `adjustResize` + the `--keyboard-height` CSS variable so
  sticky bars lift with the keyboard.
- **External links** open in a Chrome Custom Tab via `@capacitor/browser`.

## 10. Store listing assets (growth-optimized)

| Asset | Spec |
| --- | --- |
| App icon | 512×512 PNG, no alpha |
| Feature graphic | 1024×500 PNG/JPG, no text near edges |
| Phone screenshots | 2–8, min 1080px on the short side |
| 7" & 10" tablet screenshots | recommended for tablet visibility |
| Short description | ≤80 chars |
| Full description | ≤4000 chars |

Suggested copy (aligns with the site's positioning):

- **Title (30 chars max):** `PixelSqueeze: AI Photo Fixer`
- **Short description:** `Fix blurry photos and shrink image size instantly with AI.`
- **Full description keywords:** fix blurry photos, photo enhancer, image
  compressor, upscale photos, remove background, resize for Instagram, reduce
  photo size, AI photo editor.
- Lead screenshots with **before/after** frames — highest-converting pattern
  for photo utilities.
- Fill the **Store listing experiments** (A/B) slot after launch: test icon and
  first screenshot first, they move installs the most.

## 11. Play Console data safety & policy

- **Data safety form:** photos are processed and, for signed-in paid users,
  stored up to 30 days; email collected for accounts; no data sold; data
  encrypted in transit.
- **Privacy policy URL:** `https://pixelsqueeze.app/privacy`
- **Account deletion URL** is mandatory when accounts exist — point to
  `https://pixelsqueeze.app/account`.
- **Target API level:** 36 (meets the current Play requirement).
- **Ads:** none — declare "No ads".
- **Content rating:** complete the IARC questionnaire (Utility, no UGC sharing
  by default; disclose the shareable-link feature).

## 12. Pre-submission testing checklist

- [ ] Cold start shows the splash, then the app with no white flash
- [ ] Back button/gesture never traps the user; exits from the home screen
- [ ] Status bar and bottom nav respect insets on a notch device
- [ ] Photo picker returns an image on Android 13+ and Android 10
- [ ] Camera capture works and permission prompt copy is clear
- [ ] Download of an optimized image lands in Downloads and is openable
- [ ] Sign in, kill the app, reopen — still signed in
- [ ] `pixelsqueeze://` and an `https://pixelsqueeze.app/...` link both open the app
- [ ] Airplane mode shows the offline state without crashing
- [ ] Release (R8) build tested, not just debug — obfuscation regressions only
      appear there
- [ ] Rotation and small-screen (360dp) layouts have no horizontal scroll
- [ ] Internal testing track validated with at least one external tester

## 13. Nothing web-side changed

Every Capacitor call stays behind `Capacitor.isNativePlatform()` in
`src/lib/native.ts`, so `bun run dev`, the PWA, and the published site at
`pixelsqueeze.app` behave exactly as before. The added
`public/manifest.webmanifest` only improves installability and Play Store
trusted-web signals.
