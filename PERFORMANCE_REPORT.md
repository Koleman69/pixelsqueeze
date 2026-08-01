# Performance Report — PixelSqueeze

All numbers below are measured from `vite build` output in this environment.
No Lighthouse binary is available in the sandbox, so bundle weight on the
critical path is used as the objective proxy rather than an invented score.

## Fixed this pass

### 1. `lucide-react` was force-bundled whole (779 kB raw / 137 kB gzip)

`vite.config.ts` declared `"icons": ["lucide-react"]` as a manual chunk. A
manual chunk is eager: naming the package pulls **every** icon in the library
into one file that every route had to download, defeating tree-shaking entirely.

Fix: removed the `icons` manual chunk. Icons now tree-shake into the route
chunks that actually reference them. The 779 kB icon chunk no longer exists.

### 2. `import * as icons from "lucide-react"` in the Learn hub (720 kB chunk)

A namespace import cannot be tree-shaken, so `/learn` shipped a 720.92 kB
(130.60 kB gzip) chunk — by far the heaviest route in the app.

Fix: replaced with an explicit `CATEGORY_ICONS` map of the 12 icons the page
actually uses. **The 720 kB chunk is gone**; the Learn route now loads from the
shared authority-center data chunk (36.88 kB / 13.22 kB gzip) plus its own small
page chunk.

### 3. Image-engine waste

- Fixed-size presets no longer upscale small sources (see `IMAGE_ENGINE.md`) —
  this removes interpolation work *and* the extra bytes it produced.
- A no-gain encode now passes the original bytes through instead of shipping a
  larger file.

### 4. Dead asset

`public/registerSW.js` was unreferenced after the PWA plugin removal and could
only ever produce a wasted request or resurrect a stale worker. Removed.

## Measured bundle state (after fixes, gzip)

| Chunk | Size | On critical path? |
| --- | --- | --- |
| `react-vendor` | 53.02 kB | yes |
| `motion` (framer-motion) | 41.94 kB | yes |
| `supabase` | 34.12 kB | yes |
| `ui-radix` | 33.27 kB | yes |
| entry `index` | 32.42 kB | yes |
| `Landing` | 12.73 kB | yes (home route) |
| `Index` (dashboard) | 27.83 kB | no — lazy, auth-gated |
| `charts` (recharts) | 105.04 kB | no — Admin only, lazy |
| `Admin` | 99.56 kB | no — lazy, auth-gated |
| ONNX runtime ×2 | 108.60 kB each | no — lazy, only on background removal |
| `jszip` | 30.03 kB | no — lazy, only on pack download |
| `authorityCenter` data | 13.22 kB | no — Learn routes only |

Total build time: **16.3s**, zero build warnings.

## Already in place (verified, not changed)

- Every route is `React.lazy` code-split (`src/App.tsx`).
- `IdleRoutePrefetcher` warms Pricing / Auth / Scanner / Dashboard chunks during
  `requestIdleCallback`, so navigations feel instant without hurting first paint.
- Heavy libraries (`@imgly/background-removal`, ONNX, `jszip`) are dynamically
  imported at point of use.
- Build target pinned to `es2020` + `safari14` so older iOS Safari does not
  receive untranspiled syntax and render a blank page.
- `esbuild` minify, CSS minify, sourcemaps off in production.
- Images use `loading="lazy"` + `decoding="async"` outside the hero; the hero LCP
  image is preloaded.
- Fonts are preconnected and subset.
- `overflow-x: clip` on the document root prevents mobile horizontal scroll.

## Remaining opportunities (deliberately not implemented)

- **Canvas encoding on the main thread.** Moving the encode loop to a Web Worker
  with `OffscreenCanvas` would eliminate main-thread jank on very large batches.
  This is a substantial engine refactor with real regression risk on Safari, so
  it is documented rather than rushed.
- **`recharts` → a lighter chart library.** 105 kB gzip is large, but it is
  Admin-only and already lazy, so it never affects a normal user's page load.
- **Response caching headers.** `public/_headers` is Netlify syntax and is not
  processed by Lovable hosting; long-lived asset caching must be configured at
  the hosting layer.
