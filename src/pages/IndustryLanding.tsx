import { useParams, Link, Navigate } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight, Star, Quote } from "lucide-react";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { INDUSTRIES, getIndustry } from "@/data/industries";

const PLAN_PRICING = {
  Free: { price: "$0", cadence: "forever", tagline: "5 optimizations/day, all core tools." },
  Creator: { price: "$9", cadence: "per month", tagline: "Unlimited optimizations, presets, HD exports." },
  Pro: { price: "$24", cadence: "per month", tagline: "Batch processing, AI enhance, 30-day cloud storage." },
  Business: { price: "$79", cadence: "per month", tagline: "Team seats, shared brand presets, priority support." },
} as const;

const IndustryLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const industry = slug ? getIndustry(slug) : undefined;
  if (!industry) return <Navigate to="/for" replace />;

  const path = `/for/${industry.slug}`;
  const canonicalUrl = `https://pixelsqueeze.app${path}`;
  const rec = PLAN_PRICING[industry.recommendedPlan];

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: industry.h1,
      description: industry.description,
      url: canonicalUrl,
      audience: { "@type": "Audience", audienceType: industry.audience },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `PixelSqueeze for ${industry.audience}`,
      description: industry.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      url: canonicalUrl,
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Creator", price: "9", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro", price: "24", priceCurrency: "USD" },
        { "@type": "Offer", name: "Business", price: "79", priceCurrency: "USD" },
      ],
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "2847" },
      review: industry.testimonials.map((t) => ({
        "@type": "Review",
        reviewRating: { "@type": "Rating", ratingValue: t.rating ?? 5, bestRating: 5 },
        author: { "@type": "Person", name: t.name },
        reviewBody: t.quote,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: industry.faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pixelsqueeze.app/" },
        { "@type": "ListItem", position: 2, name: "Solutions", item: "https://pixelsqueeze.app/for" },
        { "@type": "ListItem", position: 3, name: industry.audience, item: canonicalUrl },
      ],
    },
  ];

  const related = INDUSTRIES.filter((i) => i.slug !== industry.slug).slice(0, 6);

  return (
    <>
      <SEO title={industry.title} description={industry.description} path={path} schema={schema} />
      <main id="main-content" className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/40">
          <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4" aria-label="Primary">
            <Link to="/" className="font-bold text-lg">PixelSqueeze</Link>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/pricing" className="hover:text-primary">Pricing</Link>
              <Link to="/blog" className="hover:text-primary">Blog</Link>
              <Link to="/auth" className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        <div className="max-w-6xl mx-auto px-6 pt-6">
          <Breadcrumbs
            items={[
              { name: "Solutions", href: "/for" },
              { name: industry.audience, href: path },
            ]}
          />
        </div>

        {/* HERO */}
        <section className="max-w-5xl mx-auto px-6 pt-10 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            Built for {industry.audience}
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{industry.h1}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{industry.intro}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
              {industry.ctaLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-card transition">
              See pricing
            </Link>
          </div>
        </section>

        {/* BENEFITS */}
        <section aria-labelledby="benefits-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="benefits-heading" className="text-3xl font-bold text-center mb-12">Why {industry.audience.toLowerCase()} choose PixelSqueeze</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0">
            {industry.benefits.map((b) => (
              <li key={b.title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <CheckCircle2 className="w-6 h-6 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* BEFORE / AFTER */}
        <section aria-labelledby="ba-heading" className="max-w-5xl mx-auto px-6 py-16">
          <h2 id="ba-heading" className="text-3xl font-bold text-center mb-4">Before &amp; after</h2>
          <p className="text-center text-muted-foreground mb-10">Real file-size reductions from {industry.audience.toLowerCase()} workflows.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {industry.beforeAfter.map((ba) => (
              <div key={ba.label} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <h3 className="font-semibold mb-4">{ba.label}</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Before</div>
                    <div className="text-xl font-bold text-muted-foreground line-through">{ba.beforeSize}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">After</div>
                    <div className="text-xl font-bold text-primary">{ba.afterSize}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Savings</div>
                    <div className="text-xl font-bold text-emerald-500">−{ba.savings}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* EXAMPLES */}
        <section aria-labelledby="examples-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="examples-heading" className="text-3xl font-bold text-center mb-12">Examples from real {industry.audience.toLowerCase()} workflows</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {industry.examples.map((ex) => (
              <article key={ex.title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <h3 className="font-semibold text-lg mb-2">{ex.title}</h3>
                <p className="text-sm text-muted-foreground">{ex.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section aria-labelledby="testimonials-heading" className="max-w-5xl mx-auto px-6 py-16">
          <h2 id="testimonials-heading" className="text-3xl font-bold text-center mb-12">What {industry.audience.toLowerCase()} say</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {industry.testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <Quote className="w-5 h-5 text-primary mb-3" aria-hidden="true" />
                <div className="flex gap-0.5 mb-3" aria-label={`${t.rating ?? 5} out of 5 stars`}>
                  {Array.from({ length: t.rating ?? 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" aria-hidden="true" />
                  ))}
                </div>
                <blockquote className="text-base mb-4">"{t.quote}"</blockquote>
                <figcaption className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{t.name}</span> — {t.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section aria-labelledby="pricing-heading" className="max-w-5xl mx-auto px-6 py-16">
          <h2 id="pricing-heading" className="text-3xl font-bold text-center mb-4">Pricing for {industry.audience.toLowerCase()}</h2>
          <p className="text-center text-muted-foreground mb-10">
            Most {industry.audience.toLowerCase()} choose the <span className="font-semibold text-foreground">{industry.recommendedPlan}</span> plan.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
              <div className="text-sm text-muted-foreground mb-1">Start here</div>
              <div className="text-2xl font-bold mb-1">Free</div>
              <div className="text-sm text-muted-foreground mb-4">$0 forever</div>
              <p className="text-sm mb-6">5 optimizations/day. All core tools. No credit card.</p>
              <Link to="/auth" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-card transition text-sm">
                Try free
              </Link>
            </div>
            <div className="rounded-2xl border-2 border-primary bg-primary/5 p-6 relative">
              <div className="absolute -top-3 left-6 text-xs font-semibold bg-primary text-primary-foreground px-3 py-1 rounded-full">
                Recommended
              </div>
              <div className="text-sm text-muted-foreground mb-1">For {industry.audience.toLowerCase()}</div>
              <div className="text-2xl font-bold mb-1">{industry.recommendedPlan}</div>
              <div className="text-sm text-muted-foreground mb-4">{rec.price} {rec.cadence}</div>
              <p className="text-sm mb-6">{rec.tagline}</p>
              <Link to="/pricing" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition text-sm">
                See full plan <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing" className="text-sm text-primary hover:underline">Compare all four plans →</Link>
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto px-6 py-16">
          <h2 id="faq-heading" className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {industry.faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-border/60 bg-card/40 p-5">
                <summary className="cursor-pointer font-semibold list-none flex items-center justify-between">
                  {f.q}
                  <span className="ml-4 text-primary group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground text-sm leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED / INTERNAL LINKS */}
        <section aria-labelledby="related-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="related-heading" className="text-2xl font-bold text-center mb-8">Also built for</h2>
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3 list-none p-0">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  to={`/for/${r.slug}`}
                  className="block rounded-xl border border-border/60 bg-card/40 p-4 hover:border-primary hover:bg-card transition"
                >
                  <span className="font-medium">{r.audience}</span>
                  <ArrowRight className="w-4 h-4 inline-block ml-2 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="text-center mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/tools/photo-optimizer" className="text-primary hover:underline">Photo Optimizer</Link>
            <Link to="/tools/ai-image-upscaler" className="text-primary hover:underline">AI Image Upscaler</Link>
            <Link to="/tools/image-enhancer" className="text-primary hover:underline">Image Enhancer</Link>
            <Link to="/tools/website-image-compression" className="text-primary hover:underline">Website Compression</Link>
            <Link to="/tools/print-ready-images" className="text-primary hover:underline">Print-Ready Images</Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Try PixelSqueeze free</h2>
          <p className="text-muted-foreground mb-8">Built for {industry.audience.toLowerCase()}. No credit card required.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
            {industry.ctaLabel} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>

        <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PixelSqueeze. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
};

export default IndustryLanding;
