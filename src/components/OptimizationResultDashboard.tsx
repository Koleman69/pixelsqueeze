import { useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import JSZip from "jszip";
import {
  Download,
  FileArchive,
  RotateCcw,
  Sparkles,
  Gauge,
  Ruler,
  Zap,
  TrendingDown,
  CheckCircle2,
  Loader2,
  Wand2,
  Globe,
  Printer,
  Share2,
  ImageIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { useOptimizationPipeline } from "@/hooks/useOptimizationPipeline";
import {
  runOptimizationPipeline,
  PipelineResult,
  GoalPreset,
  OutputFormat,
} from "@/services/imageOptimizationPipeline";
import { cn } from "@/lib/utils";

export interface DashboardResult extends PipelineResult {
  beforeUrl: string;
  originalFile?: File;
}

interface Props {
  results: DashboardResult[];
  destinationLabel?: string;
  onReset: () => void;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function qualityScore(r: PipelineResult) {
  // Heuristic 0-100: reward compression while penalising extreme downscaling
  const compression = Math.min(100, r.compressionRatio);
  const pixelRetention =
    (r.outputWidth * r.outputHeight) /
    Math.max(1, r.originalWidth * r.originalHeight);
  const retentionScore = Math.min(1, pixelRetention) * 100;
  const score = Math.round(compression * 0.55 + retentionScore * 0.45);
  return Math.max(60, Math.min(99, score));
}

function speedImprovement(savedBytes: number) {
  // Rough LCP improvement: ~1ms per KB saved on 3G, cap 3.5s
  const ms = Math.min(3500, (savedBytes / 1024) * 1.2);
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s faster` : `${Math.round(ms)}ms faster`;
}

function suggestionsFor(r: PipelineResult): string[] {
  const s: string[] = [];
  if (r.format !== "webp" && r.format !== "avif")
    s.push("Export a WebP copy for 20-35% smaller website loads.");
  if (r.originalWidth > 3000)
    s.push("Original is oversized — the resized version is ideal for web.");
  if (r.compressionRatio < 30)
    s.push("Try a Social or Website preset for stronger compression.");
  if (!r.metadataStripped) s.push("Strip EXIF metadata for privacy and size.");
  if (r.originalHeight >= 2000 && r.contentType === "photo")
    s.push("Great candidate for AI upscaling if you need a print version.");
  if (s.length === 0) s.push("Perfectly optimized — ready to publish.");
  return s;
}

const PACK_GOALS: { key: string; label: string; goals: GoalPreset[]; icon: any; format?: OutputFormat }[] = [
  { key: "webp", label: "WebP", goals: ["web"], icon: Globe, format: "webp" },
  { key: "print", label: "Print", goals: ["print"], icon: Printer },
  { key: "social", label: "Social Pack", goals: ["instagram", "facebook", "linkedin", "tiktok", "pinterest"], icon: Share2 },
  { key: "website", label: "Website Pack", goals: ["web", "thumbnail", "email"], icon: Globe, format: "webp" },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function OptimizationResultDashboard({ results, destinationLabel, onReset }: Props) {
  const { toast } = useToast();
  const { downloadResult, downloadAllAsZip } = useOptimizationPipeline();
  const [busyPack, setBusyPack] = useState<string | null>(null);

  const totals = useMemo(() => {
    const original = results.reduce((a, r) => a + r.originalSize, 0);
    const optimized = results.reduce((a, r) => a + r.optimizedSize, 0);
    const saved = Math.max(0, original - optimized);
    const avgRatio = results.length
      ? Math.round(results.reduce((a, r) => a + r.compressionRatio, 0) / results.length)
      : 0;
    const avgQuality = results.length
      ? Math.round(results.reduce((a, r) => a + qualityScore(r), 0) / results.length)
      : 0;
    return { original, optimized, saved, avgRatio, avgQuality };
  }, [results]);

  const downloadPack = useCallback(
    async (pack: (typeof PACK_GOALS)[number], scope: "single" | "all", target?: DashboardResult) => {
      const key = `${pack.key}-${scope}-${target?.seoFileName ?? "all"}`;
      setBusyPack(key);
      try {
        const files: { name: string; blob: Blob }[] = [];
        const sources = scope === "single" && target ? [target] : results;
        for (const r of sources) {
          if (!r.originalFile) continue;
          for (const goal of pack.goals) {
            const out = await runOptimizationPipeline(
              r.originalFile,
              { goal, forceFormat: pack.format, storeMetrics: false, seoRename: true, stripMetadata: true },
              0,
            );
            const suffix = pack.goals.length > 1 ? `-${goal}` : "";
            const dot = out.seoFileName.lastIndexOf(".");
            const name = dot > 0
              ? `${out.seoFileName.slice(0, dot)}${suffix}${out.seoFileName.slice(dot)}`
              : `${out.seoFileName}${suffix}`;
            files.push({ name, blob: out.blob });
          }
        }

        if (files.length === 0) {
          toast({ title: "No files to pack", description: "Missing source images.", variant: "destructive" });
          return;
        }

        if (files.length === 1) {
          const url = URL.createObjectURL(files[0].blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = files[0].name;
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 60000);
        } else {
          const zip = new JSZip();
          for (const f of files) zip.file(f.name, await f.blob.arrayBuffer());
          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${pack.key}-pack-${Date.now()}.zip`;
          a.rel = "noopener";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            a.remove();
            URL.revokeObjectURL(url);
          }, 60000);
        }

        toast({ title: `${pack.label} ready`, description: `${files.length} file${files.length > 1 ? "s" : ""} prepared.` });
      } catch (e) {
        console.error(e);
        toast({ title: "Pack failed", description: (e as Error).message, variant: "destructive" });
      } finally {
        setBusyPack(null);
      }
    },
    [results, toast],
  );

  if (results.length === 0) return null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
      className="space-y-6"
    >
      {/* HEADER */}
      <motion.div variants={cardVariants} custom={0}>
        <Card className="relative overflow-hidden border-border/40 bg-gradient-to-br from-primary/10 via-card/80 to-secondary/10 backdrop-blur-xl">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(600px_circle_at_20%_20%,hsl(var(--primary)/0.25),transparent),radial-gradient(500px_circle_at_80%_80%,hsl(var(--secondary)/0.2),transparent)]" />
          <div className="relative flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-[var(--shadow-glow)]"
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold tracking-tight md:text-2xl">
                  {results.length} image{results.length > 1 ? "s" : ""} optimized
                  {destinationLabel ? ` · ${destinationLabel}` : ""}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Saved {formatBytes(totals.saved)} · avg quality {totals.avgQuality}/100 · {speedImprovement(totals.saved)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PACK_GOALS.map((pack) => {
                const Icon = pack.icon;
                const key = `${pack.key}-all-all`;
                const busy = busyPack === key;
                return (
                  <Button
                    key={pack.key}
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => downloadPack(pack, "all")}
                    className="border-primary/30 bg-background/60 backdrop-blur transition hover:border-primary hover:bg-primary/10"
                  >
                    {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Icon className="mr-1.5 h-3.5 w-3.5" />}
                    {pack.label}
                  </Button>
                );
              })}
              <Button
                size="sm"
                onClick={() => downloadAllAsZip(results)}
                className="bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
              >
                <FileArchive className="mr-1.5 h-3.5 w-3.5" />
                Download All
              </Button>
              <Button size="sm" variant="ghost" onClick={onReset}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Start over
              </Button>
            </div>
          </div>

          {/* Aggregate metric cells */}
          <div className="relative grid grid-cols-2 gap-px border-t border-border/40 bg-border/40 md:grid-cols-4">
            <MetricCell icon={TrendingDown} label="Saved" value={formatBytes(totals.saved)} accent />
            <MetricCell icon={Gauge} label="Avg quality" value={`${totals.avgQuality}/100`} />
            <MetricCell icon={FileArchive} label="Compressed" value={`${totals.avgRatio}%`} />
            <MetricCell icon={Zap} label="Speed gain" value={speedImprovement(totals.saved)} />
          </div>
        </Card>
      </motion.div>

      {/* PER RESULT */}
      {results.map((r, i) => {
        const score = qualityScore(r);
        const saved = Math.max(0, r.originalSize - r.optimizedSize);
        const suggestions = suggestionsFor(r);
        return (
          <motion.div key={r.seoFileName} custom={i + 1} variants={cardVariants}>
            <Card className="overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl">
              <div className="grid gap-0 lg:grid-cols-5">
                {/* Comparison */}
                <div className="lg:col-span-3">
                  <div className="border-b border-border/40 bg-background/40 p-3">
                    <BeforeAfterSlider
                      beforeImage={r.beforeUrl}
                      afterImage={r.url}
                      title="Original vs Optimized"
                      description={`${formatBytes(r.originalSize)} → ${formatBytes(r.optimizedSize)}`}
                    />
                  </div>
                </div>

                {/* Stats + actions */}
                <div className="space-y-4 p-5 lg:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/50">
                      <img src={r.url} alt={r.altText} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{r.seoFileName}</p>
                      <p className="text-xs text-muted-foreground">{r.format.toUpperCase()} · {r.contentType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <MiniStat icon={Gauge} label="Quality" value={`${score}`} suffix="/100" />
                    <MiniStat icon={TrendingDown} label="Saved" value={formatBytes(saved)} sub={`${r.compressionRatio}% smaller`} />
                    <MiniStat icon={Ruler} label="Resolution" value={`${r.outputWidth}×${r.outputHeight}`} sub={`from ${r.originalWidth}×${r.originalHeight}`} />
                    <MiniStat icon={Zap} label="Speed gain" value={speedImprovement(saved)} />
                  </div>

                  {/* Suggestions */}
                  <div className="rounded-xl border border-border/40 bg-background/40 p-3">
                    <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <Wand2 className="h-3.5 w-3.5 text-primary" />
                      Suggested improvements
                    </div>
                    <ul className="space-y-1.5">
                      {suggestions.map((s, idx) => (
                        <motion.li
                          key={idx}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + idx * 0.05 }}
                          className="flex items-start gap-2 text-xs text-foreground/90"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary" />
                          <span>{s}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>

                  {/* Download buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => downloadResult(r)}
                      className="col-span-2 bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[var(--shadow-glow)] hover:opacity-95"
                    >
                      <Download className="mr-1.5 h-4 w-4" />
                      Download
                    </Button>
                    {PACK_GOALS.map((pack) => {
                      const Icon = pack.icon;
                      const key = `${pack.key}-single-${r.seoFileName}`;
                      const busy = busyPack === key;
                      const disabled = !r.originalFile || busy;
                      return (
                        <Button
                          key={pack.key}
                          size="sm"
                          variant="outline"
                          disabled={disabled}
                          onClick={() => downloadPack(pack, "single", r)}
                          className="border-border/60 bg-background/60 hover:border-primary hover:bg-primary/10"
                        >
                          {busy ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Icon className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {pack.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function MetricCell({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-background/70 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className={cn("text-lg font-bold md:text-xl", accent && "bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent")}>
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
}: {
  icon: any;
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-border/40 bg-background/50 p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <p className="mt-0.5 text-sm font-bold">
        {value}
        {suffix && <span className="text-xs font-medium text-muted-foreground">{suffix}</span>}
      </p>
      {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
    </div>
  );
}
