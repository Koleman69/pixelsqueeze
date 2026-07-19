import { lazy, Suspense, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Sparkles,
  Upload,
  ArrowRight,
  Star,
  CheckCircle,
  Wand2,
  Maximize2,
  Minimize2,
  Crop,
  Palette,
  Zap,
  Shield,
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
  const beforeAfterRef = useRef<HTMLDivElement>(null);

  const scrollToBeforeAfter = () => {
    beforeAfterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/50" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-glow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display">PixelSqueeze</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Features</a>
            <a href="#reviews" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Reviews</a>
            <a href="#pricing" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-foreground/70 hover:text-foreground transition-colors">FAQ</a>
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-semibold">Sign in</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="rounded-2xl px-5 font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 shadow-glow border-0">
                Get started
              </Button>
            </Link>
          </div>
          <div className="flex md:hidden">
            <Link to="/auth">
              <Button size="sm" className="rounded-2xl font-semibold bg-gradient-to-r from-primary to-secondary text-white border-0">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content">
        {/* HERO */}
        <section
          className="relative px-6 pt-16 md:pt-24 pb-20 md:pb-28 overflow-hidden"
          aria-labelledby="hero-heading"
          style={{ backgroundImage: "var(--gradient-mesh)" }}
        >
          <div className="max-w-5xl mx-auto text-center relative">
            <div className="inline-flex items-center gap-2 bg-white border border-border rounded-full px-4 py-1.5 mb-8 shadow-soft">
              <Sparkles className="w-3.5 h-3.5 text-secondary" />
              <span className="text-xs font-semibold text-foreground/80">AI-powered image studio</span>
            </div>
            <h1
              id="hero-heading"
              className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.02] tracking-tight text-foreground"
            >
              Make Every Photo Look{" "}
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Professional.
              </span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto leading-relaxed">
              Enhance, upscale, compress, resize and optimize every image with AI in one click.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/auth">
                <Button
                  size="lg"
                  className="rounded-2xl h-14 px-8 text-base font-semibold bg-gradient-to-r from-primary to-secondary text-white hover:opacity-95 shadow-glow border-0 min-w-[220px]"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Image
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={scrollToBeforeAfter}
                className="rounded-2xl h-14 px-8 text-base font-semibold border-2 min-w-[220px] bg-white/60 backdrop-blur"
              >
                See Before & After
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            <p className="mt-6 text-xs text-foreground/50 font-medium">
              No credit card required · Free forever plan · Cancel anytime
            </p>
          </div>

          {/* Hero showcase mockup */}
          <div className="max-w-5xl mx-auto mt-16 relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20 blur-3xl rounded-[3rem]" aria-hidden />
            <div className="relative rounded-3xl bg-white shadow-card border border-border overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border bg-muted/40">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-loss/70" />
                  <span className="w-3 h-3 rounded-full bg-warning/70" />
                  <span className="w-3 h-3 rounded-full bg-profit/70" />
                </div>
                <div className="mx-auto text-xs font-medium text-foreground/50">pixelsqueeze.app / studio</div>
              </div>
              <div className="aspect-[16/9] bg-muted/40">
                <Suspense fallback={<div className="w-full h-full animate-pulse bg-muted" />}>
                  <BeforeAfterSlider
                    beforeImage={weddingBefore}
                    afterImage={weddingAfter}
                    title=""
                    description=""
                  />
                </Suspense>
              </div>
            </div>
          </div>
        </section>

        {/* TRUSTED BY CREATORS */}
        <section className="px-6 py-14 border-y border-border bg-white" aria-label="Trusted by creators">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-[11px] uppercase tracking-[0.25em] font-bold text-foreground/40 mb-8">
              Trusted by 12,000+ creators & teams
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60">
              {["Shopify", "Etsy", "Squarespace", "Amazon", "Airbnb", "Webflow"].map((b) => (
                <span key={b} className="text-lg md:text-xl font-display font-bold tracking-tight text-foreground/70">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* BEFORE & AFTER SLIDER */}
        <section ref={beforeAfterRef} className="px-6 py-20 md:py-28" aria-labelledby="before-after-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Before & After</p>
              <h2 id="before-after-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight">
                See the difference AI makes.
              </h2>
              <p className="text-lg text-foreground/60 mt-4">Drag the slider. Same photo, dramatically better.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<div className="aspect-video bg-muted rounded-3xl animate-pulse" />}>
                <BeforeAfterSlider
                  beforeImage={weddingBefore}
                  afterImage={weddingAfter}
                  title="Wedding photo enhanced"
                  description="Sharper detail, richer color, 70% smaller file"
                />
                <BeforeAfterSlider
                  beforeImage={manBefore}
                  afterImage={manAfter}
                  title="Portrait upscaled"
                  description="AI enhancement + smart compression"
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* AI FEATURES */}
        <section id="features" className="px-6 py-20 md:py-28 bg-white" aria-labelledby="features-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">AI Features</p>
              <h2 id="features-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight">
                One app. Every image tool you need.
              </h2>
              <p className="text-lg text-foreground/60 mt-4">Powered by AI. Ready in one click.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: Wand2, title: "AI Enhance", desc: "Restore clarity, color and detail automatically.", color: "from-primary to-secondary" },
                { icon: Maximize2, title: "AI Upscale", desc: "Up to 4× larger with zero loss in sharpness.", color: "from-secondary to-accent" },
                { icon: Minimize2, title: "Smart Compress", desc: "Up to 80% smaller, no visible quality loss.", color: "from-accent to-primary" },
                { icon: Crop, title: "Auto Resize", desc: "Perfect crops for every platform, instantly.", color: "from-primary to-accent" },
                { icon: Palette, title: "Background Removal", desc: "Studio-grade cutouts in seconds.", color: "from-secondary to-primary" },
                { icon: Zap, title: "Magic Optimize", desc: "Pick a destination — we handle the rest.", color: "from-accent to-secondary" },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div
                  key={title}
                  className="group p-7 rounded-3xl bg-white border border-border shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-300"
                >
                  <div className={`w-12 h-12 rounded-2xl mb-5 flex items-center justify-center bg-gradient-to-br ${color} shadow-glow`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2">{title}</h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CUSTOMER REVIEWS */}
        <section id="reviews" className="px-6 py-20 md:py-28" aria-labelledby="reviews-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Reviews</p>
              <h2 id="reviews-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight">
                Loved by creators everywhere.
              </h2>
              <div className="flex items-center justify-center gap-2 mt-6">
                <div className="flex gap-0.5 text-warning">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-foreground/70">4.9 · 2,847 reviews</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { name: "Sarah Jenkins", role: "E-com Director", quote: "The Amazon preset alone saved our team 12 hours a week. It's the standard for our workflow now." },
                { name: "Marcus Chen", role: "Photographer", quote: "AI upscale is unreal. I've stopped paying for two other tools since switching to PixelSqueeze." },
                { name: "Elena Rossi", role: "Boutique Owner", quote: "My product photos load faster and look better. Sales pages feel professional again." },
              ].map((r) => (
                <div key={r.name} className="bg-white rounded-3xl border border-border p-7 shadow-soft">
                  <div className="flex gap-0.5 text-warning mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-base leading-relaxed text-foreground/80 mb-6">"{r.quote}"</blockquote>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary via-secondary to-accent" aria-hidden />
                    <div>
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-xs text-foreground/50">{r.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING PREVIEW */}
        <section id="pricing" className="px-6 py-20 md:py-28 bg-gradient-to-b from-white via-white to-primary/[0.03]" aria-labelledby="pricing-heading">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">Pricing</p>
              <h2 id="pricing-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight">
                Plans that scale with you
              </h2>
              <p className="text-lg text-foreground/60 mt-4">Start free. Upgrade the moment you need more.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto items-stretch">
              {[
                {
                  name: "Free",
                  price: "$0",
                  cadence: "/forever",
                  tagline: "Try every core tool.",
                  cta: "Start free",
                  features: ["25 images / month", "Basic optimization", "No watermark", "Web-ready exports"],
                  accent: "from-slate-500/10 to-slate-500/5",
                  border: "border-border",
                  popular: false,
                },
                {
                  name: "Creator",
                  price: "$9",
                  cadence: "/month",
                  tagline: "For creators & freelancers.",
                  cta: "Start Creator",
                  features: ["500 images / month", "AI Enhance", "Batch processing", "Social exports"],
                  accent: "from-primary via-secondary to-accent",
                  border: "border-transparent",
                  popular: true,
                },
                {
                  name: "Pro",
                  price: "$24",
                  cadence: "/month",
                  tagline: "For studios & agencies.",
                  cta: "Go Pro",
                  features: ["Unlimited images", "Print Ready (400 DPI)", "API access", "Priority processing"],
                  accent: "from-indigo-500/10 to-purple-500/5",
                  border: "border-border",
                  popular: false,
                },
                {
                  name: "Business",
                  price: "$79",
                  cadence: "/month",
                  tagline: "For growing teams.",
                  cta: "Contact sales",
                  features: ["Everything in Pro", "Teams & white label", "Brand presets", "Analytics", "Enterprise support"],
                  accent: "from-emerald-500/10 to-teal-500/5",
                  border: "border-border",
                  popular: false,
                },
              ].map((tier) => {
                const highlight = tier.popular;
                return (
                  <div
                    key={tier.name}
                    className={`group relative rounded-3xl p-8 transition-all duration-500 ease-out hover:-translate-y-2 hover:shadow-2xl ${
                      highlight
                        ? `text-white overflow-hidden shadow-glow bg-gradient-to-br ${tier.accent} lg:scale-[1.04] lg:-translate-y-1 hover:lg:-translate-y-3`
                        : `bg-background border ${tier.border} shadow-soft hover:border-primary/40`
                    }`}
                  >
                    {highlight && (
                      <>
                        <div aria-hidden className="absolute -top-16 -right-16 w-48 h-48 bg-white/20 blur-3xl pointer-events-none" />
                        <div aria-hidden className="absolute -bottom-20 -left-10 w-56 h-56 bg-white/10 blur-3xl pointer-events-none" />
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-white text-primary rounded-full px-3 py-1.5 shadow-lg">
                            <Sparkles className="w-3 h-3" />
                            Most Popular
                          </span>
                        </div>
                      </>
                    )}
                    <div className="relative">
                      <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${highlight ? "text-white/90" : "text-foreground/50"}`}>
                        {tier.name}
                      </p>
                      <div className="flex items-baseline mb-2">
                        <span className="text-5xl font-bold font-display">{tier.price}</span>
                        <span className={`text-sm ml-2 ${highlight ? "opacity-80" : "text-foreground/60"}`}>{tier.cadence}</span>
                      </div>
                      <p className={`text-sm mb-6 ${highlight ? "opacity-90" : "text-foreground/60"}`}>{tier.tagline}</p>
                      <ul className="space-y-3 mb-8 min-h-[168px]">
                        {tier.features.map((f) => (
                          <li key={f} className={`flex items-start gap-2.5 text-sm ${highlight ? "" : "text-foreground/80"}`}>
                            <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${highlight ? "text-white" : "text-primary"}`} />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                      <Link to={tier.name === "Business" ? "/contact" : "/auth"}>
                        <Button
                          className={`w-full h-12 rounded-2xl font-semibold transition-transform group-hover:scale-[1.02] ${
                            highlight
                              ? "bg-white text-primary hover:bg-white/95 border-0"
                              : "bg-foreground text-background hover:bg-foreground/90 border-0"
                          }`}
                        >
                          {tier.cta}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-foreground/50 mt-8">
              All plans include no watermark, HTTPS delivery, and cancel-anytime billing.
            </p>
          </div>
        </section>


        {/* FAQ */}
        <section id="faq" className="px-6 py-20 md:py-28" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-primary mb-3">FAQ</p>
              <h2 id="faq-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight">Questions, answered.</h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {[
                { q: "How is PixelSqueeze different from a normal compressor?", a: "PixelSqueeze uses AI to enhance, upscale, and optimize — not just shrink. Pick a destination and we auto-select format, dimensions, and compression." },
                { q: "Can I really use it for free?", a: "Yes. The free plan includes every core AI tool. Pro removes the daily cap and unlocks batch, cloud storage, and priority processing." },
                { q: "Where are my images processed?", a: "Free plan processes in-browser. Paid plans use encrypted storage that auto-deletes after 30 days. Files are never shared, sold, or used for training." },
                { q: "What formats are supported?", a: "JPEG, PNG, WebP, AVIF, GIF and SVG in — WebP or AVIF out, sized correctly for your chosen destination." },
                { q: "Can I cancel anytime?", a: "One click in your account. You keep Pro access until the end of your billing period." },
              ].map(({ q, a }, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="bg-white rounded-2xl border border-border px-6 shadow-soft">
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline font-display">{q}</AccordionTrigger>
                  <AccordionContent className="text-foreground/70 pb-5 leading-relaxed">{a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 pb-24">
          <div className="max-w-5xl mx-auto rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden shadow-glow bg-gradient-to-br from-primary via-secondary to-accent text-white">
            <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-white/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
                Make every photo look professional.
              </h2>
              <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
                Try PixelSqueeze free. No card, no watermarks, no fine print.
              </p>
              <Link to="/auth">
                <Button size="lg" className="bg-white text-primary hover:bg-white/95 rounded-2xl px-8 h-14 font-semibold border-0 text-base">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload your first image
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-base font-bold font-display">PixelSqueeze</span>
              </div>
              <p className="text-sm text-foreground/60 leading-relaxed">
                AI-powered image optimization. Enhance, upscale, compress — all in one place.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link to="/auth" className="hover:text-foreground transition-colors">Magic Optimize</Link></li>
                <li><Link to="/scanner" className="hover:text-foreground transition-colors">Website Scanner</Link></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link to="/company" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-foreground/60">
                <li><Link to="/install" className="hover:text-foreground transition-colors">Install App</Link></li>
                <li><Link to="/promote" className="hover:text-foreground transition-colors">Affiliate</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-foreground/50">© {new Date().getFullYear()} PixelSqueeze. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-foreground/50">
              <Shield className="w-3.5 h-3.5" />
              <span>Private by default · SOC-friendly workflow</span>
            </div>
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
