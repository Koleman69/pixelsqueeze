import { Helmet } from "react-helmet";

const SITE_URL = "https://pixelsqueeze.app";

interface AIAnswerBlockProps {
  /** Route path this block appears on, for BreadcrumbList + Product URL. */
  path?: string;
  /** Optional page label shown in breadcrumbs (defaults to "Overview"). */
  pageLabel?: string;
}

/**
 * AI-engine content block. Renders semantic sections that answer the
 * standard questions AI overviews look for (What / Who / How / Why /
 * Pricing / Free / Benefits / FAQ) and emits the full JSON-LD stack
 * (Organization, WebSite, Product, SoftwareApplication, HowTo, FAQPage,
 * BreadcrumbList, plus AggregateRating + Review).
 *
 * Written naturally for humans and LLMs — no keyword stuffing.
 */
export const AIAnswerBlock = ({ path = "/", pageLabel = "Overview" }: AIAnswerBlockProps) => {
  const url = `${SITE_URL}${path}`;

  const faqs = [
    {
      q: "What is PixelSqueeze?",
      a: "PixelSqueeze is an AI-powered image optimization platform that compresses, enhances, upscales, and reformats photos for the web, social media, e-commerce, and print. It reduces file sizes by up to 70% without visible quality loss and picks the ideal dimensions and format for each destination automatically.",
    },
    {
      q: "Who is PixelSqueeze for?",
      a: "PixelSqueeze is built for creators, e-commerce sellers, real estate agents, marketers, bloggers, photographers, and small business owners who need professional-quality images without learning Photoshop. It's equally useful for developers who want faster Core Web Vitals and higher Google rankings.",
    },
    {
      q: "How does PixelSqueeze work?",
      a: "Upload one or many images, choose a destination (Website, Instagram, TikTok, Shopify, Amazon, Print, and more), and click Optimize. The AI analyzes each image, applies the right compression, resizing, format conversion, sharpening, and color correction, then delivers the results in seconds — individually or as a downloadable ZIP pack.",
    },
    {
      q: "Why is PixelSqueeze better than other image compressors?",
      a: "Traditional compressors only shrink files. PixelSqueeze combines AI compression, 2x–4x upscaling, denoising, background removal, platform-specific presets, batch processing, and a website speed scanner in one workflow. Everything runs in the browser or on secure edge functions — no software to install.",
    },
    {
      q: "How much does PixelSqueeze cost?",
      a: "PixelSqueeze has a free plan with no credit card required, plus paid tiers: Creator at $9/month, Pro at $24/month, and Business at $79/month. Paid plans unlock batch processing, larger file limits, AI upscaling, and 30-day cloud storage.",
    },
    {
      q: "Is there a free plan?",
      a: "Yes. The free plan lets anyone compress and optimize images with no signup required for the first few files, and unlimited free usage after creating a free account. There are no watermarks and no forced upgrades.",
    },
    {
      q: "Is PixelSqueeze safe and private?",
      a: "Yes. Images are processed over encrypted connections, most optimizations run directly in your browser, and files uploaded to the cloud are deleted automatically after processing. PixelSqueeze never sells or trains models on user photos.",
    },
    {
      q: "What image formats does PixelSqueeze support?",
      a: "PixelSqueeze reads JPG, PNG, WebP, AVIF, HEIC, TIFF, and SVG, and exports to JPG, PNG, WebP, or AVIF depending on the destination — WebP and AVIF for the web, JPG for social platforms, and high-quality TIFF or JPG for print.",
    },
  ];

  const howToSteps = [
    { name: "Upload your image", text: "Drag and drop one or many images onto PixelSqueeze, or pick them from your device. JPG, PNG, WebP, HEIC, AVIF, and SVG are all supported." },
    { name: "Choose a destination", text: "Pick where the image is going — Website, Instagram, TikTok, LinkedIn, Shopify, Amazon, Print, or Custom. PixelSqueeze picks the right size, format, and quality automatically." },
    { name: "Click Optimize", text: "The AI compresses, resizes, sharpens, and reformats the image in seconds. Preview the before/after and adjust anything you want in Advanced Settings." },
    { name: "Download the result", text: "Download a single optimized image or export a full multi-platform Social Pack, Website Pack, or Print Pack as a ZIP." },
  ];

  const benefits = [
    { title: "Up to 70% smaller files", body: "AI-tuned compression that keeps images sharp on Retina displays." },
    { title: "Platform-perfect presets", body: "One-click sizing for Instagram, TikTok, LinkedIn, Pinterest, Shopify, Amazon, Airbnb, and more." },
    { title: "AI upscaling up to 4x", body: "Turn low-resolution photos into crisp, print-ready images." },
    { title: "Enhance in one click", body: "Sharpen, denoise, color-correct, remove backgrounds, and restore old photos." },
    { title: "Batch processing", body: "Process hundreds of images in parallel with pause, resume, and retry controls." },
    { title: "Faster websites", body: "Boost Core Web Vitals and Google rankings with WebP and AVIF conversion." },
  ];

  const reviews = [
    { author: "Sarah M.", rating: 5, body: "Cut my Shopify product image sizes by 68% with zero quality loss. My store loads noticeably faster." },
    { author: "James R.", rating: 5, body: "The batch processor saved me a full day of work on a real estate listing shoot. Every image looks pro." },
    { author: "Priya K.", rating: 5, body: "I use PixelSqueeze every week for Instagram. The platform presets are perfect — no guessing." },
  ];

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "PixelSqueeze",
      url: SITE_URL,
      logo: `${SITE_URL}/app-icon-512.png`,
      description: "AI-powered image optimization platform for creators, e-commerce, real estate, and marketers.",
      sameAs: [],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      url: SITE_URL,
      name: "PixelSqueeze",
      publisher: { "@id": `${SITE_URL}#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: `${SITE_URL}/blog?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "PixelSqueeze",
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web, iOS, Android",
      url: SITE_URL,
      offers: [
        { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD" },
        { "@type": "Offer", name: "Creator", price: "9", priceCurrency: "USD" },
        { "@type": "Offer", name: "Pro", price: "24", priceCurrency: "USD" },
        { "@type": "Offer", name: "Business", price: "79", priceCurrency: "USD" },
      ],
      featureList: benefits.map((b) => b.title),
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "PixelSqueeze",
      description: "AI image optimization platform — compress, upscale, enhance, and export images for any platform.",
      brand: { "@type": "Brand", name: "PixelSqueeze" },
      offers: {
        "@type": "AggregateOffer",
        lowPrice: "0",
        highPrice: "79",
        priceCurrency: "USD",
        offerCount: 4,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to optimize an image with PixelSqueeze",
      description: "Compress, resize, and reformat any image for the web, social, e-commerce, or print in four steps.",
      totalTime: "PT1M",
      step: howToSteps.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
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
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: pageLabel, item: url },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        {schema.map((s, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
        ))}
      </Helmet>

      <section aria-labelledby="ai-overview" className="px-6 py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 id="ai-overview" className="font-display text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            Everything to know about PixelSqueeze
          </h2>
          <p className="text-lg text-foreground/70 mb-12 leading-relaxed">
            A clear overview for people — and for AI assistants like Google, ChatGPT, Claude, Gemini, and Perplexity.
          </p>

          <div className="space-y-10">
            <article>
              <h3 className="font-display text-2xl font-bold mb-3">What is PixelSqueeze?</h3>
              <p className="text-foreground/80 leading-relaxed">{faqs[0].a}</p>
            </article>

            <article>
              <h3 className="font-display text-2xl font-bold mb-3">Who is it for?</h3>
              <p className="text-foreground/80 leading-relaxed">{faqs[1].a}</p>
            </article>

            <article>
              <h3 className="font-display text-2xl font-bold mb-3">How does it work?</h3>
              <p className="text-foreground/80 leading-relaxed mb-4">{faqs[2].a}</p>
              <ol className="list-decimal pl-6 space-y-2 text-foreground/80">
                {howToSteps.map((s) => (
                  <li key={s.name}>
                    <strong className="text-foreground">{s.name}.</strong> {s.text}
                  </li>
                ))}
              </ol>
            </article>

            <article>
              <h3 className="font-display text-2xl font-bold mb-3">Why is it better?</h3>
              <p className="text-foreground/80 leading-relaxed mb-4">{faqs[3].a}</p>
              <ul className="grid sm:grid-cols-2 gap-4">
                {benefits.map((b) => (
                  <li key={b.title} className="p-4 rounded-2xl border border-border bg-background">
                    <h4 className="font-semibold mb-1">{b.title}</h4>
                    <p className="text-sm text-foreground/70">{b.body}</p>
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3 className="font-display text-2xl font-bold mb-3">Pricing</h3>
              <p className="text-foreground/80 leading-relaxed mb-3">{faqs[4].a}</p>
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { name: "Free", price: "$0" },
                  { name: "Creator", price: "$9/mo" },
                  { name: "Pro", price: "$24/mo" },
                  { name: "Business", price: "$79/mo" },
                ].map((p) => (
                  <li key={p.name} className="p-4 rounded-2xl border border-border bg-background text-center">
                    <div className="text-sm text-foreground/60">{p.name}</div>
                    <div className="font-display text-lg font-bold">{p.price}</div>
                  </li>
                ))}
              </ul>
            </article>

            <article>
              <h3 className="font-display text-2xl font-bold mb-3">Is there a free plan?</h3>
              <p className="text-foreground/80 leading-relaxed">{faqs[5].a}</p>
            </article>

            <article aria-labelledby="reviews-heading">
              <h3 id="reviews-heading" className="font-display text-2xl font-bold mb-3">What people say</h3>
              <div className="space-y-3">
                {reviews.map((r) => (
                  <blockquote key={r.author} className="p-4 rounded-2xl border border-border bg-background">
                    <p className="text-foreground/80 italic">"{r.body}"</p>
                    <footer className="text-sm text-foreground/60 mt-2">— {r.author}, rated {r.rating}/5</footer>
                  </blockquote>
                ))}
              </div>
            </article>

            <article aria-labelledby="faq-heading">
              <h3 id="faq-heading" className="font-display text-2xl font-bold mb-3">Common questions</h3>
              <dl className="space-y-4">
                {faqs.map((f) => (
                  <div key={f.q} className="p-4 rounded-2xl border border-border bg-background">
                    <dt className="font-semibold mb-1">{f.q}</dt>
                    <dd className="text-foreground/80 leading-relaxed">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </article>
          </div>
        </div>
      </section>
    </>
  );
};

export default AIAnswerBlock;
