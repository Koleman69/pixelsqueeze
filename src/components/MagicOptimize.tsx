import { useState, useRef, useCallback, useMemo, useEffect, type ChangeEvent, type DragEvent, type ElementType } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  FileArchive,
  Loader2,
  RotateCcw,
  Globe,
  Mail,
  Instagram,
  Music2,
  Printer,
  ShoppingCart,
  Home,
  Hotel,
  Linkedin,
  Settings2,
  Sparkles,
  Link2,
  Check,
  Lock,
  CheckCircle2,
  Wand2,
  Film,
  ArrowRight,
  ImageIcon,
  Gauge,
  ShieldCheck,
  Stars,
} from "lucide-react";
import { useOptimizationPipeline } from "@/hooks/useOptimizationPipeline";
import { PipelineResult, GoalPreset } from "@/services/imageOptimizationPipeline";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useToast } from "@/hooks/use-toast";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { cn } from "@/lib/utils";

// ─── Destinations ───────────────────────────────────────────────────────────

interface Destination {
  id: string;
  label: string;
  description: string;
  icon: ElementType;
  goal: GoalPreset;
  isPaid?: boolean;
  hint: string;
}

const DESTINATIONS: Destination[] = [
  { id: "web", label: "Website Speed", description: "WebP/AVIF • <250KB target", icon: Globe, goal: "web", hint: "AVIF/WebP" },
  { id: "instagram", label: "Instagram", description: "1080² • vivid colors", icon: Instagram, goal: "instagram", hint: "WebP/JPEG" },
  { id: "tiktok", label: "TikTok", description: "Vertical-friendly • fast load", icon: Music2, goal: "tiktok", hint: "WebP" },
  { id: "print", label: "Print", description: "Max resolution • minimal compression", icon: Printer, goal: "print", hint: "PNG/JPEG", isPaid: true },
  { id: "amazon", label: "Amazon Listing", description: "2000² square • white background", icon: ShoppingCart, goal: "amazon", hint: "JPEG", isPaid: true },
  { id: "email", label: "Email", description: "≤500KB • progressive JPEG", icon: Mail, goal: "email", hint: "JPEG" },
  { id: "airbnb", label: "Airbnb", description: "Bright rooms • smaller files", icon: Home, goal: "airbnb", hint: "JPEG" },
  { id: "hotel", label: "Hotel Website", description: "Luxury feel • architectural detail", icon: Hotel, goal: "hotel", hint: "JPEG/WebP", isPaid: true },
  { id: "linkedin", label: "LinkedIn", description: "1200×627 • professional sharpening", icon: Linkedin, goal: "linkedin", hint: "JPEG/WebP" },
  { id: "custom", label: "Custom", description: "Balanced defaults • 1920px • q85", icon: Settings2, goal: "custom", hint: "WebP/JPEG" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function estimatePageSpeedGain(originalKB: number, savedKB: number): number {
  if (originalKB <= 0) return 0;
  return Math.max(0, Math.min(95, Math.round((savedKB / originalKB) * 60)));
}

function qualityRetained(compressionRatio: number): number {
  return Math.max(70, Math.round(100 - Math.max(0, (compressionRatio - 50) * 0.3)));
}

interface MagicResult extends PipelineResult {
  beforeUrl: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface MagicOptimizeProps {
  isSubscribed?: boolean;
}

export const MagicOptimize = ({ isSubscribed = false }: MagicOptimizeProps) => {
  const { toast } = useToast();
  const { createCheckout } = useImageCompression();
  const { jobs, isProcessing, overallProgress, processFiles, downloadResult, downloadAllAsZip, clearJobs } =
    useOptimizationPipeline();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [destination, setDestination] = useState<Destination>(DESTINATIONS[0]);
  const [results, setResults] = useState<MagicResult[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openSlider, setOpenSlider] = useState<string | null>(null);

  const beforeUrlsRef = useRef<string[]>([]);

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      beforeUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const handleFilesSelected = (incoming: File[]) => {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    const videos = incoming.filter((f) => f.type.startsWith("video/"));
    if (images.length === 0 && videos.length === 0) {
      toast({ title: "Unsupported files", description: "Upload images or videos.", variant: "destructive" });
      return;
    }
    setFiles((prev) => [...prev, ...images]);
    setVideoFiles((prev) => [...prev, ...videos]);
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
    if (files.length === 0) {
      toast({ title: "Add files first", description: "Upload one or more images to optimize." });
      return;
    }
    // capture "before" URLs so the slider always has something to show
    const beforeUrls = files.map((f) => URL.createObjectURL(f));
    beforeUrlsRef.current.push(...beforeUrls);

    const pipelineResults = await processFiles(files, {
      goal: destination.goal,
      seoRename: true,
      stripMetadata: true,
      storeMetrics: true,
      generateAltText: false,
    });

    const magic: MagicResult[] = pipelineResults.map((r, idx) => ({
      ...r,
      beforeUrl: beforeUrls[idx],
    }));
    setResults(magic);

    const saved = pipelineResults.reduce((acc, r) => acc + (r.originalSize - r.optimizedSize), 0);
    toast({
      title: `${pipelineResults.length} file${pipelineResults.length > 1 ? "s" : ""} optimized`,
      description: `Saved ${formatBytes(saved)} • Destination: ${destination.label}`,
    });
  }, [files, destination, processFiles, toast]);

  const handleReset = () => {
    clearJobs();
    beforeUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    beforeUrlsRef.current = [];
    setFiles([]);
    setVideoFiles([]);
    setResults([]);
    setOpenSlider(null);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const removeVideo = (index: number) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totals = useMemo(() => {
    const original = results.reduce((a, r) => a + r.originalSize, 0);
    const optimized = results.reduce((a, r) => a + r.optimizedSize, 0);
    const saved = Math.max(0, original - optimized);
    const avgRatio = results.length
      ? Math.round(results.reduce((a, r) => a + r.compressionRatio, 0) / results.length)
      : 0;
    return {
      original,
      optimized,
      saved,
      avgRatio,
      speed: estimatePageSpeedGain(original / 1024, saved / 1024),
    };
  }, [results]);

  const handleCopyShare = async (r: MagicResult) => {
    try {
      // Lightweight share: copy the local blob URL.
      // (Server-side share links require auth + storage upload; offered separately.)
      await navigator.clipboard.writeText(r.url);
      setCopiedId(r.seoFileName);
      setTimeout(() => setCopiedId(null), 1800);
      toast({ title: "Link copied", description: "Optimized file URL copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl md:p-7">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.18),transparent_35%),radial-gradient(circle_at_top_right,hsl(var(--accent)/0.14),transparent_32%)]" />
        <div className="relative grid gap-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border border-primary/20 bg-primary/10 text-foreground hover:bg-primary/10">
                <Stars className="h-3.5 w-3.5 text-primary" />
                Magic Optimize
              </Badge>
              <Badge variant="outline" className="border-border/60 bg-background/30 text-muted-foreground">
                {files.length + videoFiles.length || 0} file{files.length + videoFiles.length === 1 ? "" : "s"} in session
              </Badge>
            </div>

            <div className="space-y-3">
              <h2 className="max-w-2xl text-2xl font-semibold tracking-tight md:text-4xl">
                Premium optimization tuned to where your media will actually live.
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                Upload once, choose a destination, and PixelSqueeze handles format, dimensions, compression, and presentation-quality output automatically.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-md">
                <Gauge className="mb-3 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Performance</p>
                <p className="mt-1 text-xl font-semibold">+{totals.speed}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Estimated page speed lift</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-md">
                <ImageIcon className="mb-3 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Savings</p>
                <p className="mt-1 text-xl font-semibold">{formatBytes(totals.saved)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Recovered from processed files</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/50 p-4 backdrop-blur-md">
                <ShieldCheck className="mb-3 h-4 w-4 text-primary" />
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Quality</p>
                <p className="mt-1 text-xl font-semibold">{results.length ? qualityRetained(totals.avgRatio) : 94}%</p>
                <p className="mt-1 text-xs text-muted-foreground">Visual quality retained</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-background/50 p-4 shadow-[var(--shadow-card)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Destination profile</p>
                <p className="mt-1 text-lg font-semibold">{destination.label}</p>
              </div>
              <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                {destination.hint}
              </div>
            </div>
            <div className="mt-4 space-y-3">
              <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Auto profile</p>
                <p className="mt-1 text-sm font-medium">{destination.description}</p>
              </div>
              <div className="rounded-xl border border-border/50 bg-card/70 p-3">
                <p className="text-xs text-muted-foreground">Workflow</p>
                <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                  <span>Upload</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Optimize</span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Download</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Destination grid */}
      <Card className="glass-card overflow-hidden border-border/40">
        <div className="border-b border-border/40 px-5 py-4 md:px-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Choose your destination
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                We’ll tune dimensions, format, and compression for the final channel automatically.
              </p>
            </div>
            {destination && (
              <Badge variant="secondary" className="w-fit border border-primary/20 bg-primary/10 text-foreground text-[11px]">
                Selected: {destination.label}
              </Badge>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5 p-4 sm:grid-cols-3 lg:grid-cols-5 md:p-5">
          {DESTINATIONS.map((d) => {
            const Icon = d.icon;
            const active = destination?.id === d.id;
            const locked = d.isPaid && !isSubscribed;
            return (
              <button
                key={d.id}
                onClick={() => handleDestinationSelect(d)}
                className={cn(
                  "relative flex min-h-[132px] flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all duration-200",
                  active
                    ? "border-primary/40 bg-primary/10 shadow-[var(--shadow-glow)] ring-1 ring-primary/20"
                    : "border-border/50 bg-background/40 hover:border-primary/30 hover:bg-background/70",
                  locked && "opacity-80"
                )}
                aria-label={`Select ${d.label}`}
              >
                {locked && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-muted-foreground/60" />}
                <div
                  className={cn(
                    "rounded-lg p-2.5",
                    active ? "bg-primary/20 text-primary" : "bg-secondary/80 text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <span className="block text-xs font-medium leading-tight">{d.label}</span>
                  <span className="block text-[10px] text-muted-foreground leading-tight line-clamp-2">{d.description}</span>
                </div>
                <span className="mt-auto text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{d.hint}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Upload area */}
      <Card
        className={cn(
          "glass-card cursor-pointer border-2 border-dashed p-6 transition-colors md:p-8",
          isDragging ? "border-primary bg-primary/10 shadow-[var(--shadow-glow)]" : "border-border/60 hover:border-primary/30",
          isProcessing && "pointer-events-none opacity-60"
        )}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={onFileInput}
          aria-label="Upload images or videos"
        />
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 shadow-[var(--shadow-glow)]">
            <Upload className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-base font-medium">
              Drop files here or <span className="text-primary underline">browse</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground md:text-sm">
              Images: JPG, PNG, WebP, AVIF • Videos: MP4, MOV, WebM
            </p>
          </div>
        </div>
      </Card>

      {/* Selected file list */}
      {(files.length > 0 || videoFiles.length > 0) && (
        <Card className="glass-card space-y-4 border-border/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">
              {files.length + videoFiles.length} file{files.length + videoFiles.length > 1 ? "s" : ""} ready
            </span>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isProcessing}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {files.map((f, idx) => (
              <Badge key={`img-${idx}`} variant="outline" className="gap-1.5 max-w-[220px]">
                <span className="truncate">{f.name}</span>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(idx);
                  }}
                  aria-label={`Remove ${f.name}`}
                >
                  ×
                </button>
              </Badge>
            ))}
            {videoFiles.map((f, idx) => (
              <Badge key={`vid-${idx}`} variant="outline" className="gap-1.5 max-w-[220px] border-amber-500/40">
                <Film className="w-3 h-3" />
                <span className="truncate">{f.name}</span>
                <button
                  className="text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeVideo(idx);
                  }}
                  aria-label={`Remove ${f.name}`}
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          {videoFiles.length > 0 && (
            <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md p-2 flex items-start gap-2">
              <Film className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>
                Magic Optimize for video is in beta — for now, use the <strong>AI Video Enhancer</strong> tool from the
                sidebar to compress and enhance videos.
              </span>
            </div>
          )}

          {/* Primary CTA */}
          <Button
            size="lg"
            onClick={handleOptimize}
            disabled={isProcessing || files.length === 0}
            className="glow-btn h-12 w-full rounded-xl bg-primary text-base text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Optimizing… {overallProgress}%
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                ✨ Optimize My Files
              </>
            )}
          </Button>
          {isProcessing && <Progress value={overallProgress} className="h-1.5 bg-secondary/80" />}
        </Card>
      )}

      {/* Results */}
      {results.length > 0 && (
        <Card className="glass-card overflow-hidden border-border/40">
          <div className="flex flex-col gap-3 border-b border-border/40 bg-background/40 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">
                {results.length} optimized for {destination.label}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {results.length > 1 && (
                <Button size="sm" onClick={() => downloadAllAsZip(results)} className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90">
                  <FileArchive className="w-3.5 h-3.5 mr-1" />
                  Download ZIP
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Start over
              </Button>
            </div>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 gap-px bg-border/40 sm:grid-cols-4">
            <div className="bg-background/60 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase text-muted-foreground">Saved</p>
              <p className="text-lg font-bold text-primary">{formatBytes(totals.saved)}</p>
            </div>
            <div className="bg-background/60 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase text-muted-foreground">Avg compression</p>
              <p className="text-lg font-bold">{totals.avgRatio}%</p>
            </div>
            <div className="bg-background/60 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase text-muted-foreground">Est. speed gain</p>
              <p className="text-lg font-bold text-primary">+{totals.speed}%</p>
            </div>
            <div className="bg-background/60 p-4 backdrop-blur-md">
              <p className="text-[11px] uppercase text-muted-foreground">Total optimized</p>
              <p className="text-lg font-bold">{formatBytes(totals.optimized)}</p>
            </div>
          </div>

          <div className="divide-y divide-border/40">
            {results.map((r) => {
              const quality = qualityRetained(r.compressionRatio);
              const speed = estimatePageSpeedGain(r.originalSize / 1024, (r.originalSize - r.optimizedSize) / 1024);
              const isOpen = openSlider === r.seoFileName;
              return (
                <div key={r.seoFileName} className="space-y-4 p-4 md:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/50 shadow-[var(--shadow-card)]">
                      <img src={r.url} alt={r.altText} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <p className="text-sm font-medium truncate">{r.seoFileName}</p>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs">
                        <div className="text-muted-foreground">
                          <span className="font-medium text-foreground">Original:</span>{" "}
                          {formatBytes(r.originalSize)} • {r.originalWidth}×{r.originalHeight}
                        </div>
                        <div className="text-muted-foreground">
                          <span className="font-medium text-foreground">Optimized:</span>{" "}
                          {formatBytes(r.optimizedSize)} • {r.outputWidth}×{r.outputHeight} • {r.format.toUpperCase()}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <Badge variant="outline" className="text-[10px] border-primary/20 bg-primary/5 text-foreground">
                          ✓ {r.compressionRatio}% smaller
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                          +{speed}% page speed
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {quality}% quality retained
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 flex-shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setOpenSlider(isOpen ? null : r.seoFileName)}>
                        {isOpen ? "Hide compare" : "Compare"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleCopyShare(r)}>
                        {copiedId === r.seoFileName ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1 text-green-500" /> Copied
                          </>
                        ) : (
                          <>
                            <Link2 className="w-3.5 h-3.5 mr-1" /> Share
                          </>
                        )}
                      </Button>
                      <Button size="sm" onClick={() => downloadResult(r)} className="bg-primary text-primary-foreground shadow-[var(--shadow-glow)] hover:bg-primary/90">
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>

                  {isOpen && (
                    <BeforeAfterSlider
                      beforeImage={r.beforeUrl}
                      afterImage={r.url}
                      title="Original vs Optimized"
                      description={`Drag to compare — ${formatBytes(r.originalSize)} → ${formatBytes(r.optimizedSize)}`}
                    />
                  )}

                  {/* AI Recommendations */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Wand2 className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold">Your image could improve further by:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {buildRecommendations(r).map((rec) => (
                        <Badge key={rec} variant="secondary" className="text-[10px] cursor-default">
                          • {rec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── Recommendations heuristics ─────────────────────────────────────────────

function buildRecommendations(r: PipelineResult): string[] {
  const recs: string[] = [];
  if (r.contentType === "photo" && r.compressionRatio < 40) recs.push("Increase clarity");
  if (r.outputWidth < 1200 || r.outputHeight < 1200) recs.push("Upscale 2×");
  if (r.format === "jpeg") recs.push("Convert to WebP/AVIF");
  if (r.contentType === "graphic" || r.contentType === "screenshot") recs.push("Remove background");
  if (recs.length === 0) recs.push("Looks great — already optimized");
  return recs.slice(0, 4);
}
