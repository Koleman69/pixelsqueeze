// Client-side pipeline: given an image File, produce WebP + AVIF + responsive
// widths, request AI-generated SEO metadata from the edge function, and
// return everything ready for download / <picture> markup / Google Image indexing.

import { supabase } from "@/integrations/supabase/client";

export interface SeoImageVariant {
  width: number;
  format: "webp" | "avif" | "jpeg";
  blob: Blob;
  filename: string;
}

export interface SeoImageResult {
  metadata: import("./imageSeoTypes").SeoMetadata;
  variants: SeoImageVariant[];
  original: { blob: Blob; filename: string; width: number; height: number };
  pictureHtml: string;   // ready-to-paste <picture> block with srcset + alt + loading=lazy
  jsonLd: string;        // <script type="application/ld+json"> content
  openGraphTags: string; // <meta property="og:image:*"> block
  twitterTags: string;
  pinterestTags: string;
  sitemapEntry: string;  // <image:image>...</image:image> block
}

const RESPONSIVE_WIDTHS = [400, 800, 1200, 1920];

async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  } finally {
    // Revoke after resolve microtask
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), type, quality));
}

async function renderVariant(img: HTMLImageElement, targetWidth: number, type: string, quality: number): Promise<Blob | null> {
  const ratio = img.naturalHeight / img.naturalWidth;
  const w = Math.min(targetWidth, img.naturalWidth);
  const h = Math.round(w * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return canvasToBlob(canvas, type, quality);
}

async function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildPictureHtml(slug: string, variants: SeoImageVariant[], alt: string, title: string, w: number, h: number) {
  const groups: Record<string, SeoImageVariant[]> = { avif: [], webp: [], jpeg: [] };
  variants.forEach((v) => groups[v.format]?.push(v));

  const srcset = (fmt: "avif" | "webp" | "jpeg") =>
    groups[fmt].map((v) => `${v.filename} ${v.width}w`).join(", ");

  const fallback = groups.jpeg[groups.jpeg.length - 1] ?? variants[variants.length - 1];

  return `<picture>
  <source type="image/avif" srcset="${srcset("avif")}" sizes="(max-width: 768px) 100vw, 1200px">
  <source type="image/webp" srcset="${srcset("webp")}" sizes="(max-width: 768px) 100vw, 1200px">
  <img
    src="${fallback.filename}"
    srcset="${srcset("jpeg")}"
    sizes="(max-width: 768px) 100vw, 1200px"
    width="${w}"
    height="${h}"
    alt="${alt.replace(/"/g, "&quot;")}"
    title="${title.replace(/"/g, "&quot;")}"
    loading="lazy"
    decoding="async"
    fetchpriority="auto">
</picture>`;
}

export async function generateSeoImagePackage(file: File): Promise<SeoImageResult> {
  const img = await loadImage(file);
  const originalWidth = img.naturalWidth;
  const originalHeight = img.naturalHeight;

  // 1. Request AI metadata in parallel with variant generation
  const base64 = await fileToBase64(file);
  const metadataPromise = supabase.functions.invoke("generate-image-seo", {
    body: { imageBase64: base64, mimeType: file.type || "image/jpeg", originalName: file.name },
  });

  // 2. Build variants: AVIF, WebP, JPEG × responsive widths
  const variants: SeoImageVariant[] = [];
  const targets = RESPONSIVE_WIDTHS.filter((w) => w <= originalWidth || w === RESPONSIVE_WIDTHS[0]);

  // Try AVIF first — some browsers (Safari <16) can't encode; skip silently.
  for (const w of targets) {
    const avif = await renderVariant(img, w, "image/avif", 0.6);
    if (avif && avif.size > 0 && avif.type.includes("avif")) {
      variants.push({ width: w, format: "avif", blob: avif, filename: `__PLACEHOLDER__-${w}w.avif` });
    }
  }
  for (const w of targets) {
    const webp = await renderVariant(img, w, "image/webp", 0.82);
    if (webp) variants.push({ width: w, format: "webp", blob: webp, filename: `__PLACEHOLDER__-${w}w.webp` });
  }
  for (const w of targets) {
    const jpeg = await renderVariant(img, w, "image/jpeg", 0.85);
    if (jpeg) variants.push({ width: w, format: "jpeg", blob: jpeg, filename: `__PLACEHOLDER__-${w}w.jpg` });
  }

  const { data, error } = await metadataPromise;
  if (error || !data) throw new Error(error?.message || "SEO metadata generation failed");
  const metadata = data as import("./imageSeoTypes").SeoMetadata;

  // 3. Rename variants with descriptive slug
  variants.forEach((v) => { v.filename = v.filename.replace("__PLACEHOLDER__", metadata.slug); });
  const originalExt = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const originalRenamed = { blob: file, filename: `${metadata.slug}.${originalExt}`, width: originalWidth, height: originalHeight };

  const largestJpeg = [...variants].reverse().find((v) => v.format === "jpeg");
  const pictureHtml = buildPictureHtml(metadata.slug, variants, metadata.altText, metadata.title, originalWidth, originalHeight);

  const jsonLd = `<script type="application/ld+json">
${JSON.stringify({
    ...metadata.schema,
    contentUrl: largestJpeg?.filename,
    width: originalWidth,
    height: originalHeight,
  }, null, 2)}
</script>`;

  const openGraphTags = `<meta property="og:image" content="${largestJpeg?.filename ?? metadata.filename}">
<meta property="og:image:alt" content="${metadata.altText}">
<meta property="og:image:width" content="${originalWidth}">
<meta property="og:image:height" content="${originalHeight}">
<meta property="og:image:type" content="image/jpeg">`;

  const twitterTags = `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${largestJpeg?.filename ?? metadata.filename}">
<meta name="twitter:image:alt" content="${metadata.twitterAltText}">`;

  const pinterestTags = `<meta name="pinterest-rich-pin" content="true">
<meta property="og:see_also" content="${largestJpeg?.filename ?? metadata.filename}">
<meta name="pinterest:description" content="${metadata.pinterestDescription.replace(/"/g, "&quot;")}">
<meta name="pinterest:media" content="${largestJpeg?.filename ?? metadata.filename}">`;

  const sitemapEntry = `<image:image>
  <image:loc>${largestJpeg?.filename ?? metadata.filename}</image:loc>
  <image:title>${metadata.title}</image:title>
  <image:caption>${metadata.caption}</image:caption>
</image:image>`;

  return {
    metadata,
    variants,
    original: originalRenamed,
    pictureHtml,
    jsonLd,
    openGraphTags,
    twitterTags,
    pinterestTags,
    sitemapEntry,
  };
}
