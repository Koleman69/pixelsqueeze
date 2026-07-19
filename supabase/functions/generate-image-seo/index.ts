// Generates SEO metadata (filename, alt, caption, title, description, keywords,
// social captions, schema.org ImageObject) for an uploaded image using Lovable AI (Gemini vision).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeoMetadata {
  slug: string;             // descriptive kebab-case filename base
  filename: string;         // slug + extension
  title: string;            // <60 chars
  altText: string;          // <=125 chars, describes image for a11y + SEO
  caption: string;          // 1-2 sentences shown under image
  description: string;      // <=155 chars for meta / og:description
  keywords: string[];       // 6-10 search phrases
  subject: string;          // primary subject noun phrase
  category: string;         // e.g. "Product Photography", "Food", "Landscape"
  pinterestDescription: string; // <=500 chars, keyword-rich, uses hashtags
  twitterAltText: string;   // <=420 chars
  ogTitle: string;
  ogDescription: string;
  schema: Record<string, unknown>; // schema.org ImageObject JSON-LD (partial)
}

const SYSTEM = `You are an SEO metadata generator for images. Analyze the image and return ONLY valid JSON matching the requested schema. Every field must be present, unique to the image, and optimized for Google Image Search + social sharing. Never invent brand names. Use plain descriptive language a shopper or reader would search for.`;

const USER_INSTRUCTIONS = `Return JSON with keys: slug, title, altText, caption, description, keywords, subject, category, pinterestDescription, twitterAltText, ogTitle, ogDescription.

Rules:
- slug: 3-8 words, lowercase, hyphens only, no stop words, no file extension. Descriptive of the actual visual content.
- title: <=60 characters, title case, keyword-forward.
- altText: <=125 characters, describe what is visible; no "image of" prefix.
- caption: 1-2 natural sentences.
- description: <=155 characters, compelling, includes primary keyword.
- keywords: array of 6-10 unique lowercase search phrases (mix of head + long-tail).
- subject: short noun phrase for the primary subject.
- category: single high-level category label.
- pinterestDescription: <=500 chars, keyword-rich, ends with 2-4 relevant hashtags.
- twitterAltText: <=420 chars, describes image for screen readers + Twitter search.
- ogTitle: <=60 chars, may differ slightly from title.
- ogDescription: <=110 chars, shareable hook.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { imageBase64, mimeType, originalName } = await req.json();
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "imageBase64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mt = mimeType || "image/jpeg";
    const dataUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:${mt};base64,${imageBase64}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          {
            role: "user",
            content: [
              { type: "text", text: `${USER_INSTRUCTIONS}\n\nOriginal filename (hint only, do not reuse): ${originalName ?? "unknown"}` },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      console.error(`[generate-image-seo] AI error [${aiRes.status}]: ${details}`);
      return new Response(JSON.stringify({ error: "AI request failed", status: aiRes.status, details }), {
        status: aiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: Partial<SeoMetadata>;
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const slug = (parsed.slug || "optimized-image").toString()
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "optimized-image";

    const ext = mt.includes("png") ? "png" : mt.includes("webp") ? "webp" : mt.includes("avif") ? "avif" : "jpg";

    const metadata: SeoMetadata = {
      slug,
      filename: `${slug}.${ext}`,
      title: (parsed.title || slug.replace(/-/g, " ")).slice(0, 60),
      altText: (parsed.altText || "").slice(0, 125),
      caption: parsed.caption || "",
      description: (parsed.description || "").slice(0, 155),
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
      subject: parsed.subject || "",
      category: parsed.category || "General",
      pinterestDescription: (parsed.pinterestDescription || "").slice(0, 500),
      twitterAltText: (parsed.twitterAltText || parsed.altText || "").slice(0, 420),
      ogTitle: (parsed.ogTitle || parsed.title || "").slice(0, 60),
      ogDescription: (parsed.ogDescription || parsed.description || "").slice(0, 110),
      schema: {
        "@context": "https://schema.org",
        "@type": "ImageObject",
        name: parsed.title,
        description: parsed.description,
        caption: parsed.caption,
        keywords: (parsed.keywords || []).join(", "),
        representativeOfPage: true,
      },
    };

    return new Response(JSON.stringify(metadata), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-image-seo] error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
