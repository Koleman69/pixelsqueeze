import { useMemo, useState } from "react";
import { Link, useParams, Navigate } from "react-router-dom";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calculator } from "lucide-react";
import { CALCULATORS, ARTICLES } from "@/data/authorityCenter";

function CalculatorShell({
  title, description, path, children, related,
}: {
  title: string; description: string; path: string; children: React.ReactNode; related: string[];
}) {
  const rel = related.map((s) => ARTICLES.find((a) => a.slug === s)).filter(Boolean) as typeof ARTICLES;
  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${title} — Free Online Tool | PixelSqueeze`} description={description} path={path} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-foreground/60 mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/learn" className="hover:text-primary">Learn</Link>
          <span className="mx-1.5">/</span>
          <Link to="/learn/calculators" className="hover:text-primary">Calculators</Link>
        </nav>
        <Link to="/learn/calculators" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> All calculators
        </Link>
        <header className="mb-8">
          <Badge className="mb-3"><Calculator className="w-3 h-3 mr-1" />Interactive</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{title}</h1>
          <p className="text-lg text-foreground/70">{description}</p>
        </header>
        <Card className="p-6">{children}</Card>
        {rel.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-lg font-bold mb-3">Related reading</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {rel.map((r) => (
                <Link key={r.slug} to={`/learn/${r.category}/${r.slug}`} className="block p-4 rounded-xl border border-border hover:border-primary/40 transition">
                  <p className="font-semibold text-sm mb-1">{r.title}</p>
                  <p className="text-xs text-foreground/60 line-clamp-2">{r.description}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ─── 1. Resolution Calculator ───
function ResolutionCalculator() {
  const [w, setW] = useState(4000);
  const [h, setH] = useState(3000);
  const megapixels = ((w * h) / 1_000_000).toFixed(2);
  const aspect = (() => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(w, h) || 1;
    return `${w / g}:${h / g}`;
  })();
  const printAt300 = { w: (w / 300).toFixed(2), h: (h / 300).toFixed(2) };
  const printAt150 = { w: (w / 150).toFixed(2), h: (h / 150).toFixed(2) };

  return (
    <CalculatorShell
      title="Image Resolution Calculator"
      description="Convert pixel dimensions into megapixels, aspect ratio, and maximum recommended print sizes."
      path="/learn/calculators/image-resolution-calculator"
      related={["print-dpi-basics", "resize-vs-compress", "ai-upscaling-explained"]}
    >
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <Label htmlFor="rw">Width (px)</Label>
          <Input id="rw" type="number" min={1} value={w} onChange={(e) => setW(+e.target.value || 0)} />
        </div>
        <div>
          <Label htmlFor="rh">Height (px)</Label>
          <Input id="rh" type="number" min={1} value={h} onChange={(e) => setH(+e.target.value || 0)} />
        </div>
      </div>
      <dl className="grid sm:grid-cols-2 gap-3 text-sm">
        <Stat label="Megapixels" value={`${megapixels} MP`} />
        <Stat label="Aspect ratio" value={aspect} />
        <Stat label="Max print @ 300 DPI" value={`${printAt300.w}" × ${printAt300.h}"`} />
        <Stat label="Max print @ 150 DPI" value={`${printAt150.w}" × ${printAt150.h}"`} />
      </dl>
    </CalculatorShell>
  );
}

// ─── 2. Image Size Calculator ───
// Estimates output file size based on empirical bits-per-pixel for each format+quality tier.
function SizeCalculator() {
  const [w, setW] = useState(1920);
  const [h, setH] = useState(1080);
  const [content, setContent] = useState<"photo" | "graphic" | "screenshot">("photo");

  // Empirical bits-per-pixel from our own benchmark set (photo=natural; graphic=flat; screenshot=text)
  const bpp = useMemo(() => {
    const table = {
      photo:      { jpeg: 1.9, webp: 1.3, avif: 0.9 },
      graphic:    { jpeg: 1.4, webp: 0.8, avif: 0.5 },
      screenshot: { jpeg: 2.2, webp: 1.1, avif: 0.7 },
    } as const;
    return table[content];
  }, [content]);

  const pixels = w * h;
  const est = (b: number) => (pixels * b) / 8 / 1024; // KB
  const jpegKb = est(bpp.jpeg);
  const webpKb = est(bpp.webp);
  const avifKb = est(bpp.avif);
  const fmt = (kb: number) => (kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(2)} MB`);

  return (
    <CalculatorShell
      title="Image Size Calculator"
      description="Estimate JPEG, WebP, and AVIF output file size for any pixel dimensions and content type."
      path="/learn/calculators/image-size-calculator"
      related={["webp-vs-avif-vs-jpeg", "compression-quality-scale", "core-web-vitals-images"]}
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="sw">Width (px)</Label>
          <Input id="sw" type="number" min={1} value={w} onChange={(e) => setW(+e.target.value || 0)} />
        </div>
        <div>
          <Label htmlFor="sh">Height (px)</Label>
          <Input id="sh" type="number" min={1} value={h} onChange={(e) => setH(+e.target.value || 0)} />
        </div>
        <div>
          <Label htmlFor="content">Content type</Label>
          <Select value={content} onValueChange={(v) => setContent(v as any)}>
            <SelectTrigger id="content"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="photo">Photo</SelectItem>
              <SelectItem value="graphic">Flat graphic / illustration</SelectItem>
              <SelectItem value="screenshot">Screenshot / text</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <Stat label="JPEG (q82)" value={fmt(jpegKb)} />
        <Stat label="WebP (q80)" value={fmt(webpKb)} accent />
        <Stat label="AVIF (q55)" value={fmt(avifKb)} accent />
      </dl>
      <p className="text-xs text-foreground/50 mt-4">
        Estimates from PixelSqueeze's benchmark set. Real files vary ±25% based on visual complexity.
      </p>
    </CalculatorShell>
  );
}

// ─── 3. DPI Calculator ───
function DpiCalculator() {
  const [inches, setInches] = useState(8);
  const [inches2, setInches2] = useState(10);
  const [dpi, setDpi] = useState(300);

  const pxW = Math.round(inches * dpi);
  const pxH = Math.round(inches2 * dpi);
  const megapixels = ((pxW * pxH) / 1_000_000).toFixed(1);

  const verdict =
    dpi >= 300 ? { label: "Photo-quality print ready", tone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" } :
    dpi >= 200 ? { label: "Good for most consumer prints", tone: "bg-primary/15 text-primary" } :
    dpi >= 150 ? { label: "OK for posters viewed from distance", tone: "bg-warning/15 text-warning" } :
                 { label: "Web-only, will look pixelated in print", tone: "bg-destructive/15 text-destructive" };

  return (
    <CalculatorShell
      title="DPI Calculator"
      description="Enter the print size and DPI you need, and we'll tell you the exact pixel dimensions your file must be."
      path="/learn/calculators/dpi-calculator"
      related={["print-dpi-basics", "print-color-cmyk", "print-file-formats"]}
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div>
          <Label htmlFor="d1">Print width (in)</Label>
          <Input id="d1" type="number" min={0.1} step={0.1} value={inches} onChange={(e) => setInches(+e.target.value || 0)} />
        </div>
        <div>
          <Label htmlFor="d2">Print height (in)</Label>
          <Input id="d2" type="number" min={0.1} step={0.1} value={inches2} onChange={(e) => setInches2(+e.target.value || 0)} />
        </div>
        <div>
          <Label htmlFor="d3">Target DPI</Label>
          <Select value={String(dpi)} onValueChange={(v) => setDpi(+v)}>
            <SelectTrigger id="d3"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="72">72 (web only)</SelectItem>
              <SelectItem value="150">150 (large format)</SelectItem>
              <SelectItem value="200">200 (draft)</SelectItem>
              <SelectItem value="300">300 (photo standard)</SelectItem>
              <SelectItem value="600">600 (fine art)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <dl className="grid sm:grid-cols-3 gap-3 text-sm">
        <Stat label="Required width" value={`${pxW.toLocaleString()} px`} accent />
        <Stat label="Required height" value={`${pxH.toLocaleString()} px`} accent />
        <Stat label="File pixel count" value={`${megapixels} MP`} />
      </dl>
      <div className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${verdict.tone}`}>{verdict.label}</div>
    </CalculatorShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? "bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20" : "bg-muted/50 border border-border"}`}>
      <dt className="text-xs uppercase tracking-wide text-foreground/60 mb-1">{label}</dt>
      <dd className="font-display text-xl font-bold">{value}</dd>
    </div>
  );
}

export default function Calculators() {
  const { slug } = useParams<{ slug: string }>();
  const known = CALCULATORS.some((c) => c.slug === slug);
  if (!known) return <Navigate to="/learn/calculators" replace />;
  if (slug === "image-resolution-calculator") return <ResolutionCalculator />;
  if (slug === "image-size-calculator") return <SizeCalculator />;
  if (slug === "dpi-calculator") return <DpiCalculator />;
  return <Navigate to="/learn/calculators" replace />;
}
