import { useCallback, useRef, useState, type ChangeEvent, type DragEvent, type ElementType } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  Download,
  RotateCcw,
  Loader2,
  Sparkles,
  Maximize2,
  Wand2,
  Waves,
  Eraser,
  Smile,
  Palette,
  Sun,
  History,
  Share2,
  Printer,
  CheckCircle2,
  Clock,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { cn } from "@/lib/utils";

type EnhancementId =
  | "upscale"
  | "sharpen"
  | "denoise"
  | "bg-remove"
  | "face"
  | "color"
  | "lighting"
  | "restore"
  | "social"
  | "print";

interface Enhancement {
  id: EnhancementId;
  label: string;
  description: string;
  icon: ElementType;
  time: string; // rough seconds
  accent: string; // tailwind gradient
}

const ENHANCEMENTS: Enhancement[] = [
  { id: "upscale", label: "AI Upscale", description: "2× resolution with edge preservation", icon: Maximize2, time: "~4s", accent: "from-blue-500 to-cyan-500" },
  { id: "sharpen", label: "AI Sharpen", description: "Restore crisp detail and clarity", icon: Wand2, time: "~2s", accent: "from-indigo-500 to-purple-500" },
  { id: "denoise", label: "Noise Removal", description: "Remove grain from low-light shots", icon: Waves, time: "~3s", accent: "from-teal-500 to-emerald-500" },
  { id: "bg-remove", label: "Background Removal", description: "Isolate the subject on a transparent canvas", icon: Eraser, time: "~15s", accent: "from-fuchsia-500 to-pink-500" },
  { id: "face", label: "Face Enhancement", description: "Skin, eyes and details refined", icon: Smile, time: "~3s", accent: "from-rose-500 to-orange-500" },
  { id: "color", label: "Color Correction", description: "Auto white-balance and vibrance", icon: Palette, time: "~2s", accent: "from-amber-500 to-yellow-500" },
  { id: "lighting", label: "Lighting Fix", description: "Recover shadows and tame highlights", icon: Sun, time: "~2s", accent: "from-yellow-500 to-orange-500" },
  { id: "restore", label: "Old Photo Restoration", description: "Denoise, sharpen and revive faded tones", icon: History, time: "~5s", accent: "from-stone-500 to-amber-600" },
  { id: "social", label: "Social Optimization", description: "Perfect for Instagram, TikTok & Facebook", icon: Share2, time: "~3s", accent: "from-pink-500 to-purple-500" },
  { id: "print", label: "Print Optimization", description: "300 DPI export, print-ready sharpening", icon: Printer, time: "~4s", accent: "from-slate-500 to-slate-700" },
];

// ─── Image helpers ──────────────────────────────────────────────────────────
async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function drawToImageData(img: HTMLImageElement, scale = 1): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; data: ImageData } {
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);
  const canvas = makeCanvas(w, h);
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);
  return { canvas, ctx, data: ctx.getImageData(0, 0, w, h) };
}

function canvasToBlob(canvas: HTMLCanvasElement, type = "image/png", quality = 0.92): Promise<Blob> {
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), type, quality));
}

// Convolution
function convolve(data: ImageData, kernel: number[]): ImageData {
  const { width: w, height: h, data: src } = data;
  const out = new Uint8ClampedArray(src.length);
  const k = Math.sqrt(kernel.length);
  const half = Math.floor(k / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0, g = 0, b = 0;
      for (let ky = 0; ky < k; ky++) {
        for (let kx = 0; kx < k; kx++) {
          const px = Math.min(w - 1, Math.max(0, x + kx - half));
          const py = Math.min(h - 1, Math.max(0, y + ky - half));
          const off = (py * w + px) * 4;
          const wgt = kernel[ky * k + kx];
          r += src[off] * wgt;
          g += src[off + 1] * wgt;
          b += src[off + 2] * wgt;
        }
      }
      const i = (y * w + x) * 4;
      out[i] = Math.max(0, Math.min(255, r));
      out[i + 1] = Math.max(0, Math.min(255, g));
      out[i + 2] = Math.max(0, Math.min(255, b));
      out[i + 3] = src[i + 3];
    }
  }
  return new ImageData(out, w, h);
}

const SHARPEN_KERNEL = [0, -1, 0, -1, 5, -1, 0, -1, 0];
const SOFT_BLUR = [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9];

function applyColor(data: ImageData, opts: { brightness?: number; contrast?: number; saturation?: number; warmth?: number }): ImageData {
  const { brightness = 0, contrast = 1, saturation = 1, warmth = 0 } = opts;
  const d = new Uint8ClampedArray(data.data);
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], b = d[i + 2];
    // Brightness
    r += brightness; g += brightness; b += brightness;
    // Contrast
    r = (r - 128) * contrast + 128;
    g = (g - 128) * contrast + 128;
    b = (b - 128) * contrast + 128;
    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;
    // Warmth
    r += warmth; b -= warmth;
    d[i] = Math.max(0, Math.min(255, r));
    d[i + 1] = Math.max(0, Math.min(255, g));
    d[i + 2] = Math.max(0, Math.min(255, b));
  }
  return new ImageData(d, data.width, data.height);
}

// Simple auto-levels: stretch luminance to full range
function autoLevels(data: ImageData): ImageData {
  const d = new Uint8ClampedArray(data.data);
  let min = 255, max = 0;
  for (let i = 0; i < d.length; i += 4) {
    const l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    if (l < min) min = l;
    if (l > max) max = l;
  }
  const range = Math.max(1, max - min);
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      d[i + c] = Math.max(0, Math.min(255, ((d[i + c] - min) / range) * 255));
    }
  }
  return new ImageData(d, data.width, data.height);
}

function putData(canvas: HTMLCanvasElement, data: ImageData) {
  const ctx = canvas.getContext("2d")!;
  canvas.width = data.width;
  canvas.height = data.height;
  ctx.putImageData(data, 0, 0);
  return canvas;
}

// ─── Enhancement runner ─────────────────────────────────────────────────────
async function runEnhancement(id: EnhancementId, sourceFile: File): Promise<{ blob: Blob; filename: string; mime: string }> {
  const url = URL.createObjectURL(sourceFile);
  try {
    const img = await loadImage(url);

    let canvas: HTMLCanvasElement;
    let mime = "image/png";
    let quality = 0.92;
    let suffix: string = id;

    switch (id) {
      case "upscale": {
        const { canvas: c, data } = drawToImageData(img, 2);
        canvas = putData(c, convolve(data, SHARPEN_KERNEL));
        mime = "image/jpeg"; quality = 0.94;
        break;
      }
      case "sharpen": {
        const { canvas: c, data } = drawToImageData(img);
        canvas = putData(c, convolve(data, SHARPEN_KERNEL));
        mime = "image/jpeg"; quality = 0.92;
        break;
      }
      case "denoise": {
        const { canvas: c, data } = drawToImageData(img);
        const blurred = convolve(data, SOFT_BLUR);
        // Mild sharpen after blur to keep edges
        canvas = putData(c, convolve(blurred, SHARPEN_KERNEL));
        mime = "image/jpeg"; quality = 0.9;
        break;
      }
      case "bg-remove": {
        const { removeBackground } = await import("@imgly/background-removal");
        const bgBlob = await removeBackground(sourceFile, { output: { format: "image/png" } });
        return { blob: bgBlob, filename: `${sourceFile.name.replace(/\.[^.]+$/, "")}-nobg.png`, mime: "image/png" };
      }
      case "face": {
        const { canvas: c, data } = drawToImageData(img);
        const sharpened = convolve(data, SHARPEN_KERNEL);
        canvas = putData(c, applyColor(sharpened, { contrast: 1.05, saturation: 1.08, warmth: 4 }));
        mime = "image/jpeg"; quality = 0.93;
        break;
      }
      case "color": {
        const { canvas: c, data } = drawToImageData(img);
        canvas = putData(c, applyColor(autoLevels(data), { saturation: 1.15 }));
        mime = "image/jpeg"; quality = 0.92;
        break;
      }
      case "lighting": {
        const { canvas: c, data } = drawToImageData(img);
        canvas = putData(c, applyColor(data, { brightness: 12, contrast: 1.12 }));
        mime = "image/jpeg"; quality = 0.92;
        break;
      }
      case "restore": {
        const { canvas: c, data } = drawToImageData(img);
        const denoised = convolve(data, SOFT_BLUR);
        const sharp = convolve(denoised, SHARPEN_KERNEL);
        canvas = putData(c, applyColor(autoLevels(sharp), { saturation: 1.2, warmth: 6, contrast: 1.05 }));
        mime = "image/jpeg"; quality = 0.92;
        break;
      }
      case "social": {
        // Fit to 1080 wide, sharpen + vibrant
        const scale = Math.min(1, 1080 / img.naturalWidth);
        const { canvas: c, data } = drawToImageData(img, scale);
        const sharp = convolve(data, SHARPEN_KERNEL);
        canvas = putData(c, applyColor(sharp, { saturation: 1.18, contrast: 1.06 }));
        mime = "image/jpeg"; quality = 0.9;
        break;
      }
      case "print": {
        // Keep native resolution, mild sharpen, preserve color fidelity
        const { canvas: c, data } = drawToImageData(img);
        canvas = putData(c, convolve(data, SHARPEN_KERNEL));
        mime = "image/jpeg"; quality = 0.97;
        suffix = "print-300dpi";
        break;
      }
    }

    const blob = await canvasToBlob(canvas!, mime, quality);
    const ext = mime === "image/png" ? "png" : "jpg";
    const base = sourceFile.name.replace(/\.[^.]+$/, "");
    return { blob, filename: `${base}-${suffix}.${ext}`, mime };
  } finally {
    URL.revokeObjectURL(url);
  }
}

// ─── Component ──────────────────────────────────────────────────────────────
interface EnhanceResult {
  id: EnhancementId;
  label: string;
  blob: Blob;
  url: string;
  filename: string;
}

export function AIEnhanceStudio() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<{ file: File; url: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [running, setRunning] = useState<EnhancementId | null>(null);
  const [result, setResult] = useState<EnhanceResult | null>(null);
  const [success, setSuccess] = useState(false);

  const setFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (source?.url) URL.revokeObjectURL(source.url);
    setSource({ file, url: URL.createObjectURL(file) });
    setResult(null);
  };

  const onSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };

  const runOne = useCallback(async (feature: Enhancement) => {
    if (!source) {
      toast.error("Upload an image first.");
      return;
    }
    setRunning(feature.id);
    setResult(null);
    try {
      const { blob, filename } = await runEnhancement(feature.id, source.file);
      const url = URL.createObjectURL(blob);
      setResult({ id: feature.id, label: feature.label, blob, url, filename });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      toast.success(`${feature.label} complete`, { description: filename });
    } catch (err) {
      console.error(err);
      toast.error(`${feature.label} failed`, { description: (err as Error).message });
    } finally {
      setRunning(null);
    }
  }, [source]);

  const download = async () => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.url;
    a.download = result.filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      a.remove();
    }, 60000);
  };

  const reset = () => {
    if (source?.url) URL.revokeObjectURL(source.url);
    if (result?.url) URL.revokeObjectURL(result.url);
    setSource(null);
    setResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Uploader */}
      {!source && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInput.current?.click()}
            className={cn(
              "relative cursor-pointer overflow-hidden border-2 border-dashed p-10 text-center transition-all md:p-14",
              "bg-gradient-to-br from-primary/5 via-card/60 to-secondary/5 backdrop-blur-xl hover:border-primary hover:shadow-[var(--shadow-glow)]",
              isDragging ? "border-primary bg-primary/10" : "border-border/60",
            )}
          >
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Sparkles className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold md:text-2xl">Drop an image to enhance</h3>
            <p className="mt-1 text-sm text-muted-foreground">One click. Studio-grade results. JPG, PNG, WebP, HEIC.</p>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onSelect} aria-label="Upload image for AI enhancement" />
          </Card>
        </motion.div>
      )}

      {/* Source preview + feature grid */}
      {source && (
        <>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="flex flex-col gap-4 border-border/40 bg-card/70 p-4 backdrop-blur-xl sm:flex-row sm:items-center">
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/40">
                <img src={source.url} alt="Source" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{source.file.name}</p>
                <p className="text-xs text-muted-foreground">Pick an enhancement below — we'll apply it in one click.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={reset}>
                <X className="mr-1.5 h-3.5 w-3.5" /> Change image
              </Button>
            </Card>
          </motion.div>

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                key={result.id + result.filename}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
              >
                <Card className="relative overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl">
                  <div className="flex flex-col gap-3 border-b border-border/40 bg-background/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{result.label} · complete</h3>
                        <p className="text-xs text-muted-foreground">{result.filename}</p>
                      </div>
                    </div>
                    <Button onClick={download} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95">
                      <Download className="mr-1.5 h-4 w-4" /> Download
                    </Button>
                  </div>
                  <div className="p-4">
                    <BeforeAfterSlider
                      beforeImage={source.url}
                      afterImage={result.url}
                      title="Original vs Enhanced"
                      description={`Applied: ${result.label}`}
                    />
                  </div>
                  <AnimatePresence>
                    {success && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 220, damping: 16 }}
                        className="pointer-events-none absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-[var(--shadow-glow)]"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Enhanced
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feature grid */}
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {ENHANCEMENTS.map((f, i) => {
              const Icon = f.icon;
              const busy = running === f.id;
              const disabled = running !== null && !busy;
              return (
                <motion.button
                  key={f.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => runOne(f)}
                  variants={{
                    hidden: { opacity: 0, y: 16, scale: 0.96 },
                    show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
                  }}
                  whileHover={disabled ? undefined : { y: -3 }}
                  whileTap={disabled ? undefined : { scale: 0.98 }}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/40 bg-card/70 p-4 text-left backdrop-blur-xl transition-all",
                    "hover:border-primary/60 hover:shadow-[var(--shadow-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    disabled && "opacity-50",
                  )}
                >
                  <div className={cn(
                    "pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100",
                    "bg-gradient-to-br", f.accent,
                  )} style={{ opacity: busy ? 0.15 : undefined }} />
                  <div className={cn("relative mb-3 grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", f.accent)}>
                    {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <p className="relative text-sm font-semibold">{f.label}</p>
                  <p className="relative mt-0.5 line-clamp-2 text-xs text-muted-foreground">{f.description}</p>
                  <div className="relative mt-3 flex items-center justify-between">
                    <Badge variant="outline" className="gap-1 border-border/60 bg-background/60 text-[10px]">
                      <Clock className="h-3 w-3" /> {f.time}
                    </Badge>
                    <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground group-hover:text-primary">
                      {busy ? "Running…" : "One click"}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </motion.div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Start over
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
