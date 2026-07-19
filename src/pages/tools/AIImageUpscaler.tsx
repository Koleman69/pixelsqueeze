import ToolLandingPage from "@/components/ToolLandingPage";

const AIImageUpscaler = () => (
  <ToolLandingPage
    slug="ai-image-upscaler"
    title="AI Image Upscaler — Enlarge Photos up to 4x Without Losing Quality"
    description="Upscale images with AI up to 4x while keeping details sharp. Free online tool — no signup required for your first images."
    h1="AI Image Upscaler"
    intro="Enlarge any photo up to 4x with AI-powered super-resolution. Perfect for old photos, low-resolution product shots, and print prep."
    benefits={[
      { title: "Up to 4x resolution", body: "Enlarge tiny photos into crisp, high-resolution images ready for print or web." },
      { title: "AI detail recovery", body: "Neural super-resolution restores edges, skin texture, and fine detail — not just interpolation." },
      { title: "Batch processing", body: "Upscale dozens of photos in one go. Perfect for e-commerce catalogs and photographers." },
    ]}
    howItWorks={[
      "Upload one or more images (JPG, PNG, WebP, HEIC).",
      "Choose your upscale factor: 2x or 4x.",
      "Click Upscale — download in seconds.",
    ]}
    faqs={[
      { q: "Is the AI upscaler free?", a: "Yes — you can upscale images for free on the free plan. Paid plans unlock batch processing and unlimited usage." },
      { q: "What image formats are supported?", a: "JPG, PNG, WebP, HEIC, TIFF, and AVIF are supported for upload." },
      { q: "Does it work for old photos?", a: "Yes. The AI upscaler is specifically tuned for restoring low-resolution and vintage photos." },
    ]}
  />
);

export default AIImageUpscaler;
