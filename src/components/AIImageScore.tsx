import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  Sparkles,
  Image as ImageIcon,
  Gauge,
  Globe,
  Printer,
  Share2,
  Search,
  Accessibility,
  Palette,
  Focus,
  Waves,
  FileArchive,
  Sun,
  Contrast,
  Crop,
  Zap,
  Loader2,
  CheckCircle2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ---------- Types ----------
type Metrics = {
  width: number;
  height: number;
  megapixels: number;
  fileSizeKB: number;
  aspectRatio: number;
  avgLuminance: number; // 0-1
  contrast: number; // stddev of luminance 0-1
  sharpness: number; // 0-100 (edge energy)
  noise: number; // 0-100 (higher = noisier)
  colorfulness: number; // 0-100
  compressionEfficiency: number; // 0-100
  hasAlpha: boolean;
  format: string;
};

type Scores = {
  overall: number;
  website: number;
  print: number;
  social: number;
  seo: number;
  accessibility: number;
  color: number;
  sharpness: number;
  noise: number; // higher = cleaner
  compression: number;
};

type FixId =
  | "brightness"
  | "contrast"
  | "sharpen"
  | "denoise"
  | "resize-web"
  | "resize-social"
  | "compress-web";

type Suggestion = {
  id: string;
  title: string;
  detail: string;
  tone: "positive" | "warning" | "info";
  fix?: { id: FixId; label: string; amount?: number };
};

// ---------- Analysis ----------
function analyzeCanvas(img: HTMLImageElement, fileSizeBytes: number, format: string): { metrics: Metrics; canvas: HTMLCanvasElement } {
  // downscale for analysis speed
  const maxAnalyze = 512;
  const scale = Math.min(1, maxAnalyze / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  let sumL = 0;
  let sumL2 = 0;
  let rMean = 0, gMean = 0, bMean = 0;
  let hasAlpha = false;
  const lum = new Float32Array(w * h);
  const n = w * h;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
    if (a < 250) hasAlpha = true;
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    lum[p] = l;
    sumL += l;
    sumL2 += l * l;
    rMean += r; gMean += g; bMean += b;
  }
  const avgL = sumL / n;
  const varL = Math.max(0, sumL2 / n - avgL * avgL);
  const contrast = Math.sqrt(varL); // 0..~0.5

  rMean /= n; gMean /= n; bMean /= n;

  // Sharpness: mean |laplacian| on luminance
  let edgeSum = 0;
  let edgeCount = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const lap =
        4 * lum[i] - lum[i - 1] - lum[i + 1] - lum[i - w] - lum[i + w];
      edgeSum += Math.abs(lap);
      edgeCount++;
    }
  }
  const edgeMean = edgeSum / Math.max(1, edgeCount); // ~0..0.5
  const sharpness = Math.max(0, Math.min(100, Math.round(edgeMean * 450)));

  // Noise: high-frequency energy in flat regions (approx via small kernel diff on chroma)
  let noiseSum = 0;
  let noiseCount = 0;
  for (let y = 1; y < h - 1; y += 2) {
    for (let x = 1; x < w - 1; x += 2) {
      const i = (y * w + x) * 4;
      const c1 = data[i] - data[i + 4];
      const c2 = data[i + 1] - data[i + 5];
      const c3 = data[i + 2] - data[i + 6];
      noiseSum += Math.abs(c1) + Math.abs(c2) + Math.abs(c3);
      noiseCount++;
    }
  }
  const noiseMean = noiseSum / Math.max(1, noiseCount); // ~0..80
  const noise = Math.max(0, Math.min(100, Math.round(noiseMean * 1.4)));

  // Colorfulness (Hasler & Süsstrunk simplified)
  let rgSum = 0, rgSum2 = 0, ybSum = 0, ybSum2 = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const rg = r - g;
    const yb = 0.5 * (r + g) - b;
    rgSum += rg; rgSum2 += rg * rg;
    ybSum += yb; ybSum2 += yb * yb;
  }
  const rgMean = rgSum / n, ybMean = ybSum / n;
  const rgStd = Math.sqrt(Math.max(0, rgSum2 / n - rgMean * rgMean));
  const ybStd = Math.sqrt(Math.max(0, ybSum2 / n - ybMean * ybMean));
  const stdRoot = Math.sqrt(rgStd * rgStd + ybStd * ybStd);
  const meanRoot = Math.sqrt(rgMean * rgMean + ybMean * ybMean);
  const colorfulnessRaw = stdRoot + 0.3 * meanRoot; // ~0..120
  const colorfulness = Math.max(0, Math.min(100, Math.round(colorfulnessRaw)));

  const megapixels = (img.width * img.height) / 1_000_000;
  const fileSizeKB = Math.round(fileSizeBytes / 1024);

  // Compression efficiency: bytes per pixel — lower = better up to a floor
  const bpp = fileSizeBytes / Math.max(1, img.width * img.height);
  // ideal ~0.15 bpp; > 1 bpp very inefficient
  let compressionEfficiency: number;
  if (bpp <= 0.15) compressionEfficiency = 100;
  else if (bpp <= 0.5) compressionEfficiency = Math.round(100 - ((bpp - 0.15) / 0.35) * 25);
  else if (bpp <= 1.5) compressionEfficiency = Math.round(75 - ((bpp - 0.5) / 1.0) * 45);
  else compressionEfficiency = Math.max(10, Math.round(30 - Math.min(20, (bpp - 1.5) * 10)));

  return {
    metrics: {
      width: img.width,
      height: img.height,
      megapixels,
      fileSizeKB,
      aspectRatio: img.width / img.height,
      avgLuminance: avgL,
      contrast,
      sharpness,
      noise,
      colorfulness,
      compressionEfficiency,
      hasAlpha,
      format,
    },
    canvas: c,
  };
}

function computeScores(m: Metrics): Scores {
  // Sub-scores
  // Exposure: closeness to 0.5 luminance, penalize very dark/bright
  const exposure = Math.max(0, 100 - Math.abs(m.avgLuminance - 0.5) * 260);
  const contrastScore = Math.max(0, Math.min(100, m.contrast * 380));
  const sharpnessScore = m.sharpness;
  const noiseCleanliness = Math.max(0, 100 - m.noise);
  const colorScore = Math.max(0, Math.min(100, m.colorfulness * 1.1 + 20));

  // Website: prefers smaller files, WebP/AVIF, reasonable resolution
  let website = 0;
  website += Math.min(30, m.compressionEfficiency * 0.3);
  website += m.width <= 2400 ? 20 : m.width <= 4000 ? 12 : 5;
  website += /webp|avif/i.test(m.format) ? 20 : /jpe?g/i.test(m.format) ? 14 : 6;
  website += sharpnessScore * 0.15;
  website += exposure * 0.15;
  website = Math.round(Math.max(0, Math.min(100, website)));

  // Print: high resolution, low noise, high sharpness
  let print = 0;
  print += m.megapixels >= 8 ? 35 : m.megapixels >= 4 ? 24 : m.megapixels >= 2 ? 14 : 5;
  print += sharpnessScore * 0.25;
  print += noiseCleanliness * 0.2;
  print += contrastScore * 0.1;
  print += m.hasAlpha ? -5 : 5;
  print = Math.round(Math.max(0, Math.min(100, print)));

  // Social: good contrast, colorful, near social aspect ratios
  const socialRatios = [1, 4 / 5, 9 / 16, 16 / 9];
  const ratioFit = 100 - Math.min(100, Math.min(...socialRatios.map((r) => Math.abs(m.aspectRatio - r) * 120)));
  let social = 0;
  social += ratioFit * 0.25;
  social += colorScore * 0.25;
  social += contrastScore * 0.2;
  social += sharpnessScore * 0.15;
  social += exposure * 0.15;
  social = Math.round(Math.max(0, Math.min(100, social)));

  // SEO: file size, format, aspect ratio suitability, sharpness
  let seo = 0;
  seo += m.fileSizeKB <= 200 ? 30 : m.fileSizeKB <= 500 ? 22 : m.fileSizeKB <= 1000 ? 14 : 6;
  seo += /webp|avif/i.test(m.format) ? 20 : /jpe?g/i.test(m.format) ? 14 : 8;
  seo += m.width >= 1200 ? 20 : m.width >= 800 ? 14 : 8;
  seo += sharpnessScore * 0.15;
  seo += exposure * 0.15;
  seo = Math.round(Math.max(0, Math.min(100, seo)));

  // Accessibility: contrast + exposure primarily
  const accessibility = Math.round(
    Math.max(0, Math.min(100, contrastScore * 0.5 + exposure * 0.4 + colorScore * 0.1))
  );

  const overall = Math.round(
    website * 0.2 + social * 0.2 + seo * 0.2 + accessibility * 0.15 + print * 0.1 + noiseCleanliness * 0.075 + sharpnessScore * 0.075
  );

  return {
    overall,
    website,
    print,
    social,
    seo,
    accessibility,
    color: Math.round(colorScore),
    sharpness: Math.round(sharpnessScore),
    noise: Math.round(noiseCleanliness),
    compression: Math.round(m.compressionEfficiency),
  };
}

function buildSuggestions(m: Metrics, s: Scores): Suggestion[] {
  const out: Suggestion[] = [];
  const brightnessDelta = 0.5 - m.avgLuminance;
  if (Math.abs(brightnessDelta) > 0.06) {
    const pct = Math.round(Math.abs(brightnessDelta) * 100);
    out.push({
      id: "brightness",
      title: brightnessDelta > 0 ? `Increase brightness by ${pct}%.` : `Decrease brightness by ${pct}%.`,
      detail: "Balances exposure so details in mid-tones read clearly.",
      tone: "warning",
      fix: { id: "brightness", label: "Fix exposure", amount: brightnessDelta * 100 },
    });
  }
  if (s.accessibility < 65 && m.contrast < 0.18) {
    out.push({
      id: "contrast",
      title: "Boost contrast for better accessibility.",
      detail: "Higher contrast improves readability and passes WCAG guidance.",
      tone: "warning",
      fix: { id: "contrast", label: "Boost contrast", amount: 20 },
    });
  }
  if (s.sharpness < 55) {
    out.push({
      id: "sharpen",
      title: "Image looks a little soft — apply light sharpening.",
      detail: "One-tap sharpen lifts edge detail without over-processing.",
      tone: "warning",
      fix: { id: "sharpen", label: "Sharpen" },
    });
  }
  if (m.noise > 40) {
    out.push({
      id: "denoise",
      title: "Background could be improved — visible noise detected.",
      detail: "A gentle denoise cleans grain while keeping subject detail.",
      tone: "warning",
      fix: { id: "denoise", label: "Denoise" },
    });
  }
  if (m.width > 2400 && s.website < 80) {
    out.push({
      id: "resize-web",
      title: "Resize to 1600px wide for faster page loads.",
      detail: "Web browsers rarely need more than 1600–2000px on the long edge.",
      tone: "info",
      fix: { id: "resize-web", label: "Resize for web" },
    });
  }
  if (m.fileSizeKB > 500 && s.seo < 80) {
    out.push({
      id: "compress-web",
      title: "Compress to under 200KB for better SEO.",
      detail: "Google Core Web Vitals rewards lean images.",
      tone: "warning",
      fix: { id: "compress-web", label: "Compress" },
    });
  }
  if (Math.abs(m.aspectRatio - 1) < 0.05 || Math.abs(m.aspectRatio - 4 / 5) < 0.05) {
    out.push({
      id: "insta-good",
      title: "This image is ideal for Instagram.",
      detail: `${Math.abs(m.aspectRatio - 1) < 0.05 ? "1:1 square" : "4:5 portrait"} matches Instagram's preferred feed dimensions.`,
      tone: "positive",
    });
  } else if (s.social < 60) {
    out.push({
      id: "resize-social",
      title: "Crop to 4:5 for higher social engagement.",
      detail: "4:5 portraits take more feed real estate on Instagram and Facebook.",
      tone: "info",
      fix: { id: "resize-social", label: "Crop for social" },
    });
  }
  if (s.print >= 80) {
    out.push({
      id: "print-good",
      title: "Print quality is excellent.",
      detail: `${m.megapixels.toFixed(1)}MP prints cleanly up to ${m.megapixels >= 12 ? "A2" : m.megapixels >= 8 ? "A3" : "A4"}.`,
      tone: "positive",
    });
  } else if (m.megapixels < 4) {
    out.push({
      id: "print-warn",
      title: "Resolution is low for large prints.",
      detail: "Upscaling with AI Enhance improves print sharpness above A5.",
      tone: "info",
    });
  }
  if (s.compression >= 85) {
    out.push({
      id: "compress-good",
      title: "Compression is highly efficient.",
      detail: "File size is well-tuned for its resolution and format.",
      tone: "positive",
    });
  }
  return out.slice(0, 8);
}

// ---------- Fix operations ----------
function cloneImageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return c;
}

function adjustBrightnessContrast(src: HTMLCanvasElement, brightnessDelta: number, contrastDelta: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(src, 0, 0);
  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;
  const b = brightnessDelta * 255;
  const cf = 1 + contrastDelta / 100;
  for (let i = 0; i < d.length; i += 4) {
    for (let k = 0; k < 3; k++) {
      let v = d[i + k] + b;
      v = (v - 128) * cf + 128;
      d[i + k] = Math.max(0, Math.min(255, v));
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return c;
}

function unsharpMask(src: HTMLCanvasElement, amount = 0.6): HTMLCanvasElement {
  const w = src.width, h = src.height;
  const ctx = src.getContext("2d")!;
  const orig = ctx.getImageData(0, 0, w, h);
  // simple 3x3 sharpen kernel
  const out = document.createElement("canvas");
  out.width = w; out.height = h;
  const octx = out.getContext("2d")!;
  const outData = octx.createImageData(w, h);
  const d = orig.data;
  const o = outData.data;
  const k = amount;
  const center = 1 + 4 * k;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        const p = d[i + c];
        const l = x > 0 ? d[i + c - 4] : p;
        const r = x < w - 1 ? d[i + c + 4] : p;
        const u = y > 0 ? d[i + c - w * 4] : p;
        const dn = y < h - 1 ? d[i + c + w * 4] : p;
        const v = center * p - k * (l + r + u + dn);
        o[i + c] = Math.max(0, Math.min(255, v));
      }
      o[i + 3] = d[i + 3];
    }
  }
  octx.putImageData(outData, 0, 0);
  return out;
}

function boxBlur(src: HTMLCanvasElement): HTMLCanvasElement {
  const out = document.createElement("canvas");
  out.width = src.width; out.height = src.height;
  const ctx = out.getContext("2d")!;
  ctx.filter = "blur(1px)";
  ctx.drawImage(src, 0, 0);
  ctx.filter = "none";
  return out;
}

function resizeCanvas(src: HTMLCanvasElement, maxLong: number): HTMLCanvasElement {
  const long = Math.max(src.width, src.height);
  if (long <= maxLong) return src;
  const scale = maxLong / long;
  const out = document.createElement("canvas");
  out.width = Math.round(src.width * scale);
  out.height = Math.round(src.height * scale);
  const ctx = out.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, out.width, out.height);
  return out;
}

function cropAspect(src: HTMLCanvasElement, ratio: number): HTMLCanvasElement {
  const cur = src.width / src.height;
  let sx = 0, sy = 0, sw = src.width, sh = src.height;
  if (cur > ratio) {
    sw = src.height * ratio;
    sx = (src.width - sw) / 2;
  } else {
    sh = src.width / ratio;
    sy = (src.height - sh) / 2;
  }
  const out = document.createElement("canvas");
  out.width = Math.round(sw); out.height = Math.round(sh);
  out.getContext("2d")!.drawImage(src, sx, sy, sw, sh, 0, 0, out.width, out.height);
  return out;
}

async function canvasToBlob(c: HTMLCanvasElement, mime = "image/jpeg", quality = 0.9): Promise<Blob> {
  return new Promise((resolve) => c.toBlob((b) => resolve(b as Blob), mime, quality));
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 60_000);
}

// ---------- UI ----------
const scoreColor = (v: number) =>
  v >= 85 ? "text-emerald-500" : v >= 65 ? "text-amber-500" : "text-rose-500";
const scoreRing = (v: number) =>
  v >= 85 ? "from-emerald-400 to-teal-500" : v >= 65 ? "from-amber-400 to-orange-500" : "from-rose-400 to-red-500";

const ScoreRing = ({ value, label, size = 120 }: { value: number; label: string; size?: number }) => {
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="relative flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={8} stroke="hsl(var(--muted))" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={8}
          strokeLinecap="round"
          stroke={`url(#grad-${label})`}
          fill="none"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-3xl font-bold tabular-nums", scoreColor(value))}>{value}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
    </div>
  );
};

const ScoreBar = ({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Gauge;
  label: string;
  value: number;
  hint?: string;
}) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="font-medium text-foreground">{label}</span>
      </div>
      <span className={cn("font-semibold tabular-nums", scoreColor(value))}>{value}</span>
    </div>
    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full bg-gradient-to-r transition-all duration-700", scoreRing(value))}
        style={{ width: `${value}%` }}
      />
    </div>
    {hint && <p className="text-[10px] text-muted-foreground/80">{hint}</p>}
  </div>
);

export const AIImageScore = () => {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string>("image");
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const workingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const runAnalysis = useCallback(async (canvas: HTMLCanvasElement, fileSize: number, format: string) => {
    setAnalyzing(true);
    // give the UI a beat to render the working image
    await new Promise((r) => setTimeout(r, 30));
    const tmp = new Image();
    tmp.src = canvas.toDataURL("image/png");
    await new Promise((r) => (tmp.onload = () => r(null)));
    const { metrics: m } = analyzeCanvas(tmp, fileSize, format);
    const s = computeScores(m);
    setMetrics(m);
    setScores(s);
    setSuggestions(buildSuggestions(m, s));
    setAnalyzing(false);
  }, []);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file.");
        return;
      }
      const dataUrl: string = await new Promise((resolve) => {
        const r = new FileReader();
        r.onload = (e) => resolve(e.target?.result as string);
        r.readAsDataURL(file);
      });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((r) => (img.onload = () => r(null)));
      const canvas = cloneImageToCanvas(img);
      workingCanvasRef.current = canvas;
      setSourceUrl(dataUrl);
      setSourceName(file.name.replace(/\.[^.]+$/, "") || "image");
      setProcessedUrl(dataUrl);
      await runAnalysis(canvas, file.size, file.type.split("/")[1] || "unknown");
    },
    [runAnalysis]
  );

  const applyFix = useCallback(
    async (s: Suggestion) => {
      if (!s.fix || !workingCanvasRef.current) return;
      setApplyingId(s.id);
      try {
        let canvas = workingCanvasRef.current;
        switch (s.fix.id) {
          case "brightness":
            canvas = adjustBrightnessContrast(canvas, ((s.fix.amount ?? 6) / 100), 0);
            break;
          case "contrast":
            canvas = adjustBrightnessContrast(canvas, 0, s.fix.amount ?? 20);
            break;
          case "sharpen":
            canvas = unsharpMask(canvas, 0.6);
            break;
          case "denoise":
            canvas = boxBlur(canvas);
            break;
          case "resize-web":
            canvas = resizeCanvas(canvas, 1600);
            break;
          case "resize-social":
            canvas = cropAspect(canvas, 4 / 5);
            break;
          case "compress-web":
            canvas = resizeCanvas(canvas, 1600);
            break;
        }
        workingCanvasRef.current = canvas;
        const quality = s.fix.id === "compress-web" ? 0.75 : 0.92;
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        const url = URL.createObjectURL(blob);
        setProcessedUrl(url);
        await runAnalysis(canvas, blob.size, "jpeg");
        toast.success(`${s.fix.label} applied`);
      } catch (e) {
        console.error(e);
        toast.error("Could not apply fix");
      } finally {
        setApplyingId(null);
      }
    },
    [runAnalysis]
  );

  const applyAllFixes = useCallback(async () => {
    for (const s of suggestions.filter((x) => x.fix)) {
      // eslint-disable-next-line no-await-in-loop
      await applyFix(s);
    }
  }, [suggestions, applyFix]);

  const downloadResult = useCallback(async () => {
    if (!workingCanvasRef.current) return;
    const blob = await canvasToBlob(workingCanvasRef.current, "image/jpeg", 0.92);
    triggerDownload(blob, `${sourceName}-scored.jpg`);
  }, [sourceName]);

  return (
    <div className="space-y-6">
      {/* Uploader */}
      <Card
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-all",
          "bg-gradient-to-br from-background via-background to-primary/5",
          isDragging ? "border-primary bg-primary/5" : "border-border/60"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              AI Image Score
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Instantly score any image across 10 dimensions.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Get an overall grade plus website, print, social, SEO, accessibility and quality scores —
              with one-click fixes to raise every metric.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <Button
                size="lg"
                onClick={() => fileRef.current?.click()}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Upload className="w-4 h-4 mr-2" />
                {sourceUrl ? "Score another image" : "Upload image"}
              </Button>
              {scores && (
                <>
                  <Button size="lg" variant="secondary" onClick={applyAllFixes} disabled={!suggestions.some((s) => s.fix)}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Apply all fixes
                  </Button>
                  <Button size="lg" variant="outline" onClick={downloadResult}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="w-full md:w-56 aspect-square rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden">
            {processedUrl ? (
              <img src={processedUrl} alt="Scored" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center px-4">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Drop image here</p>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.currentTarget.value = "";
          }}
          aria-label="Upload image to score"
        />
      </Card>

      {analyzing && !scores && (
        <Card className="p-6 flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Analyzing image quality…
        </Card>
      )}

      {scores && metrics && (
        <>
          {/* Score dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-6 lg:col-span-1 bg-gradient-to-br from-primary/5 via-background to-background">
              <div className="flex flex-col items-center text-center gap-3">
                <ScoreRing value={scores.overall} label="Overall" size={160} />
                <div>
                  <p className="text-sm font-semibold">
                    {scores.overall >= 85
                      ? "Beautifully optimized."
                      : scores.overall >= 65
                      ? "Solid — a few tweaks will polish it."
                      : "Needs work — apply the suggested fixes."}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {metrics.width}×{metrics.height} · {metrics.megapixels.toFixed(1)}MP · {metrics.fileSizeKB}KB · {metrics.format.toUpperCase()}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 lg:col-span-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Destination scores</p>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 items-end">
                <ScoreRing value={scores.website} label="Website" size={96} />
                <ScoreRing value={scores.print} label="Print" size={96} />
                <ScoreRing value={scores.social} label="Social" size={96} />
                <ScoreRing value={scores.seo} label="SEO" size={96} />
                <ScoreRing value={scores.accessibility} label="A11y" size={96} />
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-4">Quality breakdown</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <ScoreBar icon={Palette} label="Color Quality" value={scores.color} hint="Colorfulness & saturation" />
              <ScoreBar icon={Focus} label="Sharpness" value={scores.sharpness} hint="Edge & detail clarity" />
              <ScoreBar icon={Waves} label="Noise" value={scores.noise} hint="Higher is cleaner" />
              <ScoreBar icon={FileArchive} label="Compression" value={scores.compression} hint="Efficiency per pixel" />
            </div>
          </Card>

          {/* Suggestions */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold">Suggestions</h3>
                <p className="text-xs text-muted-foreground">Tap a fix — everything runs automatically.</p>
              </div>
              {suggestions.some((s) => s.fix) && (
                <Button size="sm" variant="ghost" onClick={applyAllFixes}>
                  <Zap className="w-3.5 h-3.5 mr-1.5" />
                  Apply all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((s) => {
                const toneStyles =
                  s.tone === "positive"
                    ? "from-emerald-500/10 to-teal-500/5 border-emerald-500/30"
                    : s.tone === "warning"
                    ? "from-amber-500/10 to-orange-500/5 border-amber-500/30"
                    : "from-primary/10 to-primary/5 border-primary/30";
                const ToneIcon =
                  s.tone === "positive" ? CheckCircle2 : s.tone === "warning" ? Sun : Sparkles;
                return (
                  <Card
                    key={s.id}
                    className={cn(
                      "p-4 border bg-gradient-to-br relative overflow-hidden hover:shadow-md transition-all",
                      toneStyles
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "shrink-0 w-9 h-9 rounded-lg flex items-center justify-center",
                          s.tone === "positive"
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                            : s.tone === "warning"
                            ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                            : "bg-primary/20 text-primary"
                        )}
                      >
                        <ToneIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-snug">{s.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.detail}</p>
                        {s.fix && (
                          <Button
                            size="sm"
                            className="mt-3"
                            onClick={() => applyFix(s)}
                            disabled={applyingId === s.id}
                          >
                            {applyingId === s.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            {s.fix.label}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
              {!suggestions.length && (
                <Card className="p-6 col-span-full text-center text-sm text-muted-foreground">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  Nothing to improve — this image looks great as-is.
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AIImageScore;
