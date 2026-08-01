# PixelSqueeze Image Engine

Source of truth: `src/services/imageOptimizationPipeline.ts` (client engine),
`supabase/functions/compress-image/index.ts` (server path),
`src/hooks/useOptimizationPipeline.ts` (UI orchestration).

## Pipeline stages

1. Decode source via `createImageBitmap`.
2. Content-type detection on a 256px analysis canvas (photo / graphic / screenshot / icon / text-heavy).
3. Format selection with runtime encoder capability probing (`canvas.toDataURL`), preference order AVIF → WebP → JPEG, PNG retained for graphics/transparency.
4. Quality estimation: goal-preset baseline adjusted per content type (icons/text +5, graphics −5, screenshots −3), not a fixed global quality.
5. Resize with `imageSmoothingQuality = 'high'`, aspect-ratio preserving.
6. Optional unsharp-mask sharpening after downscale (presets that need it).
7. Encode, with optional max-file-size loop (quality step-down, max 8 attempts).
8. Truthful metrics + optional SEO filename / alt text.

## Changes made in this pass

| Issue found | Fix |
| --- | --- |
| `createImageBitmap(file)` ignored EXIF orientation, so rotated iPhone/DSLR photos could be exported sideways on non-Safari engines | Now decodes with `{ imageOrientation: 'from-image' }`, with a guarded fallback for engines that reject the option |
| Fixed-dimension presets (Amazon/hotel/Airbnb/square crop) computed `scale` without an upper bound, so small sources were interpolated upward — added blur and bytes | `scale` is clamped to `≤ 1`; small sources are letterboxed on the preset canvas instead of upscaled |
| A no-gain encode could still replace the source file | If the encode is ≥ the original **and** no resize, forced format, or format change was requested, the original bytes are passed through unchanged |
| `compressionRatio` could be negative and was later `Math.max(0, …)`-ed only for the DB row, so the UI could show a nonsense figure | Ratio is clamped at the source; a neutral result reports **0%**, never a fabricated saving |

## Format support (verified)

- **AVIF** — used when the browser can *encode* it (probe based on `toDataURL('image/avif')`, so Chrome, which can decode but not encode, correctly falls through).
- **WebP** — universal fallback on all current targets.
- **JPEG** — final fallback and the automatic retry when AVIF/WebP produce a larger file.
- **PNG** — preserved for graphics/icons and anything requiring alpha.

## Truthfulness guarantees

- Savings are computed from real `Blob.size` values, before/after, per file.
- No saving is ever synthesised when the output is not smaller.
- `batch_processing_stats` rows persist the same measured byte counts shown in the UI.

## Known limits (not defects)

- Encoding runs on the main thread via `<canvas>`; the analysis pass is downsampled to 256px to keep it cheap, and heavy modules (`@imgly/background-removal`, ONNX runtime, `jszip`) are lazy-loaded. A full Web Worker / `OffscreenCanvas` migration is the next available performance step and is *not* implemented.
- Browser canvas encoding does not preserve ICC profiles or EXIF; metadata stripping is intentional (privacy + size). Presets flagged `preserveColorProfile` rely on the browser converting into sRGB, which is correct for web/social output but is not profile passthrough.
- Transparency is preserved only on PNG/WebP output paths.
