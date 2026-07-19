import ToolLandingPage from "@/components/ToolLandingPage";

const WebsiteImageCompression = () => (
  <ToolLandingPage
    slug="website-image-compression"
    title="Website Image Compression — Speed Up Your Site by 70%"
    description="Compress website images to WebP and AVIF with AI. Cut page load times, improve Core Web Vitals, and boost SEO — free to try."
    h1="Website Image Compression"
    intro="Compress every image on your website by up to 70% with no visible quality loss. Faster pages, better Core Web Vitals, higher Google rankings."
    benefits={[
      { title: "Core Web Vitals boost", body: "Faster LCP and lower CLS — the metrics Google measures for rankings." },
      { title: "WebP & AVIF conversion", body: "Modern formats deliver dramatically smaller files with the same quality." },
      { title: "SEO alt text & renaming", body: "Auto-generate descriptive filenames and alt text to help search engines index your images." },
    ]}
    howItWorks={[
      "Scan your website or upload images directly.",
      "PixelSqueeze picks the best format and quality for each image.",
      "Download compressed images or plug into your CMS.",
    ]}
    faqs={[
      { q: "How much faster will my site be?", a: "Most sites see LCP improve by 30–60% after switching heavy images to compressed WebP/AVIF." },
      { q: "Does it work with Shopify, WordPress, Webflow?", a: "Yes. Export optimized images and upload to any CMS, or use our website scanner to find heavy images automatically." },
      { q: "Will image quality drop?", a: "No — we tune quality per image so the change is invisible even on Retina displays." },
    ]}
  />
);

export default WebsiteImageCompression;
