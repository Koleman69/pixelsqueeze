import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Minimize2,
  Zap,
  Shield,
  Upload,
  Crown,
  CheckCircle,
  ArrowRight,
  Star,
  HelpCircle,
  Download,
  Search,
  ShoppingCart,
  PenTool,
  Home,
  Hotel,
  FolderSync,
  Target,
  AlertTriangle,
  Gauge,
  ImageDown,
  Clock,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import InstallBanner from "@/components/InstallBanner";
import EmailCapturePopup from "@/components/EmailCapturePopup";
import { useUtmTracking } from "@/hooks/useUtmTracking";
import weddingBefore from "@/assets/wedding-before.jpg";
import weddingAfter from "@/assets/wedding-after.jpg";
import manBefore from "@/assets/man-before.jpg";
import manAfter from "@/assets/man-after.jpg";

const Landing = () => {
  useUtmTracking();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PixelSqueeze",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    description:
      "AI-powered image optimization that makes websites load faster, rank higher, and convert more visitors.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free tier with manual tools",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "2847",
      bestRating: "5",
    },
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PixelSqueeze",
    url: "https://pixelsqueeze.lovable.app",
    description:
      "Image optimization built for real-world results, not technical settings.",
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does PixelSqueeze optimize images without losing quality?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PixelSqueeze uses AI to analyze each image and select the best format, size, and compression automatically — removing unnecessary metadata and converting to modern formats while preserving visual fidelity.",
        },
      },
      {
        "@type": "Question",
        name: "What formats are supported?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "JPEG, PNG, WebP, GIF, and TIFF. PixelSqueeze auto-converts to the optimal format for your chosen goal (web, social, email, etc.).",
        },
      },
      {
        "@type": "Question",
        name: "Are my images stored on your servers?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Free tier: no storage. Paid plans store processed files for 30 days. All transfers are encrypted with 256-bit SSL.",
        },
      },
      {
        "@type": "Question",
        name: "Can I process multiple images at once?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — batch processing supports 100+ images at once with automatic format selection, resizing, and compression.",
        },
      },
      {
        "@type": "Question",
        name: "What results can I expect?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Typical improvements: up to 70% smaller images, 1–3 second faster page loads, improved PageSpeed scores, and fewer rejected uploads.",
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background" role="document">
      <Helmet>
        <title>PixelSqueeze — Make Your Website Load Faster Automatically</title>
        <meta
          name="description"
          content="PixelSqueeze optimizes your images for SEO, speed, and platform compatibility so your pages pass speed tests and convert more visitors. Start free."
        />
        <meta
          name="keywords"
          content="image optimizer, website speed, page load time, image compression, SEO images, Shopify image optimizer, real estate image compressor, email image resize"
        />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="PixelSqueeze — Make Your Website Load Faster" />
        <meta
          property="og:description"
          content="Optimize images for SEO, speed, and platform compatibility. Fix slow pages in seconds."
        />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="640" />
        <meta property="og:url" content="https://pixelsqueeze.lovable.app" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="PixelSqueeze — Make Your Website Load Faster" />
        <meta
          name="twitter:description"
          content="Optimize images for SEO, speed, and platform compatibility. Fix slow pages in seconds."
        />
        <meta name="twitter:image" content="/og-image.png" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://pixelsqueeze.lovable.app" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        <script type="application/ld+json">{JSON.stringify(organizationData)}</script>
        <script type="application/ld+json">{JSON.stringify(faqData)}</script>
      </Helmet>

      {/* ─── Navigation ─── */}
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Minimize2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              PixelSqueeze
            </span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              How It Works
            </a>
            <a href="#use-cases" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Use Cases
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Pricing
            </a>
            <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Blog
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/install" className="hidden lg:block">
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Install
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-primary">Optimize Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/40 via-background to-background" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 leading-tight text-foreground">
            Make Your Website{" "}
            <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Load Faster
            </span>{" "}
            — Automatically
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            PixelSqueeze optimizes your images for SEO, speed, and platform
            compatibility so your pages pass speed tests and convert more
            visitors.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8 py-6 text-lg">
                <Upload className="w-5 h-5 mr-2" />
                Optimize Images Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/scanner">
              <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
                <Search className="w-5 h-5 mr-2" />
                Scan My Website
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">
            No quality loss • No design skills needed • Works in seconds
          </p>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <AlertTriangle className="w-4 h-4" />
            The Hidden Problem
          </div>
          <h2 className="section-title">Slow Images Are Costing You Customers</h2>
          <p className="text-lg text-muted-foreground mb-10">
            Most websites lose visitors before the page even finishes loading.
            Large images silently cause:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto mb-10 text-left">
            {[
              "Lower Google rankings",
              "Failed PageSpeed scores",
              "Slow Shopify stores",
              "Rejected marketplace uploads",
              "Oversized email attachments",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                <div className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
          <p className="text-lg font-semibold text-foreground">
            You don't need a new website.{" "}
            <span className="text-primary">You need optimized images.</span>
          </p>
        </div>
      </section>

      {/* ─── SOLUTION ─── */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title">PixelSqueeze Fixes Images Automatically</h2>
          <p className="section-subtitle">
            Upload once or scan your website and PixelSqueeze handles everything:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
            {[
              { icon: ImageDown, text: "Compress without visible quality loss" },
              { icon: FileCheck, text: "Convert to modern formats (WebP, AVIF)" },
              { icon: Target, text: "Resize to correct dimensions" },
              { icon: TrendingUp, text: "Generate SEO filenames & alt text" },
              { icon: Shield, text: "Remove unnecessary metadata" },
              { icon: Zap, text: "Prepare files for any platform" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-foreground leading-snug pt-1.5">{text}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground font-medium">
            No guessing. No settings. Just faster pages.
          </p>
        </div>
      </section>

      {/* ─── BEFORE / AFTER ─── */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">See the Difference</h2>
          <p className="section-subtitle !mb-8">
            Slide to compare — same visual quality, dramatically smaller files
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BeforeAfterSlider
              beforeImage={weddingBefore}
              afterImage={weddingAfter}
              title="Wedding Photo — 70% Smaller"
              description="Crystal-clear quality preserved"
            />
            <BeforeAfterSlider
              beforeImage={manBefore}
              afterImage={manAfter}
              title="Portrait — 65% Smaller"
              description="Professional detail maintained"
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="section-padding" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three steps to faster pages</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Choose Your Goal",
                desc: "Website speed, social media, marketplace, email, or listing uploads",
              },
              {
                step: "2",
                title: "PixelSqueeze Optimizes",
                desc: "AI selects the best format, size, and compression automatically",
              },
              {
                step: "3",
                title: "Download or Auto-Replace",
                desc: "Use optimized files instantly or connect a folder for continuous optimization",
              },
            ].map(({ step, title, desc }) => (
              <Card key={step} className="p-6 text-center relative overflow-hidden">
                <div className="text-6xl font-black text-primary/10 absolute -top-2 -left-1">
                  {step}
                </div>
                <div className="relative pt-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WEBSITE SCANNER ─── */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <Gauge className="w-4 h-4" />
            Free Tool
          </div>
          <h2 className="section-title">See Exactly What's Slowing Your Site</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Enter your website and get a speed improvement report showing:
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mb-10 text-left">
            {[
              "Problem images",
              "Estimated load time saved",
              "Downloadable fixed versions",
              "Performance grade",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
          <Link to="/scanner">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground px-8 py-6 text-lg">
              <Search className="w-5 h-5 mr-2" />
              Scan My Website Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── USE CASES ─── */}
      <section className="section-padding" id="use-cases">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title">Built for Your Industry</h2>
          <p className="section-subtitle">
            Faster pages, better rankings, more conversions — no matter your niche
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShoppingCart,
                title: "Online Stores",
                desc: "Faster pages increase conversions and lower bounce rates",
              },
              {
                icon: PenTool,
                title: "Bloggers & Marketers",
                desc: "Improve SEO rankings without changing your design",
              },
              {
                icon: Home,
                title: "Realtors & Listings",
                desc: "Meet strict upload limits instantly",
              },
              {
                icon: Hotel,
                title: "Hotels & Travel",
                desc: "Make booking pages load faster for mobile guests",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6 border-t-4 border-t-primary">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AUTOMATION ─── */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-2 mb-6 text-sm font-medium">
            <FolderSync className="w-4 h-4" />
            Pro Feature
          </div>
          <h2 className="section-title">Stop Manually Fixing Images</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Connect a folder or platform and PixelSqueeze works in the
            background. New images become optimized automatically.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {["Google Drive", "Dropbox", "Shopify", "Local Folders"].map((s) => (
              <span key={s} className="px-4 py-2 rounded-full bg-card border border-border text-sm font-medium text-foreground">
                {s}
              </span>
            ))}
          </div>
          <Link to="/auth">
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg">
              <Crown className="w-5 h-5 mr-2 text-primary" />
              Unlock Automation
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── RESULTS ─── */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title">Typical Improvements</h2>
          <p className="section-subtitle">Real results measured across thousands of websites</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "70%", label: "Smaller images" },
              { value: "1–3s", label: "Faster page loads" },
              { value: "90+", label: "PageSpeed scores" },
              { value: "0", label: "Rejected uploads" },
            ].map(({ value, label }) => (
              <div key={label} className="p-6 rounded-xl bg-card border border-border">
                <p className="text-3xl md:text-4xl font-bold text-primary mb-1">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section className="section-padding bg-secondary/20" id="pricing">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title">Start Free — Upgrade Only If You Want Automation</h2>
          <p className="section-subtitle">No credit card required</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2 text-foreground">Free</h3>
              <p className="text-muted-foreground mb-6">Manual tools, no storage</p>
              <div className="text-4xl font-bold mb-6 text-foreground">
                $0<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Compress, resize & convert",
                  "AI format selection",
                  "Social media export",
                  "Website scanner",
                  "No file storage",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button variant="outline" className="w-full">Get Started Free</Button>
              </Link>
            </Card>

            {/* Pro */}
            <Card className="p-8 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-primary text-primary-foreground px-4 py-1 text-sm font-medium">
                Popular
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold text-foreground">Pro</h3>
              </div>
              <p className="text-muted-foreground mb-6">Automation + scanner + 30-day storage</p>
              <div className="text-4xl font-bold mb-6 text-foreground">
                $6.95<span className="text-lg text-muted-foreground">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Everything in Free",
                  "Unlimited compressions",
                  "Folder & platform automation",
                  "Competitor intelligence",
                  "Pro optimizer (print & web)",
                  "AI video enhancement",
                  "30-day file storage",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-foreground font-medium">{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth">
                <Button className="w-full bg-gradient-primary">Start Pro Trial</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="section-padding">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Frequently Asked Questions</h2>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {[
              {
                q: "How does PixelSqueeze optimize without losing quality?",
                a: "AI analyzes each image and selects the best format, compression level, and dimensions — removing unnecessary metadata and converting to modern formats while preserving visual fidelity.",
              },
              {
                q: "What formats are supported?",
                a: "JPEG, PNG, WebP, GIF, and TIFF. PixelSqueeze auto-converts to the optimal format for your chosen goal.",
              },
              {
                q: "Are my images stored on your servers?",
                a: "Free tier has no storage. Paid plans store processed files for 30 days. All transfers are encrypted with 256-bit SSL.",
              },
              {
                q: "Can I process multiple images at once?",
                a: "Yes — batch processing supports 100+ images with automatic format selection, resizing, and compression.",
              },
              {
                q: "What results can I expect?",
                a: "Typical improvements: up to 70% smaller images, 1–3 second faster page loads, improved PageSpeed scores, and zero rejected uploads.",
              },
              {
                q: "What's the difference between Free and Pro?",
                a: "Free gives you all manual optimization tools. Pro adds folder automation, competitor scanning, pro optimizer, 30-day storage, and unlimited compressions.",
              },
              {
                q: "Can I cancel anytime?",
                a: "Absolutely. Cancel from your account settings and keep access until the end of your billing period.",
              },
            ].map(({ q, a }, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-lg border px-6">
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">{a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-foreground">
            Your Website Isn't Slow.{" "}
            <span className="text-primary">Your Images Are.</span>
          </h2>
          <p className="text-lg text-muted-foreground mb-8">Fix them in seconds.</p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-10 py-6 text-lg">
              <Upload className="w-5 h-5 mr-2" />
              Optimize Images Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Minimize2 className="w-6 h-6 text-primary" />
                <span className="text-lg font-bold text-foreground">PixelSqueeze</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Image optimization built for real-world results, not technical
                settings.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Image Optimizer</Link></li>
                <li><Link to="/scanner" className="hover:text-foreground transition-colors">Website Scanner</Link></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/company" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/privacy-policy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/install" className="hover:text-foreground transition-colors">Install App</Link></li>
                <li><Link to="/promote" className="hover:text-foreground transition-colors">Affiliate Program</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} PixelSqueeze. All rights reserved.
          </div>
        </div>
      </footer>

      <InstallBanner />
      <EmailCapturePopup />
    </div>
  );
};

export default Landing;
