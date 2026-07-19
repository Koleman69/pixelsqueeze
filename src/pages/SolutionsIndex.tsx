import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import Breadcrumbs from "@/components/Breadcrumbs";
import { INDUSTRIES } from "@/data/industries";

const SolutionsIndex = () => {
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "PixelSqueeze Solutions by Industry",
      description: "Image optimization tailored for creators, e-commerce, real estate, hospitality and more.",
      url: "https://pixelsqueeze.app/for",
      hasPart: INDUSTRIES.map((i) => ({
        "@type": "WebPage",
        name: `PixelSqueeze for ${i.audience}`,
        url: `https://pixelsqueeze.app/for/${i.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pixelsqueeze.app/" },
        { "@type": "ListItem", position: 2, name: "Solutions", item: "https://pixelsqueeze.app/for" },
      ],
    },
  ];

  return (
    <>
      <SEO
        title="PixelSqueeze Solutions by Industry"
        description="Image optimization built for creators, e-commerce, real estate, hotels, restaurants, agencies and more."
        path="/for"
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
          <Breadcrumbs items={[{ label: "Solutions", path: "/for" }]} />
        </div>

        <section className="max-w-4xl mx-auto px-6 pt-10 pb-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Built for the way you work</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Pick your industry — every workflow gets the presets, sizes and quality settings that fit.
          </p>
        </section>

        <section className="max-w-6xl mx-auto px-6 pb-20">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0">
            {INDUSTRIES.map((i) => (
              <li key={i.slug}>
                <Link
                  to={`/for/${i.slug}`}
                  className="block rounded-2xl border border-border/60 bg-card/40 p-6 hover:border-primary hover:bg-card transition h-full"
                >
                  <h2 className="text-lg font-semibold mb-2 flex items-center justify-between">
                    {i.audience}
                    <ArrowRight className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  </h2>
                  <p className="text-sm text-muted-foreground">{i.description}</p>
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

export default SolutionsIndex;
