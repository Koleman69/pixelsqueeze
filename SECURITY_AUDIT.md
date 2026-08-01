# Security Audit — PixelSqueeze

Scope: repository source, Supabase schema/RLS/RPC grants, edge functions, native
Android/iOS configuration, client storage, dependencies. Only verified findings
are listed; no hypothetical issues.

## Method

- `npm audit` via the platform dependency scanner
- Full source grep for secrets, `dangerouslySetInnerHTML`, `eval`, unsafe redirects
- Review of every `supabase/functions/*` handler for auth, CORS, input validation
- Review of Supabase `SECURITY DEFINER` functions and role grants
- Native manifest / Info.plist review

## Verified state

| Area | Result | Evidence |
| --- | --- | --- |
| Dependency vulnerabilities | **PASS** — no high/critical | dependency scanner: "No high or critical severity vulnerabilities found" |
| Secret leakage | **PASS** | only `VITE_SUPABASE_URL` / publishable anon key reach the client; every privileged key is a Supabase Function secret read via `Deno.env.get` |
| Service-role exposure | **PASS** | `SUPABASE_SERVICE_ROLE_KEY` appears only inside edge functions, never in `src/` |
| RLS | **PASS** | every user-owned table has owner-scoped policies; `free_tool_usage` has no direct client grants and is reachable only via `SECURITY DEFINER` RPCs |
| `SECURITY DEFINER` exposure | **FIXED (previous pass)** | `EXECUTE` revoked from `anon`/`authenticated`/`PUBLIC` on internal trigger helpers; only the guest quota and share-code RPCs remain public by design |
| IDOR on shared files | **PASS** | `get_shared_file_by_code` requires a high-entropy share code and enforces expiry server-side; the `shared-files` bucket is private |
| Quota bypass | **FIXED (previous pass)** | `compress-image` requires an authenticated caller; guest quota is keyed to a secret 24-byte device token, not a guessable email |
| Usage-count leakage | **FIXED (previous pass)** | `count_daily_ai_usage` rejects reads for any subject other than `auth.uid()` (or `service_role`) |
| CORS | **PASS** | all edge functions answer `OPTIONS` and return CORS headers on success *and* error paths |
| Open redirect | **PASS** | Stripe/portal/share-link redirects are pinned to `https://pixelsqueeze.app` server-side rather than echoing a caller-supplied origin (`capacitor://localhost` was the original defect) |
| XSS | **PASS** | no `dangerouslySetInnerHTML` on untrusted input; markdown rendering passes through `dompurify` |
| Android network security | **PASS** | `usesCleartextTraffic="false"`; release builds are minified, resource-shrunk and non-debuggable (no `android:debuggable` override) |
| iOS transport security | **PASS** | `NSAllowsArbitraryLoads = false`; all usage-description strings present |
| iOS privacy manifest | **FIXED this pass** | `ios/App/App/PrivacyInfo.xcprivacy` added with required-reason declarations (UserDefaults `CA92.1`, file timestamp `C617.1`, disk space `E174.1`) — must be added to *Copy Bundle Resources* in Xcode |

## Fixed this pass

1. **Added the iOS privacy manifest** — its absence is an automatic App Store
   rejection since May 2024.
2. **Removed unverifiable `aggregateRating`/`review` structured data** from
   `index.html`, `Landing.tsx`, `IndustryLanding.tsx`, `EnhanceTopic.tsx`,
   `AIAnswerBlock.tsx`, `ToolLandingPage.tsx`. Self-serving review markup
   violates Google's structured-data policy and was the source of the Search
   Console "invalid object type for itemReviewed" errors.
3. **Removed dead `public/registerSW.js`** — an unreferenced service-worker
   registration shim that could re-install a stale worker if ever fetched.

## Not fixed / out of reach from the codebase

- **Response headers (CSP, HSTS, Permissions-Policy)** — Lovable hosting does
  not process `public/_headers`; it is Netlify syntax and has no effect here.
  A CSP therefore cannot be enforced from this repository. This is a hosting
  configuration item, not a code defect.
- **Rate limiting** — edge functions rely on Supabase platform limits plus the
  per-account/per-token quota counters. There is no per-IP throttle in code.
- **SVG uploads** — the client engine decodes through `createImageBitmap`, which
  does not execute scripts, and uploads are stored in a private bucket. SVG is
  not offered as an output format.
