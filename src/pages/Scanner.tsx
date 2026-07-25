import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Globe,
  Search,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  Image,
  ArrowLeft,
  Download,
  TrendingUp,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";

interface ImageIssue {
  src: string;
  alt: string;
  width: number | null;
  height: number | null;
  fileSize: number | null;
  format: string;
  issues: string[];
  severity: "critical" | "warning" | "info";
  estimatedSavings: number;
}

interface ScanResult {
  url: string;
  totalImages: number;
  issueCount: number;
  images: ImageIssue[];
  performanceGrade: string;
  estimatedLoadTimeReduction: number;
  seoScore: number;
  totalCurrentSize: number;
  totalOptimizedSize: number;
  recommendations: string[];
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const gradeColor = (grade: string) => {
  if (grade.startsWith("A")) return "text-green-500";
  if (grade === "B") return "text-yellow-500";
  if (grade === "C") return "text-orange-500";
  return "text-red-500";
};

const severityIcon = (severity: string) => {
  if (severity === "critical") return <XCircle className="w-4 h-4 text-destructive" />;
  if (severity === "warning") return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <Info className="w-4 h-4 text-muted-foreground" />;
};

const Scanner = () => {
  const [url, setUrl] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const { toast } = useToast();

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsScanning(true);
    setResult(null);
    setScreenshot(null);

    try {
      const { data, error } = await supabase.functions.invoke("scan-website", {
        body: { url: url.trim() },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Scan failed");

      setResult(data.data);
      setScreenshot(data.screenshot || null);
    } catch (error: any) {
      toast({
        title: "Scan Failed",
        description: error.message || "Could not scan this website",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };


  const totalSavings = result
    ? result.totalCurrentSize - result.totalOptimizedSize
    : 0;
  const savingsPercent = result && result.totalCurrentSize > 0
    ? Math.round((totalSavings / result.totalCurrentSize) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Website Image Scanner — PixelSqueeze"
        description="Scan any website for image optimization issues. Get a free performance grade, SEO score, and size savings estimate in seconds."
        path="/scanner"
      />
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Website Scanner
            </h1>
            <p className="text-xs text-muted-foreground">
              Analyze any page for image optimization opportunities
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* URL Input */}
        <Card className="p-6">
          <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g. example.com)"
                className="pl-10"
                disabled={isScanning}
              />
            </div>
            <Button
              type="submit"
              disabled={isScanning || !url.trim()}
              className="bg-gradient-to-r from-primary to-primary/80"
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Scan Website
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Scanning State */}
        {isScanning && (
          <Card className="p-8 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Scanning {url}</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Crawling page, detecting images, and analyzing optimization opportunities...
              </p>
            </div>
            <Progress value={45} className="max-w-xs mx-auto" />
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Score Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-5 text-center">
                <div className={`text-4xl font-black ${gradeColor(result.performanceGrade)}`}>
                  {result.performanceGrade}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Performance Grade</p>
              </Card>

              <Card className="p-5 text-center">
                <div className="text-4xl font-black text-foreground">
                  {result.totalImages}
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Images Found
                </p>
                <Badge variant={result.issueCount > 0 ? "destructive" : "default"} className="mt-2 text-[10px]">
                  {result.issueCount} issues
                </Badge>
              </Card>

              <Card className="p-5 text-center">
                <div className="text-4xl font-black text-primary">
                  {savingsPercent}%
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">Potential Savings</p>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {formatBytes(totalSavings)} saveable
                </p>
              </Card>

              <Card className="p-5 text-center">
                <div className="text-4xl font-black text-foreground">
                  {result.estimatedLoadTimeReduction}s
                </div>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                  Faster Load Time
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">estimated on 3G</p>
              </Card>
            </div>

            {/* SEO & Speed Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">SEO Image Score</h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-black text-foreground">{result.seoScore}/100</div>
                  <Progress value={result.seoScore} className="flex-1" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Based on alt text coverage, proper dimensions, and format optimization
                </p>
              </Card>

              <Card className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Zap className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Size Breakdown</h2>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current estimated</span>
                    <span className="font-medium text-foreground">{formatBytes(result.totalCurrentSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">After optimization</span>
                    <span className="font-medium text-primary">{formatBytes(result.totalOptimizedSize)}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-border pt-2">
                    <span className="text-muted-foreground font-medium">Total savings</span>
                    <span className="font-bold text-green-500">{formatBytes(totalSavings)}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Recommendations</h2>
              </div>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="text-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Image Issues Table */}
            {result.images.length > 0 && (
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Image className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">
                      Image Issues ({result.images.length})
                    </h2>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="destructive" className="text-[10px]">
                      {result.images.filter((i) => i.severity === "critical").length} Critical
                    </Badge>
                    <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-600">
                      {result.images.filter((i) => i.severity === "warning").length} Warnings
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {result.images.map((img, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg border ${
                        img.severity === "critical"
                          ? "border-destructive/30 bg-destructive/5"
                          : img.severity === "warning"
                          ? "border-yellow-500/30 bg-yellow-500/5"
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {severityIcon(img.severity)}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-muted-foreground truncate">
                            {img.src}
                          </p>
                          <div className="flex flex-wrap gap-2 mt-1.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {img.format.toUpperCase()}
                            </Badge>
                            {img.width && img.height && (
                              <Badge variant="secondary" className="text-[10px]">
                                {img.width}×{img.height}
                              </Badge>
                            )}
                            {img.fileSize && (
                              <Badge variant="secondary" className="text-[10px]">
                                ~{formatBytes(img.fileSize)}
                              </Badge>
                            )}
                            {img.estimatedSavings > 0 && (
                              <Badge variant="outline" className="text-[10px] text-green-600 border-green-500/30">
                                Save ~{formatBytes(img.estimatedSavings)}
                              </Badge>
                            )}
                          </div>
                          <ul className="mt-2 space-y-1">
                            {img.issues.map((issue, j) => (
                              <li key={j} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                <span className="text-muted-foreground/50">•</span>
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Screenshot */}
            {screenshot && (
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Globe className="w-5 h-5 text-primary" />
                  <h2 className="font-semibold text-foreground">Page Screenshot</h2>
                </div>
                <div className="rounded-lg overflow-hidden border border-border">
                  <img
                    src={screenshot}
                    alt={`Screenshot of ${result.url}`}
                    className="w-full"
                    loading="lazy"
                  />
                </div>
              </Card>
            )}

            {/* CTA */}
            <Card className="p-6 text-center bg-primary/5 border-primary/20">
              <h2 className="text-lg font-bold text-foreground mb-2">
                Ready to optimize these images?
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Upload them to PixelSqueeze and save {formatBytes(totalSavings)} instantly
              </p>
              <Link to="/dashboard">
                <Button className="bg-gradient-to-r from-primary to-primary/80">
                  <Download className="w-4 h-4 mr-2" />
                  Go to Optimizer
                </Button>
              </Link>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {!isScanning && !result && (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
              <Globe className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Scan any website</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Enter a URL above to detect unoptimized images, missing alt text,
              incorrect formats, and get actionable recommendations to improve
              page speed and SEO.
            </p>
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {["Large images", "Wrong formats", "Missing alt text", "Layout shift", "Lazy loading"].map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Scanner;
