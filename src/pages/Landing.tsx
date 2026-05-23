import { lazy, Suspense } from "react";
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
const BeforeAfterSlider = lazy(() =>
  import("@/components/BeforeAfterSlider").then((m) => ({ default: m.BeforeAfterSlider }))
);
const InstallBanner = lazy(() => import("@/components/InstallBanner"));
const EmailCapturePopup = lazy(() => import("@/components/EmailCapturePopup"));
import { useUtmTracking } from "@/hooks/useUtmTracking";
import weddingBefore from "@/assets/wedding-before.jpg";
import weddingAfter from "@/assets/wedding-after.jpg";
import manBefore from "@/assets/man-before.jpg";
import manAfter from "@/assets/man-after.jpg";

const Landing = () => {
  useUtmTracking();

  return (
    <div className="min-h-screen bg-background" role="document">
      {/* ─── Navigation (Compressor.io-style: minimal) ─── */}
      <nav className="bg-background border-b border-border/60 px-6 py-4 sticky top-0 z-50" aria-label="Main navigation">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Minimize2 className="w-7 h-7 text-primary" />
            <span className="text-xl font-bold tracking-tight text-foreground">
              PixelSqueeze
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-10">
            <a href="#features" className="text-foreground/80 hover:text-foreground transition-colors text-base font-medium">
              Features
            </a>
            <Link to="/pricing">
              <Button size="sm" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-5 rounded-full font-semibold">
                Go Premium
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700 rounded-full px-5 font-semibold">
                Sign In
              </Button>
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Link to="/pricing">
              <Button size="sm" className="bg-gradient-primary rounded-full">Go Premium</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-purple-600 text-white hover:bg-purple-700 rounded-full font-semibold">Sign In</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO (Compressor.io-style: big centered headline + dropzone CTA) ─── */}
      <main id="main-content">
      <section className="relative px-6 pt-16 md:pt-24 pb-20 overflow-hidden" aria-labelledby="hero-heading">
        {/* Diagonal brand accents */}
        <div
          aria-hidden="true"
          className="absolute -left-32 top-8 w-[55%] h-[420px] bg-gradient-primary opacity-90 hidden md:block"
          style={{ clipPath: "polygon(0 0, 100% 35%, 0 70%)" }}
        />
        <div
          aria-hidden="true"
          className="absolute -right-32 bottom-0 w-[55%] h-[420px] bg-gradient-primary opacity-90 hidden md:block"
          style={{ clipPath: "polygon(100% 30%, 100% 100%, 0 70%)" }}
        />

        <div className="relative max-w-3xl mx-auto text-center">
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 leading-[1.05] text-foreground tracking-tight"
          >
            Fast &amp; efficient image{" "}
            <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              compression
            </span>
          </h1>

          <div className="inline-flex items-center justify-center border-2 border-primary/40 text-primary rounded-full px-6 py-2.5 mb-12 text-sm sm:text-base font-semibold">
            Optimize JPEG, PNG, WebP, AVIF &amp; SVG
          </div>

          {/* Dropzone-styled CTA card (routes to /auth — no anonymous compression) */}
          <Link to="/auth" aria-label="Sign up to optimize images" className="block group">
            <div className="bg-card border-2 border-dashed border-primary/50 rounded-2xl p-10 sm:p-14 shadow-sm hover:shadow-glow hover:border-primary transition-all">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-2xl bg-gradient-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-10 h-10 text-primary" />
                </div>
                <p className="text-xl sm:text-2xl font-semibold text-primary">
                  Drop your images or click to start
                </p>
                <p className="text-sm text-muted-foreground">
                  Compress JPG, PNG, WebP, AVIF • Up to 100 images at once
                </p>
                <Button size="lg" className="mt-2 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 rounded-full px-8 font-semibold">
                  <Upload className="w-4 h-4 mr-2" />
                  Select files
                </Button>
              </div>
            </div>
          </Link>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> No quality loss</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Free to start</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Works in seconds</span>
          </div>

          <div className="mt-8">
            <Link to="/scanner" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
              <Search className="w-4 h-4" />
              Or scan your whole website for slow images
            </Link>
          </div>
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
      <section className="section-padding" id="features">
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
            <Suspense fallback={<div className="aspect-video bg-secondary/30 rounded-lg animate-pulse" />}>
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
            </Suspense>
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

      </main>

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

      <Suspense fallback={null}>
        <InstallBanner />
        <EmailCapturePopup />
      </Suspense>
    </div>
  );
};

export default Landing;
