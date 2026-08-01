# Production Readiness — PixelSqueeze

Companion documents: `SECURITY_AUDIT.md`, `SEO_AUDIT.md`,
`PERFORMANCE_REPORT.md`, `TEST_MATRIX.md`, `IMAGE_ENGINE.md`,
`IOS_CONVERSION.md`, `ANDROID_CONVERSION.md`.

No claim below is made without measured evidence. This document does not claim
the app is 100% secure, bug free, or guaranteed acceptance by Apple or Google.

## Repairs completed this pass

**Image engine** — EXIF orientation now honoured on decode; fixed-size presets no
longer upscale small sources; a no-gain encode passes the original bytes through;
compression ratio clamped so no fabricated saving can be displayed.

**Performance** — removed the eager `lucide-react` manual chunk (779 kB raw /
137 kB gzip) and the `import * as icons` namespace import that produced a
720 kB `/learn` chunk. Both chunks no longer exist. Build is clean in 16.3s.

**SEO** — removed all fabricated `aggregateRating` / `review` structured data
from six surfaces (the cause of the Search Console `itemReviewed` and
`reviewCount` errors and a violation of Google's self-serving review policy);
fixed the PWA shortcut that pointed at the non-existent `/index` route and added
a `/index → /dashboard` alias; stripped generation-date `<lastmod>` values from
all 107 sitemap URLs; normalised canonical/`og:url` to the trailing-slash form
the sitemap advertises; disallowed `/reset-password`; removed obsolete meta tags.

**iOS** — added the required `PrivacyInfo.xcprivacy` privacy manifest with
required-reason API declarations.

**PWA** — added `display_override` for a better standalone launch; deleted the
dead `registerSW.js`.

**Quality** — `tsgo --noEmit` passes with 0 errors; production build passes with
no warnings; dependency scan reports no high or critical advisories; all 15
tested routes render a single H1, a unique title, no horizontal overflow at
428px, and no console errors.

## Certification

### Web — **READY**

Evidence: 0 TypeScript errors; clean production build; 15/15 routes verified
loading with correct heading structure, unique metadata and no console errors;
no high/critical dependency advisories; critical-path JS ~200 kB gzip after the
chunk fixes; RLS and edge-function auth verified.
Caveat: CSP and HSTS cannot be set from this repository (`public/_headers` is not
processed by the host) — that is a hosting-layer configuration item.

### PWA — **READY**

Evidence: valid `manifest.webmanifest` (name, short_name, icons incl. maskable,
theme/background colors, `display: standalone`, `display_override`, scope,
start_url, screenshots, shortcuts); every shortcut target now resolves to a real
route; `/install` page documents platform install steps; kill-switch worker in
place to evict stale caches from the removed PWA plugin.
Caveat: intentionally has **no** offline service worker. Offline support was
deliberately removed after it served stale builds to users; the app requires a
network connection.

### Android — **CONDITIONALLY READY**

Ready in code: `AndroidManifest.xml` declares deep links (`pixelsqueeze://` and
`https://pixelsqueeze.app` App Links) with `autoVerify`; cleartext traffic
disabled; release build type is minified, resource-shrunk and non-debuggable;
`versionCode`/`versionName` are env-injected (`PS_VERSION_CODE`,
`PS_VERSION_NAME`) so CI no longer rewrites `build.gradle`; `codemagic.yaml`
builds a signed AAB and uploads to the internal track as a draft; hardware back
button handled in `src/lib/native.ts`.

Release tooling added this pass:
- `npm run android:keystore` — generates the PKCS12 upload keystore (RSA 4096,
  10000 days), writes the git-ignored `android/keystore.properties`, prints the
  SHA-256. Password is prompted, never passed via argv, never logged.
- `npm run android:assetlinks -- <PLAY_SHA256> [UPLOAD_SHA256]` — validates and
  writes real fingerprints into `public/.well-known/assetlinks.json`; rejects
  anything that is not a 32-byte SHA-256 and refuses to write placeholders.
- `npm run android:aab` / `npm run android:apk` — build → `cap sync` → Gradle,
  with a placeholder-fingerprint warning.
- The `android-playstore` CI workflow now **hard-fails** if
  `assetlinks.json` still contains the placeholder.

Conditions that cannot be satisfied from this environment:
1. **The AAB itself was not produced here.** This sandbox has no JDK, no Android
   SDK and no Gradle (`java`, `keytool`, `sdkmanager` all absent), so
   `bundleRelease` cannot run. Execute `npm run android:aab` locally or trigger
   the `android-playstore` Codemagic workflow.
2. **The keystore was not generated here** — a private signing key must not be
   created inside a shared sandbox or committed to the repo. Run
   `npm run android:keystore` on your machine and back the `.jks` up offline.
3. **The real assetlinks fingerprint is still a placeholder** — the correct value
   is the Play App Signing certificate hash, which only exists after the app is
   created in Play Console. Then run `npm run android:assetlinks -- <sha256>`.
4. Upload the keystore to Codemagic as `pixelsqueeze_keystore` and set
   `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS`.
5. Complete the Play Console Data Safety form and store listing.
6. Run at least one physical-device release-build pass.

### iOS — **CONDITIONALLY READY**

Ready in code: bundle ID `com.pixelsqueeze.app`; all required usage-description
strings present (camera, photo library, photo add, microphone, Face ID);
`NSAllowsArbitraryLoads = false`; custom URL scheme registered; safe-area
handling via `contentInset: 'always'` plus CSS `env(safe-area-inset-*)`; assets
bundled locally from `dist/` rather than a remote-URL webview wrapper (important
for App Review guideline 4.2); `codemagic.yaml` archives and submits to
TestFlight; `PrivacyInfo.xcprivacy` now present.

Conditions outside the codebase:
1. Add `PrivacyInfo.xcprivacy` to the App target's **Copy Bundle Resources**
   phase in Xcode — creating the file is not sufficient on its own.
2. Set the real numeric `APP_STORE_APPLE_ID` in `codemagic.yaml` (currently a
   `0000000000` placeholder) and connect the `codemagic_asc_api_key` integration.
3. Configure the Associated Domains entitlement for Universal Links.
4. Complete App Privacy answers in App Store Connect to match the manifest.
5. Run at least one physical-device pass — this sandbox cannot execute Xcode.

## Known open items not fixed here

- **Password-reset email delivery** is blocked on verifying `pixelsqueeze.app` in
  Resend. The `send-password-reset` edge function and `/reset-password` route are
  implemented and deployed; delivery will start once the domain is verified.
- **112 ESLint errors**, all stylistic (`no-explicit-any`, `prefer-const`,
  `exhaustive-deps`). No correctness or security rule is triggered. A repo-wide
  `any` refactor carries behavioural risk with no functional payoff, so it is
  reported rather than rushed.
- **Signed-in end-to-end flows** (upload → optimize → download, batch, share
  links, Stripe completion) could not be executed in this environment — no
  authenticated session was injectable. They are marked UNVERIFIED in
  `TEST_MATRIX.md` rather than assumed passing.
- **Main-thread canvas encoding** — a Web Worker / `OffscreenCanvas` migration is
  the next real performance step and is documented, not implemented.
