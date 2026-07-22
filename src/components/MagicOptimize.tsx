import { useState, useRef, useCallback, useMemo, useEffect, type ChangeEvent, type DragEvent, type ElementType } from "react";
import { useToolQuota } from "@/components/FreeToolGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  FileArchive,
  Loader2,
  RotateCcw,
  Globe,
  Instagram,
  Music2,
  Printer,
  ShoppingCart,
  Linkedin,
  Sparkles,
  Link2,
  Check,
  Lock,
  CheckCircle2,
  Wand2,
  Film,
  ImageIcon,
  ChevronDown,
  Facebook,
  Store,
  User,
  Camera,
  X,
} from "lucide-react";
import { useOptimizationPipeline } from "@/hooks/useOptimizationPipeline";
import { PipelineResult, GoalPreset } from "@/services/imageOptimizationPipeline";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useToast } from "@/hooks/use-toast";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { OptimizationResultDashboard } from "@/components/OptimizationResultDashboard";
import { cn } from "@/lib/utils";

// Pinterest icon (simple svg to avoid extra deps)
const Pinterest: ElementType = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M12 2C6.48 2 2 6.48 2 12c0 4.09 2.46 7.6 5.97 9.14-.08-.78-.16-1.97.03-2.82.18-.77 1.15-4.9 1.15-4.9s-.29-.59-.29-1.46c0-1.37.79-2.39 1.78-2.39.84 0 1.25.63 1.25 1.39 0 .85-.54 2.12-.82 3.29-.23.98.49 1.78 1.46 1.78 1.75 0 3.1-1.85 3.1-4.52 0-2.36-1.7-4.02-4.13-4.02-2.81 0-4.46 2.11-4.46 4.29 0 .85.33 1.76.74 2.25.08.1.09.19.07.29-.07.29-.24.98-.27 1.12-.04.18-.14.22-.33.14-1.23-.57-2-2.37-2-3.81 0-3.1 2.25-5.95 6.5-5.95 3.41 0 6.06 2.43 6.06 5.68 0 3.39-2.14 6.12-5.11 6.12-1 0-1.94-.52-2.26-1.14l-.61 2.35c-.22.85-.82 1.92-1.22 2.57.92.28 1.88.44 2.9.44 5.52 0 10-4.48 10-10S17.52 2 12 2z" />
  </svg>
);

interface Destination {
  id: string;
  label: string;
  icon: ElementType;
  goal: GoalPreset;
  isPaid?: boolean;
  hint: string;
  color: string; // tailwind bg tint on active
}

const DESTINATIONS: Destination[] = [
  { id: "instagram", label: "Instagram", icon: Instagram, goal: "instagram", hint: "1080² · vivid", color: "from-pink-500/20 to-purple-500/20" },
  { id: "facebook", label: "Facebook", icon: Facebook, goal: "facebook", hint: "1200px · WebP", color: "from-blue-500/20 to-indigo-500/20" },
  { id: "tiktok", label: "TikTok", icon: Music2, goal: "tiktok", hint: "Vertical · fast", color: "from-fuchsia-500/20 to-cyan-500/20" },
  { id: "pinterest", label: "Pinterest", icon: Pinterest, goal: "pinterest", hint: "1000px · tall", color: "from-red-500/20 to-rose-500/20" },
  { id: "linkedin", label: "LinkedIn", icon: Linkedin, goal: "linkedin", hint: "1200×627", color: "from-sky-500/20 to-blue-500/20" },
  { id: "web", label: "Website", icon: Globe, goal: "web", hint: "AVIF/WebP", color: "from-emerald-500/20 to-teal-500/20" },
  { id: "amazon", label: "Amazon", icon: ShoppingCart, goal: "amazon", hint: "2000² · white bg", isPaid: true, color: "from-orange-500/20 to-amber-500/20" },
  { id: "shopify", label: "Shopify", icon: Store, goal: "shopify", hint: "2048² · square", isPaid: true, color: "from-lime-500/20 to-green-500/20" },
  { id: "print", label: "Print", icon: Printer, goal: "print", hint: "Max res · 300dpi", isPaid: true, color: "from-slate-500/20 to-zinc-500/20" },
  { id: "personal", label: "Personal", icon: User, goal: "personal", hint: "High quality", color: "from-violet-500/20 to-purple-500/20" },
];

const ACCEPT_TYPES = "image/png,image/jpeg,image/webp,image/heic,image/heif,image/tiff,image/avif,image/svg+xml,image/*";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function qualityRetained(compressionRatio: number): number {
  return Math.max(70, Math.round(100 - Math.max(0, (compressionRatio - 50) * 0.3)));
}

interface UploadedFile {
  id: string;
  file: File;
  previewUrl: string;
  width?: number;
  height?: number;
  analysis?: string; // short AI-style summary derived from image dims/type
}

interface MagicResult extends PipelineResult {
  beforeUrl: string;
  originalFile?: File;
}

interface MagicOptimizeProps {
  isSubscribed?: boolean;
}

export const MagicOptimize = ({ isSubscribed = false }: MagicOptimizeProps) => {
  const { toast } = useToast();
  const quota = useToolQuota();
  const { createCheckout } = useImageCompression();
  const { isProcessing, overallProgress, processFiles, downloadResult, downloadAllAsZip, clearJobs } =
    useOptimizationPipeline();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [destination, setDestination] = useState<Destination | null>(null);
  const [results, setResults] = useState<MagicResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openSlider, setOpenSlider] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // advanced controls
  const [seoRename, setSeoRename] = useState(true);
  const [stripMetadata, setStripMetadata] = useState(true);
  const [generateAltText, setGenerateAltText] = useState(false);

  const objectUrlsRef = useRef<string[]>([]);
  useEffect(() => () => objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const analyzeImage = (file: File, url: string): Promise<{ width: number; height: number; analysis: string }> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const orientation = w > h * 1.15 ? "landscape" : h > w * 1.15 ? "portrait" : "square";
        const mp = ((w * h) / 1_000_000).toFixed(1);
        const kind = file.type.includes("png") ? "PNG graphic"
          : file.type.includes("svg") ? "SVG vector"
          : file.type.includes("webp") ? "WebP photo"
          : file.type.includes("heic") || file.type.includes("heif") ? "HEIC photo"
          : file.type.includes("tiff") ? "TIFF master"
          : file.type.includes("avif") ? "AVIF photo"
          : "JPEG photo";
        resolve({ width: w, height: h, analysis: `${kind} · ${w}×${h} · ${mp}MP · ${orientation}` });
      };
      img.onerror = () => resolve({ width: 0, height: 0, analysis: `${file.type || "image"} · ${formatBytes(file.size)}` });
      img.src = url;
    });

  // ─── Photo Health Score (client-side heuristic from file/dim signals) ───
  const photoHealth = useMemo(() => {
    if (!uploads.length) return null;
    const findings: { label: string; kind: "warn" | "ok" }[] = [];
    let score = 100;
    const first = uploads[0];
    const mp = ((first.width ?? 0) * (first.height ?? 0)) / 1_000_000;
    const bytesPerPixel = (first.file.size || 0) / Math.max(1, (first.width ?? 1) * (first.height ?? 1));

    // Low resolution
    if (mp && mp < 2) { findings.push({ label: "Resolution could be improved", kind: "warn" }); score -= 18; }
    else findings.push({ label: "Good resolution detected", kind: "ok" });

    // Likely blurry / heavily compressed (very low bytes/pixel for JPEG-ish)
    if (bytesPerPixel && bytesPerPixel < 0.35 && !first.file.type.includes("png") && !first.file.type.includes("svg")) {
      findings.push({ label: "Slight blur or soft focus detected", kind: "warn" }); score -= 14;
    }

    // Noise likely on small/low-res photos
    if (mp && mp < 3 && !first.file.type.includes("png")) {
      findings.push({ label: "Minor digital noise likely", kind: "warn" }); score -= 8;
    }

    // Flat color (heuristic on PNG screenshots vs photos — assume photos may be flat)
    if (!first.file.type.includes("png") && !first.file.type.includes("svg")) {
      findings.push({ label: "Color could be more vibrant", kind: "warn" }); score -= 7;
    }

    // Lighting placeholder — always suggest we'll auto-brighten unless PNG graphic
    if (!first.file.type.includes("png") && !first.file.type.includes("svg")) {
      findings.push({ label: "Lighting can be balanced", kind: "warn" }); score -= 6;
    }

    score = Math.max(28, Math.min(96, Math.round(score)));
    const grade = score >= 85 ? "Great start" : score >= 65 ? "Good — with room to shine" : score >= 45 ? "Needs a fix" : "Rescue mode";
    return { score, grade, findings };
  }, [uploads]);


  const handleFilesSelected = async (incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/") || /\.(heic|heif|tiff|avif|svg)$/i.test(f.name));
    const videos = incoming.filter((f) => f.type.startsWith("video/"));
    if (!images.length && !videos.length) {
      toast({ title: "Unsupported files", description: "Upload images (PNG, JPEG, WebP, HEIC, TIFF, AVIF, SVG) or videos.", variant: "destructive" });
      return;
    }

    // Free trial quota: charge one credit per image/video added
    if (quota && !quota.unlimited) {
      const need = images.length + videos.length;
      const ok = await quota.consume(need);
      if (!ok) return;
    }

    setVideoFiles((prev) => [...prev, ...videos]);

    // Simulated upload progress (client-side files load instantly, but we surface progress UX)
    setUploadProgress(0);
    let processed = 0;
    const total = images.length || 1;

    const newUploads: UploadedFile[] = [];
    for (const file of images) {
      const previewUrl = URL.createObjectURL(file);
      objectUrlsRef.current.push(previewUrl);
      const meta = await analyzeImage(file, previewUrl);
      newUploads.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl,
        ...meta,
      });
      processed += 1;
      setUploadProgress(Math.round((processed / total) * 100));
    }

    setUploads((prev) => [...prev, ...newUploads]);
    setTimeout(() => setUploadProgress(0), 800);
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFilesSelected(Array.from(e.target.files));
    e.target.value = "";
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) handleFilesSelected(Array.from(e.dataTransfer.files));
  };

  const handleDestinationSelect = (d: Destination) => {
    if (d.isPaid && !isSubscribed) {
      toast({ title: "Upgrade required", description: `"${d.label}" is part of Creator+.` });
      createCheckout();
      return;
    }
    setDestination(d);
  };

  const handleOptimize = useCallback(async () => {
    if (!uploads.length) {
      toast({ title: "Add files first", description: "Upload one or more images to optimize." });
      return;
    }
    if (!destination) {
      toast({ title: "Pick a destination", description: "Tell us where these images will live." });
      return;
    }

    const pipelineResults = await processFiles(uploads.map((u) => u.file), {
      goal: destination.goal,
      seoRename,
      stripMetadata,
      storeMetrics: true,
      generateAltText,
    });

    const magic: MagicResult[] = pipelineResults.map((r, idx) => ({
      ...r,
      beforeUrl: uploads[idx]?.previewUrl ?? r.url,
      originalFile: uploads[idx]?.file,
    }));
    setResults(magic);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2200);

    const saved = pipelineResults.reduce((acc, r) => acc + (r.originalSize - r.optimizedSize), 0);
    toast({
      title: `${pipelineResults.length} file${pipelineResults.length > 1 ? "s" : ""} optimized`,
      description: `Saved ${formatBytes(saved)} · Destination: ${destination.label}`,
    });
  }, [uploads, destination, processFiles, toast, seoRename, stripMetadata, generateAltText]);

  const handleReset = () => {
    clearJobs();
    objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    objectUrlsRef.current = [];
    setUploads([]);
    setVideoFiles([]);
    setResults([]);
    setOpenSlider(null);
    setDestination(null);
  };

  const removeUpload = (id: string) => setUploads((prev) => prev.filter((u) => u.id !== id));
  const removeVideo = (index: number) => setVideoFiles((prev) => prev.filter((_, i) => i !== index));

  const totals = useMemo(() => {
    const original = results.reduce((a, r) => a + r.originalSize, 0);
    const optimized = results.reduce((a, r) => a + r.optimizedSize, 0);
    const saved = Math.max(0, original - optimized);
    const avgRatio = results.length
      ? Math.round(results.reduce((a, r) => a + r.compressionRatio, 0) / results.length)
      : 0;
    return { original, optimized, saved, avgRatio };
  }, [results]);

  const handleCopyShare = async (r: MagicResult) => {
    try {
      await navigator.clipboard.writeText(r.url);
      setCopiedId(r.seoFileName);
      setTimeout(() => setCopiedId(null), 1800);
      toast({ title: "Link copied", description: "Optimized file URL copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  const hasUploads = uploads.length > 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Success celebration overlay */}
      {showSuccess && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <div className="animate-scale-in rounded-3xl border border-primary/30 bg-background/90 px-10 py-8 shadow-[var(--shadow-glow)] backdrop-blur-xl">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                <div className="relative rounded-full bg-primary p-4 text-primary-foreground">
                  <Check className="h-8 w-8" strokeWidth={3} />
                </div>
              </div>
              <p className="text-lg font-semibold">Optimized ✨</p>
              <p className="text-xs text-muted-foreground">Your files are ready to download</p>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────── STEP 1 — DROPZONE ───────────────────── */}
      {!hasUploads && (
        <Card
          className={cn(
            "group relative cursor-pointer overflow-hidden border-2 border-dashed transition-all",
            isDragging
              ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)] scale-[1.01]"
              : "border-border/60 bg-card/60 hover:border-primary/50 hover:bg-card/80",
          )}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_55%)]" />
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT_TYPES}
            multiple
            className="hidden"
            onChange={onFileInput}
            aria-label="Upload images"
          />
          <div className="relative flex flex-col items-center gap-5 px-6 py-16 text-center md:py-24">
            <div className="rounded-2xl border border-primary/25 bg-primary/10 p-5 shadow-[var(--shadow-glow)] transition-transform group-hover:scale-105">
              <Upload className="h-10 w-10 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Drop your image to begin
              </h2>
              <p className="text-sm text-muted-foreground md:text-base">
                or <span className="font-medium text-primary underline underline-offset-4">click to browse</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {["PNG", "JPEG", "WebP", "HEIC", "TIFF", "AVIF", "SVG"].map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px] font-medium">
                  {t}
                </Badge>
              ))}
            </div>
            {uploadProgress > 0 && (
              <div className="w-full max-w-sm space-y-2">
                <Progress value={uploadProgress} className="h-1.5" />
                <p className="text-xs text-muted-foreground">Uploading… {uploadProgress}%</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ───────────────────── STEP 2 — PREVIEW + DESTINATION ───────────────────── */}
      {hasUploads && results.length === 0 && (
        <>
          {/* Preview strip */}
          <Card className="overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">
                  {uploads.length} image{uploads.length > 1 ? "s" : ""} ready
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="mr-1 h-3.5 w-3.5" /> Add more
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Clear
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_TYPES}
                  multiple
                  className="hidden"
                  onChange={onFileInput}
                  aria-label="Upload more images"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
              {uploads.map((u) => (
                <div
                  key={u.id}
                  className="group relative overflow-hidden rounded-xl border border-border/40 bg-muted/40 shadow-[var(--shadow-card)]"
                >
                  <div className="aspect-square overflow-hidden">
                    <img src={u.previewUrl} alt={u.file.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </div>
                  <div className="space-y-1 p-2.5">
                    <p className="truncate text-xs font-medium">{u.file.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{u.analysis ?? formatBytes(u.file.size)}</p>
                    <div className="flex items-center justify-between pt-1">
                      <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[10px]">
                        <Sparkles className="mr-1 h-2.5 w-2.5 text-primary" />
                        AI-ready
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{formatBytes(u.file.size)}</span>
                    </div>
                  </div>
                  <button
                    className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={(e) => { e.stopPropagation(); removeUpload(u.id); }}
                    aria-label={`Remove ${u.file.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {videoFiles.length > 0 && (
              <div className="border-t border-border/40 bg-amber-500/5 px-4 py-3">
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <Film className="mt-0.5 h-3.5 w-3.5" />
                  <span>
                    Videos detected ({videoFiles.length}). Use the <strong>AI Video Enhancer</strong> in the sidebar to compress video.
                    {videoFiles.map((f, i) => (
                      <button key={i} className="ml-2 underline hover:text-destructive" onClick={() => removeVideo(i)}>
                        remove {f.name}
                      </button>
                    ))}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {/* Destination picker */}
          <Card className="overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl">
            <div className="border-b border-border/40 px-5 py-4">
              <h3 className="text-lg font-semibold tracking-tight">What are you creating?</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Pick a destination — we'll auto-tune dimensions, format, and compression.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 md:grid-cols-5">
              {DESTINATIONS.map((d) => {
                const Icon = d.icon;
                const active = destination?.id === d.id;
                const locked = d.isPaid && !isSubscribed;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDestinationSelect(d)}
                    aria-pressed={active}
                    className={cn(
                      "group relative flex flex-col items-center gap-2 overflow-hidden rounded-xl border p-4 text-center transition-all duration-200",
                      active
                        ? "border-primary/60 bg-gradient-to-br shadow-[var(--shadow-glow)] ring-2 ring-primary/30 " + d.color
                        : "border-border/50 bg-background/50 hover:border-primary/30 hover:bg-background/80 hover:-translate-y-0.5",
                      locked && "opacity-75"
                    )}
                  >
                    {locked && <Lock className="absolute right-2 top-2 h-3 w-3 text-muted-foreground/70" />}
                    {active && (
                      <div className="absolute right-2 top-2 rounded-full bg-primary p-0.5 text-primary-foreground">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-xl p-3 transition-transform group-hover:scale-110",
                      active ? "bg-primary/20 text-primary" : "bg-secondary/80 text-foreground"
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-sm font-medium">{d.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{d.hint}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Advanced Settings */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="border-t border-border/40">
              <CollapsibleTrigger asChild>
                <button className="flex w-full items-center justify-between px-5 py-3 text-sm font-medium text-muted-foreground hover:bg-background/50 hover:text-foreground">
                  <span className="flex items-center gap-2">
                    <Wand2 className="h-3.5 w-3.5" />
                    Advanced Settings
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", advancedOpen && "rotate-180")} />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 border-t border-border/40 bg-background/40 px-5 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="seo-rename" className="text-sm">SEO-friendly filenames</Label>
                    <p className="text-xs text-muted-foreground">Rename files with descriptive keywords.</p>
                  </div>
                  <Switch id="seo-rename" checked={seoRename} onCheckedChange={setSeoRename} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="strip-meta" className="text-sm">Strip EXIF metadata</Label>
                    <p className="text-xs text-muted-foreground">Remove location, camera, and personal data.</p>
                  </div>
                  <Switch id="strip-meta" checked={stripMetadata} onCheckedChange={setStripMetadata} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="alt-text" className="text-sm">Generate AI alt text</Label>
                    <p className="text-xs text-muted-foreground">Uses AI credits — improves accessibility & SEO.</p>
                  </div>
                  <Switch id="alt-text" checked={generateAltText} onCheckedChange={setGenerateAltText} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Optimize CTA */}
            <div className="space-y-2 border-t border-border/40 bg-background/60 p-4 backdrop-blur-md">
              <Button
                size="lg"
                onClick={handleOptimize}
                disabled={isProcessing || !destination || uploads.length === 0}
                className="glow-btn h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Optimizing… {overallProgress}%
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    {destination ? `Optimize for ${destination.label}` : "Choose a destination"}
                  </>
                )}
              </Button>
              {isProcessing && <Progress value={overallProgress} className="h-1.5" />}
              {!isProcessing && destination && (
                <p className="text-center text-xs text-muted-foreground">
                  {uploads.length} file{uploads.length > 1 ? "s" : ""} · {destination.hint}
                </p>
              )}
            </div>
          </Card>
        </>
      )}

      {/* ───────────────────── STEP 3 — RESULT DASHBOARD ───────────────────── */}
      {results.length > 0 && (
        <OptimizationResultDashboard
          results={results}
          destinationLabel={destination?.label}
          onReset={handleReset}
        />
      )}
    </div>
  );
};
