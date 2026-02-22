import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Download,
  FileArchive,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  RotateCcw,
  Globe,
  Mail,
  Instagram,
  ShoppingBag,
  Building2,
  Hotel,
  Store,
  Lock,
  Image as ImageIcon,
  FileText,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { useOptimizationPipeline, PipelineJob } from "@/hooks/useOptimizationPipeline";
import { PipelineResult, GoalPreset } from "@/services/imageOptimizationPipeline";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ─── Goal Definitions ───────────────────────────────────────────────────────

interface QuickGoal {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isPaid: boolean;
  pipelineGoal: GoalPreset;
  generateAlt: boolean;
  formatHint: string;
}

const quickGoals: QuickGoal[] = [
  {
    id: "website-speed",
    label: "Website Speed",
    description: "WebP/AVIF • responsive ready • max quality per KB",
    icon: Globe,
    isPaid: false,
    pipelineGoal: "web",
    generateAlt: true,
    formatHint: "AVIF / WebP",
  },
  {
    id: "email-attachment",
    label: "Email Attachment",
    description: "JPEG ≤500 KB • progressive • email-safe",
    icon: Mail,
    isPaid: false,
    pipelineGoal: "email",
    generateAlt: false,
    formatHint: "JPEG",
  },
  {
    id: "social-media",
    label: "Social Media",
    description: "Sharpened • vivid colors • 1200px",
    icon: Instagram,
    isPaid: false,
    pipelineGoal: "social",
    generateAlt: true,
    formatHint: "JPEG / WebP",
  },
  {
    id: "shopify-product",
    label: "Shopify Product",
    description: "2048² square • white bg • WebP",
    icon: ShoppingBag,
    isPaid: true,
    pipelineGoal: "ecommerce",
    generateAlt: true,
    formatHint: "WebP",
  },
  {
    id: "real-estate",
    label: "Real Estate Listing",
    description: "MLS-compliant • 2400×1600 • JPEG",
    icon: Building2,
    isPaid: true,
    pipelineGoal: "web",
    generateAlt: true,
    formatHint: "JPEG",
  },
  {
    id: "hotel-ota",
    label: "Hotel OTA Upload",
    description: "Booking / Expedia / Airbnb sizes",
    icon: Hotel,
    isPaid: true,
    pipelineGoal: "web",
    generateAlt: false,
    formatHint: "JPEG",
  },
  {
    id: "marketplace",
    label: "Marketplace Listing",
    description: "1600² square • white bg • eBay / Amazon",
    icon: Store,
    isPaid: true,
    pipelineGoal: "ecommerce",
    generateAlt: true,
    formatHint: "JPEG",
  },
];

// Goal-specific overrides that extend the pipeline preset
const goalOverrides: Record<string, Partial<{
  forceFormat: "jpeg" | "webp" | "avif" | "png";
  maxDimension: number;
  quality: number;
}>> = {
  "real-estate": { forceFormat: "jpeg", maxDimension: 2400, quality: 82 },
  "hotel-ota": { forceFormat: "jpeg", maxDimension: 2880, quality: 80 },
  "marketplace": { forceFormat: "jpeg", maxDimension: 1600, quality: 85 },
};

// ─── Component ──────────────────────────────────────────────────────────────

interface QuickOptimizeProps {
  isSubscribed?: boolean;
}

export const QuickOptimize = ({ isSubscribed = false }: QuickOptimizeProps) => {
  const { toast } = useToast();
  const { createCheckout } = useImageCompression();
  const {
    jobs,
    isProcessing,
    overallProgress,
    processFiles,
    downloadResult,
    downloadAllAsZip,
    clearJobs,
  } = useOptimizationPipeline();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedGoal, setSelectedGoal] = useState<QuickGoal | null>(null);
  const [generateAltText, setGenerateAltText] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [results, setResults] = useState<PipelineResult[]>([]);
  const [copiedAlt, setCopiedAlt] = useState<string | null>(null);

  // ── Step: Select Goal ──
  const handleGoalSelect = (goal: QuickGoal) => {
    if (goal.isPaid && !isSubscribed) {
      toast({
        title: "Upgrade Required",
        description: `"${goal.label}" is available on Creator+ plans.`,
      });
      createCheckout();
      return;
    }
    setSelectedGoal(goal);
    setGenerateAltText(goal.generateAlt);
  };

  // ── Step: Process Files ──
  const handleFiles = useCallback(
    async (files: File[]) => {
      if (!selectedGoal) return;
      if (files.length === 0) return;

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      if (imageFiles.length === 0) {
        toast({ title: "No images found", description: "Please upload image files.", variant: "destructive" });
        return;
      }

      const overrides = goalOverrides[selectedGoal.id] ?? {};

      const pipelineResults = await processFiles(imageFiles, {
        goal: selectedGoal.pipelineGoal,
        generateAltText,
        seoRename: true,
        stripMetadata: true,
        storeMetrics: true,
        forceFormat: overrides.forceFormat,
        maxDimension: overrides.maxDimension,
        quality: overrides.quality,
      });

      setResults(pipelineResults);

      const totalSaved = pipelineResults.reduce((acc, r) => acc + (r.originalSize - r.optimizedSize), 0);
      toast({
        title: `${pipelineResults.length} image${pipelineResults.length > 1 ? "s" : ""} optimized`,
        description: `Saved ${formatBytes(totalSaved)} total`,
      });
    },
    [selectedGoal, generateAltText, processFiles, toast]
  );

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      await handleFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      await handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleReset = () => {
    clearJobs();
    setResults([]);
    setSelectedGoal(null);
  };

  const copyAltText = (alt: string, fileName: string) => {
    navigator.clipboard.writeText(alt);
    setCopiedAlt(fileName);
    setTimeout(() => setCopiedAlt(null), 2000);
  };

  // ── Render: Goal Selection ──
  if (!selectedGoal) {
    return (
      <Card className="p-6 space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-semibold text-foreground">What's your goal?</h3>
          <p className="text-sm text-muted-foreground">
            We'll apply the best format, size, and compression automatically.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickGoals.map((goal) => {
            const Icon = goal.icon;
            const locked = goal.isPaid && !isSubscribed;
            return (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-150",
                  locked
                    ? "border-border/40 bg-muted/30 hover:border-primary/30"
                    : "border-border hover:border-primary hover:bg-primary/5 hover:shadow-sm"
                )}
              >
                {locked && <Lock className="absolute top-2 right-2 w-3.5 h-3.5 text-muted-foreground/50" />}
                <div className={cn("p-2.5 rounded-lg", locked ? "bg-muted" : "bg-secondary")}>
                  <Icon className={cn("w-5 h-5", locked ? "text-muted-foreground/50" : "text-foreground")} />
                </div>
                <span className={cn("text-sm font-medium leading-tight", locked ? "text-muted-foreground/50" : "text-foreground")}>
                  {goal.label}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">{goal.description}</span>
                {locked && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                    Creator+
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </Card>
    );
  }

  // ── Render: Upload + Results ──
  const completedResults = results.filter((r) => r.optimizedSize > 0);
  const hasResults = completedResults.length > 0;

  return (
    <div className="space-y-6">
      {/* Active Goal Banner */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <selectedGoal.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Optimizing for: <span className="text-primary">{selectedGoal.label}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {selectedGoal.formatHint} • SEO filenames • metadata stripped
                {generateAltText && " • AI alt text"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch
                id="alt-text-toggle"
                checked={generateAltText}
                onCheckedChange={setGenerateAltText}
                disabled={isProcessing}
              />
              <Label htmlFor="alt-text-toggle" className="text-xs text-muted-foreground cursor-pointer">
                AI Alt Text
              </Label>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} disabled={isProcessing}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Change Goal
            </Button>
          </div>
        </div>
      </Card>

      {/* Upload Area */}
      <Card
        className={cn(
          "p-8 border-2 border-dashed transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
          isProcessing && "pointer-events-none opacity-60"
        )}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileInput}
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {isProcessing ? (
            <>
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Optimizing images…</p>
                <p className="text-xs text-muted-foreground">
                  {jobs.filter((j) => j.status === "completed").length} / {jobs.filter((j) => j.status !== "pending" || j.status === "pending").length} completed
                </p>
              </div>
              <Progress value={overallProgress} className="w-64 h-2" />
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Drop images here or <span className="text-primary underline">browse</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPEG, WebP, AVIF • Up to 50 images at once
                </p>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Results Table */}
      {hasResults && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-foreground">
                {completedResults.length} image{completedResults.length > 1 ? "s" : ""} optimized
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Start Over
              </Button>
              {completedResults.length > 1 && (
                <Button size="sm" onClick={() => downloadAllAsZip(completedResults)}>
                  <FileArchive className="w-3.5 h-3.5 mr-1" />
                  Download ZIP
                </Button>
              )}
            </div>
          </div>

          <div className="divide-y divide-border">
            {completedResults.map((result, idx) => (
              <div key={idx} className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={result.url} alt={result.altText} className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Filename */}
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground truncate">{result.seoFileName}</span>
                  </div>

                  {/* Alt text */}
                  {result.altText && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs text-muted-foreground truncate flex-1">{result.altText}</span>
                      <button
                        onClick={() => copyAltText(result.altText, result.seoFileName)}
                        className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        {copiedAlt === result.seoFileName ? (
                          <Check className="w-3.5 h-3.5 text-green-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {result.format.toUpperCase()}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {result.outputWidth}×{result.outputHeight}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-600">
                      {result.compressionRatio}% smaller
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatBytes(result.originalSize)} → {formatBytes(result.optimizedSize)}
                    </span>
                  </div>
                </div>

                {/* Download */}
                <Button variant="outline" size="sm" onClick={() => downloadResult(result)} className="flex-shrink-0">
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>

          {/* Summary Footer */}
          <div className="p-4 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total saved:{" "}
                <span className="font-semibold text-foreground">
                  {formatBytes(completedResults.reduce((acc, r) => acc + (r.originalSize - r.optimizedSize), 0))}
                </span>
              </span>
              <span className="text-muted-foreground">
                Avg compression:{" "}
                <span className="font-semibold text-foreground">
                  {Math.round(completedResults.reduce((acc, r) => acc + r.compressionRatio, 0) / completedResults.length)}%
                </span>
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
