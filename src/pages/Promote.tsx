import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Download, 
  Smartphone, 
  Zap, 
  Shield, 
  TrendingDown,
  Star,
  Copy,
  Check,
  ExternalLink
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useState } from "react";
import { toast } from "sonner";
import ReferralCard from "@/components/ReferralCard";

const Promote = () => {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const appStoreDescription = `Pixelsqueeze - AI Image Compression

Compress your images without losing quality. Reduce file sizes by up to 80% with our AI-powered compression technology.

FEATURES:
• Smart AI Compression - Automatically finds optimal compression
• Bulk Processing - Compress hundreds of images at once
• Multiple Formats - JPG, PNG, WebP, and more
• Secure Processing - 256-bit encryption, auto-delete
• Lightning Fast - Process images in seconds
• Works Offline - Install as a web app

PERFECT FOR:
• Web developers optimizing site speed
• Photographers sharing high-quality images
• Content creators reducing upload times
• Anyone who needs smaller file sizes

Download now and start compressing for free!`;

  const shortDescription = "AI-powered image compression. Reduce file sizes by up to 80% without losing quality.";

  const keywords = [
    "image compression",
    "compress images",
    "reduce image size",
    "photo compressor",
    "image optimizer",
    "web optimization",
    "bulk compression",
    "AI compression"
  ];

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      toast.success(`${label} copied!`);
      setTimeout(() => setCopiedText(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Promote Pixelsqueeze - Marketing Assets & Referrals</title>
        <meta name="description" content="Get marketing materials, referral links, and promotional assets for Pixelsqueeze image compression app." />
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Promote Pixelsqueeze</h1>
        </div>

        {/* Hero Banner */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 p-8 text-primary-foreground">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                <Smartphone className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Pixelsqueeze</h2>
                <p className="text-primary-foreground/80">AI Image Compression</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                <span className="ml-1">4.9</span>
              </div>
              <Badge variant="secondary" className="bg-white/20">Free</Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <TrendingDown className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">80% Smaller</p>
              </div>
              <div>
                <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Instant</p>
              </div>
              <div>
                <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Secure</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Referral Card */}
          <ReferralCard />

          {/* Install Link */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5" />
                Direct Install Link
              </CardTitle>
              <CardDescription>Share this link for direct app installation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <code className="flex-1 p-3 bg-muted rounded-lg text-sm break-all">
                  {window.location.origin}/install
                </code>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleCopy(`${window.location.origin}/install`, "Install link")}
                >
                  {copiedText === "Install link" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Link to="/install">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Install Page
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* App Store Assets */}
        <div className="mt-8 space-y-6">
          <h2 className="text-xl font-bold">App Store Assets</h2>

          {/* Short Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Short Description</CardTitle>
              <CardDescription>For app store subtitle or brief description</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <p className="flex-1 p-3 bg-muted rounded-lg text-sm">{shortDescription}</p>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleCopy(shortDescription, "Short description")}
                >
                  {copiedText === "Short description" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Full Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Full App Description</CardTitle>
              <CardDescription>Complete description for app store listing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <pre className="p-4 bg-muted rounded-lg text-sm whitespace-pre-wrap font-sans">
                  {appStoreDescription}
                </pre>
                <Button 
                  variant="outline"
                  onClick={() => handleCopy(appStoreDescription, "Full description")}
                  className="w-full"
                >
                  {copiedText === "Full description" ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy Full Description
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keywords</CardTitle>
              <CardDescription>SEO keywords for app store optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary">{keyword}</Badge>
                  ))}
                </div>
                <Button 
                  variant="outline"
                  onClick={() => handleCopy(keywords.join(", "), "Keywords")}
                  className="w-full"
                >
                  {copiedText === "Keywords" ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                  Copy All Keywords
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* App Icon Download */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">App Icon</CardTitle>
              <CardDescription>Download app icon for marketing materials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <img 
                  src="/app-icon-512.png" 
                  alt="Pixelsqueeze App Icon" 
                  className="w-20 h-20 rounded-2xl shadow-lg"
                />
                <div className="space-y-2">
                  <a href="/app-icon-512.png" download="pixelsqueeze-icon-512.png">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      512x512 PNG
                    </Button>
                  </a>
                  <a href="/app-icon-192.png" download="pixelsqueeze-icon-192.png">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      192x192 PNG
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Promote;
