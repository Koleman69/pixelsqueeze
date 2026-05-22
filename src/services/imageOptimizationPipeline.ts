/**
 * ImageOptimizationPipeline
 * 
 * Unified engine that processes every image through a consistent pipeline:
 * 1. Detect content type (photo, graphic, screenshot, etc.)
 * 2. Select optimal format (AVIF > WebP > JPEG)
 * 3. Smart compression with quality targeting
 * 4. Resize based on goal preset
 * 5. Remove EXIF metadata (via canvas re-encoding)
 * 6. Generate SEO filename
 * 7. Generate alt text
 * 8. Store performance metrics
 */

import { supabase } from '@/integrations/supabase/client';

// ─── Types ──────────────────────────────────────────────────────────────────

export type ContentType = 'photo' | 'graphic' | 'screenshot' | 'icon' | 'text-heavy' | 'unknown';

export type OutputFormat = 'avif' | 'webp' | 'jpeg' | 'png';

export type GoalPreset =
  | 'web'
  | 'social'
  | 'email'
  | 'print'
  | 'thumbnail'
  | 'ecommerce'
  | 'custom'
  | 'instagram'
  | 'tiktok'
  | 'amazon'
  | 'airbnb'
  | 'hotel'
  | 'linkedin';

export interface PipelineOptions {
  /** Target goal preset */
  goal: GoalPreset;
  /** Force a specific output format (auto-detect if omitted) */
  forceFormat?: OutputFormat;
  /** Quality 1-100 (auto-determined if omitted) */
  quality?: number;
  /** Max dimension for the longest side */
  maxDimension?: number;
  /** Strip EXIF metadata (default: true) */
  stripMetadata?: boolean;
  /** Generate SEO filename (default: true) */
  seoRename?: boolean;
  /** SEO filename prefix */
  seoPrefix?: string;
  /** Generate alt text via AI (default: false — requires API call) */
  generateAltText?: boolean;
  /** Store metrics to Supabase (default: true) */
  storeMetrics?: boolean;
  /** User ID for metrics storage */
  userId?: string;
}

export interface PipelineResult {
  blob: Blob;
  url: string;
  contentType: ContentType;
  detectedFormat: OutputFormat;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  seoFileName: string;
  altText: string;
  format: OutputFormat;
  processingTimeMs: number;
  metadataStripped: boolean;
  goalPreset: GoalPreset;
}

// ─── Goal Preset Configs ────────────────────────────────────────────────────

export interface GoalConfig {
  maxDimension: number;
  quality: number;
  preferredFormats: OutputFormat[];
  /** Apply unsharp-mask sharpening after resize */
  sharpenAfterResize?: boolean;
  /** Sharpen strength 0-1 (default 0.3) */
  sharpenAmount?: number;
  /** Force progressive JPEG encoding order */
  progressive?: boolean;
  /** Normalize background to white (for product shots) */
  whiteBackgroundNormalize?: boolean;
  /** Max file size in KB — re-encode at lower quality until met */
  maxFileSizeKB?: number;
  /** Preserve ICC / color profile data */
  preserveColorProfile?: boolean;
  /** Generate responsive srcset variants */
  responsiveVariants?: number[];
  /** Square crop to exact dimensions */
  squareCrop?: boolean;
  /** Fixed output dimensions (overrides maxDimension) */
  fixedDimensions?: { width: number; height: number };
}

const GOAL_PRESETS: Record<GoalPreset, GoalConfig> = {
  web: {
    maxDimension: 1920,
    quality: 82,
    preferredFormats: ['avif', 'webp', 'jpeg'],
    responsiveVariants: [640, 1024, 1920],
    sharpenAfterResize: false,
    progressive: true,
  },
  social: {
    maxDimension: 1200,
    quality: 85,
    preferredFormats: ['webp', 'jpeg'],
    sharpenAfterResize: true,
    sharpenAmount: 0.35,
    preserveColorProfile: true,
  },
  email: {
    maxDimension: 800,
    quality: 70,
    preferredFormats: ['jpeg'],
    progressive: true,
    maxFileSizeKB: 500,
    sharpenAfterResize: false,
  },
  print: {
    maxDimension: 4096,
    quality: 95,
    preferredFormats: ['png', 'jpeg'],
    preserveColorProfile: true,
    sharpenAfterResize: false,
  },
  thumbnail: {
    maxDimension: 400,
    quality: 78,
    preferredFormats: ['webp', 'jpeg'],
    sharpenAfterResize: true,
    sharpenAmount: 0.4,
  },
  ecommerce: {
    maxDimension: 2048,
    quality: 85,
    preferredFormats: ['webp', 'jpeg'],
    whiteBackgroundNormalize: true,
    squareCrop: true,
    fixedDimensions: { width: 2048, height: 2048 },
    sharpenAfterResize: true,
    sharpenAmount: 0.25,
  },
  custom: {
    maxDimension: 1920,
    quality: 85,
    preferredFormats: ['webp', 'jpeg'],
  },
};

// ─── Content Detection ──────────────────────────────────────────────────────

function detectContentType(imageData: ImageData): ContentType {
  const { data, width, height } = imageData;
  const totalPixels = width * height;
  
  // Sample pixels for analysis (every 10th pixel for speed)
  let uniqueColors = new Set<string>();
  let edgeCount = 0;
  let flatCount = 0;
  let prevR = 0, prevG = 0, prevB = 0;
  const sampleStep = Math.max(1, Math.floor(totalPixels / 5000));

  for (let i = 0; i < data.length; i += sampleStep * 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    
    // Quantize to reduce noise in color counting
    const qr = Math.floor(r / 16) * 16;
    const qg = Math.floor(g / 16) * 16;
    const qb = Math.floor(b / 16) * 16;
    uniqueColors.add(`${qr},${qg},${qb}`);

    // Edge detection via gradient
    const diff = Math.abs(r - prevR) + Math.abs(g - prevG) + Math.abs(b - prevB);
    if (diff > 80) edgeCount++;
    else if (diff < 10) flatCount++;
    prevR = r; prevG = g; prevB = b;
  }

  const sampledPixels = Math.ceil(totalPixels / sampleStep);
  const colorRatio = uniqueColors.size / Math.min(sampledPixels, 5000);
  const edgeRatio = edgeCount / sampledPixels;
  const flatRatio = flatCount / sampledPixels;

  // Small dimensions → icon
  if (width <= 128 && height <= 128) return 'icon';

  // Very few colors with sharp edges → graphic/vector
  if (colorRatio < 0.05 && flatRatio > 0.7) return 'graphic';

  // Many flat areas with some edges → screenshot
  if (flatRatio > 0.5 && edgeRatio > 0.05 && colorRatio < 0.15) return 'screenshot';

  // High edge ratio with few flat areas → text-heavy
  if (edgeRatio > 0.15 && flatRatio < 0.3) return 'text-heavy';

  // Rich color diversity → photo
  if (colorRatio > 0.1) return 'photo';

  return 'unknown';
}

// ─── Format Selection ───────────────────────────────────────────────────────

function selectOptimalFormat(
  contentType: ContentType,
  preferredFormats: OutputFormat[],
  forceFormat?: OutputFormat
): OutputFormat {
  if (forceFormat) return forceFormat;

  // Check browser support
  const supportsAvif = isFormatSupported('avif');
  const supportsWebp = isFormatSupported('webp');

  const formatPriority: Record<ContentType, OutputFormat[]> = {
    photo: ['avif', 'webp', 'jpeg'],
    graphic: ['webp', 'png', 'avif'],
    screenshot: ['webp', 'png', 'avif'],
    icon: ['png', 'webp'],
    'text-heavy': ['png', 'webp'],
    unknown: ['webp', 'jpeg'],
  };

  const priorities = formatPriority[contentType];
  
  for (const format of priorities) {
    if (!preferredFormats.includes(format)) continue;
    if (format === 'avif' && !supportsAvif) continue;
    if (format === 'webp' && !supportsWebp) continue;
    return format;
  }

  // Fallback
  return supportsWebp ? 'webp' : 'jpeg';
}

let _formatSupportCache: Record<string, boolean> = {};

function isFormatSupported(format: string): boolean {
  if (format in _formatSupportCache) return _formatSupportCache[format];
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const dataUrl = canvas.toDataURL(`image/${format}`);
  const supported = dataUrl.startsWith(`data:image/${format}`);
  _formatSupportCache[format] = supported;
  return supported;
}

// ─── Quality Adjustment ─────────────────────────────────────────────────────

function adjustQualityForContent(baseQuality: number, contentType: ContentType): number {
  const adjustments: Record<ContentType, number> = {
    photo: 0,
    graphic: -5,       // Graphics compress well at lower quality
    screenshot: -3,
    icon: +5,          // Icons need higher quality for sharp edges
    'text-heavy': +5,  // Text needs clarity
    unknown: 0,
  };
  return Math.min(100, Math.max(10, baseQuality + (adjustments[contentType] || 0)));
}

// ─── Resize ─────────────────────────────────────────────────────────────────

function calculateResizeDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }

  const aspectRatio = width / height;
  if (width > height) {
    return { width: maxDimension, height: Math.round(maxDimension / aspectRatio) };
  } else {
    return { width: Math.round(maxDimension * aspectRatio), height: maxDimension };
  }
}

// ─── SEO Filename ───────────────────────────────────────────────────────────

function generateSeoFileName(
  originalName: string,
  contentType: ContentType,
  prefix?: string,
  index?: number
): string {
  // Remove extension
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  // Clean: lowercase, replace non-alphanumeric with hyphens
  let seoName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  // Remove common non-descriptive patterns
  seoName = seoName
    .replace(/^img[-_]?/i, '')
    .replace(/^dsc[-_]?/i, '')
    .replace(/^screenshot[-_]?/i, '')
    .replace(/^image[-_]?/i, '')
    .replace(/^\d{8,}[-_]?/, '') // Remove long numeric prefixes (timestamps)
    .replace(/^-+|-+$/g, '');

  // Add prefix
  if (prefix?.trim()) {
    const cleanPrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    seoName = seoName ? `${cleanPrefix}-${seoName}` : cleanPrefix;
  }

  // Add index if provided
  if (index !== undefined) {
    seoName = `${seoName}-${String(index + 1).padStart(3, '0')}`;
  }

  // Fallback if empty
  if (!seoName) {
    seoName = `${contentType}-image${index !== undefined ? `-${String(index + 1).padStart(3, '0')}` : ''}`;
  }

  // Truncate
  if (seoName.length > 80) seoName = seoName.substring(0, 80).replace(/-+$/, '');

  return seoName;
}

// ─── Alt Text Generation ────────────────────────────────────────────────────

async function generateAltText(file: File): Promise<string> {
  try {
    const base64 = await fileToBase64(file);
    const { data, error } = await supabase.functions.invoke('analyze-image', {
      body: {
        image: base64,
        prompt: 'Generate a concise, descriptive alt text for this image in under 125 characters. Focus on the main subject, action, and context. Do not start with "Image of" or "Picture of". Return ONLY the alt text, nothing else.',
      },
    });
    if (error || !data?.analysis) {
      return deriveAltTextFromFileName(file.name);
    }
    // Clean up the response
    let alt = (data.analysis as string).trim();
    if (alt.length > 125) alt = alt.substring(0, 122) + '...';
    return alt;
  } catch {
    return deriveAltTextFromFileName(file.name);
  }
}

function deriveAltTextFromFileName(fileName: string): string {
  return fileName
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || 'Optimized image';
}

// ─── Sharpening (Unsharp Mask) ──────────────────────────────────────────────

function applySharpen(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const copy = new Uint8ClampedArray(data);
  
  // Simple 3×3 unsharp mask kernel
  const w4 = width * 4;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const blur = (
          copy[idx - w4 - 4 + c] + copy[idx - w4 + c] + copy[idx - w4 + 4 + c] +
          copy[idx - 4 + c]      +                        copy[idx + 4 + c] +
          copy[idx + w4 - 4 + c] + copy[idx + w4 + c] + copy[idx + w4 + 4 + c]
        ) / 8;
        data[idx + c] = Math.min(255, Math.max(0, Math.round(center + (center - blur) * amount)));
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

// ─── Canvas Encode Helper ───────────────────────────────────────────────────

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => b ? resolve(b) : reject(new Error('Failed to encode image')),
      mime,
      quality
    );
  });
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeType(format: OutputFormat): string {
  const mimeTypes: Record<OutputFormat, string> = {
    avif: 'image/avif',
    webp: 'image/webp',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  return mimeTypes[format];
}

function getExtension(format: OutputFormat): string {
  const extensions: Record<OutputFormat, string> = {
    avif: '.avif',
    webp: '.webp',
    jpeg: '.jpg',
    png: '.png',
  };
  return extensions[format];
}

// ─── Main Pipeline ──────────────────────────────────────────────────────────

export async function runOptimizationPipeline(
  file: File,
  options: PipelineOptions,
  index?: number
): Promise<PipelineResult> {
  const startTime = performance.now();
  const goalConfig = GOAL_PRESETS[options.goal];

  // ── Step 0: Load image ──
  const bitmap = await createImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // ── Step 1: Detect content type ──
  // Draw to a small canvas for fast analysis
  const analysisSize = 256;
  const analysisScale = Math.min(analysisSize / originalWidth, analysisSize / originalHeight, 1);
  const analysisW = Math.round(originalWidth * analysisScale);
  const analysisH = Math.round(originalHeight * analysisScale);
  
  const analysisCanvas = document.createElement('canvas');
  analysisCanvas.width = analysisW;
  analysisCanvas.height = analysisH;
  const analysisCtx = analysisCanvas.getContext('2d')!;
  analysisCtx.drawImage(bitmap, 0, 0, analysisW, analysisH);
  const analysisData = analysisCtx.getImageData(0, 0, analysisW, analysisH);
  const contentType = detectContentType(analysisData);

  // ── Step 2: Select optimal format ──
  const detectedFormat = selectOptimalFormat(
    contentType,
    goalConfig.preferredFormats,
    options.forceFormat
  );

  // ── Step 3: Determine quality ──
  const baseQuality = options.quality ?? goalConfig.quality;
  const adjustedQuality = adjustQualityForContent(baseQuality, contentType);

  // ── Step 4: Resize based on goal ──
  const maxDim = options.maxDimension ?? goalConfig.maxDimension;
  const { width: outputWidth, height: outputHeight } = calculateResizeDimensions(
    originalWidth, originalHeight, maxDim
  );

  // ── Step 5: Render to canvas (strips EXIF automatically) ──
  const outputCanvas = document.createElement('canvas');
  const ctx = outputCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Square crop for ecommerce-type goals
  if (goalConfig.squareCrop || goalConfig.fixedDimensions) {
    const targetW = goalConfig.fixedDimensions?.width ?? outputWidth;
    const targetH = goalConfig.fixedDimensions?.height ?? outputHeight;
    outputCanvas.width = targetW;
    outputCanvas.height = targetH;

    // White background fill for product shots
    if (goalConfig.whiteBackgroundNormalize) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, targetW, targetH);
    }

    // Center-fit the image on the canvas
    const scale = Math.min(targetW / originalWidth, targetH / originalHeight);
    const drawW = Math.round(originalWidth * scale);
    const drawH = Math.round(originalHeight * scale);
    const offsetX = Math.round((targetW - drawW) / 2);
    const offsetY = Math.round((targetH - drawH) / 2);
    ctx.drawImage(bitmap, 0, 0, originalWidth, originalHeight, offsetX, offsetY, drawW, drawH);
  } else {
    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;
    ctx.drawImage(bitmap, 0, 0, outputWidth, outputHeight);
  }
  bitmap.close();

  // ── Step 5a: Sharpening (unsharp mask via convolution) ──
  if (goalConfig.sharpenAfterResize) {
    const amount = goalConfig.sharpenAmount ?? 0.3;
    applySharpen(ctx, outputCanvas.width, outputCanvas.height, amount);
  }

  // ── Step 5b: Encode to selected format ──
  const mime = getMimeType(detectedFormat);
  const qualityParam = detectedFormat === 'png' ? undefined : adjustedQuality / 100;
  
  let finalBlob = await canvasToBlob(outputCanvas, mime, qualityParam);
  let finalFormat = detectedFormat;

  // If AVIF/WebP produced a larger file than original, fallback to JPEG
  if (finalBlob.size > file.size && detectedFormat !== 'jpeg') {
    const jpegBlob = await canvasToBlob(outputCanvas, 'image/jpeg', adjustedQuality / 100);
    if (jpegBlob.size < finalBlob.size) {
      finalBlob = jpegBlob;
      finalFormat = 'jpeg';
    }
  }

  // ── Step 5c: Enforce max file size (re-encode at lower quality) ──
  if (goalConfig.maxFileSizeKB) {
    const maxBytes = goalConfig.maxFileSizeKB * 1024;
    let currentQuality = adjustedQuality;
    let attempts = 0;
    while (finalBlob.size > maxBytes && currentQuality > 20 && attempts < 8) {
      currentQuality -= 8;
      attempts++;
      const reducedMime = getMimeType(finalFormat === 'png' ? 'jpeg' : finalFormat);
      if (finalFormat === 'png') finalFormat = 'jpeg';
      finalBlob = await canvasToBlob(outputCanvas, reducedMime, currentQuality / 100);
    }
  }

  // ── Step 6: Generate SEO filename ──
  const seoFileName = (options.seoRename !== false)
    ? generateSeoFileName(file.name, contentType, options.seoPrefix, index) + getExtension(finalFormat)
    : file.name.replace(/\.[^/.]+$/, '') + getExtension(finalFormat);

  // ── Step 7: Generate alt text ──
  let altText = deriveAltTextFromFileName(file.name);
  if (options.generateAltText) {
    altText = await generateAltText(file);
  }

  // ── Step 8: Store performance metrics ──
  const processingTimeMs = Math.round(performance.now() - startTime);
  const compressionRatio = Math.round((1 - finalBlob.size / file.size) * 100);

  if (options.storeMetrics !== false && options.userId) {
    // Fire and forget — don't block the pipeline
    supabase.from('batch_processing_stats').insert({
      user_id: options.userId,
      image_count: 1,
      success_count: 1,
      failed_count: 0,
      total_original_size: file.size,
      total_optimized_size: finalBlob.size,
      total_saved: Math.max(0, file.size - finalBlob.size),
      avg_compression_ratio: Math.max(0, compressionRatio),
      processing_time_ms: processingTimeMs,
      settings: {
        contentType,
        format: finalFormat,
        quality: adjustedQuality,
        goal: options.goal,
        originalDimensions: `${originalWidth}x${originalHeight}`,
        outputDimensions: `${outputWidth}x${outputHeight}`,
      },
    }).then(({ error }) => {
      if (error) console.warn('Failed to store pipeline metrics:', error);
    });
  }

  const url = URL.createObjectURL(finalBlob);

  return {
    blob: finalBlob,
    url,
    contentType,
    detectedFormat,
    originalSize: file.size,
    optimizedSize: finalBlob.size,
    compressionRatio: Math.max(0, compressionRatio),
    originalWidth,
    originalHeight,
    outputWidth,
    outputHeight,
    seoFileName,
    altText,
    format: finalFormat,
    processingTimeMs,
    metadataStripped: options.stripMetadata !== false,
    goalPreset: options.goal,
  };
}

// ─── Batch Pipeline ─────────────────────────────────────────────────────────

export interface BatchPipelineCallbacks {
  onProgress?: (completed: number, total: number, current: PipelineResult | null) => void;
  onError?: (file: File, error: Error) => void;
}

export async function runBatchPipeline(
  files: File[],
  options: PipelineOptions,
  callbacks?: BatchPipelineCallbacks
): Promise<PipelineResult[]> {
  const results: PipelineResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await runOptimizationPipeline(files[i], options, i);
      results.push(result);
      callbacks?.onProgress?.(i + 1, files.length, result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      callbacks?.onError?.(files[i], error);
      callbacks?.onProgress?.(i + 1, files.length, null);
    }

    // Yield to main thread between images to prevent UI freezing
    if (i % 3 === 2) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
}

// ─── Exports ────────────────────────────────────────────────────────────────

export {
  detectContentType,
  selectOptimalFormat,
  adjustQualityForContent,
  calculateResizeDimensions,
  generateSeoFileName,
  generateAltText,
  deriveAltTextFromFileName,
  getMimeType,
  getExtension,
  GOAL_PRESETS,
};
