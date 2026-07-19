import { useState, useCallback } from "react";
import JSZip from "jszip";
import { Upload, Loader2, Download, Sparkles, Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SEO from "@/components/SEO";
import { generateSeoImagePackage, type SeoImageResult } from "@/services/imageSeoPipeline";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={`Copy ${label ?? "value"}`}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
    </Button>
  );
}

export default function SeoImageOptimizer() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SeoImageResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setBusy(true);
    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));
    try {
      const pkg = await generateSeoImagePackage(file);
      setResult(pkg);
      toast.success("SEO metadata generated");
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message || "Failed to optimize image");
    } finally {
      setBusy(false);
    }
  }, []);

  const downloadZip = async () => {
    if (!result) return;
    const zip = new JSZip();
    const media = zip.folder("images")!;
    for (const v of result.variants) media.file(v.filename, v.blob);
    media.file(result.original.filename, result.original.blob);

    const seo = zip.folder("seo")!;
    seo.file("metadata.json", JSON.stringify(result.metadata, null, 2));
    seo.file("picture.html", result.pictureHtml);
    seo.file("json-ld.html", result.jsonLd);
    seo.file("open-graph.html", result.openGraphTags);
    seo.file("twitter.html", result.twitterTags);
    seo.file("pinterest.html", result.pinterestTags);
    seo.file("sitemap-entry.xml", result.sitemapEntry);
    seo.file(
      "README.md",
      `# ${result.metadata.title}\n\nDrop the files in /images into your CDN (or /public), then paste the snippets in /seo into your page \`<head>\` and body. See picture.html for the ready-made responsive markup.`,
    );

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.metadata.slug}-seo-pack.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SEO Image Optimizer — AI Alt Text, Schema & Responsive Sizes"
        description="Automatically generate descriptive filenames, alt tags, captions, schema, Open Graph, Twitter, and Pinterest metadata for every image. Ships WebP, AVIF, and responsive sizes ready for Google Image Search."
        path="/tools/seo-image-optimizer"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="w-3 h-3 mr-1" /> AI-Powered SEO
          </Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-3">
            SEO Image Optimizer
          </h1>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Upload once. Get a descriptive filename, alt text, caption, schema, Open Graph, Twitter,
            and Pinterest metadata — plus WebP, AVIF, and responsive sizes ready for Google Image Search.
          </p>
        </header>

        {!result && (
          <Card className="p-10 border-dashed border-2">
            <label className="flex flex-col items-center justify-center cursor-pointer text-center">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                disabled={busy}
                aria-label="Upload image to optimize for SEO"
              />
              {busy ? (
                <>
                  <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
                  <p className="text-lg font-semibold">Analyzing image with AI…</p>
                  <p className="text-sm text-foreground/60 mt-1">
                    Generating metadata, WebP, AVIF, and responsive sizes.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <Upload className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-lg font-semibold">Drop or select an image</p>
                  <p className="text-sm text-foreground/60 mt-1">PNG, JPG, WebP, AVIF, HEIC up to 20 MB</p>
                  <span className="mt-6 inline-flex items-center px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    Choose image
                  </span>
                </>
              )}
            </label>
          </Card>
        )}

        {result && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-[280px_1fr] gap-6">
              <Card className="p-4">
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt={result.metadata.altText}
                    className="w-full rounded-xl border border-border"
                    loading="lazy"
                    decoding="async"
                  />
                )}
                <p className="mt-3 text-xs font-mono text-foreground/60 break-all">
                  {result.original.filename}
                </p>
                <p className="text-xs text-foreground/50">
                  {result.original.width} × {result.original.height}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/50 mb-1">Category</p>
                    <Badge variant="secondary">{result.metadata.category}</Badge>
                  </div>
                  <Button onClick={downloadZip} size="lg">
                    <Download className="w-4 h-4 mr-2" /> Download SEO pack
                  </Button>
                </div>

                <dl className="space-y-4">
                  <Field label="Filename" value={result.metadata.filename} />
                  <Field label="Title tag" value={result.metadata.title} />
                  <Field label="Alt text" value={result.metadata.altText} />
                  <Field label="Caption" value={result.metadata.caption} />
                  <Field label="Meta description" value={result.metadata.description} />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-foreground/50 mb-1.5">Keywords</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.metadata.keywords.map((k) => (
                        <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                      ))}
                    </div>
                  </div>
                </dl>
              </Card>
            </div>

            <Card className="p-6">
              <h2 className="font-display text-xl font-bold mb-4">
                Generated variants ({result.variants.length})
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-foreground/60 border-b border-border">
                      <th className="py-2 pr-4">Filename</th>
                      <th className="py-2 pr-4">Format</th>
                      <th className="py-2 pr-4">Width</th>
                      <th className="py-2">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.variants.map((v) => (
                      <tr key={v.filename} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-mono text-xs break-all">{v.filename}</td>
                        <td className="py-2 pr-4 uppercase">{v.format}</td>
                        <td className="py-2 pr-4">{v.width}px</td>
                        <td className="py-2">{formatBytes(v.blob.size)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-6">
              <Tabs defaultValue="picture">
                <TabsList className="flex flex-wrap h-auto">
                  <TabsTrigger value="picture">&lt;picture&gt;</TabsTrigger>
                  <TabsTrigger value="schema">Schema.org</TabsTrigger>
                  <TabsTrigger value="og">Open Graph</TabsTrigger>
                  <TabsTrigger value="twitter">Twitter</TabsTrigger>
                  <TabsTrigger value="pinterest">Pinterest</TabsTrigger>
                  <TabsTrigger value="sitemap">Image sitemap</TabsTrigger>
                </TabsList>
                {[
                  ["picture", result.pictureHtml, "Responsive picture markup"],
                  ["schema", result.jsonLd, "JSON-LD schema"],
                  ["og", result.openGraphTags, "Open Graph tags"],
                  ["twitter", result.twitterTags, "Twitter tags"],
                  ["pinterest", result.pinterestTags, "Pinterest tags"],
                  ["sitemap", result.sitemapEntry, "Sitemap entry"],
                ].map(([key, code, label]) => (
                  <TabsContent key={key} value={key} className="mt-4">
                    <div className="flex justify-end mb-2">
                      <CopyButton text={code} label={label} />
                    </div>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                      <code>{code}</code>
                    </pre>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>

            <div className="text-center">
              <Button variant="outline" onClick={() => { setResult(null); setPreviewUrl(null); }}>
                Optimize another image
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-xs uppercase tracking-wide text-foreground/50">{label}</p>
        <CopyButton text={value} label={label} />
      </div>
      <p className="text-sm bg-muted px-3 py-2 rounded-md break-words">{value || <span className="italic text-foreground/40">(empty)</span>}</p>
    </div>
  );
}
