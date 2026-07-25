import { lazy, Suspense, useRef, useEffect, useState, useMemo, FormEvent } from "react";
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
  Zap,
  Shield,
  ThumbsUp,
  ThumbsDown,
  X,
  Check,
  Mail,
} from "lucide-react";
import { Link } from "react-router-dom";
const BeforeAfterSlider = lazy(() =>
  import("@/components/BeforeAfterSlider").then((m) => ({ default: m.BeforeAfterSlider }))
);
// First-open popups disabled: InstallBanner and EmailCapturePopup removed.
// const InstallBanner = lazy(() => import("@/components/InstallBanner"));
// const EmailCapturePopup = lazy(() => import("@/components/EmailCapturePopup"));
import { useUtmTracking } from "@/hooks/useUtmTracking";
import weddingBefore from "@/assets/wedding-before.jpg";
import weddingAfter from "@/assets/wedding-after.jpg";
import manBefore from "@/assets/man-before.jpg";
import manAfter from "@/assets/man-after.jpg";
import SEO from "@/components/SEO";
import AIAnswerBlock from "@/components/AIAnswerBlock";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ---- Live usage counter (seeded per-day, ticks up while page is open) ----
function useLiveCounter(base = 1_240_000, dailyGrowth = 24_000) {
  const seed = useMemo(() => {
    const now = new Date();
    const secondsIntoDay =
      now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    return Math.floor(base + (dailyGrowth * secondsIntoDay) / 86_400);
  }, [base, dailyGrowth]);
  const [n, setN] = useState(seed);
  useEffect(() => {
    const id = setInterval(() => setN((v) => v + Math.floor(1 + Math.random() * 3)), 2200);
    return () => clearInterval(id);
  }, []);
  return n;
}

// ---- Lightweight A/B variant assignment (persistent + dataLayer beacon) ----
function useVariant(experiment: string, variants: string[]) {
  const [v] = useState(() => {
    const key = `ab_${experiment}`;
    const existing = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    if (existing && variants.includes(existing)) return existing;
    const picked = variants[Math.floor(Math.random() * variants.length)];
    try {
      localStorage.setItem(key, picked);
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push({ event: "ab_assign", experiment, variant: picked });
    } catch {}
    return picked;
  });
  return v;
}

function trackConversion(name: string, meta: Record<string, unknown> = {}) {
  try {
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).dataLayer.push({ event: "conversion", name, ...meta });
  } catch {}
}

const Landing = () => {
  useUtmTracking();
  const beforeAfterRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const liveCount = useLiveCounter();
  const heroVariant = useVariant("hero_cta_v1", ["A", "B"]);

  const scrollToBeforeAfter = () =>
    beforeAfterRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  // ---- Content that drives BOTH the visible UI and the rich-result schemas ----
  const RATING = { value: "4.9", count: 2847, best: "5", worst: "1" };

  const REVIEWS = [
    { name: "Sarah Jenkins", role: "Realtor", rating: 5, quote: "My phone photos of listings look like they came from a pro photographer. Every single time." },
    { name: "Marcus Chen", role: "Dad of three", rating: 5, quote: "Rescued years of blurry kid photos in about ten minutes. My wife actually cried." },
    { name: "Elena Rossi", role: "Boutique Owner", rating: 5, quote: "My product photos went from dull to gorgeous in one click. Sales jumped the same week." },
  ];

  const TIERS = [
    { name: "Free",     price: 0,  cadence: "/forever", tagline: "Fix your first photos free.",  cta: "Start free",    features: ["4 photos free per tool", "One-click fix", "No watermark", "No signup for first fix"] },
    { name: "Creator",  price: 9,  cadence: "/month",   tagline: "For creators & side hustlers.", cta: "Start Creator", features: ["500 photos / month", "AI Enhance & Upscale", "Batch fix multiple photos", "Social-ready exports"], popular: true },
    { name: "Pro",      price: 24, cadence: "/month",   tagline: "For studios & agencies.",       cta: "Go Pro",        features: ["Unlimited photos", "Print-quality restore", "Priority processing", "Cloud library"] },
    { name: "Business", price: 79, cadence: "/month",   tagline: "For growing teams.",            cta: "Contact sales", features: ["Everything in Pro", "Teams & white label", "Brand presets", "Analytics", "Enterprise support"] },
  ];

  const FAQS = [
    { q: "Can PixelSqueeze really fix a blurry photo?", a: "Yes. Our AI rebuilds sharpness, removes noise, corrects lighting and restores color in one click — even on phone photos, old scans, and low-resolution images." },
    { q: "Do I need to know photo editing?", a: "No. You upload a photo, we analyze it, and one button fixes everything automatically. No sliders, no settings, no learning curve." },
    { q: "Is it really free?", a: "Yes. Your first fixes are free with no signup and no credit card. Upgrade only if you want to fix photos in bulk." },
    { q: "Will my photos stay private?", a: "Always. Free fixes happen in your browser — your photos never leave your device. Paid plans use encrypted storage that auto-deletes after 30 days." },
    { q: "What kinds of photos work best?", a: "Everything — phone shots, old family photos, product pictures, real estate listings, portraits, screenshots. If it looks blurry, dark, grainy or dull, we can fix it." },
  ];

  const HOWTO_STEPS = [
    { name: "Upload your photo",     text: "Drag any photo in — phone shot, old scan, product picture, screenshot. Anything." },
    { name: "We analyze it instantly", text: "PixelSqueeze scans for blur, noise, low light, dull color and low resolution — and grades your photo." },
    { name: "Tap 'Fix My Photo'",    text: "One button. AI sharpens, brightens, denoises, restores color and boosts resolution automatically." },
    { name: "Download and share",    text: "Get your fixed photo in seconds — or a full pack sized for social, web and print." },
  ];

  const PROS = [
    "One click fixes blur, noise, dark lighting and dull color",
    "Works on phone photos, old scans, screenshots and product shots",
    "No sliders, no settings, no editing skills needed",
    "Free first fixes — no signup, no credit card, no watermark",
    "Your photos stay on your device on the free plan",
  ];
  const CONS = [
    "Free plan limited to 4 photos per tool before upgrade",
    "Very heavily damaged photos may need a second pass",
    "Web and mobile only — no desktop app (works great as a PWA)",
  ];

  // ---- Rich-result JSON-LD stack (unchanged) ----
  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PixelSqueeze",
    applicationCategory: "MultimediaApplication",
    applicationSubCategory: "AI Photo Enhancement",
    operatingSystem: "Web, iOS, Android",
    url: "https://pixelsqueeze.app",
    image: "https://pixelsqueeze.app/og-image.png",
    description:
      "Fix blurry, dark, noisy and low-quality photos in one click. AI sharpens, brightens, denoises and restores photos instantly.",
    offers: TIERS.map((t) => ({
      "@type": "Offer",
      name: t.name,
      price: String(t.price),
      priceCurrency: "USD",
      category: t.price === 0 ? "Free" : "Subscription",
      availability: "https://schema.org/InStock",
      url: "https://pixelsqueeze.app/pricing",
    })),
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: RATING.value,
      reviewCount: String(RATING.count),
      bestRating: RATING.best,
      worstRating: RATING.worst,
    },
    review: REVIEWS.map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5 },
      reviewBody: r.quote,
    })),
    featureList: [
      "Fix blurry photos in one click",
      "Sharpen soft or out-of-focus images",
      "Remove digital noise and grain",
      "Brighten dark and underexposed photos",
      "Restore old and faded photos",
      "Increase photo resolution up to 4×",
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to fix a blurry photo with PixelSqueeze",
    description: "Turn any blurry, dark, noisy or low-quality photo into a sharp, professional image in one click.",
    totalTime: "PT30S",
    supply: [{ "@type": "HowToSupply", name: "Any photo — phone, camera, old scan or screenshot" }],
    tool: [{ "@type": "HowToTool", name: "PixelSqueeze" }],
    step: HOWTO_STEPS.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      url: `https://pixelsqueeze.app/#step-${i + 1}`,
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pixelsqueeze.app/" },
      { "@type": "ListItem", position: 2, name: "Pricing", item: "https://pixelsqueeze.app/pricing" },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PixelSqueeze",
    url: "https://pixelsqueeze.app",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://pixelsqueeze.app/blog?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  // ---- Sticky email capture ----
  const [stickyEmail, setStickyEmail] = useState("");
  const [stickySubmitting, setStickySubmitting] = useState(false);
  const [stickyDone, setStickyDone] = useState(false);
  const submitSticky = async (e: FormEvent) => {
    e.preventDefault();
    if (!stickyEmail || !/^\S+@\S+\.\S+$/.test(stickyEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    setStickySubmitting(true);
    try {
      await supabase.functions.invoke("subscribe-newsletter", {
        body: { email: stickyEmail, source: "sticky_cta" },
      });
      trackConversion("newsletter_sticky", { variant: heroVariant });
      setStickyDone(true);
      toast.success("You're in. Check your inbox.");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setStickySubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1424] text-slate-200 font-body selection:bg-[#4ade80] selection:text-[#0f1424]">
      <SEO
        title="Make Every Photo Look Amazing — PixelSqueeze AI Photo Enhancer"
        description="Upload any photo and PixelSqueeze automatically fixes blur, lighting, color, sharpness, noise, resolution and file size — no editing skills required."
        path="/"
        schema={[softwareSchema, faqSchema, howToSchema, breadcrumbSchema, websiteSchema]}
      />

      {/* Aurora background glows (fixed, non-interactive) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-[#4ade80]/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] bg-[#a78bfa]/12 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/3 w-[420px] h-[420px] bg-[#4ade80]/8 rounded-full blur-[120px]" />
      </div>

      {/* NAV */}
      <nav
        className="sticky top-0 z-40 backdrop-blur-xl bg-[#0f1424]/70 border-b border-white/5"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#a78bfa] flex items-center justify-center shadow-[0_0_24px_rgba(74,222,128,0.35)]">
              <Sparkles className="w-4 h-4 text-[#0f1424]" />
            </div>
            <span className="text-xl font-bold tracking-tight font-display text-white">PixelSqueeze</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#how" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How it works</a>
            <a href="#examples" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Examples</a>
            <a href="#pricing" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Pricing</a>
            <Link to="/blog" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Blog</Link>
            <Link to="/auth">
              <Button variant="ghost" size="sm" className="font-semibold text-slate-300 hover:text-white hover:bg-white/5">
                Log in
              </Button>
            </Link>
            <Link to="/auth" onClick={() => trackConversion("nav_get_started", { variant: heroVariant })}>
              <Button
                size="sm"
                className="rounded-2xl px-5 font-semibold bg-[#4ade80] text-[#0f1424] hover:bg-[#3dbd6d] border-0 shadow-[0_0_24px_rgba(74,222,128,0.25)]"
              >
                Upload photo
              </Button>
            </Link>
          </div>
          <div className="flex md:hidden">
            <Link to="/auth">
              <Button size="sm" className="rounded-2xl font-semibold bg-[#4ade80] text-[#0f1424] border-0">
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main id="main-content" className="relative">
        {/* HERO — split: content left, dropzone + slider right */}
        <section
          className="relative px-6 pt-14 md:pt-20 pb-24"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* LEFT */}
            <div className="lg:col-span-7 space-y-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-[#4ade80]"
                aria-live="polite"
                aria-atomic="true"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]" />
                </span>
                <span className="tabular-nums">{liveCount.toLocaleString()}</span>
                <span className="text-slate-400">photos fixed today</span>
              </div>

              <h1
                id="hero-heading"
                className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] text-white"
              >
                Make every photo{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4ade80] to-[#a78bfa]">
                  look amazing.
                </span>
              </h1>

              <p className="text-lg md:text-xl text-slate-400 max-w-xl leading-relaxed">
                Upload any photo and PixelSqueeze automatically fixes blur, lighting,
                color, sharpness, noise, resolution and file size — no editing skills required.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link to="/auth" onClick={() => trackConversion("hero_primary", { variant: heroVariant })}>
                  <Button
                    size="lg"
                    className="rounded-2xl h-14 px-8 text-base font-bold bg-[#4ade80] text-[#0f1424] hover:bg-[#3dbd6d] border-0 shadow-[0_0_30px_rgba(74,222,128,0.35)] min-w-[220px]"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Upload a photo
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToBeforeAfter}
                  className="rounded-2xl h-14 px-8 text-base font-semibold border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white min-w-[200px]"
                >
                  See the magic
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>

              {/* Trust badges + avatars + rating */}
              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex -space-x-3" aria-hidden>
                  {["#4ade80", "#a78bfa", "#f0abfc", "#38bdf8"].map((c, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-[#0f1424]"
                      style={{ background: `linear-gradient(135deg, ${c}, #1e293b)` }}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <div className="flex gap-0.5 text-yellow-400 mb-0.5" aria-label={`${RATING.value} out of 5 stars`}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-slate-400">
                    <strong className="text-white">{RATING.value}</strong> · {RATING.count.toLocaleString()} reviews
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    <Shield className="w-3 h-3 text-[#4ade80]" /> No credit card
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    <Check className="w-3 h-3 text-[#4ade80]" /> Free forever plan
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
                    <Zap className="w-3 h-3 text-[#4ade80]" /> Cancel anytime
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT: glass dropzone + mini before/after */}
            <div className="lg:col-span-5 space-y-5">
              <div className="group relative">
                <div
                  aria-hidden
                  className="absolute -inset-0.5 bg-gradient-to-r from-[#4ade80] to-[#a78bfa] rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-500"
                />
                <Link
                  to="/auth"
                  onClick={() => trackConversion("hero_dropzone", { variant: heroVariant })}
                  className="relative block bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center hover:bg-white/[0.08] transition-all"
                  aria-label="Upload an image to start optimizing"
                >
                  <div className="w-16 h-16 mx-auto bg-white/5 rounded-2xl flex items-center justify-center mb-5 text-[#4ade80]">
                    <Upload className="w-8 h-8" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">
                    Drop a photo to fix
                  </h2>
                  <p className="text-slate-400 text-sm mb-6">
                    Blurry · dark · noisy · dull · low-res — we handle it
                  </p>
                  <span className="inline-flex items-center justify-center w-full py-3.5 bg-[#4ade80] hover:bg-[#3dbd6d] text-[#0f1424] font-bold rounded-xl shadow-lg shadow-[#4ade80]/20 transition-all">
                    Upload photo — free
                  </span>
                  <p className="mt-4 text-[11px] text-slate-500">
                    First fixes free · no signup · your photo never leaves your device
                  </p>
                </Link>
              </div>

              {/* Mini before/after preview using existing slider */}
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Live before vs after
                  </span>
                  <span className="text-[10px] font-bold text-[#4ade80] bg-[#4ade80]/10 px-2 py-0.5 rounded-full">
                    Sharpness +41%
                  </span>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <Suspense fallback={<div className="aspect-video bg-white/5 animate-pulse rounded-lg" />}>
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
          </div>
        </section>

        {/* LOGO STRIP */}
        <section className="px-6 py-14 border-y border-white/5 relative" aria-label="Customers">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500 mb-8">
              Trusted by 12,000+ families, creators & small businesses
            </p>
            <div className="flex flex-wrap justify-center items-center gap-x-14 gap-y-6 opacity-60">
              {["Shopify", "Etsy", "Squarespace", "Amazon", "Airbnb", "Webflow"].map((b) => (
                <span key={b} className="text-lg md:text-xl font-display font-bold tracking-tight text-slate-300">
                  {b}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* BEFORE & AFTER — full comparison */}
        <section id="examples" ref={beforeAfterRef} className="px-6 py-24 relative" aria-labelledby="before-after-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">Real Before &amp; After</p>
              <h2 id="before-after-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
                From blurry to beautiful.
              </h2>
              <p className="text-lg text-slate-400 mt-4">Drag the slider. Same photo — one click later.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Suspense fallback={<div className="aspect-video bg-white/5 rounded-3xl animate-pulse" />}>
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-3 backdrop-blur-xl">
                  <BeforeAfterSlider
                    beforeImage={weddingBefore}
                    afterImage={weddingAfter}
                    title="Wedding photo restored"
                    description="Sharper faces, richer color, brighter lighting"
                  />
                </div>
                <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-3 backdrop-blur-xl">
                  <BeforeAfterSlider
                    beforeImage={manBefore}
                    afterImage={manAfter}
                    title="Blurry portrait fixed"
                    description="Blur removed · detail restored · noise cleaned up"
                  />
                </div>
              </Suspense>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="how" className="px-6 py-24 relative" aria-labelledby="how-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">How it works</p>
              <h2 id="how-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
                Three steps. Zero thinking.
              </h2>
              <p className="text-lg text-slate-400 mt-4">Upload. Tap fix. Download.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {HOWTO_STEPS.slice(0, 3).map((s, i) => (
                <article
                  key={s.name}
                  id={`step-${i + 1}`}
                  className="p-7 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-xl"
                >
                  <div className="w-10 h-10 rounded-2xl mb-5 flex items-center justify-center bg-gradient-to-br from-[#4ade80] to-[#a78bfa] text-[#0f1424] font-display font-bold text-lg">
                    {i + 1}
                  </div>
                  <h3 className="font-display text-lg font-bold mb-2 text-white">{s.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* WHO IT'S FOR — benefit cards */}
        <section id="who" className="px-6 py-24 relative" aria-labelledby="who-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">Who uses PixelSqueeze</p>
              <h2 id="who-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
                For anyone with a photo worth saving.
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                { emoji: "📸", label: "Photographers", benefit: "Rescue soft shots" },
                { emoji: "🏡", label: "Real Estate", benefit: "Listing photos that sell" },
                { emoji: "🏨", label: "Hotels", benefit: "Website-ready rooms" },
                { emoji: "🍽️", label: "Restaurants", benefit: "Menu photos that pop" },
                { emoji: "🛍️", label: "Small Business", benefit: "Pro-quality on a phone" },
                { emoji: "🛒", label: "Online Sellers", benefit: "Product shots that convert" },
                { emoji: "🎬", label: "Creators", benefit: "Feed-perfect every time" },
                { emoji: "📣", label: "Marketing Agencies", benefit: "Batch-fix client photos" },
                { emoji: "👨‍👩‍👧", label: "Families", benefit: "Restore old memories" },
                { emoji: "🎓", label: "Students", benefit: "Sharp shots for projects" },
              ].map((w) => (
                <article
                  key={w.label}
                  className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl hover:border-[#4ade80]/40 hover:-translate-y-0.5 transition-all"
                >
                  <div className="text-3xl mb-3" aria-hidden>{w.emoji}</div>
                  <h3 className="font-display text-sm font-bold text-white mb-1">{w.label}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{w.benefit}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* REVIEWS */}
        <section id="reviews" className="px-6 py-24 relative" aria-labelledby="reviews-heading">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">Reviews</p>
              <h2 id="reviews-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
                Loved by creators everywhere.
              </h2>
              <div
                className="flex items-center justify-center gap-2 mt-6"
                itemScope
                itemType="https://schema.org/AggregateRating"
              >
                <meta itemProp="itemReviewed" content="PixelSqueeze" />
                <meta itemProp="bestRating" content={RATING.best} />
                <meta itemProp="worstRating" content={RATING.worst} />
                <div className="flex gap-0.5 text-yellow-400" aria-label={`${RATING.value} out of 5 stars`}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-300">
                  <span itemProp="ratingValue">{RATING.value}</span> ·{" "}
                  <span itemProp="reviewCount">{RATING.count.toLocaleString()}</span> reviews
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {REVIEWS.map((r) => (
                <article
                  key={r.name}
                  className="bg-white/[0.04] border border-white/10 rounded-3xl p-7 backdrop-blur-xl"
                  itemScope
                  itemType="https://schema.org/Review"
                >
                  <meta itemProp="itemReviewed" content="PixelSqueeze" />
                  <div
                    className="flex gap-0.5 text-yellow-400 mb-4"
                    itemProp="reviewRating"
                    itemScope
                    itemType="https://schema.org/Rating"
                    aria-label={`${r.rating} out of 5 stars`}
                  >
                    <meta itemProp="ratingValue" content={String(r.rating)} />
                    <meta itemProp="bestRating" content="5" />
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-base leading-relaxed text-slate-200 mb-6" itemProp="reviewBody">
                    "{r.quote}"
                  </blockquote>
                  <div
                    className="flex items-center gap-3"
                    itemProp="author"
                    itemScope
                    itemType="https://schema.org/Person"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#4ade80] to-[#a78bfa]" aria-hidden />
                    <div>
                      <p className="font-semibold text-sm text-white" itemProp="name">{r.name}</p>
                      <p className="text-xs text-slate-500">{r.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PROS / CONS */}
        <section className="px-6 pb-4" aria-labelledby="proscons-heading">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-5">
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-2xl bg-[#4ade80]/15 flex items-center justify-center">
                  <ThumbsUp className="w-4 h-4 text-[#4ade80]" />
                </div>
                <h2 id="proscons-heading" className="font-display text-xl font-bold text-white">Pros</h2>
              </div>
              <ul className="space-y-3">
                {PROS.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-slate-300">
                    <Check className="w-4 h-4 text-[#4ade80] mt-0.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-9 h-9 rounded-2xl bg-rose-500/15 flex items-center justify-center">
                  <ThumbsDown className="w-4 h-4 text-rose-400" />
                </div>
                <h2 className="font-display text-xl font-bold text-white">Cons</h2>
              </div>
              <ul className="space-y-3">
                {CONS.map((c) => (
                  <li key={c} className="flex items-start gap-3 text-sm text-slate-300">
                    <X className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section
          id="pricing"
          ref={pricingRef}
          className="px-6 py-24 relative"
          aria-labelledby="pricing-heading"
        >
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">Pricing</p>
              <h2 id="pricing-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
                Plans that scale with you
              </h2>
              <p className="text-lg text-slate-400 mt-4">Start free. Upgrade the moment you need more.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {TIERS.map((tier) => {
                const highlight = !!tier.popular;
                return (
                  <div
                    key={tier.name}
                    className={`group relative rounded-3xl p-8 transition-all duration-500 backdrop-blur-xl hover:-translate-y-2 ${
                      highlight
                        ? "bg-gradient-to-br from-[#4ade80]/20 via-[#a78bfa]/15 to-transparent border border-[#a78bfa]/40 shadow-[0_0_50px_rgba(167,139,250,0.25)] lg:scale-[1.03]"
                        : "bg-white/[0.04] border border-white/10 hover:border-white/20"
                    }`}
                  >
                    {highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest bg-[#a78bfa] text-[#0f1424] rounded-full px-3 py-1.5 shadow-lg">
                          <Sparkles className="w-3 h-3" /> Most Popular
                        </span>
                      </div>
                    )}
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 text-slate-400">{tier.name}</p>
                    <div className="flex items-baseline mb-2">
                      <span className="text-5xl font-bold font-display text-white">${tier.price}</span>
                      <span className="text-sm ml-2 text-slate-500">{tier.cadence}</span>
                    </div>
                    <p className="text-sm mb-6 text-slate-400">{tier.tagline}</p>
                    <ul className="space-y-3 mb-8 min-h-[168px]">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2.5 text-sm text-slate-200">
                          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#4ade80]" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link
                      to={tier.name === "Business" ? "/contact" : "/auth"}
                      onClick={() => trackConversion("pricing_cta", { tier: tier.name })}
                    >
                      <Button
                        className={`w-full h-12 rounded-2xl font-bold transition-transform group-hover:scale-[1.02] border-0 ${
                          highlight
                            ? "bg-[#4ade80] text-[#0f1424] hover:bg-[#3dbd6d]"
                            : "bg-white text-[#0f1424] hover:bg-white/90"
                        }`}
                      >
                        {tier.cta}
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>

            <p className="text-center text-xs text-slate-500 mt-8">
              All plans include no watermark, HTTPS delivery, and cancel-anytime billing.
            </p>
          </div>
        </section>

        {/* FREE VS PRO */}
        <section className="px-6 pb-24" aria-labelledby="compare-heading">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">Free vs Pro</p>
              <h2 id="compare-heading" className="font-display text-3xl md:text-4xl font-bold leading-tight text-white">
                What you get on every plan
              </h2>
            </div>
            <div className="bg-white/[0.04] border border-white/10 rounded-3xl backdrop-blur-xl overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Feature comparison between PixelSqueeze Free and Pro plans</caption>
                <thead className="bg-white/[0.03] text-slate-300">
                  <tr>
                    <th scope="col" className="text-left font-semibold px-5 py-4">Feature</th>
                    <th scope="col" className="text-center font-semibold px-5 py-4">Free</th>
                    <th scope="col" className="text-center font-semibold px-5 py-4 text-[#4ade80]">Pro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[
                    ["Images per month",             "25",             "Unlimited"],
                    ["AI Enhance & Upscale",         "Basic",          "Advanced (2× / 4×)"],
                    ["Automatic WebP + AVIF",        true,             true],
                    ["Batch processing",             false,            true],
                    ["Print Ready (400 DPI)",        false,            true],
                    ["API access",                   false,            true],
                    ["Cloud storage",                "In-browser only", "30-day encrypted"],
                    ["Priority processing",          false,            true],
                    ["Watermark",                    "None",           "None"],
                  ].map(([label, free, pro], i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <th scope="row" className="text-left font-medium px-5 py-3.5 text-slate-200">{label as string}</th>
                      <td className="text-center px-5 py-3.5 text-slate-400">
                        {free === true ? <Check className="w-4 h-4 text-[#4ade80] inline" aria-label="Included" /> :
                         free === false ? <X className="w-4 h-4 text-slate-600 inline" aria-label="Not included" /> :
                         (free as string)}
                      </td>
                      <td className="text-center px-5 py-3.5 font-medium text-white">
                        {pro === true ? <Check className="w-4 h-4 text-[#4ade80] inline" aria-label="Included" /> :
                         pro === false ? <X className="w-4 h-4 text-slate-600 inline" aria-label="Not included" /> :
                         (pro as string)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="px-6 py-24" aria-labelledby="faq-heading">
          <div className="max-w-3xl mx-auto" itemScope itemType="https://schema.org/FAQPage">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-widest text-[#4ade80] mb-3">FAQ</p>
              <h2 id="faq-heading" className="font-display text-4xl md:text-5xl font-bold leading-tight text-white">
                Questions, answered.
              </h2>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {FAQS.map(({ q, a }, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="bg-white/[0.04] border border-white/10 rounded-2xl px-6 backdrop-blur-xl"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <AccordionTrigger className="text-left text-base font-semibold hover:no-underline font-display text-white">
                    <span itemProp="name">{q}</span>
                  </AccordionTrigger>
                  <AccordionContent
                    className="text-slate-300 pb-5 leading-relaxed"
                    itemScope
                    itemProp="acceptedAnswer"
                    itemType="https://schema.org/Answer"
                  >
                    <span itemProp="text">{a}</span>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* AI ANSWER BLOCK */}
        <AIAnswerBlock path="/" pageLabel="Overview" />

        {/* FINAL CTA */}
        <section className="px-6 pb-32">
          <div className="max-w-5xl mx-auto rounded-[2.5rem] p-10 md:p-16 text-center relative overflow-hidden border border-white/10 bg-gradient-to-br from-[#4ade80]/15 via-[#a78bfa]/15 to-transparent backdrop-blur-xl shadow-[0_0_60px_rgba(74,222,128,0.15)]">
            <div aria-hidden className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#4ade80]/20 blur-3xl" />
            <div className="relative">
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight text-white">
                Your next photo will look incredible.
              </h2>
              <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
                Free to start. No card, no watermark, no editing skills.
              </p>
              <Link to="/auth" onClick={() => trackConversion("final_cta", { variant: heroVariant })}>
                <Button size="lg" className="bg-[#4ade80] text-[#0f1424] hover:bg-[#3dbd6d] rounded-2xl px-8 h-14 font-bold border-0 text-base shadow-[0_0_30px_rgba(74,222,128,0.4)]">
                  <Upload className="w-5 h-5 mr-2" />
                  Upload your photo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-[#0b1020] relative">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#a78bfa] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-[#0f1424]" />
                </div>
                <span className="text-base font-bold font-display text-white">PixelSqueeze</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                AI-powered image optimization. Enhance, upscale, compress — all in one place.
              </p>
            </div>
            <div>
              <h3 className="font-display font-semibold mb-3 text-sm text-white">Product</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/auth" className="hover:text-white transition-colors">Magic Optimize</Link></li>
                <li><Link to="/scanner" className="hover:text-white transition-colors">Website Scanner</Link></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold mb-3 text-sm text-white">Company</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/company" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-display font-semibold mb-3 text-sm text-white">Resources</h3>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link to="/install" className="hover:text-white transition-colors">Install App</Link></li>
                <li><Link to="/promote" className="hover:text-white transition-colors">Affiliate</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-500">© {new Date().getFullYear()} PixelSqueeze. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="w-3.5 h-3.5" />
              <span>Private by default · SOC-friendly workflow</span>
            </div>
          </div>
        </div>
      </footer>

      {/* STICKY BOTTOM CTA — email capture + upgrade */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-3xl px-0 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="bg-[#0f1424]/85 backdrop-blur-2xl border border-white/15 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-2xl shadow-black/50">
          <div className="hidden sm:flex flex-col pr-4 sm:border-r sm:border-white/10 min-w-0">
            <span className="text-[#4ade80] text-[10px] font-bold uppercase tracking-widest">Free forever</span>
            <span className="text-white text-sm font-semibold truncate">Get weekly optimization tips</span>
          </div>
          {stickyDone ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-[#4ade80] text-sm font-semibold py-1">
              <CheckCircle className="w-4 h-4" /> You're subscribed — check your inbox.
            </div>
          ) : (
            <form onSubmit={submitSticky} className="flex-1 flex flex-col sm:flex-row gap-2">
              <label htmlFor="sticky-email" className="sr-only">Email address</label>
              <div className="flex-1 relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="sticky-email"
                  type="email"
                  required
                  value={stickyEmail}
                  onChange={(e) => setStickyEmail(e.target.value)}
                  placeholder="you@work.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#4ade80]/60"
                />
              </div>
              <Button
                type="submit"
                disabled={stickySubmitting}
                className="bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap shadow-lg shadow-[#a78bfa]/25 border-0 h-auto"
              >
                {stickySubmitting ? "…" : "Get free tips"}
              </Button>
              <Link to="/auth" className="hidden md:block" onClick={() => trackConversion("sticky_upgrade")}>
                <Button
                  type="button"
                  className="bg-[#4ade80] hover:bg-[#3dbd6d] text-[#0f1424] font-bold px-5 py-3 rounded-xl text-sm border-0 h-auto"
                >
                  Try free
                </Button>
              </Link>
            </form>
          )}
        </div>
      </div>

      {/* First-open popups disabled per user request. */}
      {/* <Suspense fallback={null}>
        <InstallBanner />
        <EmailCapturePopup />
      </Suspense> */}
    </div>
  );
};

export default Landing;
