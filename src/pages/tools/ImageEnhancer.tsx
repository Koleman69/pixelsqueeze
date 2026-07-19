import ToolLandingPage from "@/components/ToolLandingPage";

const ImageEnhancer = () => (
  <ToolLandingPage
    slug="image-enhancer"
    title="AI Image Enhancer — Sharpen, Denoise & Restore Photos Online"
    description="One-click AI image enhancement: sharpen details, remove noise, fix lighting, and restore color. Free online enhancer for creators."
    h1="AI Image Enhancer"
    intro="Instantly sharpen, denoise, color-correct, and light-balance any photo with a single click. Trained on millions of images."
    benefits={[
      { title: "One-click enhancement", body: "Sharpen, denoise, and auto-color every image without touching sliders." },
      { title: "Face & portrait boost", body: "Dedicated face enhancement makes skin, eyes, and hair look natural — not plastic." },
      { title: "Old photo restoration", body: "Bring faded memories back to life with restoration built for scanned photos." },
    ]}
    howItWorks={[
      "Upload a photo (up to 50MB).",
      "Pick an enhancement: Sharpen, Denoise, Color, Lighting, or Restore.",
      "Preview with the before/after slider and download.",
    ]}
    faqs={[
      { q: "How is this different from a filter?", a: "PixelSqueeze uses AI models trained specifically for enhancement — it improves real detail rather than applying a color preset." },
      { q: "Can I enhance multiple images?", a: "Yes. Creator and Pro plans support batch enhancement." },
      { q: "Are my photos private?", a: "Yes. Files are processed securely and deleted after processing on all plans." },
    ]}
  />
);

export default ImageEnhancer;
