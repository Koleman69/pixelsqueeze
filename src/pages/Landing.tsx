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
  Search,
  ShoppingCart,
  PenTool,
  Home,
  Hotel,
  Instagram,
  Globe,
  Sparkles,
  Layers,
  Lock,
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
    <div className="min-h-screen bg-background text-foreground" role="document">
      {/* ─── Navigation ─── */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/60" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <Minimize2 className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display text-foreground">
              PixelSqueeze
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
            <Link to="/scanner" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Scanner</Link>
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="text-foreground font-semibold">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-secondary rounded-xl px-5 font-semibold shadow-glow">
                Get started
              </Button>
            </Link>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <Link to="/auth">
              <Button size="sm" className="bg-accent text-accent-foreground rounded-xl font-semibold">Get started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* ─── HERO BENTO ─── */}
        <section className="px-6 pt-10 md:pt-16 pb-16" aria-labelledby="hero-heading">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* Hero Header Card */}
            <div className="lg:col-span-8 bg-card p-8 md:p-12 rounded-3xl border border-primary/10 shadow-card flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center gap-2 bg-secondary/5 border border-secondary/10 rounded-full px-4 py-1.5 w-fit">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-widest text-secondary">Magic Optimize · Live</span>
              </div>
              <h1
                id="hero-heading"
                className="font-display text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] tracking-tight text-foreground"
              >
                Upload once.<br />
                <span className="text-primary">Perfect for everywhere.</span>
              </h1>
              <p className="text-lg text-foreground/70 max-w-xl leading-relaxed">
                Destination-aware image optimization for creators, sellers, and teams who value quality — and their time.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/auth">
                  <Button size="lg" className="bg-accent text-accent-foreground hover:bg-secondary rounded-xl px-7 h-12 font-semibold shadow-glow">
                    Start optimizing free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="h-9 w-9 rounded-full border-2 border-card bg-gradient-to-br from-primary to-secondary" />
                    <div className="h-9 w-9 rounded-full border-2 border-card bg-gradient-to-br from-secondary to-accent" />
                    <div className="h-9 w-9 rounded-full border-2 border-card bg-gradient-to-br from-accent to-primary" />
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-0.5 text-warning">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-current" />
                      ))}
                    </div>
                    <p className="text-xs text-foreground/60 font-medium">Joined by 12,000+ creators</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Magic Optimize Tool Card */}
            <div className="lg:col-span-4 bg-accent rounded-3xl p-7 flex flex-col justify-between text-accent-foreground relative overflow-hidden group">
              <div aria-hidden className="absolute top-0 right-0 w-40 h-40 bg-primary/25 blur-3xl" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h3 className="text-base font-bold font-display tracking-tight">Magic Optimize</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: Instagram, label: "Instagram Grid", active: true },
                    { icon: Globe, label: "Web (WebP High)" },
                    { icon: ShoppingCart, label: "Amazon E-com" },
                  ].map(({ icon: Icon, label, active }) => (
                    <div
                      key={label}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                        active
                          ? "bg-white/15 border-white/20"
                          : "bg-white/5 border-white/10 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-lg ${active ? "bg-primary" : "bg-primary/40"}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">{label}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-white/30"}`} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-5 border-t border-white/10 relative z-10">
                <p className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-1">Status</p>
                <p className="text-sm text-white/90">Optimizing for 3 destinations…</p>
              </div>
            </div>

            {/* Proof Card */}
            <div className="lg:col-span-3 bg-card border border-primary/10 rounded-3xl p-6 flex flex-col justify-between shadow-card">
              <div>
                <p className="text-primary font-bold text-[11px] uppercase tracking-widest mb-3">Efficiency</p>
                <div className="flex items-end gap-0.5">
                  <span className="text-5xl font-bold font-display text-foreground leading-none">94</span>
                  <span className="text-xl font-bold text-foreground mb-1">%</span>
                </div>
                <p className="text-sm text-foreground/60 leading-snug mt-2">Average size reduction with no perceptible quality loss.</p>
              </div>
              <div className="mt-5 bg-background rounded-2xl h-24 relative overflow-hidden">
                <div className="absolute inset-0 flex">
                  <div className="w-1/2 bg-muted h-full flex items-center justify-center text-[9px] text-foreground/60 font-bold tracking-widest">BEFORE</div>
                  <div className="w-1/2 bg-primary h-full flex items-center justify-center text-[9px] text-primary-foreground font-bold tracking-widest">AFTER</div>
                </div>
                <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-card shadow" />
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="lg:col-span-5 bg-primary rounded-3xl p-8 text-primary-foreground flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold font-display leading-none">4.9</p>
                  <p className="text-[10px] uppercase font-bold text-white/70 tracking-widest mt-1">User rating</p>
                </div>
              </div>
              <blockquote className="text-lg md:text-xl font-medium leading-snug py-5">
                "The Amazon preset alone saved our team 12 hours a week. It's the standard for our e-com workflow now."
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/25" />
                <div className="text-xs">
                  <p className="font-bold">Sarah Jenkins</p>
                  <p className="opacity-70">E-com Director, Nordvick</p>
                </div>
              </div>
            </div>

            {/* Pricing Hook Card */}
            <div className="lg:col-span-4 bg-card border border-primary/10 rounded-3xl p-8 flex flex-col justify-center items-center text-center gap-4 shadow-card">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Pro Subscription</p>
              <div className="flex items-baseline">
                <span className="text-sm font-bold text-secondary mr-1">$</span>
                <span className="text-6xl font-bold font-display text-foreground leading-none">12</span>
                <span className="text-sm font-medium text-foreground/60 ml-1">/mo</span>
              </div>
              <ul className="text-sm text-foreground/80 space-y-2 pb-2 w-full max-w-[240px]">
                {["Unlimited Magic exports", "Every destination preset", "30-day cloud storage", "Priority processing"].map((f) => (
                  <li key={f} className="flex items-center gap-2 justify-start">
                    <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/pricing" className="w-full">
                <Button className="w-full h-12 rounded-xl border-2 border-accent bg-transparent text-accent hover:bg-accent hover:text-accent-foreground transition-all font-semibold">
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>

          {/* Trust bar */}
          <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-border">
            <p className="text-center text-[11px] uppercase tracking-[0.2em] font-bold text-foreground/40 mb-6">
              Trusted by teams shipping on
            </p>
            <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16 opacity-50">
              {["SHOPIFY", "ETSY", "SQUARESPACE", "AMAZON", "WOO"].map((b) => (
                <span key={b} className="text-sm md:text-base font-display font-bold tracking-[0.2em] text-foreground">{b}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEATURES ─── */}
        <section id="features" className="px-6 py-20 md:py-28">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-14">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4">Features</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Everything you'd expect from a $50/mo tool. Nothing you don't.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  icon: Sparkles,
                  title: "Magic Optimize",
                  desc: "Pick a destination — Instagram, Amazon, Print, Web — and we auto-select the format, dimensions, and compression.",
                  featured: true,
                },
                {
                  icon: Layers,
                  title: "Batch processing",
                  desc: "Drop up to 100 files, download a single zip. Perfect for product catalogs and photo shoots.",
                },
                {
                  icon: Globe,
                  title: "Website scanner",
                  desc: "Paste any URL — get a full image audit with performance grade, SEO score, and one-click fixes.",
                },
                {
                  icon: Zap,
                  title: "Modern formats",
                  desc: "WebP and AVIF conversion for up to 80% smaller files that Google actually rewards.",
                },
                {
                  icon: Lock,
                  title: "Metadata cleanup",
                  desc: "Strip GPS, camera data, and personal info from every file — automatically.",
                },
                {
                  icon: Shield,
                  title: "Private by default",
                  desc: "Free tier processes locally. Paid tiers use encrypted storage that auto-deletes after 30 days.",
                },
              ].map(({ icon: Icon, title, desc, featured }) => (
                <div
                  key={title}
                  className={`p-7 rounded-3xl border transition-all hover:-translate-y-0.5 ${
                    featured
                      ? "bg-accent border-accent text-accent-foreground shadow-glow"
                      : "bg-card border-primary/10 text-foreground shadow-card hover:border-primary/30"
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl mb-5 flex items-center justify-center ${featured ? "bg-primary" : "bg-primary/10"}`}>
                    <Icon className={`w-5 h-5 ${featured ? "text-primary-foreground" : "text-primary"}`} />
                  </div>
                  <h3 className={`font-display text-lg font-bold mb-2 ${featured ? "text-accent-foreground" : "text-foreground"}`}>{title}</h3>
                  <p className={`text-sm leading-relaxed ${featured ? "text-white/70" : "text-foreground/60"}`}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── BEFORE / AFTER PROOF ─── */}
        <section className="px-6 py-20 md:py-28 bg-card">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4">Proof</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Same photo. Same eyes. A fraction of the file.
              </h2>
              <p className="text-lg text-foreground/60 mt-4">Slide to compare originals with Magic-optimized output.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<div className="aspect-video bg-muted rounded-2xl animate-pulse" />}>
                <BeforeAfterSlider
                  beforeImage={weddingBefore}
                  afterImage={weddingAfter}
                  title="Wedding photo — 70% smaller"
                  description="Crystal-clear quality preserved"
                />
                <BeforeAfterSlider
                  beforeImage={manBefore}
                  afterImage={manAfter}
                  title="Portrait — 65% smaller"
                  description="Professional detail maintained"
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* ─── WHO IT'S FOR ─── */}
        <section className="px-6 py-20 md:py-28">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-2xl mb-12">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4">Built for</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Everyone who publishes images.
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: ShoppingCart, title: "Ecom sellers", desc: "Amazon, Shopify, Etsy — every marketplace has different specs." },
                { icon: PenTool, title: "Creators", desc: "Instagram, TikTok, LinkedIn — perfect crops in one click." },
                { icon: Home, title: "Realtors", desc: "Listing photos that hit MLS specs, instantly." },
                { icon: Hotel, title: "Hospitality", desc: "Faster booking pages that convert mobile guests." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-6 rounded-2xl bg-card border border-primary/10 shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-foreground mb-1.5">{title}</h3>
                  <p className="text-sm text-foreground/60 leading-snug">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── PRICING ─── */}
        <section id="pricing" className="px-6 py-20 md:py-28 bg-card">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4">Pricing</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">
                Simple pricing. Cancel anytime.
              </h2>
              <p className="text-lg text-foreground/60 mt-4">Start free. Upgrade only when you need more.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
              <div className="bg-background rounded-3xl border border-border p-8">
                <p className="text-[11px] font-bold uppercase tracking-widest text-foreground/60 mb-2">Free</p>
                <div className="flex items-baseline mb-2">
                  <span className="text-5xl font-bold font-display text-foreground">$0</span>
                  <span className="text-sm text-foreground/60 ml-2">/forever</span>
                </div>
                <p className="text-sm text-foreground/60 mb-6">Every core tool, no card required.</p>
                <ul className="space-y-3 mb-8">
                  {["Magic Optimize (3/day)", "All destination presets", "Batch up to 5 files", "Website scanner", "WebP & AVIF export"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <CheckCircle className="w-4 h-4 text-primary shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth">
                  <Button variant="outline" className="w-full h-11 rounded-xl border-2 border-border text-foreground hover:bg-muted font-semibold">
                    Start free
                  </Button>
                </Link>
              </div>

              <div className="bg-accent rounded-3xl p-8 text-accent-foreground relative overflow-hidden shadow-glow">
                <div aria-hidden className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 blur-3xl" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Pro</p>
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-primary text-primary-foreground rounded-full px-2.5 py-1">Most popular</span>
                  </div>
                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold font-display">$12</span>
                    <span className="text-sm opacity-70 ml-2">/month</span>
                  </div>
                  <p className="text-sm opacity-70 mb-6">For serious sellers and busy creators.</p>
                  <ul className="space-y-3 mb-8">
                    {[
                      "Unlimited Magic Optimize",
                      "Batch up to 100 files",
                      "AI edits & background removal",
                      "30-day cloud storage",
                      "Folder & platform automation",
                      "Priority processing",
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/auth">
                    <Button className="w-full h-11 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                      Start 7-day free trial
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="px-6 py-20 md:py-28">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-[11px] font-bold uppercase tracking-widest text-primary mb-4">FAQ</p>
              <h2 className="font-display text-3xl md:text-5xl font-bold text-foreground leading-tight">Questions, answered.</h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {[
                { q: "How is Magic Optimize different from a normal compressor?", a: "Regular tools ask you to pick format, quality, and dimensions. Magic Optimize picks all of that for you based on where the image is going — Instagram, Amazon, Print, Web — so you never guess and never over-compress." },
                { q: "Can I really use it for free?", a: "Yes. The free plan includes every core destination preset and the website scanner. Pro removes the daily cap and unlocks batch, automation, and cloud storage." },
                { q: "Where are my images processed?", a: "Free plan processes in-browser. Paid plans use encrypted storage that auto-deletes after 30 days. Files are never shared, sold, or used for training." },
                { q: "What formats are supported?", a: "JPEG, PNG, WebP, AVIF, and GIF in — WebP or AVIF out, sized correctly for your chosen destination." },
                { q: "Can I cancel anytime?", a: "One click in your account. You keep Pro access until the end of your billing period." },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-card rounded-2xl border border-primary/10 px-6 shadow-card">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline font-display">{q}</AccordionTrigger>
                  <AccordionContent className="text-foreground/70 pb-5 leading-relaxed">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ─── FINAL CTA ─── */}
        <section className="px-6 py-20 md:py-28">
          <div className="max-w-5xl mx-auto bg-accent rounded-[2rem] p-10 md:p-16 text-accent-foreground text-center relative overflow-hidden shadow-glow">
            <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/25 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 leading-tight">
                Your images deserve better tools.
              </h2>
              <p className="text-lg opacity-70 mb-8 max-w-xl mx-auto">
                Try Magic Optimize free. No card, no watermarks, no fine print.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 h-12 font-semibold">
                  <Upload className="w-4 h-4 mr-2" />
                  Start optimizing free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center">
                  <Minimize2 className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <span className="text-base font-bold font-display text-foreground">PixelSqueeze</span>
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Destination-aware image optimization. Built for creators who value quality and time.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-foreground text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Magic Optimize</Link></li>
                <li><Link to="/scanner" className="hover:text-foreground transition-colors">Website Scanner</Link></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-foreground text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link to="/company" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-foreground text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link to="/install" className="hover:text-foreground transition-colors">Install App</Link></li>
                <li><Link to="/promote" className="hover:text-foreground transition-colors">Affiliate</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-xs text-foreground/50">
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
