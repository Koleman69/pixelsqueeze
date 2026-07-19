import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  Download,
  RefreshCw,
  Package,
  Loader2,
  CheckCircle2,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Image as ImageIcon,
  Video,
  Sparkles,
  Twitter,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JSZip from "jszip";

type IconComp = typeof Instagram;

interface PlatformSpec {
  id: string;
  platform: string;
  label: string;
  width: number;
  height: number;
  ratio: string;
  icon: IconComp;
  gradient: string;
  tip: string;
}

const SPECS: PlatformSpec[] = [
  { id: "ig-feed", platform: "Instagram", label: "Feed", width: 1080, height: 1350, ratio: "4:5", icon: Instagram, gradient: "from-fuchsia-500 via-pink-500 to-orange-400", tip: "Portrait posts get the most feed real estate." },
  { id: "ig-story", platform: "Instagram", label: "Story", width: 1080, height: 1920, ratio: "9:16", icon: Instagram, gradient: "from-purple-500 via-fuchsia-500 to-pink-500", tip: "Full-screen vertical for stories." },
  { id: "ig-reel", platform: "Instagram", label: "Reel Cover", width: 1080, height: 1920, ratio: "9:16", icon: Instagram, gradient: "from-pink-500 via-rose-500 to-red-500", tip: "Center subject; edges get cropped by UI." },
  { id: "fb-feed", platform: "Facebook", label: "Feed", width: 1200, height: 630, ratio: "1.91:1", icon: Facebook, gradient: "from-blue-600 to-blue-400", tip: "Best for link and image posts." },
  { id: "fb-cover", platform: "Facebook", label: "Cover", width: 820, height: 312, ratio: "2.63:1", icon: Facebook, gradient: "from-blue-700 to-indigo-500", tip: "Keep the focal point centered." },
  { id: "tt-cover", platform: "TikTok", label: "Cover", width: 1080, height: 1920, ratio: "9:16", icon: Video, gradient: "from-slate-900 via-slate-700 to-cyan-500", tip: "Vertical thumbnail for videos." },
  { id: "li", platform: "LinkedIn", label: "Post", width: 1200, height: 627, ratio: "1.91:1", icon: Linkedin, gradient: "from-sky-700 to-sky-500", tip: "Professional, landscape format." },
  { id: "pin", platform: "Pinterest", label: "Pin", width: 1000, height: 1500, ratio: "2:3", icon: ImageIcon, gradient: "from-red-600 to-rose-500", tip: "Tall pins outperform square." },
  { id: "yt", platform: "YouTube", label: "Thumbnail", width: 1280, height: 720, ratio: "16:9", icon: Youtube, gradient: "from-red-600 to-red-500", tip: "High contrast, bold subject." },
  { id: "x", platform: "X (Twitter)", label: "Post", width: 1600, height: 900, ratio: "16:9", icon: Twitter, gradient: "from-slate-900 to-slate-700", tip: "In-feed images render 16:9." },
  { id: "threads", platform: "Threads", label: "Post", width: 1080, height: 1350, ratio: "4:5", icon: MessageCircle, gradient: "from-neutral-800 to-neutral-600", tip: "Portrait matches Instagram feel." },
];

type Variant = {
  spec: PlatformSpec;
  dataUrl: string | null;
  blob: Blob | null;
  loading: boolean;
};

async function renderVariant(img: HTMLImageElement, spec: PlatformSpec): Promise<{ dataUrl: string; blob: Blob }> {
  const canvas = document.createElement("canvas");
  canvas.width = spec.width;
  canvas.height = spec.height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // cover fit
  const targetAspect = spec.width / spec.height;
  const imgAspect = img.width / img.height;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgAspect > targetAspect) {
    sw = img.height * targetAspect;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetAspect;
    sy = (img.height - sh) / 2;
  }
  // fill white behind for transparent PNGs
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b as Blob), "image/jpeg", 0.92)
  );
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return { dataUrl, blob };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
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

export const SocialStudio = () => {
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState<string>("image");
  const [variants, setVariants] = useState<Variant[]>(
    SPECS.map((s) => ({ spec: s, dataUrl: null, blob: null, loading: false }))
  );
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [zipping, setZipping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const dragActive = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setSourceUrl(e.target?.result as string);
      setSourceName(file.name.replace(/\.[^.]+$/, "") || "image");
      setVariants(SPECS.map((s) => ({ spec: s, dataUrl: null, blob: null, loading: false })));
    };
    reader.readAsDataURL(file);
  }, []);

  const generateAll = useCallback(async () => {
    if (!sourceUrl) return;
    setGenerating(true);
    setProgress(0);
    try {
      const img = await loadImage(sourceUrl);
      const results: Variant[] = [];
      for (let i = 0; i < SPECS.length; i++) {
        const spec = SPECS[i];
        try {
          const { dataUrl, blob } = await renderVariant(img, spec);
          results.push({ spec, dataUrl, blob, loading: false });
        } catch {
          results.push({ spec, dataUrl: null, blob: null, loading: false });
        }
        setProgress(Math.round(((i + 1) / SPECS.length) * 100));
        // yield to UI
        await new Promise((r) => setTimeout(r, 0));
      }
      setVariants(results);
      toast.success("Social Pack ready — 11 platform versions generated");
    } catch (e) {
      console.error(e);
      toast.error("Could not process image");
    } finally {
      setGenerating(false);
    }
  }, [sourceUrl]);

  // Auto-generate the first time an image loads
  useEffect(() => {
    if (sourceUrl && !variants.some((v) => v.dataUrl)) {
      generateAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceUrl]);

  const regenerateOne = useCallback(
    async (id: string) => {
      if (!sourceUrl) return;
      setVariants((prev) => prev.map((v) => (v.spec.id === id ? { ...v, loading: true } : v)));
      try {
        const img = await loadImage(sourceUrl);
        const spec = SPECS.find((s) => s.id === id)!;
        const { dataUrl, blob } = await renderVariant(img, spec);
        setVariants((prev) =>
          prev.map((v) => (v.spec.id === id ? { ...v, dataUrl, blob, loading: false } : v))
        );
        toast.success(`${spec.platform} ${spec.label} regenerated`);
      } catch {
        setVariants((prev) => prev.map((v) => (v.spec.id === id ? { ...v, loading: false } : v)));
        toast.error("Regenerate failed");
      }
    },
    [sourceUrl]
  );

  const downloadOne = (v: Variant) => {
    if (!v.blob) return;
    const filename = `${sourceName}-${v.spec.platform.toLowerCase().replace(/[^a-z0-9]/g, "")}-${v.spec.label
      .toLowerCase()
      .replace(/\s+/g, "-")}-${v.spec.width}x${v.spec.height}.jpg`;
    triggerDownload(v.blob, filename);
  };

  const downloadPack = async () => {
    const ready = variants.filter((v) => v.blob);
    if (!ready.length) {
      toast.error("Generate versions first");
      return;
    }
    setZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder(`${sourceName}-social-pack`)!;
      ready.forEach((v) => {
        const filename = `${v.spec.platform.replace(/[^A-Za-z0-9]/g, "")}-${v.spec.label.replace(/\s+/g, "")}-${v.spec.width}x${v.spec.height}.jpg`;
        folder.file(filename, v.blob!);
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      triggerDownload(zipBlob, `${sourceName}-social-pack.zip`);
      toast.success("Social Pack downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not build ZIP");
    } finally {
      setZipping(false);
    }
  };

  const readyCount = variants.filter((v) => v.dataUrl).length;

  return (
    <div className="space-y-6">
      {/* Uploader / Hero */}
      <Card
        className={cn(
          "relative overflow-hidden border-2 border-dashed transition-all",
          "bg-gradient-to-br from-background via-background to-primary/5",
          isDragging ? "border-primary bg-primary/5" : "border-border/60"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragActive.current) {
            dragActive.current = true;
            setIsDragging(true);
          }
        }}
        onDragLeave={() => {
          dragActive.current = false;
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragActive.current = false;
          setIsDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
      >
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Social Studio
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              One image. Every platform, perfectly sized.
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Drop an optimized image and Social Studio instantly generates 11 platform-ready versions —
              Instagram, Facebook, TikTok, LinkedIn, Pinterest, YouTube, X and Threads.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              <Button
                size="lg"
                onClick={() => fileRef.current?.click()}
                className="bg-gradient-to-r from-primary to-primary/80"
              >
                <Upload className="w-4 h-4 mr-2" />
                {sourceUrl ? "Replace image" : "Upload image"}
              </Button>
              {sourceUrl && (
                <Button size="lg" variant="outline" onClick={generateAll} disabled={generating}>
                  <RefreshCw className={cn("w-4 h-4 mr-2", generating && "animate-spin")} />
                  Regenerate all
                </Button>
              )}
              <Button
                size="lg"
                variant="secondary"
                onClick={downloadPack}
                disabled={!readyCount || zipping}
              >
                {zipping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Package className="w-4 h-4 mr-2" />}
                Download Social Pack{readyCount ? ` (${readyCount})` : ""}
              </Button>
            </div>
          </div>

          <div className="w-full md:w-56 aspect-square rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center overflow-hidden">
            {sourceUrl ? (
              <img src={sourceUrl} alt="Source" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className="text-center px-4">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Drop image here</p>
              </div>
            )}
          </div>
        </div>

        {generating && (
          <div className="px-6 pb-4">
            <Progress value={progress} className="h-1.5" />
            <p className="text-xs text-muted-foreground mt-2">Generating platform versions… {progress}%</p>
          </div>
        )}

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
          aria-label="Upload source image"
        />
      </Card>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {variants.map((v) => {
          const Icon = v.spec.icon;
          return (
            <Card
              key={v.spec.id}
              className="group relative overflow-hidden border-border/60 hover:border-primary/40 hover:shadow-lg transition-all"
            >
              <div className={cn("h-1 w-full bg-gradient-to-r", v.spec.gradient)} />
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={cn(
                      "shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                      v.spec.gradient
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate">{v.spec.platform}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{v.spec.label}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {v.spec.ratio}
                </Badge>
              </div>

              <div
                className="relative bg-muted/40 border-y border-border/50 flex items-center justify-center overflow-hidden"
                style={{ aspectRatio: `${v.spec.width} / ${v.spec.height}`, maxHeight: 260 }}
              >
                {v.loading || (generating && !v.dataUrl) ? (
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                ) : v.dataUrl ? (
                  <img
                    src={v.dataUrl}
                    alt={`${v.spec.platform} ${v.spec.label} preview`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="text-center px-3">
                    <ImageIcon className="w-6 h-6 mx-auto mb-1 text-muted-foreground/50" />
                    <p className="text-[11px] text-muted-foreground">
                      {sourceUrl ? "Waiting…" : "Upload to preview"}
                    </p>
                  </div>
                )}
                {v.dataUrl && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 drop-shadow" />
                  </div>
                )}
              </div>

              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">
                    {v.spec.width}×{v.spec.height}
                  </span>
                  {v.blob && <span>{Math.round(v.blob.size / 1024)} KB</span>}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => downloadOne(v)}
                    disabled={!v.blob}
                    aria-label={`Download ${v.spec.platform} ${v.spec.label}`}
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => regenerateOne(v.spec.id)}
                    disabled={!sourceUrl || v.loading}
                    aria-label={`Regenerate ${v.spec.platform} ${v.spec.label}`}
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", v.loading && "animate-spin")} />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/80 leading-snug">{v.spec.tip}</p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default SocialStudio;
