import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import NewsletterSignup from "@/components/NewsletterSignup";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  topic: string | null;
  tags: string[] | null;
  reading_time: number | null;
  published_at: string | null;
  featured_image_url: string | null;
}

const TOPICS = [
  "All", "Photography", "Instagram", "TikTok", "Pinterest", "AI Images",
  "Photo Marketing", "Website Images", "SEO Images", "E-commerce Photography",
  "Print Resolution", "Content Marketing", "Social Media", "Compress vs Upscale", "Google SEO",
];

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, slug, title, excerpt, category, topic, tags, reading_time, published_at, featured_image_url")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(60);
      if (!error && data) setPosts(data as BlogPost[]);
      setLoading(false);
    })();
  }, []);

  const filtered = filter === "All" ? posts : posts.filter((p) => p.topic === filter);
  const [hero, ...rest] = filtered;

  const listSchema = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "PixelSqueeze Blog",
    url: "https://pixelsqueeze.app/blog",
    description: "Two AI-powered image, SEO & content marketing articles published weekly.",
    blogPost: filtered.slice(0, 20).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      url: `https://pixelsqueeze.app/blog/${p.slug}`,
      datePublished: p.published_at,
      image: p.featured_image_url ?? undefined,
    })),
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="PixelSqueeze Blog — AI Image, SEO & Marketing Tactics"
        description="Two fresh AI-tested articles every week on photography, Instagram, TikTok, Pinterest, e-commerce photos, image SEO and Google rankings."
        path="/blog"
        schema={listSchema}
      />

      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Back to PixelSqueeze
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-12 pb-8">
        <Badge variant="outline" className="mb-4 gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Auto-published Tue & Fri
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          The PixelSqueeze Journal
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
          AI-written, human-approved playbooks on image optimization, photography, social platforms,
          e-commerce, and SEO. Two new deep-dives every week.
        </p>
      </section>

      {/* Topic filter */}
      <section className="max-w-6xl mx-auto px-4 pb-8">
        <div className="flex flex-wrap gap-2">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-sm px-3 py-1.5 rounded-full border transition ${
                filter === t
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
              }`}
              aria-pressed={filter === t}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Content */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading articles…
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-lg font-medium mb-2">No articles yet for this topic.</p>
            <p className="text-muted-foreground">
              Fresh posts publish automatically every Tuesday & Friday.
            </p>
          </Card>
        ) : (
          <>
            {/* Featured */}
            {hero && (
              <Link to={`/blog/${hero.slug}`} className="block group mb-12">
                <Card className="overflow-hidden border-border hover:border-primary/40 transition">
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="aspect-[16/10] md:aspect-auto bg-muted overflow-hidden">
                      {hero.featured_image_url ? (
                        <img
                          src={hero.featured_image_url}
                          alt={hero.title}
                          loading="eager"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                      )}
                    </div>
                    <div className="p-8 md:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        {hero.topic && <Badge>{hero.topic}</Badge>}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {hero.published_at ? new Date(hero.published_at).toLocaleDateString() : ""}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {hero.reading_time ?? 8} min
                        </span>
                      </div>
                      <h2 className="text-2xl md:text-3xl font-bold mb-3 group-hover:text-primary transition">
                        {hero.title}
                      </h2>
                      <p className="text-muted-foreground mb-5">{hero.excerpt}</p>
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        Read article <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {rest.map((p) => (
                <Link to={`/blog/${p.slug}`} key={p.id} className="block group">
                  <Card className="overflow-hidden h-full flex flex-col border-border hover:border-primary/40 transition">
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {p.featured_image_url ? (
                        <img
                          src={p.featured_image_url}
                          alt={p.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {p.topic && <Badge variant="secondary" className="text-xs">{p.topic}</Badge>}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {p.reading_time ?? 8} min
                        </span>
                      </div>
                      <h3 className="font-bold text-lg mb-2 leading-snug group-hover:text-primary transition line-clamp-2">
                        {p.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">{p.excerpt}</p>
                      <span className="text-xs text-muted-foreground">
                        {p.published_at ? new Date(p.published_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <NewsletterSignup source="blog-index" />

            <div className="text-center mt-16">
              <h3 className="text-2xl font-bold mb-3">Ready to optimize your own images?</h3>
              <p className="text-muted-foreground mb-6">Compress, upscale, and enhance with one click.</p>
              <Button asChild size="lg">
                <Link to="/">Try PixelSqueeze free →</Link>
              </Button>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Blog;
