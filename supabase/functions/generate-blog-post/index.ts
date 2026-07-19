// Auto-generates one SEO blog post per invocation.
// Scheduled twice weekly via pg_cron; also callable manually with { topic?: string }.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const TOPICS = [
  "Photography",
  "Instagram",
  "TikTok",
  "Pinterest",
  "AI Images",
  "Photo Marketing",
  "Website Images",
  "SEO Images",
  "E-commerce Photography",
  "Print Resolution",
  "Content Marketing",
  "Social Media",
  "Compress vs Upscale",
  "Google SEO",
];

// Curated royalty-free Unsplash hero images per topic (source URLs are auto-optimized).
const HERO_IMAGES: Record<string, string> = {
  "Photography": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=1600&q=80",
  "Instagram": "https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&w=1600&q=80",
  "TikTok": "https://images.unsplash.com/photo-1596558450268-9c27524ba856?auto=format&fit=crop&w=1600&q=80",
  "Pinterest": "https://images.unsplash.com/photo-1611926653458-09294b3142bf?auto=format&fit=crop&w=1600&q=80",
  "AI Images": "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1600&q=80",
  "Photo Marketing": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1600&q=80",
  "Website Images": "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?auto=format&fit=crop&w=1600&q=80",
  "SEO Images": "https://images.unsplash.com/photo-1571721795195-a2d50c404a17?auto=format&fit=crop&w=1600&q=80",
  "E-commerce Photography": "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80",
  "Print Resolution": "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1600&q=80",
  "Content Marketing": "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&w=1600&q=80",
  "Social Media": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=1600&q=80",
  "Compress vs Upscale": "https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?auto=format&fit=crop&w=1600&q=80",
  "Google SEO": "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1600&q=80",
};

// Inline images used inside the article body per topic
const INLINE_IMAGES: Record<string, string> = {
  "Photography": "https://images.unsplash.com/photo-1495467033336-2effd8753d51?auto=format&fit=crop&w=1400&q=80",
  "Instagram": "https://images.unsplash.com/photo-1616469829581-73993eb86b02?auto=format&fit=crop&w=1400&q=80",
  "TikTok": "https://images.unsplash.com/photo-1611605698335-8b1569810432?auto=format&fit=crop&w=1400&q=80",
  "Pinterest": "https://images.unsplash.com/photo-1611926653670-e18b1ec3b6f7?auto=format&fit=crop&w=1400&q=80",
  "AI Images": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1400&q=80",
  "Photo Marketing": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
  "Website Images": "https://images.unsplash.com/photo-1547658719-da2b51169166?auto=format&fit=crop&w=1400&q=80",
  "SEO Images": "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?auto=format&fit=crop&w=1400&q=80",
  "E-commerce Photography": "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=80",
  "Print Resolution": "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&w=1400&q=80",
  "Content Marketing": "https://images.unsplash.com/photo-1552581234-26160f608093?auto=format&fit=crop&w=1400&q=80",
  "Social Media": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80",
  "Compress vs Upscale": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1400&q=80",
  "Google SEO": "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?auto=format&fit=crop&w=1400&q=80",
};

function slugify(t: string) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let requestedTopic: string | undefined;
    try {
      const body = await req.json();
      requestedTopic = body?.topic;
    } catch { /* no body */ }

    // Rotate topic based on how many posts exist so we hit every topic
    const { count } = await supabase
      .from("blog_posts")
      .select("*", { count: "exact", head: true });
    const topic = requestedTopic && TOPICS.includes(requestedTopic)
      ? requestedTopic
      : TOPICS[(count ?? 0) % TOPICS.length];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an expert SEO content writer for PixelSqueeze (pixelsqueeze.app), an AI-powered image optimization platform (compress, upscale, enhance, background removal). Write authoritative, helpful, non-fluffy long-form articles that rank on Google and get featured snippets.

Rules:
- Output ONLY valid JSON matching the requested schema, no markdown fences.
- Article body MUST be 1,700-2,200 words of substantive HTML (this is a hard requirement — count as you write and expand if short).
- Structure the article as: (1) 40-55 word direct-answer paragraph for featured snippets, (2) short TL;DR bullet list, (3) 7-10 <h2> sections each 180-260 words with supporting <h3> subheadings where useful, (4) one comparison <table>, (5) one numbered <ol> how-to list, (6) one <blockquote> tip, (7) closing CTA paragraph.
- Use semantic HTML: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <blockquote>, <strong>, <table>, <thead>, <tbody>, <tr>, <th>, <td>.
- Weave 4-6 internal links to PixelSqueeze pages naturally in body text. Available URLs:
  /  /enhance  /pricing  /scanner  /for  /for/ecommerce  /for/real-estate  /for/social-media-creators
  /enhance/ai-image-upscaler  /enhance/image-enhancer  /enhance/sharpen-blurry-photos
  /enhance/increase-image-resolution  /enhance/background-removal  /tools/photo-optimizer
- Add exactly one inline image using this exact placeholder tag on its own line inside the article: [INLINE_IMAGE]
- FAQ answers must be 40-60 words each (featured-snippet length). Include 6 FAQs.
- Tone: expert, practical, concrete numbers and file-size percentages, no filler, no "in today's fast-paced world" openings.`;

    const userPrompt = `Write a fresh 2026 SEO article about: "${topic}" — specifically how it relates to image quality, optimization, and PixelSqueeze's use cases. Angle it so it uniquely serves marketers, creators, or store owners.`;

    const schema = {
      type: "object",
      properties: {
        title: { type: "string", description: "Compelling SEO title, under 65 chars" },
        slug: { type: "string", description: "kebab-case slug, unique-feeling" },
        meta_description: { type: "string", description: "SEO meta description 140-158 chars" },
        excerpt: { type: "string", description: "1-2 sentence teaser, ~200 chars" },
        category: { type: "string" },
        tags: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 8 },
        content_html: { type: "string", description: "Full article HTML, >1500 words" },
        faqs: {
          type: "array",
          minItems: 5,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
            },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "slug", "meta_description", "excerpt", "category", "tags", "content_html", "faqs"],
      additionalProperties: false,
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: { name: "BlogPost", schema, strict: true },
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway failed:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", status: aiRes.status, details: errText }),
        { status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    const article = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Inject inline image
    const inlineImg = INLINE_IMAGES[topic] ?? HERO_IMAGES[topic];
    const contentWithImage = String(article.content_html || "").replace(
      /\[INLINE_IMAGE\]/g,
      `<figure class="my-8"><img src="${inlineImg}" alt="${topic} illustration for PixelSqueeze article" loading="lazy" class="rounded-2xl w-full" /></figure>`,
    );

    // Ensure unique slug
    let slug = slugify(article.slug || article.title);
    const { data: existing } = await supabase.from("blog_posts").select("slug").eq("slug", slug).maybeSingle();
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    // Compute word count + reading time
    const plain = contentWithImage.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const words = plain.split(" ").filter(Boolean).length;
    const reading = Math.max(5, Math.round(words / 220));

    // Related posts: 3 most recent published in same topic (else recent)
    const { data: relSame } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("is_published", true)
      .eq("topic", topic)
      .order("published_at", { ascending: false })
      .limit(3);
    let related = (relSame ?? []).map((r) => r.slug);
    if (related.length < 3) {
      const { data: relAny } = await supabase
        .from("blog_posts")
        .select("slug")
        .eq("is_published", true)
        .order("published_at", { ascending: false })
        .limit(6);
      for (const r of relAny ?? []) if (!related.includes(r.slug) && related.length < 3) related.push(r.slug);
    }

    const insert = {
      slug,
      title: article.title,
      excerpt: article.excerpt,
      content: contentWithImage,
      meta_title: article.title,
      meta_description: article.meta_description,
      category: article.category,
      tags: article.tags,
      topic,
      faqs: article.faqs,
      related_slugs: related,
      featured_image_url: HERO_IMAGES[topic] ?? null,
      word_count: words,
      reading_time: reading,
      is_published: true,
      published_at: new Date().toISOString(),
    };

    const { data: inserted, error: insErr } = await supabase
      .from("blog_posts")
      .insert(insert)
      .select("id, slug, title")
      .single();

    if (insErr) {
      console.error("Insert failed:", insErr);
      return new Response(
        JSON.stringify({ error: "DB insert failed", details: insErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, topic, post: inserted, words }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("generate-blog-post error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
