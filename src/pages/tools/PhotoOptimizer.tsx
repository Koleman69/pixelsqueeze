import ToolLandingPage from "@/components/ToolLandingPage";

const PhotoOptimizer = () => (
  <ToolLandingPage
    slug="photo-optimizer"
    title="AI Photo Optimizer — Optimize Photos for Any Platform in One Click"
    description="Optimize photos for Instagram, TikTok, Shopify, Amazon, and more with AI presets. Perfect dimensions, compression, and quality automatically."
    h1="Photo Optimizer"
    intro="Automatically optimize any photo for the platform you're posting to — from Instagram feed to Amazon product listings. AI picks the perfect settings."
    benefits={[
      { title: "Platform-perfect presets", body: "Instagram, TikTok, LinkedIn, Pinterest, Shopify, Amazon, Airbnb — the right size and format for each." },
      { title: "AI-tuned compression", body: "Up to 80% smaller files with no visible quality loss." },
      { title: "Bulk export packs", body: "Export a full social media pack from one photo in seconds." },
    ]}
    howItWorks={[
      "Upload your photo.",
      "Pick the destination — Instagram, TikTok, Shopify, and more.",
      "Download the optimized version instantly.",
    ]}
    faqs={[
      { q: "Does it work with HEIC from iPhone?", a: "Yes. iPhone HEIC files are converted and optimized automatically." },
      { q: "Can I optimize a batch of photos?", a: "Yes. Creator and Pro plans include batch optimization." },
      { q: "Which format does it output?", a: "WebP for web, JPEG for social platforms — chosen automatically for the best result." },
    ]}
  />
);

export default PhotoOptimizer;
