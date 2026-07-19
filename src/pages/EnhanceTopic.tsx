import { useParams, Link, Navigate } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ENHANCE_TOPICS, getTopic } from "@/data/enhanceTopics";

const EnhanceTopicPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const topic = slug ? getTopic(slug) : undefined;
  if (!topic) return <Navigate to="/enhance" replace />;

  const path = `/enhance/${topic.slug}`;
  const canonicalUrl = `https://pixelsqueeze.app${path}`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: topic.h1,
      description: topic.description,
      url: canonicalUrl,
      about: topic.keyword,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: `${topic.keyword} — PixelSqueeze`,
      description: topic.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      url: canonicalUrl,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "2847" },
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `How to use PixelSqueeze for ${topic.keyword}`,
      step: topic.howItWorks.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: `Step ${i + 1}`,
        text: s,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: topic.faqs.map((f) => ({
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
        { "@type": "ListItem", position: 2, name: "Enhance", item: "https://pixelsqueeze.app/enhance" },
        { "@type": "ListItem", position: 3, name: topic.keyword, item: canonicalUrl },
      ],
    },
  ];

  const related = (topic.relatedSlugs ?? [])
    .map((s) => getTopic(s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  // Fallback: if no related specified, show 6 others
  const relatedList = related.length > 0
    ? related
    : ENHANCE_TOPICS.filter((t) => t.slug !== topic.slug).slice(0, 6);

  return (
    <>
      <SEO title={topic.title} description={topic.description} path={path} schema={schema} />
      <main id="main-content" className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/40">
          <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4" aria-label="Primary">
            <Link to="/" className="font-bold text-lg">PixelSqueeze</Link>
            <div className="flex items-center gap-6 text-sm">
              <Link to="/enhance" className="hover:text-primary">All tools</Link>
              <Link to="/pricing" className="hover:text-primary">Pricing</Link>
              <Link to="/auth" className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 transition">
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        <div className="max-w-6xl mx-auto px-6 pt-6">
          <Breadcrumbs
            items={[
              { label: "Enhance", path: "/enhance" },
              { label: topic.keyword, path },
            ]}
          />
        </div>

        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-10 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            AI-powered • Free to try
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{topic.h1}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">{topic.intro}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition">
              {topic.primaryCta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-card transition">
              See pricing
            </Link>
          </div>
        </section>

        {/* BENEFITS */}
        <section aria-labelledby="benefits-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="benefits-heading" className="text-3xl font-bold text-center mb-12">Why PixelSqueeze for {topic.keyword.toLowerCase()}</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0">
            {topic.benefits.map((b) => (
              <li key={b.title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <CheckCircle2 className="w-6 h-6 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* USE CASES */}
        <section aria-labelledby="uses-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="uses-heading" className="text-3xl font-bold text-center mb-12">Where people use this</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topic.useCases.map((u) => (
              <article key={u.title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <h3 className="font-semibold text-lg mb-2">{u.title}</h3>
                <p className="text-sm text-muted-foreground">{u.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section aria-labelledby="how-heading" className="max-w-4xl mx-auto px-6 py-16">
          <h2 id="how-heading" className="text-3xl font-bold text-center mb-12">How it works</h2>
          <ol className="space-y-4">
            {topic.howItWorks.map((step, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-border/60 bg-card/40 p-5">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span className="text-base pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto px-6 py-16">
          <h2 id="faq-heading" className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {topic.faqs.map((f) => (
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

        {/* RELATED */}
        <section aria-labelledby="related-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="related-heading" className="text-2xl font-bold text-center mb-8">Related tools</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 list-none p-0">
            {relatedList.map((r) => (
              <li key={r.slug}>
                <Link
                  to={`/enhance/${r.slug}`}
                  className="block rounded-xl border border-border/60 bg-card/40 p-4 hover:border-primary hover:bg-card transition"
                >
                  <span className="font-medium">{r.keyword}</span>
                  <ArrowRight className="w-4 h-4 inline-block ml-2 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="text-center mt-8">
            <Link to="/enhance" className="text-sm text-primary hover:underline">Browse all enhancement tools →</Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Try PixelSqueeze free</h2>
          <p className="text-muted-foreground mb-8">No credit card required. Cancel anytime.</p>
          <Link to="/auth" className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition">
            {topic.primaryCta} <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>

        <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PixelSqueeze. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
};

export default EnhanceTopicPage;
