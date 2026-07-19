import ToolLandingPage from "@/components/ToolLandingPage";

const PrintReadyImages = () => (
  <ToolLandingPage
    slug="print-ready-images"
    title="Print Ready Images — 300–400 DPI Export for Any Print Size"
    description="Prepare images for print in one click. Standard sizes, 300–400 DPI, CMYK-safe export, and AI upscaling for pixel-perfect results."
    h1="Print Ready Images"
    intro="Turn any photo into a print-ready file — perfect resolution, correct DPI, and full-bleed dimensions for posters, business cards, and canvas."
    benefits={[
      { title: "Standard print sizes", body: "4x6, 5x7, 8x10, 11x14, 16x20, poster and canvas — resized correctly with full-bleed margins." },
      { title: "300–400 DPI export", body: "Professional print resolution for crisp results on any printer." },
      { title: "AI upscaling built-in", body: "Low-resolution source? Automatic upscale keeps prints sharp." },
    ]}
    howItWorks={[
      "Upload your image.",
      "Choose print size and DPI (300 or 400).",
      "Download the print-ready file — TIFF or high-quality JPEG.",
    ]}
    faqs={[
      { q: "What DPI should I use for print?", a: "300 DPI is standard for most prints. Use 400 DPI for premium photo prints and fine-art posters." },
      { q: "Do you support CMYK?", a: "Files are exported in sRGB with print-safe color profiles. Most modern print shops accept sRGB directly." },
      { q: "Can I upscale before printing?", a: "Yes. Print Ready mode uses AI upscaling automatically when your source resolution is too low." },
    ]}
  />
);

export default PrintReadyImages;
