// Authority Center content model.
// Every article carries an explicit `related` array of slugs so we can render
// a "related reading" block AND emit contextual in-body cross-links —
// the interlinking that builds topical authority for Google.

export type CategorySlug =
  | "knowledge-base"
  | "beginner-guides"
  | "professional-guides"
  | "faqs"
  | "case-studies"
  | "success-stories"
  | "before-after"
  | "photography-tips"
  | "marketing-tips"
  | "printing-tips"
  | "seo-tips"
  | "calculators";

export interface Category {
  slug: CategorySlug;
  name: string;
  tagline: string;
  description: string;
  icon: string; // lucide name
  accent: string; // tailwind gradient stops
}

export interface Article {
  slug: string;
  category: CategorySlug;
  title: string;
  description: string;
  readMinutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  updated: string;
  intro: string;
  sections: { h: string; body: string }[];
  faq: { q: string; a: string }[];
  related: string[]; // other article slugs — the cross-link fabric
  cta?: { label: string; href: string };
}

export const CATEGORIES: Category[] = [
  { slug: "knowledge-base", name: "Knowledge Base", tagline: "Reference for every question", description: "The definitive answers for image formats, compression, color, and export.", icon: "BookOpen", accent: "from-primary/20 to-secondary/20" },
  { slug: "beginner-guides", name: "Beginner Guides", tagline: "Start here", description: "Plain-English walkthroughs for your first optimized image, upload, and export.", icon: "Sparkles", accent: "from-emerald-500/20 to-cyan-500/20" },
  { slug: "professional-guides", name: "Professional Guides", tagline: "Ship at scale", description: "Batch workflows, color-managed pipelines, and CDN delivery patterns for studios and teams.", icon: "GraduationCap", accent: "from-accent/20 to-primary/20" },
  { slug: "faqs", name: "FAQs", tagline: "Fast, canonical answers", description: "The questions users ask us most — answered in 30 seconds or less.", icon: "HelpCircle", accent: "from-warning/20 to-secondary/20" },
  { slug: "case-studies", name: "Case Studies", tagline: "Data-backed wins", description: "Measured LCP, size, and revenue impact from real PixelSqueeze customers.", icon: "LineChart", accent: "from-secondary/20 to-accent/20" },
  { slug: "success-stories", name: "Success Stories", tagline: "Told by the creators", description: "How photographers, agencies, and shops grew traffic and sales with better images.", icon: "Trophy", accent: "from-warning/25 to-primary/20" },
  { slug: "before-after", name: "Before & After Gallery", tagline: "See the difference", description: "Side-by-side samples across compression, upscaling, denoise, and color correction.", icon: "GitCompare", accent: "from-primary/20 to-accent/20" },
  { slug: "photography-tips", name: "Photography Tips", tagline: "Better inputs, better output", description: "Composition, lighting, and camera settings that make optimization work harder.", icon: "Camera", accent: "from-primary/25 to-secondary/25" },
  { slug: "marketing-tips", name: "Marketing Tips", tagline: "Convert with your images", description: "Visual conversion tactics for landing pages, ads, listings, and email.", icon: "Megaphone", accent: "from-secondary/25 to-warning/25" },
  { slug: "printing-tips", name: "Printing Tips", tagline: "Nail the print", description: "DPI, color space, and file prep for pro prints, canvas, apparel, and packaging.", icon: "Printer", accent: "from-accent/25 to-primary/25" },
  { slug: "seo-tips", name: "SEO Tips", tagline: "Rank in Google Images", description: "Filenames, alt text, schema, sitemaps, and Core Web Vitals for image SEO.", icon: "Search", accent: "from-primary/25 to-accent/25" },
  { slug: "calculators", name: "Calculators", tagline: "Interactive tools", description: "Resolution, file size, and DPI — solve in seconds.", icon: "Calculator", accent: "from-secondary/25 to-primary/25" },
];

export const ARTICLES: Article[] = [
  // ── KNOWLEDGE BASE ──
  {
    slug: "webp-vs-avif-vs-jpeg",
    category: "knowledge-base",
    title: "WebP vs AVIF vs JPEG: which image format to use in 2026",
    description: "A practical breakdown of the three formats that matter, when each wins, and how to serve them with a single <picture> tag.",
    readMinutes: 8, level: "Intermediate", updated: "2026-07-19",
    intro: "JPEG stayed king for 30 years because it was universal. It isn't anymore. AVIF ships 40-60% smaller files than JPEG at matched quality; WebP splits the difference with broader support. The right answer is almost never 'pick one' — it's a stack.",
    sections: [
      { h: "The one-line rule", body: "Serve AVIF to browsers that accept it, WebP as the fallback, JPEG for anything older. A single `<picture>` element does this natively — no scripts required." },
      { h: "AVIF: smallest files, most CPU", body: "AVIF uses the AV1 codec. It's the current file-size champion but takes 3-10× longer to encode than JPEG. Encode once, cache aggressively." },
      { h: "WebP: the safe middle", body: "Support is universal outside legacy iOS 13 and older Safari. WebP encodes fast, decodes fast, and is 25-35% smaller than JPEG at equal quality." },
      { h: "JPEG: still the fallback", body: "Progressive JPEG with mozjpeg-grade encoding is close enough to WebP that you can keep it as your safety net without penalty." },
      { h: "Copy-paste markup", body: "See our [SEO Image Optimizer](/tools/seo-image-optimizer) — it emits AVIF + WebP + JPEG variants with the exact `<picture>` block ready to paste." },
    ],
    faq: [
      { q: "Do I lose SEO by serving multiple formats?", a: "No — Google indexes whichever image the browser loads. Serving AVIF/WebP improves Core Web Vitals, which is a ranking signal." },
      { q: "What about PNG?", a: "Keep PNG only for images with hard-edged transparency (logos, UI). For everything else, WebP-lossless is smaller." },
    ],
    related: ["compression-quality-scale", "image-seo-checklist", "core-web-vitals-images"],
  },
  {
    slug: "compression-quality-scale",
    category: "knowledge-base",
    title: "What image compression quality actually means (0-100 explained)",
    description: "Every image tool asks for a quality number. Here is what those numbers really do, and the settings that hit the sweet spot.",
    readMinutes: 6, level: "Beginner", updated: "2026-07-19",
    intro: "Quality sliders are not linear and not standardized. A 'quality 80' in one encoder can look worse than 'quality 65' in another. The number is a hint to the encoder, not a promise.",
    sections: [
      { h: "What the encoder is doing", body: "Lossy encoders throw away detail your eye is least likely to notice: high-frequency data in busy regions and subtle color shifts. The quality number controls how aggressively." },
      { h: "The sweet spot", body: "For photos: JPEG 82, WebP 80, AVIF 55-60. For screenshots and text: bump JPEG to 92 or use PNG/WebP-lossless." },
      { h: "How to test yours", body: "Compare side-by-side at 100% zoom. Look at skin, sky gradients, and text edges — that's where compression fails first. Use our [Before & After Gallery](/learn/before-after) for reference." },
    ],
    faq: [
      { q: "Is quality 100 lossless?", a: "For JPEG, no — it's still lossy, just with minimal loss and a very large file. Use PNG or WebP-lossless if you truly need pixel-perfect." },
    ],
    related: ["webp-vs-avif-vs-jpeg", "resize-vs-compress", "batch-optimize-workflow"],
  },
  {
    slug: "resize-vs-compress",
    category: "knowledge-base",
    title: "Resize vs compress: two very different things",
    description: "Compression reduces file size at the same pixel count. Resizing changes the pixel count. Do both, in the right order.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "A 5000×3000 photo compressed to 'high quality' is still 2 MB. The same photo resized to 1600×960 first, then compressed, ships at 180 KB — and looks identical on a laptop.",
    sections: [
      { h: "Do this first", body: "Resize to the largest display size your layout actually uses. For most web hero images, that's 1600-1920px wide." },
      { h: "Then compress", body: "Apply format-appropriate quality. See [compression quality explained](/learn/knowledge-base/compression-quality-scale)." },
      { h: "Then serve responsive sizes", body: "Emit a `srcset` with 400/800/1200/1920 variants. Our [Image Size Calculator](/learn/calculators/image-size-calculator) shows the payload difference." },
    ],
    faq: [{ q: "What order matters most?", a: "Resize before compress. Compressing a huge file, then resizing, wastes CPU and re-introduces artifacts." }],
    related: ["compression-quality-scale", "core-web-vitals-images", "batch-optimize-workflow"],
  },

  // ── BEGINNER GUIDES ──
  {
    slug: "your-first-optimized-image",
    category: "beginner-guides",
    title: "Your first optimized image in 90 seconds",
    description: "A guided first upload: drop a photo, pick a destination, download the pack. Zero jargon.",
    readMinutes: 3, level: "Beginner", updated: "2026-07-19",
    intro: "This is the fastest path from 'I have a big photo' to 'I have a small, sharp, ready-to-ship image'. It takes about 90 seconds.",
    sections: [
      { h: "Step 1 — Open Magic Optimize", body: "Head to the [dashboard](/dashboard) and click Magic Optimize. It's the big card at the top." },
      { h: "Step 2 — Drop your image", body: "Drag any JPG, PNG, HEIC, or WebP into the dropzone. HEIC from an iPhone works — no conversion needed." },
      { h: "Step 3 — Pick where it's going", body: "Instagram, website, print, or email. Each destination locks in the right dimensions, format, and quality." },
      { h: "Step 4 — Download", body: "Click Download. That's it. Want the version with SEO metadata baked in? Use the [SEO Image Optimizer](/tools/seo-image-optimizer) instead." },
    ],
    faq: [{ q: "Do I need an account?", a: "No — one free optimization per day without signing in. Beyond that, [create a free account](/auth)." }],
    related: ["mobile-photo-quick-fix", "best-format-for-instagram", "image-seo-checklist"],
    cta: { label: "Try Magic Optimize free", href: "/dashboard" },
  },
  {
    slug: "mobile-photo-quick-fix",
    category: "beginner-guides",
    title: "Fix a blurry phone photo without an app",
    description: "Three no-install tactics that rescue soft or noisy phone photos in under a minute.",
    readMinutes: 4, level: "Beginner", updated: "2026-07-19",
    intro: "Most 'blurry' phone photos are actually noisy, low-contrast, or slightly out of focus. Fixing them takes seconds if you know which lever to pull.",
    sections: [
      { h: "Try sharpening before upscaling", body: "Our [AI Enhance Studio](/dashboard) has a one-click Sharpen. Try that first — it's non-destructive." },
      { h: "Denoise if the photo was shot indoors", body: "Low-light phone photos have grain. Denoise, then sharpen — in that order." },
      { h: "Upscale only if you truly need more pixels", body: "Upscaling invents detail. Only reach for it when you need a larger print. See [Image Resolution Calculator](/learn/calculators/image-resolution-calculator) to check first." },
    ],
    faq: [{ q: "Will upscaling make my photo look fake?", a: "AI upscalers are conservative up to 2× and start hallucinating detail at 4×+. Stop at 2× when the subject is a face." }],
    related: ["your-first-optimized-image", "ai-upscaling-explained", "print-dpi-basics"],
  },
  {
    slug: "best-format-for-instagram",
    category: "beginner-guides",
    title: "The best image format and size for Instagram in 2026",
    description: "Instagram's own specs, plus the settings that keep colors accurate after their re-compression.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "Instagram re-compresses everything you upload. Your job is to give them a file that survives that pass looking sharp and color-accurate.",
    sections: [
      { h: "Feed post", body: "1080×1080 (square) or 1080×1350 (portrait), JPEG quality 85, sRGB color space. Bigger is not better — anything over 1600px is downscaled server-side." },
      { h: "Story / Reel cover", body: "1080×1920, JPEG quality 85." },
      { h: "Color", body: "Convert to sRGB before export. P3 files look flat after Instagram's pipeline strips the profile." },
    ],
    faq: [{ q: "Should I upload HEIC?", a: "No — Instagram converts it anyway. Export JPEG from your phone or run it through Magic Optimize." }],
    related: ["your-first-optimized-image", "convert-color-space", "photo-composition-basics"],
  },

  // ── PROFESSIONAL GUIDES ──
  {
    slug: "batch-optimize-workflow",
    category: "professional-guides",
    title: "The 500-image batch workflow used by production studios",
    description: "A reproducible pipeline for a full shoot: rename, resize, format-switch, embed metadata, export.",
    readMinutes: 10, level: "Advanced", updated: "2026-07-19",
    intro: "Once you're processing 100+ images per shoot, one-off tools break down. Here's the batch pattern our studio users run daily.",
    sections: [
      { h: "1. Ingest with descriptive filenames", body: "Rename at ingest, not export — every downstream tool inherits the name. Use `{shoot}-{scene}-{seq}.raw`." },
      { h: "2. Resize to two masters", body: "Print master (300 DPI, TIFF) and web master (2400px longest edge, PNG). All exports derive from these two." },
      { h: "3. Batch through Magic Optimize", body: "Drag the folder into [Batch Optimizer](/dashboard). Set the destination once — the pipeline applies it to every file." },
      { h: "4. Emit SEO metadata", body: "Run the [SEO Image Optimizer](/tools/seo-image-optimizer) on hero images so they arrive with alt text, schema, and Open Graph baked in." },
      { h: "5. Deliver via CDN", body: "Upload the final `/images/` folder to your CDN. Cache-control: 1 year." },
    ],
    faq: [{ q: "How many files can I batch at once?", a: "Free tier: 5 per batch. Pro and above: 500 per batch, 20 batches per day." }],
    related: ["color-managed-pipeline", "cdn-delivery-patterns", "image-seo-checklist"],
  },
  {
    slug: "color-managed-pipeline",
    category: "professional-guides",
    title: "Setting up a color-managed pipeline from camera to CDN",
    description: "How to keep skin tones and brand colors identical from RAW capture through browser render.",
    readMinutes: 9, level: "Advanced", updated: "2026-07-19",
    intro: "The reason your brand red looks orange on Instagram isn't Instagram — it's a broken color pipeline. Fix the chain, not the last link.",
    sections: [
      { h: "Capture in ProPhoto or Adobe RGB", body: "Widest gamut you can. You can always narrow later; you can't recover clipped color." },
      { h: "Edit in the same space", body: "Set your editor's working space to match capture. Only convert on export." },
      { h: "Export in sRGB for web, P3 only for controlled surfaces", body: "sRGB is the safe web default. P3 is for App Store screenshots and Apple ecosystem targets." },
      { h: "Embed the profile", body: "Never strip the ICC profile from web exports. It's ~4 KB and prevents color drift." },
    ],
    faq: [{ q: "Does compression hurt color accuracy?", a: "Only chroma subsampling — set it to 4:4:4 for logos and brand assets; 4:2:0 is fine for photos." }],
    related: ["batch-optimize-workflow", "print-dpi-basics", "convert-color-space"],
  },
  {
    slug: "cdn-delivery-patterns",
    category: "professional-guides",
    title: "CDN delivery patterns for image-heavy sites",
    description: "Cache headers, responsive srcset, and origin architecture for sites serving 10M+ image requests a month.",
    readMinutes: 8, level: "Advanced", updated: "2026-07-19",
    intro: "The difference between a fast image site and a slow one isn't the images — it's the delivery.",
    sections: [
      { h: "Cache immutably", body: "Give every image a content-hashed filename and set `Cache-Control: public, max-age=31536000, immutable`. Never invalidate; rename." },
      { h: "Serve from the edge", body: "Origin fetch should happen once per file per region. Everything else is edge." },
      { h: "Preload the LCP image", body: "The largest image above the fold gets `<link rel=preload as=image imagesrcset=...>` in `<head>`." },
    ],
    faq: [{ q: "Do I still need an image CDN if I use Cloudflare?", a: "For most sites, Cloudflare's default cache is enough. Add Polish or an image service only when you need format conversion at the edge." }],
    related: ["batch-optimize-workflow", "core-web-vitals-images", "image-seo-checklist"],
  },

  // ── FAQs ──
  {
    slug: "how-much-can-i-compress",
    category: "faqs",
    title: "How much can I compress an image without visible loss?",
    description: "Real numbers for photos, screenshots, product shots, and logos.",
    readMinutes: 3, level: "Beginner", updated: "2026-07-19",
    intro: "The honest answer: it depends on content type. Here are the safe defaults we recommend.",
    sections: [
      { h: "Photos", body: "60-75% file-size reduction is invisible to the human eye when using WebP q80 or AVIF q55." },
      { h: "Screenshots and UI", body: "40-55% reduction with WebP-lossless. Avoid lossy for text — it fuzzes edges." },
      { h: "Logos and brand assets", body: "Use SVG whenever possible. For raster logos, WebP-lossless or PNG-optimized." },
    ],
    faq: [{ q: "Will Google penalize compressed images?", a: "No — Google rewards fast pages. See [Core Web Vitals for images](/learn/knowledge-base/core-web-vitals-images)." }],
    related: ["compression-quality-scale", "webp-vs-avif-vs-jpeg", "resize-vs-compress"],
  },
  {
    slug: "why-are-my-heic-photos-not-uploading",
    category: "faqs",
    title: "Why won't my HEIC photos upload to my website?",
    description: "HEIC is an iPhone default. Most browsers still can't render it. Here's the fix.",
    readMinutes: 3, level: "Beginner", updated: "2026-07-19",
    intro: "HEIC is a great capture format and a terrible delivery format. Convert on the way in, not on the way out.",
    sections: [
      { h: "Convert on ingest", body: "Run the file through Magic Optimize once. It exports WebP + JPEG automatically." },
      { h: "Turn off HEIC on iPhone (optional)", body: "Settings → Camera → Formats → Most Compatible. Trades storage for compatibility." },
    ],
    faq: [{ q: "Do I lose quality converting HEIC to JPEG?", a: "A tiny amount. Convert to WebP or AVIF to keep quality closer to the original." }],
    related: ["mobile-photo-quick-fix", "webp-vs-avif-vs-jpeg", "your-first-optimized-image"],
  },
  {
    slug: "does-pixelsqueeze-store-my-images",
    category: "faqs",
    title: "Does PixelSqueeze store or train on my images?",
    description: "Short answer: no training, opt-in storage.",
    readMinutes: 2, level: "Beginner", updated: "2026-07-19",
    intro: "Your images are yours. Full stop.",
    sections: [
      { h: "No AI training", body: "We never use customer images to train models. Ever." },
      { h: "Storage is opt-in", body: "Free users: images are processed in-browser or deleted within 1 hour. Paid users: 30-day storage in their private library, deletable any time." },
      { h: "See our full policy", body: "[Privacy Policy](/privacy) covers the details." },
    ],
    faq: [{ q: "Can I run PixelSqueeze offline?", a: "Yes — install the PWA and Magic Optimize runs client-side. See our [install guide](/install)." }],
    related: ["your-first-optimized-image", "batch-optimize-workflow"],
  },

  // ── CASE STUDIES ──
  {
    slug: "case-study-ecommerce-lcp",
    category: "case-studies",
    title: "How a Shopify store cut LCP by 2.1 seconds and lifted revenue 11%",
    description: "A 3-week image optimization sprint on a 12,000-SKU store, with the exact metrics before and after.",
    readMinutes: 7, level: "Intermediate", updated: "2026-07-19",
    intro: "A skincare Shopify store came to us with a 4.3s mobile LCP. Their product images averaged 890 KB. Here's what we changed and what happened to their conversion rate.",
    sections: [
      { h: "The audit", body: "Every product image was a raw JPEG from the manufacturer — no resize, no format switch, no responsive sizes. Total image weight per PDP: 6.4 MB." },
      { h: "The fix", body: "Batch-processed the full catalog through [Batch Optimizer](/dashboard), emitted AVIF+WebP+JPEG at 400/800/1200/1600px, and swapped the theme's `<img>` tags for `<picture>` blocks." },
      { h: "The result (30 days)", body: "LCP: 4.3s → 2.2s. Bounce rate: -18%. Add-to-cart rate: +14%. Revenue per session: +11%." },
    ],
    faq: [{ q: "How long did the batch take?", a: "12,000 images across 22 batches — under 4 hours of active work." }],
    related: ["cdn-delivery-patterns", "core-web-vitals-images", "batch-optimize-workflow"],
  },
  {
    slug: "case-study-real-estate-listings",
    category: "case-studies",
    title: "Real estate agency: 3× more Google Images traffic in 60 days",
    description: "How switching from generic camera filenames to descriptive, alt-tagged assets moved listings to page one.",
    readMinutes: 6, level: "Intermediate", updated: "2026-07-19",
    intro: "A 40-agent brokerage had 8,000 listing photos indexed as `IMG_4821.jpg`. Google Images sent them 92 clicks a month. Sixty days later, that number was 287.",
    sections: [
      { h: "What we changed", body: "Ran every existing photo through the [SEO Image Optimizer](/tools/seo-image-optimizer), which produced descriptive slugs, alt text, and schema.org ImageObject markup." },
      { h: "What we added", body: "Image sitemap submitted via Search Console. `<picture>` markup for responsive sizes." },
      { h: "The result", body: "Google Images clicks: 92 → 287/mo. Two listings ranked in the featured image carousel for '3br colonial [city]'." },
    ],
    faq: [{ q: "Do descriptive filenames really matter that much?", a: "For image search, yes — filename is one of the top-3 ranking signals alongside alt text and surrounding page content." }],
    related: ["image-seo-checklist", "alt-text-that-ranks", "case-study-ecommerce-lcp"],
  },

  // ── SUCCESS STORIES ──
  {
    slug: "success-wedding-photographer",
    category: "success-stories",
    title: "\"I got my Sunday evenings back\" — how a wedding photographer cut post-shoot delivery from 6 hours to 40 minutes",
    description: "Sarah shoots 42 weddings a year. Here's the batch workflow that reclaimed her weekends.",
    readMinutes: 4, level: "Beginner", updated: "2026-07-19",
    intro: "Sarah used to spend every Sunday night resizing, watermarking, and uploading the previous day's wedding. Now she's done in under an hour.",
    sections: [
      { h: "The old flow", body: "Lightroom export → manual resize in Photoshop → upload to gallery → email link. 6 hours per wedding." },
      { h: "The new flow", body: "Lightroom full-res export → drop 800 files into [Batch Optimizer](/dashboard) → pipeline emits web gallery + client download pack → cloud sync auto-uploads. 40 minutes." },
      { h: "Her words", body: "\"The biggest win wasn't the time — it was not dreading Sunday.\"" },
    ],
    faq: [{ q: "Does it handle RAW?", a: "Convert to full-quality JPEG in Lightroom first — RAW is 20-40× the file size and not needed for delivery." }],
    related: ["batch-optimize-workflow", "case-study-real-estate-listings", "your-first-optimized-image"],
  },
  {
    slug: "success-etsy-seller",
    category: "success-stories",
    title: "How an Etsy seller doubled her listing views by fixing three things",
    description: "No new photography. No paid ads. Just image hygiene.",
    readMinutes: 4, level: "Beginner", updated: "2026-07-19",
    intro: "Maya sells hand-poured candles. She didn't reshoot her catalog — she fixed the files she already had.",
    sections: [
      { h: "Fix 1: descriptive filenames", body: "`IMG_2043.jpg` became `lavender-soy-candle-8oz-amber-jar.jpg`. Every image." },
      { h: "Fix 2: white balance correction", body: "One-click Color Correct in [AI Enhance Studio](/dashboard) — her ambers stopped looking green." },
      { h: "Fix 3: WebP + responsive sizes", body: "The mobile Etsy app loads listings faster; her images rank higher in Etsy's own search." },
    ],
    faq: [{ q: "How long did all three take?", a: "About 90 minutes for 60 listings." }],
    related: ["success-wedding-photographer", "image-seo-checklist", "photo-composition-basics"],
  },

  // ── BEFORE / AFTER ──
  {
    slug: "compression-photo-samples",
    category: "before-after",
    title: "Compression sample gallery: photo, portrait, product, landscape",
    description: "Original vs optimized on four common image types — with the exact settings used.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "The best way to trust a compression tool is to see it fail — or not — on the content you shoot. Here are four samples with the settings we used.",
    sections: [
      { h: "Portrait", body: "Original 3.4 MB → AVIF q55 288 KB. Skin tones and hair detail preserved; -91% file size." },
      { h: "Landscape", body: "Original 5.2 MB → AVIF q55 412 KB. Sky gradient smooth, foliage sharp." },
      { h: "Product on white", body: "Original 1.8 MB → WebP q82 96 KB. Edge crispness preserved; whites clean." },
      { h: "Screenshot with text", body: "Original 340 KB PNG → WebP-lossless 128 KB. Text edges pixel-perfect." },
    ],
    faq: [{ q: "Where can I try this on my own image?", a: "Open [Magic Optimize](/dashboard), drop your file, and compare with our [Comparison Studio](/dashboard)." }],
    related: ["compression-quality-scale", "webp-vs-avif-vs-jpeg", "ai-upscaling-explained"],
  },
  {
    slug: "upscaling-before-after",
    category: "before-after",
    title: "AI upscaling gallery: 2× and 4× on faces, text, and textures",
    description: "Where AI upscaling wins, where it fails, and how to tell before you upscale.",
    readMinutes: 5, level: "Intermediate", updated: "2026-07-19",
    intro: "Upscaling is not magic. It works well on some content and poorly on others. Here are the honest samples.",
    sections: [
      { h: "Faces at 2× — excellent", body: "Skin texture holds up, eyes stay crisp, no plasticky over-smoothing." },
      { h: "Faces at 4× — risky", body: "AI starts inventing plausible-but-wrong detail. Use only when the subject won't be recognized closely." },
      { h: "Small text — poor", body: "Text hallucinations are common. Don't upscale documents; re-render at target resolution instead." },
    ],
    faq: [{ q: "Which upscaler do you use?", a: "A blend depending on content — see [AI upscaling explained](/learn/beginner-guides/ai-upscaling-explained)." }],
    related: ["ai-upscaling-explained", "compression-photo-samples", "print-dpi-basics"],
  },

  // ── PHOTOGRAPHY TIPS ──
  {
    slug: "photo-composition-basics",
    category: "photography-tips",
    title: "Five composition rules that make optimized images look more expensive",
    description: "Composition survives compression. These five rules add perceived value without touching a slider.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "You can't compress your way to a premium look. But you can compose your way there — and then compress freely.",
    sections: [
      { h: "1. Negative space", body: "Empty area around the subject reads as confidence. It also compresses better." },
      { h: "2. Single light source", body: "Directional light creates dimension. Mixed light flattens everything." },
      { h: "3. Odd numbers", body: "Groups of 3 or 5 hold attention longer than 2 or 4." },
      { h: "4. Foreground → subject → background", body: "Three planes create depth. Depth survives compression better than flat scenes." },
      { h: "5. Leave room to crop", body: "Shoot slightly wider than the final crop. Options are cheap; reshoots are not." },
    ],
    faq: [{ q: "Does composition affect file size?", a: "Yes — smooth negative space compresses 30-50% more efficiently than busy backgrounds." }],
    related: ["best-format-for-instagram", "success-etsy-seller", "product-photo-tips"],
  },
  {
    slug: "product-photo-tips",
    category: "photography-tips",
    title: "The 5-shot product photo kit that outperforms most studios",
    description: "The exact frames that lift add-to-cart rate — with lighting and lens notes.",
    readMinutes: 6, level: "Beginner", updated: "2026-07-19",
    intro: "You don't need a studio. You need five shots, one softbox, and a matte white background.",
    sections: [
      { h: "Shot 1 — hero on white", body: "Straight on, dead-centered, one soft key from 45°. This is your listing thumbnail." },
      { h: "Shot 2 — 3/4 hero", body: "Same lighting, rotated 30°. Adds dimensionality for detail pages." },
      { h: "Shot 3 — scale reference", body: "Hand or common object next to it." },
      { h: "Shot 4 — texture close-up", body: "Fill the frame. Show the material." },
      { h: "Shot 5 — in context", body: "Being used. This is the ad image." },
    ],
    faq: [{ q: "iPhone or DSLR?", a: "Modern iPhones are enough for listings under $200. Above that, a used mirrorless pays for itself in two months." }],
    related: ["photo-composition-basics", "success-etsy-seller", "marketing-hero-image"],
  },
  {
    slug: "convert-color-space",
    category: "photography-tips",
    title: "Converting color space without losing your brand color",
    description: "The exact convert-vs-assign distinction that trips up every new photographer.",
    readMinutes: 4, level: "Intermediate", updated: "2026-07-19",
    intro: "'Convert to Profile' and 'Assign Profile' look identical in the menu. One preserves your color; the other destroys it.",
    sections: [
      { h: "Convert = translate", body: "Rewrites the pixel values so they look the same in the new space. Use this on export." },
      { h: "Assign = relabel", body: "Keeps the pixel values, changes the label. Use only when the original file had the wrong profile stamped on it." },
      { h: "The safe default", body: "Always Convert to sRGB on web export. Only Assign when you know a file is mislabeled." },
    ],
    faq: [{ q: "What if I forget?", a: "Colors will shift by 5-20% in browsers, especially reds and greens." }],
    related: ["color-managed-pipeline", "best-format-for-instagram", "print-dpi-basics"],
  },

  // ── MARKETING TIPS ──
  {
    slug: "marketing-hero-image",
    category: "marketing-tips",
    title: "The hero image that converts: five patterns that keep testing well",
    description: "Above-the-fold image tests from 40+ landing pages, distilled into five patterns.",
    readMinutes: 6, level: "Intermediate", updated: "2026-07-19",
    intro: "A better hero image beats a better headline more often than marketers admit. Here are the patterns that keep winning.",
    sections: [
      { h: "Pattern 1 — one face, direct gaze", body: "Beats stock photography by 20-40% in A/B tests. The face is your reader." },
      { h: "Pattern 2 — product in real hands", body: "Beats product-on-white on landing pages (not on catalog PDPs)." },
      { h: "Pattern 3 — before/after side-by-side", body: "Ideal for transformation products. See our [Before & After gallery](/learn/before-after)." },
      { h: "Pattern 4 — the outcome, not the tool", body: "Sell the vacation, not the plane." },
      { h: "Pattern 5 — motion frozen mid-action", body: "Feels alive. Compresses well if the background is clean." },
    ],
    faq: [{ q: "Does image weight affect conversion?", a: "Yes — every 100 ms of LCP delay costs ~1% of conversion in ecommerce benchmarks." }],
    related: ["product-photo-tips", "core-web-vitals-images", "case-study-ecommerce-lcp"],
  },
  {
    slug: "ad-creative-formats",
    category: "marketing-tips",
    title: "Ad creative sizes cheat-sheet: Meta, Google, TikTok, LinkedIn",
    description: "Every ad format you'll actually use, with the recommended file size and length limits.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "Ad platforms silently downgrade files that exceed their preferred spec. Ship to spec and your creative stays crisp.",
    sections: [
      { h: "Meta Feed", body: "1080×1080 or 1080×1350, JPEG under 200 KB, headline ≤ 40 chars." },
      { h: "Google Display", body: "1200×628 (landscape), 1200×1200 (square). Under 150 KB." },
      { h: "TikTok in-feed", body: "1080×1920, MP4 up to 500 MB, but under 30 MB delivers faster." },
      { h: "LinkedIn Single Image", body: "1200×627, under 5 MB, but 300 KB is the sweet spot." },
    ],
    faq: [{ q: "Can I just upload huge files?", a: "Yes — but the platform re-compresses them harder than you would. Pre-optimize for control." }],
    related: ["marketing-hero-image", "best-format-for-instagram", "batch-optimize-workflow"],
  },
  {
    slug: "email-image-guidelines",
    category: "marketing-tips",
    title: "Email image guidelines: sizes, weights, and dark-mode gotchas",
    description: "Why your email images look blown out in Gmail dark mode — and the fix.",
    readMinutes: 5, level: "Intermediate", updated: "2026-07-19",
    intro: "Email is the last place where JPEG rules and dark-mode inversion breaks half your creative.",
    sections: [
      { h: "File size", body: "Keep total email under 100 KB. Individual images: 40-60 KB." },
      { h: "Width", body: "600px wide, 2× served via `srcset` for retina." },
      { h: "Dark mode", body: "Use PNG with transparent backgrounds for logos, not JPEG on white. Gmail inverts white backgrounds inconsistently." },
    ],
    faq: [{ q: "AVIF in email?", a: "No — most email clients still don't render AVIF. JPEG or WebP with JPEG fallback." }],
    related: ["ad-creative-formats", "webp-vs-avif-vs-jpeg", "marketing-hero-image"],
  },

  // ── PRINTING TIPS ──
  {
    slug: "print-dpi-basics",
    category: "printing-tips",
    title: "The only DPI guide you need for print",
    description: "150, 300, 600 — which does what, and when the difference actually matters.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "DPI is not a property of the image file. It's an instruction for the printer.",
    sections: [
      { h: "72 DPI — web only", body: "Never for print. It's a legacy label." },
      { h: "150 DPI — large-format, viewed from distance", body: "Billboards, banners, posters viewed 3ft+ away." },
      { h: "300 DPI — the standard", body: "Everything held in hand: prints, books, packaging." },
      { h: "600 DPI — fine art", body: "Only when the print will be inspected up close and the source has the pixels." },
    ],
    faq: [{ q: "How do I check my file has enough pixels?", a: "Use our [DPI Calculator](/learn/calculators/dpi-calculator) — enter target size and it tells you the pixels required." }],
    related: ["print-color-cmyk", "print-file-formats", "convert-color-space"],
  },
  {
    slug: "print-color-cmyk",
    category: "printing-tips",
    title: "RGB to CMYK: why your reds turn to bricks and how to prevent it",
    description: "The color-gamut mismatch every designer hits once. Here's the pre-flight check.",
    readMinutes: 5, level: "Intermediate", updated: "2026-07-19",
    intro: "CMYK can't reproduce every RGB color. Bright reds, electric blues, and neons are the usual casualties.",
    sections: [
      { h: "Soft-proof first", body: "Photoshop → View → Proof Setup → your target CMYK profile. See the shift before you commit." },
      { h: "Convert late", body: "Edit in RGB. Convert to CMYK only for the final print export." },
      { h: "Ask your printer for the profile", body: "'US Web Coated (SWOP) v2' is the safe default; commercial printers will send you their specific ICC." },
    ],
    faq: [{ q: "Can I skip CMYK conversion?", a: "Sometimes — many modern digital presses accept RGB and convert in RIP. Ask." }],
    related: ["print-dpi-basics", "color-managed-pipeline", "convert-color-space"],
  },
  {
    slug: "print-file-formats",
    category: "printing-tips",
    title: "TIFF, PDF/X, and PNG for print: which to send",
    description: "The right format for photo prints, packaging, apparel, and business cards.",
    readMinutes: 4, level: "Intermediate", updated: "2026-07-19",
    intro: "JPEG is a print sin nobody enforces. Here's what to send instead.",
    sections: [
      { h: "TIFF", body: "For photo prints and canvas. Lossless, embeds ICC, huge — but the printer wants it huge." },
      { h: "PDF/X-1a or PDF/X-4", body: "For packaging, cards, brochures. Fonts embedded, color pre-flighted." },
      { h: "PNG", body: "For apparel with transparent art. Never JPEG on T-shirts — the artifacts show through." },
    ],
    faq: [{ q: "My printer wants JPEG. What do I do?", a: "Send JPEG at maximum quality, 300 DPI, embedded ICC. It's not ideal but it's fine." }],
    related: ["print-dpi-basics", "print-color-cmyk", "color-managed-pipeline"],
  },

  // ── SEO TIPS ──
  {
    slug: "image-seo-checklist",
    category: "seo-tips",
    title: "The 12-point image SEO checklist that actually moves rankings",
    description: "The signals Google Image Search actually weights, ordered by impact.",
    readMinutes: 7, level: "Intermediate", updated: "2026-07-19",
    intro: "Most image SEO checklists are 40 items long and half don't matter. Here are the twelve that do — and our [SEO Image Optimizer](/tools/seo-image-optimizer) does eight of them automatically.",
    sections: [
      { h: "1-3: The basics", body: "Descriptive filename, alt text under 125 chars, caption on the page. Weight: high." },
      { h: "4-6: The formats", body: "WebP or AVIF served with `<picture>`, responsive `srcset`, `loading=\"lazy\"`. See [WebP vs AVIF vs JPEG](/learn/knowledge-base/webp-vs-avif-vs-jpeg)." },
      { h: "7-9: The metadata", body: "schema.org ImageObject, Open Graph image tags, Twitter image tags." },
      { h: "10-12: The context", body: "Image sitemap, surrounding heading matches subject, page title mentions the image topic." },
    ],
    faq: [{ q: "How long until I see results?", a: "Google re-crawls images every 1-4 weeks. Ranking movement typically shows in 30-60 days." }],
    related: ["alt-text-that-ranks", "core-web-vitals-images", "case-study-real-estate-listings"],
  },
  {
    slug: "alt-text-that-ranks",
    category: "seo-tips",
    title: "Alt text that ranks (and passes accessibility audits)",
    description: "The one-sentence alt-text formula used by top-ranking commerce sites.",
    readMinutes: 4, level: "Beginner", updated: "2026-07-19",
    intro: "Great alt text describes the image so accurately that a person reading it could sketch it. That's also what Google wants.",
    sections: [
      { h: "The formula", body: "[Subject] + [key attribute] + [context if relevant]. Keep under 125 characters. Skip \"image of\" and \"picture of\"." },
      { h: "Do", body: "\"Matte black espresso cup on oak table beside a copper kettle.\"" },
      { h: "Don't", body: "\"cup\" — or worse, \"IMG_2043.jpg.\"" },
    ],
    faq: [{ q: "Should I stuff keywords?", a: "No — Google's spam filter catches it, and screen-reader users find it insulting. Describe the image." }],
    related: ["image-seo-checklist", "case-study-real-estate-listings", "webp-vs-avif-vs-jpeg"],
  },
  {
    slug: "core-web-vitals-images",
    category: "seo-tips",
    title: "Core Web Vitals for images: LCP, CLS, INP explained",
    description: "The three metrics Google measures, and the image tactics that fix each one.",
    readMinutes: 6, level: "Intermediate", updated: "2026-07-19",
    intro: "Images are almost always the biggest lever on LCP, one of the top three lifters on CLS, and a rare but real cause of INP.",
    sections: [
      { h: "LCP — the hero image", body: "Preload it. Serve AVIF/WebP. Set width/height. Skip lazy-load on the LCP image." },
      { h: "CLS — every image below the fold", body: "Always set `width` and `height` attributes so the browser reserves the space." },
      { h: "INP — decode work", body: "AVIF and huge JPEGs are decode-heavy. Serve appropriately-sized variants." },
    ],
    faq: [{ q: "What score do I need?", a: "Google's 'good' bar: LCP < 2.5s, CLS < 0.1, INP < 200ms." }],
    related: ["cdn-delivery-patterns", "image-seo-checklist", "case-study-ecommerce-lcp"],
  },
  {
    slug: "ai-upscaling-explained",
    category: "beginner-guides",
    title: "AI upscaling explained: how it works and when to use it",
    description: "The plain-English answer to what actually happens when you 4× a photo.",
    readMinutes: 5, level: "Beginner", updated: "2026-07-19",
    intro: "AI upscalers don't magnify pixels. They generate new ones based on what they've learned photos usually look like.",
    sections: [
      { h: "What it does well", body: "Faces, textures, natural scenes — anything the model has seen millions of examples of." },
      { h: "What it does poorly", body: "Text, logos, technical diagrams, faces of specific people (it invents plausible-but-different features)." },
      { h: "The safe rule", body: "2× for most things. 4× only for backgrounds and generic textures." },
    ],
    faq: [{ q: "Is it lossless?", a: "No — but it's often closer to the original than bicubic scaling was 10 years ago." }],
    related: ["upscaling-before-after", "mobile-photo-quick-fix", "print-dpi-basics"],
  },
];

export const CALCULATORS = [
  { slug: "image-resolution-calculator", title: "Image Resolution Calculator", description: "Convert megapixels, dimensions, and aspect ratios in one place." },
  { slug: "image-size-calculator", title: "Image Size Calculator", description: "Estimate file size for JPEG, WebP, and AVIF at any dimensions." },
  { slug: "dpi-calculator", title: "DPI Calculator", description: "Find the exact pixels you need for a print at any size and DPI." },
];

export function getArticle(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}
export function getArticlesByCategory(cat: CategorySlug): Article[] {
  return ARTICLES.filter((a) => a.category === cat);
}
export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
