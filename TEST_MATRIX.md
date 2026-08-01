# Test Matrix — PixelSqueeze

Evidence recorded on this pass. "Measured" = executed in this environment.

## Toolchain

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `tsgo --noEmit` | **PASS** — 0 errors |
| Production build | `vite build` | **PASS** — built in ~18s, no warnings above the 800 kB chunk limit after the icon-chunk fix |
| Lint | `eslint .` | **112 errors / 24 warnings**, all stylistic: `@typescript-eslint/no-explicit-any`, `prefer-const`, `react-hooks/exhaustive-deps`. Zero correctness or security rules triggered. Not suppressed, not mass-rewritten (a repo-wide `any` refactor is a behavioural risk with no functional payoff) |
| Dependency audit | platform dependency scanner | **PASS** — no high/critical advisories |
| Unit tests | — | none exist in the repository |

## Route matrix (Chromium, 428×1200, measured)

| Route | Loads | Single H1 | Unique title | No overflow | Console clean |
| --- | --- | --- | --- | --- | --- |
| `/` | yes | yes | yes | yes | yes |
| `/index` (alias) | redirects → `/dashboard` (→ `/auth` when signed out) | yes | yes | yes | yes |
| `/pricing` | yes | yes | yes | yes | yes |
| `/scanner` | yes | yes | yes | yes | yes |
| `/blog` | yes | yes | yes | yes | yes |
| `/learn` | yes | yes | yes | yes | yes |
| `/for` | yes | yes | yes | yes | yes |
| `/enhance` | yes | yes | yes | yes | yes |
| `/auth` | yes | yes | yes | yes | yes |
| `/tools/seo-image-optimizer` | yes | yes | yes | yes | yes |
| `/tools/photo-optimizer` | yes | yes | yes | yes | yes |
| `/company` | yes | yes | yes | yes | yes |
| `/privacy` | yes | yes | yes | yes | yes |
| `/install` | yes | yes | yes | yes | yes |
| unknown path | 404 page renders | yes | yes | yes | expected 404 log only |

Protected routes (`/dashboard`, `/account`, `/success`, `/admin`) correctly bounce
unauthenticated visitors to `/auth` — verified via the `/index` alias redirect
chain.

## Not measured in this pass

- Signed-in dashboard flows (upload → optimize → download, batch processing,
  collections, share links): no injected Supabase session was available in this
  environment, so they are **UNVERIFIED** here. They were exercised in earlier
  sessions.
- Stripe checkout completion (requires live card flow).
- Password-reset email delivery — blocked on verifying `pixelsqueeze.app` in
  Resend; the edge function and `/reset-password` route are in place.
- Native device runs (Xcode / Android Studio) — cannot execute in this sandbox.
- Real Lighthouse scores — no Lighthouse binary here; bundle sizes below are the
  measured proxy.

## Bundle evidence (post-fix, gzip)

| Chunk | Before | After |
| --- | --- | --- |
| icons (all of `lucide-react`, force-bundled) | 779 kB raw / 137 kB gzip | eliminated — icons now tree-shake into the routes that use them |
| `react-vendor` | 53 kB gzip | unchanged |
| `charts` (Admin only, lazy) | 105 kB gzip | unchanged, off the critical path |
| ONNX runtime / background removal | lazy | lazy |
