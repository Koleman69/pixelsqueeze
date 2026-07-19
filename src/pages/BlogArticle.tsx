import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import DOMPurify from "dompurify";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft, ArrowRight, Share2, Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import NewsletterSignup from "@/components/NewsletterSignup";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface Faq { question: string; answer: string; }
interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
  category: string | null;
  topic: string | null;
  tags: string[] | null;
  reading_time: number | null;
  word_count: number | null;
  published_at: string | null;
  featured_image_url: string | null;
  faqs: Faq[] | null;
  related_slugs: string[] | null;
}

interface RelatedRef { slug: string; title: string; featured_image_url: string | null; reading_time: number | null; topic: string | null; }

const BlogArticle = () => {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<RelatedRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", id)
        .eq("is_published", true)
        .maybeSingle();
      if (error || !data) {
        setNotFound(true);
      } else {
        setPost(data as unknown as Post);
        const relatedSlugs = (data as any).related_slugs ?? [];
        if (relatedSlugs.length > 0) {
          const { data: rel } = await supabase
            .from("blog_posts")
            .select("slug, title, featured_image_url, reading_time, topic")
            .in("slug", relatedSlugs)
            .eq("is_published", true);
          setRelated((rel ?? []) as RelatedRef[]);
        } else {
          const { data: rel } = await supabase
            .from("blog_posts")
            .select("slug, title, featured_image_url, reading_time, topic")
            .neq("slug", id)
            .eq("is_published", true)
            .order("published_at", { ascending: false })
            .limit(3);
          setRelated((rel ?? []) as RelatedRef[]);
        }
      }
      setLoading(false);
      window.scrollTo(0, 0);
    })();
  }, [id]);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Article URL copied to clipboard." });
    }
  };

  if (notFound) return <Navigate to="/blog" replace />;

  if (loading || !post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const cleanContent = DOMPurify.sanitize(post.content, { USE_PROFILES: { html: true } });
  const dateIso = post.published_at ?? new Date().toISOString();

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.meta_description ?? post.excerpt,
    image: post.featured_image_url ?? undefined,
    datePublished: dateIso,
    dateModified: dateIso,
    author: { "@type": "Organization", name: "PixelSqueeze" },
    publisher: {
      "@type": "Organization",
      name: "PixelSqueeze",
      logo: { "@type": "ImageObject", url: "https://pixelsqueeze.app/icon-512.png" },
    },
    mainEntityOfPage: `https://pixelsqueeze.app/blog/${post.slug}`,
    articleSection: post.category ?? post.topic ?? "Optimization",
    keywords: (post.tags ?? []).join(", "),
    wordCount: post.word_count ?? undefined,
  };

  const faqSchema = post.faqs && post.faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://pixelsqueeze.app/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: "https://pixelsqueeze.app/blog" },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://pixelsqueeze.app/blog/${post.slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={post.meta_title ?? post.title}
        description={post.meta_description ?? post.excerpt ?? post.title}
        path={`/blog/${post.slug}`}
        type="article"
        image={post.featured_image_url ?? undefined}
        schema={[articleSchema, breadcrumbSchema, ...(faqSchema ? [faqSchema] : [])]}
      />

      {/* Nav */}
      <div className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-6 flex items-center justify-between">
          <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> All articles
          </Link>
          <Button variant="ghost" size="sm" onClick={share} aria-label="Share article">
            <Share2 className="w-4 h-4 mr-1.5" /> Share
          </Button>
        </div>
      </div>

      {/* Hero */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {post.topic && <Badge>{post.topic}</Badge>}
          {post.category && post.category !== post.topic && <Badge variant="secondary">{post.category}</Badge>}
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {new Date(dateIso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.reading_time ?? 8} min read
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-muted-foreground mb-8">{post.excerpt}</p>}

        {post.featured_image_url && (
          <img
            src={post.featured_image_url}
            alt={post.title}
            width={1600}
            height={900}
            className="w-full rounded-2xl mb-10 aspect-[16/9] object-cover"
          />
        )}

        {/* Content */}
        <div
          className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20 prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-p:leading-relaxed prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-2xl prose-table:text-sm prose-blockquote:border-primary prose-blockquote:not-italic"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-10 pt-6 border-t border-border">
            {post.tags.map((t) => (
              <Badge key={t} variant="outline">#{t}</Badge>
            ))}
          </div>
        )}

        {/* FAQs */}
        {post.faqs && post.faqs.length > 0 && (
          <section className="mt-14" id="faqs">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Frequently asked questions
            </h2>
            <Accordion type="single" collapsible className="border border-border rounded-2xl bg-card divide-y divide-border">
              {post.faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-0 px-5">
                  <AccordionTrigger className="text-left font-semibold hover:no-underline">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>
        )}

        {/* CTA */}
        <section className="mt-14 rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent p-8 md:p-10 text-primary-foreground">
          <h3 className="text-2xl md:text-3xl font-bold mb-3">Put this into practice in 60 seconds</h3>
          <p className="opacity-90 mb-6 max-w-xl">
            PixelSqueeze applies every tactic in this article automatically — compress, upscale, enhance, or prep for
            print with one click. No account required to try.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="secondary">
              <Link to="/">Optimize an image free →</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </section>

        {/* Newsletter */}
        <div className="mt-14">
          <NewsletterSignup source={`blog-post:${post.slug}`} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Keep reading</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="group">
                  <Card className="overflow-hidden h-full border-border hover:border-primary/40 transition">
                    <div className="aspect-[16/9] bg-muted overflow-hidden">
                      {r.featured_image_url ? (
                        <img src={r.featured_image_url} alt={r.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20" />
                      )}
                    </div>
                    <div className="p-4">
                      {r.topic && <Badge variant="secondary" className="text-xs mb-2">{r.topic}</Badge>}
                      <h3 className="font-semibold leading-snug group-hover:text-primary transition line-clamp-2">{r.title}</h3>
                      <span className="text-xs text-muted-foreground mt-2 inline-flex items-center gap-1">
                        Read <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </div>
  );
};

export default BlogArticle;
