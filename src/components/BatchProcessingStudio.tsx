import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  FolderOpen,
  FileArchive,
  Play,
  Pause,
  StopCircle,
  RotateCcw,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Pencil,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

type OutputFormat = "webp" | "jpeg" | "png" | "keep";
type JobStatus = "queued" | "processing" | "done" | "error" | "canceled";

interface Job {
  id: string;
  file: File;
  originalName: string;
  renamedTo: string;
  originalSize: number;
  outputSize?: number;
  status: JobStatus;
  progress: number;
  error?: string;
  outputBlob?: Blob;
  outputMime?: string;
  durationMs?: number;
}

interface Settings {
  format: OutputFormat;
  quality: number; // 0.5 - 1
  maxDimension: number; // 0 = keep original
}

const CONCURRENCY = 2; // low = stable memory
const uid = () => Math.random().toString(36).slice(2, 10);

function extForMime(mime: string): string {
  if (/webp/.test(mime)) return "webp";
  if (/jpe?g/.test(mime)) return "jpg";
  if (/png/.test(mime)) return "png";
  return "img";
}

function targetMime(format: OutputFormat, srcType: string): string {
  if (format === "keep") return srcType || "image/jpeg";
  if (format === "webp") return "image/webp";
  if (format === "png") return "image/png";
  return "image/jpeg";
}

function bytesFmt(n?: number) {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function formatDuration(ms: number) {
  if (!isFinite(ms) || ms < 0) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  if (m < 60) return `${m}m ${rem}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    // Revoke after decode; img now holds decoded data
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function processOne(
  job: Job,
  settings: Settings,
  signal: AbortSignal
): Promise<{ blob: Blob; mime: string }> {
  if (signal.aborted) throw new DOMException("aborted", "AbortError");
  const img = await loadImageFromFile(job.file);
  if (signal.aborted) throw new DOMException("aborted", "AbortError");

  let w = img.width;
  let h = img.height;
  const maxD = settings.maxDimension;
  if (maxD > 0 && Math.max(w, h) > maxD) {
    const scale = maxD / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, w, h);

  const mime = targetMime(settings.format, job.file.type);
  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Encode failed"))),
      mime,
      settings.quality
    );
  });

  // Release canvas memory hints
  canvas.width = 0;
  canvas.height = 0;

  return { blob, mime };
}

async function expandFiles(files: File[]): Promise<File[]> {
  const out: File[] = [];
  for (const f of files) {
    if (/\.zip$/i.test(f.name) || f.type === "application/zip") {
      try {
        const zip = await JSZip.loadAsync(f);
        const entries = Object.values(zip.files).filter((e) => !e.dir);
        for (const entry of entries) {
          if (!/\.(png|jpe?g|webp|gif|bmp|avif|tiff?|heic)$/i.test(entry.name)) continue;
          const blob = await entry.async("blob");
          const name = entry.name.split("/").pop() || entry.name;
          const guessed =
            /webp/i.test(name) ? "image/webp" :
            /png/i.test(name) ? "image/png" :
            /jpe?g/i.test(name) ? "image/jpeg" :
            blob.type || "image/jpeg";
          out.push(new File([blob], name, { type: guessed }));
        }
      } catch (e) {
        console.error("ZIP read failed", e);
        toast.error(`Could not read ${f.name}`);
      }
    } else if (f.type.startsWith("image/")) {
      out.push(f);
    }
  }
  return out;
}

export const BatchProcessingStudio = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const jobsRef = useRef<Job[]>([]);
  jobsRef.current = jobs;

  const [settings, setSettings] = useState<Settings>({
    format: "webp",
    quality: 0.85,
    maxDimension: 2000,
  });

  const [state, setState] = useState<"idle" | "running" | "paused">("idle");
  const stateRef = useRef(state);
  stateRef.current = state;

  const abortRef = useRef<AbortController | null>(null);
  const pauseGateRef = useRef<Promise<void>>(Promise.resolve());
  const resumeResolverRef = useRef<(() => void) | null>(null);

  const [expandingCount, setExpandingCount] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Derived stats
  const stats = useMemo(() => {
    const total = jobs.length;
    const done = jobs.filter((j) => j.status === "done").length;
    const errored = jobs.filter((j) => j.status === "error").length;
    const processing = jobs.filter((j) => j.status === "processing").length;
    const queued = jobs.filter((j) => j.status === "queued").length;
    const savedBytes = jobs.reduce(
      (acc, j) => acc + (j.status === "done" && j.outputSize ? j.originalSize - j.outputSize : 0),
      0
    );
    const totalOriginal = jobs.reduce((acc, j) => acc + j.originalSize, 0);
    return { total, done, errored, processing, queued, savedBytes, totalOriginal };
  }, [jobs]);

  const eta = useMemo(() => {
    if (state !== "running" || !startedAt || completedCount === 0) return null;
    const elapsed = Date.now() - startedAt;
    const per = elapsed / completedCount;
    const remaining = jobsRef.current.filter((j) => j.status === "queued" || j.status === "processing").length;
    return per * remaining;
  }, [state, startedAt, completedCount, jobs]);

  const updateJob = useCallback((id: string, patch: Partial<Job>) => {
    setJobs((prev) => prev.map((j) => (j.id === id ? { ...j, ...patch } : j)));
  }, []);

  const addFiles = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setExpandingCount((c) => c + files.length);
    try {
      const expanded = await expandFiles(files);
      if (!expanded.length) {
        toast.error("No supported images found");
        return;
      }
      const newJobs: Job[] = expanded.map((f) => ({
        id: uid(),
        file: f,
        originalName: f.name,
        renamedTo: f.name.replace(/\.[^.]+$/, ""),
        originalSize: f.size,
        status: "queued",
        progress: 0,
      }));
      setJobs((prev) => [...prev, ...newJobs]);
      toast.success(`Queued ${newJobs.length} image${newJobs.length === 1 ? "" : "s"}`);
    } finally {
      setExpandingCount((c) => Math.max(0, c - files.length));
    }
  }, []);

  const waitIfPaused = useCallback(async () => {
    if (stateRef.current !== "paused") return;
    await new Promise<void>((resolve) => {
      resumeResolverRef.current = resolve;
    });
  }, []);

  const runQueue = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setState("running");
    setStartedAt((s) => s ?? Date.now());

    const workers: Promise<void>[] = [];
    let cursor = 0;

    const takeNext = (): Job | null => {
      const all = jobsRef.current;
      while (cursor < all.length) {
        const j = all[cursor++];
        if (j.status === "queued") return j;
      }
      // second pass — pick anything still queued (jobs may have been retried)
      const retry = jobsRef.current.find((j) => j.status === "queued");
      return retry ?? null;
    };

    const worker = async () => {
      while (!controller.signal.aborted) {
        await waitIfPaused();
        if (controller.signal.aborted) return;
        const next = takeNext();
        if (!next) return;
        updateJob(next.id, { status: "processing", progress: 15 });
        const t0 = performance.now();
        try {
          await waitIfPaused();
          const { blob, mime } = await processOne(next, settings, controller.signal);
          if (controller.signal.aborted) {
            updateJob(next.id, { status: "canceled", progress: 0 });
            return;
          }
          updateJob(next.id, {
            status: "done",
            progress: 100,
            outputBlob: blob,
            outputMime: mime,
            outputSize: blob.size,
            durationMs: performance.now() - t0,
          });
          setCompletedCount((c) => c + 1);
        } catch (e) {
          if ((e as any)?.name === "AbortError") {
            updateJob(next.id, { status: "canceled", progress: 0 });
            return;
          }
          console.error(e);
          updateJob(next.id, { status: "error", progress: 0, error: (e as Error).message });
        }
      }
    };

    for (let i = 0; i < CONCURRENCY; i++) workers.push(worker());
    await Promise.all(workers);

    if (!controller.signal.aborted) {
      setState("idle");
      toast.success("Batch complete");
    }
  }, [settings, updateJob, waitIfPaused]);

  const handleStart = useCallback(() => {
    const hasQueued = jobsRef.current.some((j) => j.status === "queued");
    if (!hasQueued) {
      toast.error("Nothing queued to process");
      return;
    }
    setCompletedCount(0);
    setStartedAt(Date.now());
    void runQueue();
  }, [runQueue]);

  const handlePause = useCallback(() => {
    if (stateRef.current !== "running") return;
    setState("paused");
  }, []);

  const handleResume = useCallback(() => {
    if (stateRef.current !== "paused") return;
    setState("running");
    resumeResolverRef.current?.();
    resumeResolverRef.current = null;
  }, []);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    resumeResolverRef.current?.();
    resumeResolverRef.current = null;
    setState("idle");
    setJobs((prev) =>
      prev.map((j) =>
        j.status === "processing" || j.status === "queued"
          ? { ...j, status: "canceled", progress: 0 }
          : j
      )
    );
    toast.info("Batch canceled");
  }, []);

  const retryFailed = useCallback(() => {
    setJobs((prev) =>
      prev.map((j) =>
        j.status === "error" || j.status === "canceled"
          ? { ...j, status: "queued", progress: 0, error: undefined }
          : j
      )
    );
    setTimeout(() => {
      if (stateRef.current === "idle") handleStart();
    }, 30);
  }, [handleStart]);

  const retryOne = useCallback(
    (id: string) => {
      updateJob(id, { status: "queued", progress: 0, error: undefined });
      setTimeout(() => {
        if (stateRef.current === "idle") handleStart();
      }, 30);
    },
    [handleStart, updateJob]
  );

  const removeOne = useCallback((id: string) => {
    setJobs((prev) => prev.filter((j) => j.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    handleCancel();
    setJobs([]);
    setCompletedCount(0);
    setStartedAt(null);
  }, [handleCancel]);

  const downloadOne = useCallback((job: Job) => {
    if (!job.outputBlob || !job.outputMime) return;
    const ext = extForMime(job.outputMime);
    const url = URL.createObjectURL(job.outputBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job.renamedTo || job.originalName.replace(/\.[^.]+$/, "")}.${ext}`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 60_000);
  }, []);

  const downloadZip = useCallback(async () => {
    const ready = jobsRef.current.filter((j) => j.status === "done" && j.outputBlob);
    if (!ready.length) {
      toast.error("Nothing to download yet");
      return;
    }
    toast.info("Building ZIP…");
    try {
      const zip = new JSZip();
      // De-dupe names
      const used = new Map<string, number>();
      for (const j of ready) {
        const ext = extForMime(j.outputMime!);
        let base = j.renamedTo || j.originalName.replace(/\.[^.]+$/, "");
        base = base.replace(/[\\/:*?"<>|]/g, "_");
        const key = `${base}.${ext}`;
        const c = used.get(key) ?? 0;
        used.set(key, c + 1);
        const finalName = c === 0 ? key : `${base}-${c + 1}.${ext}`;
        zip.file(finalName, j.outputBlob!);
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "STORE" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pixelsqueeze-batch-${Date.now()}.zip`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 60_000);
      toast.success("ZIP downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not build ZIP");
    }
  }, []);

  // Cleanup blobs on unmount
  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    []
  );

  const overallProgress = stats.total
    ? Math.round(((stats.done + stats.errored) / stats.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header + uploaders */}
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
        onDrop={async (e) => {
          e.preventDefault();
          setIsDragging(false);
          const items = Array.from(e.dataTransfer.files || []);
          if (items.length) addFiles(items);
        }}
      >
        <div className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                <Layers className="w-3.5 h-3.5" />
                Batch Studio
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Optimize hundreds of images at once.
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                Drop a folder, upload a ZIP, or select hundreds of images. Pause, resume, cancel, retry
                failures, rename, and download everything as a single archive.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileInputRef.current?.click()} variant="default">
                <Upload className="w-4 h-4 mr-2" />
                Add images
              </Button>
              <Button onClick={() => folderInputRef.current?.click()} variant="outline">
                <FolderOpen className="w-4 h-4 mr-2" />
                Add folder
              </Button>
              <Button onClick={() => zipInputRef.current?.click()} variant="outline">
                <FileArchive className="w-4 h-4 mr-2" />
                Add ZIP
              </Button>
            </div>
          </div>

          {/* Settings row */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Output format</label>
              <Select
                value={settings.format}
                onValueChange={(v) => setSettings((s) => ({ ...s, format: v as OutputFormat }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (recommended)</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="keep">Keep original</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Quality: {Math.round(settings.quality * 100)}%
              </label>
              <input
                type="range"
                min={50}
                max={100}
                step={1}
                value={Math.round(settings.quality * 100)}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, quality: Number(e.target.value) / 100 }))
                }
                className="w-full mt-3 accent-primary"
                aria-label="Output quality"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Max long edge (px)</label>
              <Select
                value={String(settings.maxDimension)}
                onValueChange={(v) => setSettings((s) => ({ ...s, maxDimension: Number(v) }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Keep original</SelectItem>
                  <SelectItem value="1200">1200 px</SelectItem>
                  <SelectItem value="1600">1600 px</SelectItem>
                  <SelectItem value="2000">2000 px</SelectItem>
                  <SelectItem value="2560">2560 px</SelectItem>
                  <SelectItem value="4000">4000 px</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          aria-label="Select images"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) addFiles(files);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={folderInputRef}
          type="file"
          multiple
          className="hidden"
          aria-label="Select folder"
          // @ts-expect-error - non-standard folder attributes
          webkitdirectory=""
          directory=""
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) addFiles(files);
            e.currentTarget.value = "";
          }}
        />
        <input
          ref={zipInputRef}
          type="file"
          multiple
          accept=".zip,application/zip"
          className="hidden"
          aria-label="Select ZIP"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            if (files.length) addFiles(files);
            e.currentTarget.value = "";
          }}
        />
      </Card>

      {/* Control bar */}
      {jobs.length > 0 && (
        <Card className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-semibold">
                  {stats.done + stats.errored} / {stats.total} processed
                </span>
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  Saved {bytesFmt(stats.savedBytes)}
                </Badge>
                {state === "running" && eta !== null && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    ETA {formatDuration(eta)}
                  </Badge>
                )}
                {expandingCount > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Reading files…
                  </Badge>
                )}
              </div>
              <Progress value={overallProgress} className="h-2 mt-2" />
            </div>
            <div className="flex flex-wrap gap-2">
              {state === "idle" && (
                <Button onClick={handleStart} disabled={!stats.queued}>
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
              {state === "running" && (
                <Button onClick={handlePause} variant="secondary">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {state === "paused" && (
                <Button onClick={handleResume}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              {(state === "running" || state === "paused") && (
                <Button onClick={handleCancel} variant="destructive">
                  <StopCircle className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
              <Button
                variant="outline"
                onClick={retryFailed}
                disabled={!jobs.some((j) => j.status === "error" || j.status === "canceled")}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry failures
              </Button>
              <Button variant="outline" onClick={downloadZip} disabled={!stats.done}>
                <Download className="w-4 h-4 mr-2" />
                Download ZIP ({stats.done})
              </Button>
              <Button variant="ghost" onClick={clearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Queue */}
      {jobs.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Layers className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">
            Drop images, folders, or a ZIP anywhere in the panel above to build your queue.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-border/60 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40">
            <div className="col-span-5">File</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="grid grid-cols-12 gap-3 items-center px-4 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="col-span-12 md:col-span-5 min-w-0">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <Input
                      value={job.renamedTo}
                      onChange={(e) => updateJob(job.id, { renamedTo: e.target.value })}
                      disabled={job.status === "processing"}
                      className="h-7 text-sm"
                      aria-label={`Rename ${job.originalName}`}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate mt-1 ml-6">
                    {job.originalName}
                  </p>
                </div>
                <div className="col-span-6 md:col-span-2 text-xs">
                  <div className="tabular-nums">{bytesFmt(job.originalSize)}</div>
                  {job.outputSize && (
                    <div className="text-emerald-500 tabular-nums">
                      → {bytesFmt(job.outputSize)}
                    </div>
                  )}
                </div>
                <div className="col-span-6 md:col-span-3">
                  <StatusPill job={job} />
                  {(job.status === "processing" || job.status === "queued") && (
                    <Progress value={job.progress} className="h-1 mt-2" />
                  )}
                  {job.error && (
                    <p className="text-[11px] text-rose-500 mt-1 truncate">{job.error}</p>
                  )}
                </div>
                <div className="col-span-12 md:col-span-2 flex justify-end gap-1">
                  {job.status === "done" && (
                    <Button size="icon" variant="ghost" onClick={() => downloadOne(job)} aria-label="Download">
                      <Download className="w-4 h-4" />
                    </Button>
                  )}
                  {(job.status === "error" || job.status === "canceled") && (
                    <Button size="icon" variant="ghost" onClick={() => retryOne(job.id)} aria-label="Retry">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeOne(job.id)}
                    disabled={job.status === "processing"}
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

const StatusPill = ({ job }: { job: Job }) => {
  const map: Record<
    JobStatus,
    { label: string; icon: typeof Loader2; className: string }
  > = {
    queued: { label: "Queued", icon: Clock, className: "bg-muted text-muted-foreground" },
    processing: { label: "Processing", icon: Loader2, className: "bg-primary/15 text-primary" },
    done: { label: "Done", icon: CheckCircle2, className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    error: { label: "Failed", icon: AlertTriangle, className: "bg-rose-500/15 text-rose-600 dark:text-rose-400" },
    canceled: { label: "Canceled", icon: StopCircle, className: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  };
  const { label, icon: Icon, className } = map[job.status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold",
        className
      )}
    >
      <Icon className={cn("w-3 h-3", job.status === "processing" && "animate-spin")} />
      {label}
    </span>
  );
};

export default BatchProcessingStudio;
