import { Link, useParams, Navigate } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, Sparkles } from "lucide-react";
import SEO from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getArticle, getCategory, ARTICLES } from "@/data/authorityCenter";

// Minimal markdown-lite: converts [text](url) into <Link>/<a> and preserves
// paragraphs. Keeps the content in the data file plain to author.
function renderRich(text: string) {
  const parts: (string | JSX.Element)[] = [];
  const linkRe = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = linkRe.exec(text)) !== null) {
    if (m.index > lastIdx) parts.push(text.slice(lastIdx, m.index));
    const [full, label, href] = m;
    if (href.startsWith("/")) {
      parts.push(
        <Link key={`l${key++}`} to={href} className="text-primary underline underline-offset-2 hover:opacity-80">
          {label}
        </Link>
      );
    } else {
      parts.push(
        <a key={`a${key++}`} href={href} className="text-primary underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          {label}
        </a>
      );
    }
    lastIdx = m.index + full.length;
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx));
  return parts;
}

export default function LearnArticle() {
  const { category, slug } = useParams<{ category: string; slug: string }>();
  const article = getArticle(slug ?? "");
  const cat = getCategory(category ?? "");

  if (!article || !cat || article.category !== cat.slug) {
    return <Navigate to="/learn" replace />;
  }

  const related = article.related
    .map((s) => ARTICLES.find((a) => a.slug === s))
    .filter((a): a is NonNullable<typeof a> => Boolean(a));

  const url = `https://pixelsqueeze.app/learn/${cat.slug}/${article.slug}`;
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.description,
      datePublished: article.updated,
      dateModified: article.updated,
      author: { "@type": "Organization", name: "PixelSqueeze" },
      publisher: { "@type": "Organization", name: "PixelSqueeze", url: "https://pixelsqueeze.app" },
      mainEntityOfPage: url,
      articleSection: cat.name,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://pixelsqueeze.app/" },
        { "@type": "ListItem", position: 2, name: "Learn", item: "https://pixelsqueeze.app/learn" },
        { "@type": "ListItem", position: 3, name: cat.name, item: `https://pixelsqueeze.app/learn/${cat.slug}` },
        { "@type": "ListItem", position: 4, name: article.title, item: url },
      ],
    },
    ...(article.faq.length
      ? [{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: article.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO title={`${article.title} | PixelSqueeze`} description={article.description} path={`/learn/${cat.slug}/${article.slug}`} schema={schema} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <nav aria-label="Breadcrumb" className="text-sm text-foreground/60 mb-6">
          <Link to="/" className="hover:text-primary">Home</Link>
          <span className="mx-1.5">/</span>
          <Link to="/learn" className="hover:text-primary">Learn</Link>
          <span className="mx-1.5">/</span>
          <Link to={`/learn/${cat.slug}`} className="hover:text-primary">{cat.name}</Link>
        </nav>

        <Link to={`/learn/${cat.slug}`} className="inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-primary mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to {cat.name}
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge>{cat.name}</Badge>
              <Badge variant="outline">{article.level}</Badge>
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">{article.title}</h1>
            <p className="text-lg text-foreground/75">{article.description}</p>
            <div className="flex items-center gap-4 text-sm text-foreground/50 mt-4">
              <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />{article.readMinutes} min read</span>
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />Updated {article.updated}</span>
            </div>
          </header>

          <div className="prose-content space-y-6">
            <p className="text-lg leading-relaxed text-foreground/85">{renderRich(article.intro)}</p>

            {article.sections.map((s, i) => (
              <section key={i}>
                <h2 className="font-display text-2xl font-bold mt-8 mb-3">{s.h}</h2>
                <p className="text-base leading-relaxed text-foreground/80">{renderRich(s.body)}</p>
              </section>
            ))}

            {article.cta && (
              <Card className="p-6 mt-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                <div className="flex items-center gap-4">
                  <Sparkles className="w-6 h-6 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="font-display font-semibold">Try it yourself</p>
                    <p className="text-sm text-foreground/70">{article.cta.label}</p>
                  </div>
                  <Link to={article.cta.href}>
                    <Button>Open</Button>
                  </Link>
                </div>
              </Card>
            )}

            {article.faq.length > 0 && (
              <section aria-labelledby="faq-heading">
                <h2 id="faq-heading" className="font-display text-2xl font-bold mt-10 mb-4">Frequently asked</h2>
                <div className="space-y-4">
                  {article.faq.map((f, i) => (
                    <details key={i} className="group rounded-xl border border-border p-4 bg-muted/30">
                      <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                        {f.q}
                        <span className="text-primary group-open:rotate-45 transition-transform">+</span>
                      </summary>
                      <p className="mt-3 text-sm text-foreground/75 leading-relaxed">{renderRich(f.a)}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </div>
        </article>

        {related.length > 0 && (
          <section aria-labelledby="related-heading" className="mt-14 pt-8 border-t border-border">
            <h2 id="related-heading" className="font-display text-xl font-bold mb-4">Keep reading</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {related.map((r) => (
                <Link key={r.slug} to={`/learn/${r.category}/${r.slug}`} className="group">
                  <Card className="h-full p-4 hover:border-primary/40 transition">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {getCategory(r.category)?.name}
                    </Badge>
                    <h3 className="font-display font-semibold text-sm mb-1 group-hover:text-primary transition">{r.title}</h3>
                    <p className="text-xs text-foreground/60 line-clamp-2">{r.description}</p>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
