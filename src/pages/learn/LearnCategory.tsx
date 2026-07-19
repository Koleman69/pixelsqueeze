import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, ARTICLES, CALCULATORS, getCategory, getArticlesByCategory } from "@/data/authorityCenter";

export default function LearnCategory() {
  const { category } = useParams<{ category: string }>();
  const cat = getCategory(category ?? "");
  if (!cat) return <Navigate to="/learn" replace />;

  const items = cat.slug === "calculators" ? [] : getArticlesByCategory(cat.slug);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${cat.name} — PixelSqueeze Learn`}
        description={cat.description}
        path={`/learn/${cat.slug}`}
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: cat.name,
          description: cat.description,
          isPartOf: { "@type": "WebSite", name: "PixelSqueeze", url: "https://pixelsqueeze.app" },
        }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-foreground/60 mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/learn" className="hover:text-primary">Learn</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{cat.name}</span>
        </nav>

        <Link to="/learn" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> All categories
        </Link>

        <header className="mb-10">
          <Badge className="mb-3">{cat.tagline}</Badge>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3">{cat.name}</h1>
          <p className="text-lg text-foreground/70">{cat.description}</p>
        </header>

        {cat.slug === "calculators" ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {CALCULATORS.map((c) => (
              <Link key={c.slug} to={`/learn/calculators/${c.slug}`} className="group">
                <Card className="h-full p-5 hover:border-primary/40 transition bg-gradient-to-br from-secondary/10 to-primary/10">
                  <h3 className="font-display font-semibold text-base mb-1.5 group-hover:text-primary transition">{c.title}</h3>
                  <p className="text-sm text-foreground/70">{c.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((a) => (
              <li key={a.slug}>
                <Link to={`/learn/${a.category}/${a.slug}`} className="group block">
                  <Card className="p-5 hover:border-primary/40 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h2 className="font-display font-semibold text-lg mb-1.5 group-hover:text-primary transition">{a.title}</h2>
                        <p className="text-sm text-foreground/70 mb-2">{a.description}</p>
                        <p className="text-xs text-foreground/50">{a.readMinutes} min read · {a.level} · Updated {a.updated}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-1 group-hover:translate-x-1 transition" />
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-12 p-6 rounded-2xl bg-muted/40 border border-border">
          <p className="font-display font-semibold mb-2">Explore other categories</p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.filter((c) => c.slug !== cat.slug).map((c) => (
              <Link key={c.slug} to={`/learn/${c.slug}`}>
                <Badge variant="outline" className="hover:bg-primary/10 hover:border-primary/40 transition cursor-pointer">
                  {c.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
