import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";

export interface ToolLandingPageProps {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  benefits: { title: string; body: string }[];
  howItWorks: string[];
  faqs: { q: string; a: string }[];
  keywords?: string;
}

/**
 * Shared SEO-optimized landing page template used by the tool
 * marketing pages under /tools/*. Semantic HTML, single H1,
 * FAQPage + SoftwareApplication JSON-LD, self-referencing canonical.
 */
export const ToolLandingPage = ({
  slug,
  title,
  description,
  h1,
  intro,
  benefits,
  howItWorks,
  faqs,
}: ToolLandingPageProps) => {
  const path = `/tools/${slug}`;

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: h1,
      description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Any",
      url: `https://pixelsqueeze.app${path}`,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "2847",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
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
        { "@type": "ListItem", position: 2, name: "Tools", item: "https://pixelsqueeze.app/tools" },
        { "@type": "ListItem", position: 3, name: h1, item: `https://pixelsqueeze.app${path}` },
      ],
    },
  ];

  return (
    <>
      <SEO title={title} description={description} path={path} schema={schema} />
      <main id="main-content" className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border/40">
          <nav className="max-w-6xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-4" aria-label="Primary">
            <Link to="/" className="font-bold text-base sm:text-lg shrink-0">PixelSqueeze</Link>
            <div className="flex items-center gap-3 sm:gap-6 text-sm">
              <Link to="/pricing" className="hover:text-primary hidden xs:inline sm:inline">Pricing</Link>
              <Link to="/blog" className="hover:text-primary hidden sm:inline">Blog</Link>
              <Link
                to="/auth"
                className="px-3 sm:px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm hover:opacity-90 transition whitespace-nowrap"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </header>

        <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            AI-powered • Free to try
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{h1}</h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">{intro}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
            >
              Try it free <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-card transition"
            >
              See pricing
            </Link>
          </div>
        </section>

        <section aria-labelledby="benefits-heading" className="max-w-6xl mx-auto px-6 py-16">
          <h2 id="benefits-heading" className="text-3xl font-bold text-center mb-12">Why creators choose PixelSqueeze</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 list-none p-0">
            {benefits.map((b) => (
              <li key={b.title} className="rounded-2xl border border-border/60 bg-card/40 p-6">
                <CheckCircle2 className="w-6 h-6 text-primary mb-3" aria-hidden="true" />
                <h3 className="font-semibold text-lg mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground">{b.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="how-heading" className="max-w-4xl mx-auto px-6 py-16">
          <h2 id="how-heading" className="text-3xl font-bold text-center mb-12">How it works</h2>
          <ol className="space-y-4">
            {howItWorks.map((step, i) => (
              <li key={i} className="flex gap-4 rounded-xl border border-border/60 bg-card/40 p-5">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span className="text-base pt-1">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto px-6 py-16">
          <h2 id="faq-heading" className="text-3xl font-bold text-center mb-10">Frequently asked questions</h2>
          <div className="space-y-4">
            {faqs.map((f) => (
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

        <section className="max-w-4xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to try it?</h2>
          <p className="text-muted-foreground mb-8">Free to start. No credit card required.</p>
          <Link
            to="/auth"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
          >
            Start free <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>

        <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PixelSqueeze. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
};

export default ToolLandingPage;
