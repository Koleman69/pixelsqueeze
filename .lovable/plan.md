# Magic Optimize — Plan

A new one-click optimizer that picks every setting automatically based on the user's *destination* (Website, Instagram, TikTok, Print, Amazon, Email, Airbnb, Hotel Website, LinkedIn, Custom). Lives inside the existing dashboard alongside Quick Optimize.

## What gets built

1. **New destination presets** added to the optimization pipeline (`src/services/imageOptimizationPipeline.ts`):
   - `instagram` (1080² square-aware, vibrant, q88, WebP/JPEG)
   - `tiktok` (1080×1920 vertical-friendly, q85, WebP)
   - `amazon` (2000² white-bg, square crop, q92, JPEG)
   - `airbnb` (1920×1080, mild brightness/clarity, q85, JPEG)
   - `hotel` (2560 long edge, q90, sharpen, JPEG — luxury feel)
   - `linkedin` (1200×627, sharpened, q85, JPEG)
   - Reuse existing `web` for Website Speed, `email`, `print`, `custom`.
   - Each preset already drives dimensions, quality, format, sharpening, white-bg normalization, metadata stripping, and color profile preservation — no rule engine rewrite needed.

2. **New component `src/components/MagicOptimize.tsx`** (the feature):
   - Upload zone (drag-drop + click) → multi-file.
   - Destination grid with the 10 options above (icons, short descriptors, Pro lock where appropriate).
   - Primary CTA: **✨ Optimize My Files**.
   - Uses `useOptimizationPipeline` already in the project.
   - Result cards show: Original (size / dimensions / format) → Optimized (size / dimensions / format), % saved, estimated page-speed gain (derived from KB saved), quality retained estimate.
   - Per-file **before/after slider** using existing `BeforeAfterSlider`.
   - Per-file actions: Download, Copy share link (reuses existing `ShareButton` / `upload-shared-file` edge function).
   - Bulk: Download All ZIP (existing `downloadAllAsZip`).
   - **AI Recommendations panel** under each result using existing `AIRecommendation` component: "Remove background", "Upscale", "Convert format", "Increase clarity" — links into the existing AI editor/upscale tools.

3. **Video handling (scoped)**:
   - Show video files in the upload list with a "Video optimization coming soon" badge + a CTA to the existing AI Video Enhancer (`AIVideoEnhancer` component).
   - Reason: full server-side video transcoding per destination is a separate, much larger backend project (ffmpeg in an edge function or external service). Calling that out so the UI ships now without blocking on it.

4. **Dashboard wiring** (`src/pages/Index.tsx` + `DashboardSidebar`):
   - Add a "Magic Optimize" entry as the **default tool** when entering the dashboard.
   - Keeps existing Quick Optimize as a secondary/advanced option.

## Technical notes

```
Destination → GoalPreset map
  Website Speed   → web
  Instagram       → instagram (new)
  TikTok          → tiktok (new)
  Print           → print
  Amazon Listing  → amazon (new, squareCrop + whiteBackgroundNormalize)
  Email           → email
  Airbnb          → airbnb (new)
  Hotel Website   → hotel (new)
  LinkedIn        → linkedin (new)
  Custom          → custom (opens advanced settings drawer)
```

- Estimated page-speed gain = `min(95, round(savedKB / originalKB * 60))` % — a simple, honest heuristic shown as "Est. load improvement".
- Quality retained % = `100 - max(0, (compressionRatio - 50) * 0.3)` rounded — keeps the UX number friendly while remaining tied to actual compression.
- All processing stays client-side (existing pipeline). No new edge function needed for images.
- Metadata strip + SEO rename stay on by default; both exposable via a small "Advanced" disclosure.

## Files touched

- `src/services/imageOptimizationPipeline.ts` — add 6 new `GoalPreset` entries + type union.
- `src/components/MagicOptimize.tsx` — new.
- `src/pages/Index.tsx` + `src/components/DashboardSidebar.tsx` — register tool, make default.
- (Reused, no edits: `BeforeAfterSlider`, `AIRecommendation`, `ShareButton`, `useOptimizationPipeline`.)

## Out of scope (call out to user)

- Real server-side **video** transcoding per destination — needs ffmpeg infrastructure. For now videos are routed to the existing AI Video Enhancer.
- Background removal is offered as a recommendation that hops into the existing AI editor; not auto-applied inside Magic Optimize.
