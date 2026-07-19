import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ENHANCE_TOPICS } from "@/data/enhanceTopics";

const EnhanceIndex = () => {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "PixelSqueeze AI Image Enhancement Tools",
      description: "Every image enhancement tool in one place — upscale, sharpen, restore, denoise, color-correct and more.",
      url: "https://pixelsqueeze.app/enhance",
      hasPart: ENHANCE_TOPICS.map((t) => ({
        "@type": "WebPage",
        name: t.keyword,
        url: `https://pixelsqueeze.app/enhance/${t.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pixelsqueeze.app/" },
        { "@type": "ListItem", position: 2, name: "Enhance", item: "https://pixelsqueeze.app/enhance" },
      ],
    },
  ];

  return (
    <>
      <SEO
        title="AI Image Enhancement Tools — Upscale, Sharpen, Restore | PixelSqueeze"
        description="Every AI image enhancement tool in one place. Upscale, sharpen blurry photos, restore old prints, remove noise, color-correct and more."
        path="/enhance"
        schema={schema}
      />
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
          <Breadcrumbs items={[{ label: "Enhance", path: "/enhance" }]} />
        </div>

        <section className="max-w-4xl mx-auto px-6 pt-10 pb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Every AI image enhancement tool, in one place</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upscale, sharpen, restore, denoise, brighten and color-correct — each tool tuned for a specific problem.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
            {ENHANCE_TOPICS.map((t) => (
              <li key={t.slug}>
                <Link
                  to={`/enhance/${t.slug}`}
                  className="block rounded-2xl border border-border/60 bg-card/40 p-6 hover:border-primary hover:bg-card transition h-full"
                >
                  <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
                    {t.keyword}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </h2>
                  <p className="text-sm text-muted-foreground">{t.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-border/40 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} PixelSqueeze. All rights reserved.</p>
        </footer>
      </main>
    </>
  );
};

export default EnhanceIndex;
