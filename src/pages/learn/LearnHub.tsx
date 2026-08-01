import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Sparkles,
  GraduationCap,
  HelpCircle,
  LineChart,
  Trophy,
  GitCompare,
  Camera,
  Megaphone,
  Printer,
  Search,
  Calculator,
} from "lucide-react";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, ARTICLES, CALCULATORS } from "@/data/authorityCenter";

// Explicit map instead of `import * as icons` — a namespace import pulls the
// entire lucide-react library (~720 kB) into this route chunk.
const CATEGORY_ICONS: Record<string, typeof BookOpen> = {
  BookOpen,
  Sparkles,
  GraduationCap,
  HelpCircle,
  LineChart,
  Trophy,
  GitCompare,
  Camera,
  Megaphone,
  Printer,
  Search,
  Calculator,
};

export default function LearnHub() {
  const featured = ARTICLES.slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PixelSqueeze Learn — The Image Optimization Authority Center"
        description="Guides, case studies, calculators, and tips for image compression, SEO, print, and marketing. Everything you need to master modern image workflows."
        path="/learn"
        schema={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "PixelSqueeze Learn",
          description: "The authority center for image optimization: knowledge base, guides, FAQs, case studies, and calculators.",
          hasPart: ARTICLES.map((a) => ({
            "@type": "Article",
            headline: a.title,
            url: `https://pixelsqueeze.app/learn/${a.category}/${a.slug}`,
            description: a.description,
          })),
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <header className="text-center mb-14 max-w-3xl mx-auto">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Authority Center</Badge>
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Learn everything about image optimization
          </h1>
          <p className="text-lg text-foreground/70">
            {ARTICLES.length}+ deeply linked guides, real case studies, and interactive calculators —
            covering compression, SEO, print, photography, and marketing.
          </p>
        </header>

        {/* Categories grid */}
        <section aria-labelledby="cats-heading" className="mb-16">
          <h2 id="cats-heading" className="sr-only">Browse by category</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICONS[c.icon] ?? BookOpen;
              const count = c.slug === "calculators" ? CALCULATORS.length : ARTICLES.filter((a) => a.category === c.slug).length;
              return (
                <Link key={c.slug} to={`/learn/${c.slug}`} className="group">
                  <Card className={`h-full p-6 border border-border hover:border-primary/40 transition bg-gradient-to-br ${c.accent}`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-background/70 backdrop-blur flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-lg">{c.name}</h3>
                        <p className="text-xs text-foreground/60">{c.tagline}</p>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/75 mb-4">{c.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/50">{count} {count === 1 ? "item" : "items"}</span>
                      <span className="text-primary font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        Explore <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Featured articles */}
        <section aria-labelledby="featured-heading" className="mb-16">
          <h2 id="featured-heading" className="font-display text-2xl font-bold mb-6">Featured reads</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {featured.map((a) => (
              <Link key={a.slug} to={`/learn/${a.category}/${a.slug}`} className="group">
                <Card className="h-full p-5 hover:border-primary/40 transition">
                  <Badge variant="secondary" className="mb-2 text-xs">
                    {CATEGORIES.find((c) => c.slug === a.category)?.name}
                  </Badge>
                  <h3 className="font-display font-semibold text-lg mb-1.5 group-hover:text-primary transition">{a.title}</h3>
                  <p className="text-sm text-foreground/70 mb-3 line-clamp-2">{a.description}</p>
                  <p className="text-xs text-foreground/50">{a.readMinutes} min read · {a.level}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* Calculators */}
        <section aria-labelledby="calc-heading">
          <h2 id="calc-heading" className="font-display text-2xl font-bold mb-2">Interactive calculators</h2>
          <p className="text-foreground/70 mb-6">Solve in seconds — no downloads, no signup.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {CALCULATORS.map((c) => (
              <Link key={c.slug} to={`/learn/calculators/${c.slug}`} className="group">
                <Card className="h-full p-5 hover:border-primary/40 transition bg-gradient-to-br from-secondary/10 to-primary/10">
                  <h3 className="font-display font-semibold text-base mb-1.5 group-hover:text-primary transition">{c.title}</h3>
                  <p className="text-sm text-foreground/70">{c.description}</p>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
