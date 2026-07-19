// Industry landing page content. Every entry produces a unique SEO page at /for/:slug.
// Titles < 60 chars, descriptions < 155 chars.

export interface Testimonial {
  name: string;
  role: string;
  quote: string;
  rating?: number;
}

export interface BeforeAfterStat {
  label: string;
  beforeSize: string;
  afterSize: string;
  savings: string;
}

export interface Industry {
  slug: string;
  audience: string;               // e.g. "Social Media Creators"
  title: string;                  // <title>
  description: string;            // <meta description>
  h1: string;
  intro: string;
  benefits: { title: string; body: string }[];
  examples: { title: string; body: string }[];
  faqs: { q: string; a: string }[];
  testimonials: Testimonial[];
  beforeAfter: BeforeAfterStat[];
  recommendedPlan: "Free" | "Creator" | "Pro" | "Business";
  ctaLabel: string;
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "social-media-creators",
    audience: "Social Media Creators",
    title: "Image Optimization for Social Media Creators | PixelSqueeze",
    description: "Auto-resize and compress content for Instagram, TikTok, YouTube and X. Post faster with perfect quality and platform-ready dimensions.",
    h1: "Image optimization built for social media creators",
    intro: "Publish faster with pixel-perfect assets for every platform. PixelSqueeze auto-resizes, compresses and enhances your content so every post looks studio-grade without the editing time.",
    benefits: [
      { title: "One upload, every platform", body: "Get Instagram, TikTok, YouTube, X and Pinterest sizes in a single click." },
      { title: "10× faster posting", body: "Skip Photoshop. Batch a week of content in under a minute." },
      { title: "Algorithm-friendly files", body: "Smaller, sharper files load faster — the signal platforms reward." },
    ],
    examples: [
      { title: "Reels & Shorts thumbnails", body: "Crisp 1080×1920 covers exported at social-safe compression." },
      { title: "Carousel posts", body: "10-slide Instagram carousels resized and color-corrected in bulk." },
      { title: "Story graphics", body: "9:16 story assets optimized for retention and load speed." },
    ],
    faqs: [
      { q: "Which platforms are supported?", a: "Instagram, TikTok, YouTube, X (Twitter), LinkedIn, Facebook, Pinterest, Snapchat and Threads with correct dimensions per placement." },
      { q: "Can I batch a week of content?", a: "Yes — upload up to hundreds of files at once and download a per-platform ZIP." },
      { q: "Will compression hurt quality?", a: "No. Our AI targets visually lossless quality — most files shrink 60–80% with no visible difference." },
    ],
    testimonials: [
      { name: "Maya R.", role: "Lifestyle Creator, 480k followers", quote: "I stopped opening Photoshop. One upload, a week of content ready.", rating: 5 },
      { name: "Devon K.", role: "TikTok Growth Coach", quote: "My thumbnails finally load fast enough to keep the swipe rate up.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Instagram carousel (10 images)", beforeSize: "38.2 MB", afterSize: "4.1 MB", savings: "89%" },
      { label: "YouTube thumbnail (1920×1080)", beforeSize: "2.4 MB", afterSize: "218 KB", savings: "91%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Optimize my content free",
  },
  {
    slug: "real-estate",
    audience: "Real Estate",
    title: "Real Estate Photo Optimization & MLS Compression | PixelSqueeze",
    description: "Compress and enhance real estate photos for MLS, Zillow and Redfin. Bright, sharp, correctly sized listings in seconds.",
    h1: "Faster listings, sharper photos, more showings",
    intro: "Real estate buyers scroll fast. PixelSqueeze auto-brightens, straightens and compresses listing photos so your homes load first and look their best on every portal.",
    benefits: [
      { title: "MLS-ready in one click", body: "Correct dimensions and file size for MLS, Zillow, Redfin, Realtor.com and Trulia." },
      { title: "Auto light & color fix", body: "Interior shots get brighter, whiter walls and true-to-life color instantly." },
      { title: "Batch entire shoots", body: "Process a full 60-photo shoot in under a minute." },
    ],
    examples: [
      { title: "Listing hero shots", body: "Wide-angle exteriors optimized to under 500KB with no visible loss." },
      { title: "Interior galleries", body: "Bright, color-balanced rooms ready for MLS upload." },
      { title: "Drone aerials", body: "High-res drone shots compressed for portals and social." },
    ],
    faqs: [
      { q: "Does it meet MLS file limits?", a: "Yes — our MLS preset stays within the strictest size caps (500KB–2MB) while keeping full resolution." },
      { q: "Will it fix dark interior shots?", a: "Yes. Auto-exposure and white balance brighten interiors without the flat, overprocessed look." },
      { q: "Can my whole team use it?", a: "The Business plan includes team seats and shared brand presets." },
    ],
    testimonials: [
      { name: "Erica L.", role: "Realtor, Compass", quote: "My listings hit MLS the same afternoon I shoot them.", rating: 5 },
      { name: "Marcus J.", role: "Broker, Keller Williams", quote: "Our whole office switched. Photos look pro without hiring an editor.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Interior gallery (35 photos)", beforeSize: "412 MB", afterSize: "34 MB", savings: "92%" },
      { label: "Drone exterior 4K", beforeSize: "8.7 MB", afterSize: "780 KB", savings: "91%" },
    ],
    recommendedPlan: "Pro",
    ctaLabel: "Optimize a listing free",
  },
  {
    slug: "wedding-photographers",
    audience: "Wedding Photographers",
    title: "Wedding Photo Delivery & Compression Tool | PixelSqueeze",
    description: "Deliver client galleries faster. Compress thousands of wedding photos without losing color, skin tone or detail.",
    h1: "Deliver wedding galleries in half the time",
    intro: "Weddings mean thousands of frames and impatient clients. PixelSqueeze compresses full-day galleries while preserving skin tones, dress detail and true color — ready for client galleries and Instagram in one workflow.",
    benefits: [
      { title: "Gallery-safe compression", body: "Preserves skin tone, dress texture and highlight detail cinema-clients notice." },
      { title: "Client gallery + social pack", body: "One export gives you web-gallery files and Instagram-ready crops." },
      { title: "Batch 2,000+ RAWs", body: "Handle full weddings without freezing your laptop." },
    ],
    examples: [
      { title: "Client gallery web files", body: "2048px, sRGB, ~300KB each — perfect for Pixieset and ShootProof." },
      { title: "Sneak peek Instagram set", body: "Square + vertical crops delivered the same night." },
      { title: "Vendor watermarking", body: "Batch-brand vendor-share images from your studio kit." },
    ],
    faqs: [
      { q: "Does it work with RAW files?", a: "Yes. Upload JPEG or common RAW previews; PixelSqueeze outputs web-ready JPEG or WebP." },
      { q: "Will skin tones stay accurate?", a: "Our wedding preset uses perceptual quality targeting to preserve skin tone and highlight roll-off." },
      { q: "How big a gallery can I process?", a: "Pro handles multi-thousand-image galleries with pause/resume and ZIP export." },
    ],
    testimonials: [
      { name: "Sophie A.", role: "Wedding Photographer", quote: "I deliver sneak peeks the night of. Couples cry. I go to sleep.", rating: 5 },
      { name: "Ravi P.", role: "Studio Owner", quote: "Cut our delivery time from 3 weeks to 5 days.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Full wedding gallery (1,800 imgs)", beforeSize: "18.4 GB", afterSize: "1.7 GB", savings: "91%" },
      { label: "Sneak peek set (30 imgs)", beforeSize: "312 MB", afterSize: "26 MB", savings: "92%" },
    ],
    recommendedPlan: "Pro",
    ctaLabel: "Optimize a gallery free",
  },
  {
    slug: "ecommerce",
    audience: "E-commerce",
    title: "E-commerce Product Image Optimization | PixelSqueeze",
    description: "Faster product pages and higher conversion. Compress and resize product images for any store — Shopify, WooCommerce, Magento.",
    h1: "Faster product pages. Higher conversion.",
    intro: "Every 100ms of load time costs conversion. PixelSqueeze compresses product images with zero visible quality loss so your storefront ranks higher and checks out faster.",
    benefits: [
      { title: "Up to 80% smaller product files", body: "Speed up PDPs and category pages without touching your theme." },
      { title: "Multi-variant exports", body: "Thumb, gallery and zoom sizes generated per SKU in one pass." },
      { title: "SEO alt & filename hints", body: "AI suggests SEO-friendly alt text and file names for every product." },
    ],
    examples: [
      { title: "Product galleries", body: "10 angles per SKU, resized to your theme's spec." },
      { title: "Lifestyle hero images", body: "Above-the-fold heroes optimized to under 200KB." },
      { title: "Category banners", body: "Perfectly sized banners for desktop and mobile viewports." },
    ],
    faqs: [
      { q: "Does it integrate with Shopify or WooCommerce?", a: "Export to your store's exact dimensions and drop the ZIP into your product upload. Direct sync is on the Business plan." },
      { q: "Will Google penalize compressed images?", a: "The opposite — Core Web Vitals reward smaller LCP images. PixelSqueeze is tuned for Google's guidance." },
      { q: "Can I process thousands of SKUs?", a: "Yes. Batch Processing handles thousands of SKUs with pause/resume." },
    ],
    testimonials: [
      { name: "Priya S.", role: "DTC Founder", quote: "LCP went from 4.1s to 1.6s. Sales up 18% the next week.", rating: 5 },
      { name: "Alex T.", role: "Ecom Ops Lead", quote: "We process 3,000 SKUs a week without opening Photoshop.", rating: 5 },
    ],
    beforeAfter: [
      { label: "PDP gallery (10 angles)", beforeSize: "42 MB", afterSize: "3.8 MB", savings: "91%" },
      { label: "Category hero banner", beforeSize: "1.9 MB", afterSize: "168 KB", savings: "91%" },
    ],
    recommendedPlan: "Pro",
    ctaLabel: "Speed up my store free",
  },
  {
    slug: "marketing-agencies",
    audience: "Marketing Agencies",
    title: "Image Optimization for Marketing Agencies | PixelSqueeze",
    description: "Deliver client assets faster across every channel. Batch, brand and export in one workflow with team seats and shared presets.",
    h1: "One image tool for every client, every channel",
    intro: "Agencies juggle 20 brands and 40 placements. PixelSqueeze gives your team shared presets, batch exports and per-client folders — ship campaigns in hours, not days.",
    benefits: [
      { title: "Shared brand presets", body: "Lock export specs per client so juniors can't ship a wrong-size asset." },
      { title: "Team seats + folders", body: "Every strategist, designer and account lead in one workspace." },
      { title: "Cross-channel packs", body: "Paid social, email, display and web — one upload, every deliverable." },
    ],
    examples: [
      { title: "Campaign launch packs", body: "Meta, TikTok, LinkedIn, display and email assets in one ZIP." },
      { title: "Programmatic display", body: "Every IAB banner size auto-exported and weight-optimized." },
      { title: "Email hero images", body: "Retina-ready hero images under 200KB per placement." },
    ],
    faqs: [
      { q: "Do you offer white-label output?", a: "Business includes white-label export and a brand-safe client-share link." },
      { q: "Can I brief clients through the tool?", a: "Yes — folders, tags and share links let you package deliverables per client." },
      { q: "How many seats?", a: "Business includes 10 seats. Enterprise adds SSO and unlimited seats." },
    ],
    testimonials: [
      { name: "Nina C.", role: "Creative Director", quote: "We killed our export sprints. It's one click now.", rating: 5 },
      { name: "Tom W.", role: "Agency Partner", quote: "Client turnaround dropped from 3 days to same-day.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Full campaign pack (60 assets)", beforeSize: "740 MB", afterSize: "62 MB", savings: "92%" },
      { label: "IAB display set (18 sizes)", beforeSize: "24 MB", afterSize: "2.1 MB", savings: "91%" },
    ],
    recommendedPlan: "Business",
    ctaLabel: "Try it with your team",
  },
  {
    slug: "graphic-designers",
    audience: "Graphic Designers",
    title: "Image Compression & Export Tool for Designers | PixelSqueeze",
    description: "Ship client-ready exports without the tedium. Batch compress, resize and format-convert straight from your design library.",
    h1: "The export step, finally automated",
    intro: "You didn't become a designer to babysit Save For Web. PixelSqueeze handles the batch resize, compress and convert step so you spend more time designing and less time exporting.",
    benefits: [
      { title: "Format-convert in bulk", body: "PNG → WebP, HEIC → JPEG, SVG → PNG — batched and preset-driven." },
      { title: "Perceptual quality tuning", body: "AI picks the quality slider per image so nothing looks crunchy." },
      { title: "Handoff-ready ZIPs", body: "Client-friendly file names, folders and README included." },
    ],
    examples: [
      { title: "Brand kit exports", body: "Full logo set in every format and size, one click." },
      { title: "Web deliverables", body: "1x/2x/3x retina assets with per-breakpoint sizing." },
      { title: "Presentation decks", body: "Compress deck imagery so Keynote and Google Slides stay snappy." },
    ],
    faqs: [
      { q: "Does it preserve transparency?", a: "Yes — PNG and WebP retain full alpha channel through compression." },
      { q: "Can I keep my file naming?", a: "Yes. Original file names are preserved and can be templated per export." },
      { q: "Does it work with Figma or Illustrator exports?", a: "Drop any export folder in and PixelSqueeze processes the whole batch." },
    ],
    testimonials: [
      { name: "Lena F.", role: "Brand Designer", quote: "It handles the boring 20% of my day so I can design.", rating: 5 },
      { name: "Otis M.", role: "Product Designer", quote: "Retina exports done right, no manual scaling.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Brand kit (120 assets)", beforeSize: "220 MB", afterSize: "22 MB", savings: "90%" },
      { label: "Retina web set (1x/2x/3x)", beforeSize: "48 MB", afterSize: "4.6 MB", savings: "90%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Try it on your next export",
  },
  {
    slug: "influencers",
    audience: "Influencers",
    title: "Image Optimization Built for Influencers | PixelSqueeze",
    description: "Post-ready content in seconds. Auto-crop for every platform, keep skin tones flawless and grow faster with sharper uploads.",
    h1: "Look sharper. Post faster. Grow further.",
    intro: "Your feed is your brand. PixelSqueeze keeps skin tones true, colors punchy and every crop platform-perfect so you can post daily without the editing grind.",
    benefits: [
      { title: "Skin-safe compression", body: "Preserves skin tone, hair detail and background bokeh." },
      { title: "Every crop, one click", body: "Feed, Reel, Story, cover — one photo becomes your full week." },
      { title: "Brand-consistent presets", body: "Save your look once and apply it forever." },
    ],
    examples: [
      { title: "Feed carousels", body: "Cinematic 4:5 sets exported with your signature grade." },
      { title: "Story series", body: "9:16 Story assets with safe zones respected." },
      { title: "Cover art", body: "Podcast and YouTube covers in every required aspect ratio." },
    ],
    faqs: [
      { q: "Will it flatten my color grade?", a: "No — we preserve LUT-baked color and only touch compression, not tone." },
      { q: "Can I save my own preset?", a: "Yes. Every influencer plan includes unlimited saved presets." },
      { q: "Is there a mobile app?", a: "PixelSqueeze runs as a fast PWA on iPhone and Android — install from the /install page." },
    ],
    testimonials: [
      { name: "Kai H.", role: "Fashion Influencer, 1.2M", quote: "Posting daily used to eat my mornings. Now it's 5 minutes.", rating: 5 },
      { name: "Amelia R.", role: "Beauty Creator", quote: "Skin tones finally look like they do on my phone.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Weekly content set (25 imgs)", beforeSize: "182 MB", afterSize: "16 MB", savings: "91%" },
      { label: "Reel cover pack (10)", beforeSize: "42 MB", afterSize: "3.6 MB", savings: "91%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Optimize a week free",
  },
  {
    slug: "content-creators",
    audience: "Content Creators",
    title: "Image Optimization for Content Creators | PixelSqueeze",
    description: "Publish across YouTube, TikTok, Substack and your own site. Every thumbnail, cover and hero image optimized in one workflow.",
    h1: "Ship content faster without losing quality",
    intro: "Cross-posting to five platforms shouldn't take an afternoon. PixelSqueeze prepares thumbnails, covers and hero shots for every channel in one click.",
    benefits: [
      { title: "Multi-platform in one pass", body: "YouTube, TikTok, Substack, X, LinkedIn — sizes and quality tuned per channel." },
      { title: "Thumbnail A/B ready", body: "Export multiple variants side-by-side to test what wins." },
      { title: "Web-fast hero images", body: "LCP-friendly hero and OG images that don't tank your site speed." },
    ],
    examples: [
      { title: "YouTube thumbnails", body: "1280×720 exports optimized for click-through, not just size." },
      { title: "Newsletter hero images", body: "Under 200KB, retina-safe hero art for Substack and Beehiiv." },
      { title: "Podcast episode art", body: "3000×3000 covers plus derivative sizes for Spotify and Apple." },
    ],
    faqs: [
      { q: "Can I use this for podcast art?", a: "Yes — 3000×3000 base plus every derivative size for Spotify, Apple and YouTube Music." },
      { q: "Does it export OG images?", a: "Yes. Set your OG spec once and every article gets a compliant image." },
      { q: "Do you support HEIC from iPhone?", a: "Yes. HEIC, HEIF, AVIF and all standard formats are supported." },
    ],
    testimonials: [
      { name: "Jesse D.", role: "YouTuber, 350k subs", quote: "Thumbs, banners and Shorts covers in one export.", rating: 5 },
      { name: "Riya M.", role: "Newsletter Writer", quote: "My hero images actually load now. Open rates went up too.", rating: 5 },
    ],
    beforeAfter: [
      { label: "YouTube thumbnail set (12)", beforeSize: "24 MB", afterSize: "2.1 MB", savings: "91%" },
      { label: "Newsletter hero (retina)", beforeSize: "3.1 MB", afterSize: "182 KB", savings: "94%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Try it on your next post",
  },
  {
    slug: "bloggers",
    audience: "Bloggers",
    title: "Blog Image Compression & SEO Tool | PixelSqueeze",
    description: "Faster blog posts, better Core Web Vitals, higher Google rankings. Compress blog images without visible quality loss.",
    h1: "Rank higher with faster blog images",
    intro: "Google measures your images. PixelSqueeze compresses blog hero and inline images to WebP with SEO-safe alt text — so your posts pass Core Web Vitals and rank higher.",
    benefits: [
      { title: "Core Web Vitals safe", body: "LCP-optimized hero images with proper dimensions and lazy-load-friendly sizing." },
      { title: "WebP + JPEG fallback", body: "Modern format with a fallback for every browser." },
      { title: "AI alt text suggestions", body: "SEO-friendly alt text drafted for every image." },
    ],
    examples: [
      { title: "Blog hero images", body: "1600px WebP heroes under 150KB." },
      { title: "Inline article images", body: "Consistent width, tight compression, retina-ready." },
      { title: "Pinterest pins", body: "1000×1500 pins auto-exported from any hero image." },
    ],
    faqs: [
      { q: "Will it break my WordPress uploads?", a: "No. Export as JPEG or WebP and drag into your media library — no plugin required." },
      { q: "Does it help SEO?", a: "Directly — faster images improve LCP and mobile scores, both ranking factors." },
      { q: "Can I bulk-optimize existing posts?", a: "Yes. Batch process your entire /uploads folder and swap files in place." },
    ],
    testimonials: [
      { name: "Chloe B.", role: "Food Blogger", quote: "PageSpeed jumped from 62 to 96 in a weekend.", rating: 5 },
      { name: "Dan P.", role: "Travel Blog Owner", quote: "Traffic up 34% quarter over quarter after we compressed everything.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Blog post (12 inline imgs)", beforeSize: "22 MB", afterSize: "1.8 MB", savings: "92%" },
      { label: "Hero image (1600px)", beforeSize: "2.1 MB", afterSize: "138 KB", savings: "93%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Speed up my blog free",
  },
  {
    slug: "amazon-sellers",
    audience: "Amazon Sellers",
    title: "Amazon Product Image Optimizer | PixelSqueeze",
    description: "Meet Amazon's image requirements automatically. 2000×2000 zoom-ready listings that convert — compressed with no visible loss.",
    h1: "Amazon-compliant listings in one click",
    intro: "Amazon rewards zoom-ready 2000×2000 images and penalizes slow-loading ones. PixelSqueeze sizes, compresses and background-cleans every product photo to Amazon's spec.",
    benefits: [
      { title: "2000×2000 zoom-ready", body: "Auto-scaled to Amazon's zoom-eligible size — the version that converts." },
      { title: "Pure white background fix", body: "One-click pure white (#FFFFFF) backgrounds for main images." },
      { title: "Fits Amazon file limits", body: "Under 10MB per file, no over-compression artifacts." },
    ],
    examples: [
      { title: "Main product image", body: "Pure white background, product filling 85% of frame." },
      { title: "Lifestyle gallery", body: "Compressed and cropped to Amazon's gallery ratio." },
      { title: "A+ content banners", body: "Module-perfect sizes for A+ Content and Brand Store." },
    ],
    faqs: [
      { q: "Does it meet Amazon's technical requirements?", a: "Yes — 2000×2000, sRGB, JPEG, under 10MB, pure white background where required." },
      { q: "Can it remove backgrounds?", a: "Yes. AI background removal produces the pure white main-image background Amazon requires." },
      { q: "How many SKUs can I process?", a: "Thousands. Batch mode handles full catalog re-uploads." },
    ],
    testimonials: [
      { name: "Vince Q.", role: "Amazon FBA Seller", quote: "Compliance warnings gone. Sessions up 22%.", rating: 5 },
      { name: "Hana K.", role: "Private Label Brand", quote: "Every SKU now has zoom-eligible images. Conversion jumped.", rating: 5 },
    ],
    beforeAfter: [
      { label: "SKU catalog (200 images)", beforeSize: "1.8 GB", afterSize: "162 MB", savings: "91%" },
      { label: "Main product image", beforeSize: "6.4 MB", afterSize: "540 KB", savings: "92%" },
    ],
    recommendedPlan: "Pro",
    ctaLabel: "Optimize my listings free",
  },
  {
    slug: "shopify-stores",
    audience: "Shopify Stores",
    title: "Shopify Image Optimization & Speed Tool | PixelSqueeze",
    description: "Boost Shopify site speed and Core Web Vitals. Compress product, collection and lifestyle images without theme changes.",
    h1: "The fastest Shopify store starts with lighter images",
    intro: "Shopify themes ship heavy by default. PixelSqueeze compresses every product, collection and lifestyle image so your store loads faster and converts more — no theme changes required.",
    benefits: [
      { title: "Theme-aware exports", body: "Dawn, Sense, Impulse — sizes matched to your theme's spec." },
      { title: "Metafield-ready", body: "Additional gallery and swatch sizes exported in one pass." },
      { title: "Better Core Web Vitals", body: "Improve LCP and CLS — Shopify's speed score and Google's rankings." },
    ],
    examples: [
      { title: "Product gallery images", body: "Every angle sized for gallery + zoom + thumbnail." },
      { title: "Collection tiles", body: "Uniform, fast-loading collection card imagery." },
      { title: "Homepage hero", body: "Sub-200KB heroes that don't tank mobile LCP." },
    ],
    faqs: [
      { q: "Do I need a Shopify app?", a: "No. Export a ZIP and bulk-upload via the admin, or use our Business-tier sync." },
      { q: "Will it break my product images?", a: "No. Original filenames and dimensions are preserved so URLs and SEO stay intact." },
      { q: "Does it improve my Shopify speed score?", a: "Yes. Compressed images are the fastest win for LCP, which is 40%+ of the score." },
    ],
    testimonials: [
      { name: "Simone O.", role: "Shopify Store Owner", quote: "Speed score went 42 → 78 in one afternoon.", rating: 5 },
      { name: "Rafi B.", role: "Shopify Plus Merchant", quote: "Mobile bounce rate dropped 19% after we compressed everything.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Full catalog (800 imgs)", beforeSize: "6.8 GB", afterSize: "540 MB", savings: "92%" },
      { label: "Homepage hero image", beforeSize: "2.4 MB", afterSize: "182 KB", savings: "92%" },
    ],
    recommendedPlan: "Pro",
    ctaLabel: "Speed up my Shopify free",
  },
  {
    slug: "restaurants",
    audience: "Restaurants",
    title: "Restaurant Menu & Food Photo Optimizer | PixelSqueeze",
    description: "Make menu and food photos look mouth-watering online. Optimize for Instagram, Google Business, Toast and DoorDash.",
    h1: "Menus that look as good as they taste",
    intro: "Food sells with the eyes. PixelSqueeze color-corrects, sharpens and compresses menu and dish photos for Instagram, Google Business, Toast and DoorDash — instantly.",
    benefits: [
      { title: "Appetite-first color", body: "Warm color and contrast tuned to make food look fresh, not flat." },
      { title: "Every menu channel", body: "Google Business, DoorDash, Uber Eats, Toast and your own site." },
      { title: "Same-day updates", body: "Change tomorrow's special this evening — no photographer required." },
    ],
    examples: [
      { title: "Dish hero shots", body: "Warm, sharp, plate-focused dish photos for menu tiles." },
      { title: "Google Business photos", body: "Properly sized cover, interior and dish photos that rank locally." },
      { title: "Delivery-app menus", body: "Correctly sized DoorDash and Uber Eats menu tiles." },
    ],
    faqs: [
      { q: "Do I need a photographer?", a: "No. Even iPhone shots come out looking pro after PixelSqueeze's food preset." },
      { q: "Does it work for Google Business photos?", a: "Yes — with Google's recommended dimensions and file weights baked in." },
      { q: "Can staff use it?", a: "Yes. It's designed to be one-click, no photo-editing skill required." },
    ],
    testimonials: [
      { name: "Chef Malik", role: "Bistro Owner", quote: "My Instagram looks like a magazine now. From an iPhone.", rating: 5 },
      { name: "Sara L.", role: "Restaurant Manager", quote: "Menus updated same day. DoorDash conversions up 15%.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Full menu (36 dishes)", beforeSize: "290 MB", afterSize: "24 MB", savings: "92%" },
      { label: "Google Business cover", beforeSize: "3.2 MB", afterSize: "228 KB", savings: "93%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Optimize my menu free",
  },
  {
    slug: "hotels",
    audience: "Hotels",
    title: "Hotel Photo Optimization for Booking Sites | PixelSqueeze",
    description: "Optimize hotel room and property photos for Booking.com, Expedia, Airbnb and your direct site. Faster bookings, brighter rooms.",
    h1: "Rooms that book. Photos that load.",
    intro: "OTA search shows the fastest, brightest photos first. PixelSqueeze auto-brightens, straightens and compresses hotel photography for Booking.com, Expedia, Airbnb and your direct site.",
    benefits: [
      { title: "OTA-compliant sizing", body: "Correct dimensions and weights for Booking.com, Expedia, Hotels.com and Airbnb." },
      { title: "Bright, true-to-room", body: "Auto-brighten interiors and pool shots without the fake HDR look." },
      { title: "Multi-property batching", body: "Process an entire portfolio's photo set in minutes." },
    ],
    examples: [
      { title: "Room galleries", body: "Consistent brightness and color across every room type." },
      { title: "Amenity photos", body: "Pool, spa, gym and dining shot sets, uniformly bright." },
      { title: "Direct-site hero", body: "Sub-300KB hero image for your booking site homepage." },
    ],
    faqs: [
      { q: "Does it meet Booking.com's requirements?", a: "Yes — 2048px longest edge, under 3MB, sRGB, exactly as Booking specifies." },
      { q: "Will pool and beach shots look overprocessed?", a: "No. We tune shadows and highlights subtly — no crushed HDR look." },
      { q: "Can I brand-standardize a portfolio?", a: "Business includes shared presets so every property looks like the same brand." },
    ],
    testimonials: [
      { name: "Elena V.", role: "Hotel Marketing Director", quote: "Our OTA ranking jumped after we re-shot nothing — just re-processed.", rating: 5 },
      { name: "Diego M.", role: "Boutique Hotel Owner", quote: "Bookings up 12% after we swapped in the new photo set.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Full property (120 imgs)", beforeSize: "1.4 GB", afterSize: "128 MB", savings: "91%" },
      { label: "Hero room shot", beforeSize: "4.8 MB", afterSize: "340 KB", savings: "93%" },
    ],
    recommendedPlan: "Business",
    ctaLabel: "Optimize a property free",
  },
  {
    slug: "travel-bloggers",
    audience: "Travel Bloggers",
    title: "Travel Blog Image Optimization Tool | PixelSqueeze",
    description: "Fast-loading travel posts that rank. Compress travel photos to WebP without losing the color of that sunset in Bali.",
    h1: "Travel photos that load fast and look real",
    intro: "Travel posts live and die by photos — but heavy galleries kill your rankings. PixelSqueeze compresses sunsets, streetscapes and drone shots to WebP with sunset color intact.",
    benefits: [
      { title: "Color-true compression", body: "Golden hour stays golden. Water stays teal. No washed-out compression." },
      { title: "Gallery-friendly formats", body: "WebP + JPEG fallback for lightbox galleries and photo essays." },
      { title: "Pinterest pin exports", body: "Every hero image auto-exported as a 1000×1500 pin." },
    ],
    examples: [
      { title: "Photo essays", body: "20-image galleries compressed to under 4MB total." },
      { title: "Drone footage stills", body: "4K stills optimized for hero placement and OG cards." },
      { title: "Instagram highlights", body: "Uniform highlight covers exported per trip." },
    ],
    faqs: [
      { q: "Will sunsets and skies band or posterize?", a: "No — our compression preserves gradient smoothness, the biggest sky-photo risk." },
      { q: "Can I export Pinterest pins too?", a: "Yes. Every hero image can be re-exported as a 1000×1500 pin in one click." },
      { q: "Does it help my travel blog rank?", a: "Yes. Fast, WebP hero images improve LCP — a direct Google ranking factor." },
    ],
    testimonials: [
      { name: "Iris N.", role: "Travel Blogger", quote: "My Bali posts finally load fast enough for Google to like them.", rating: 5 },
      { name: "Owen R.", role: "Adventure Photographer", quote: "Sunsets still look like sunsets. That was my dealbreaker.", rating: 5 },
    ],
    beforeAfter: [
      { label: "Photo essay (24 imgs)", beforeSize: "182 MB", afterSize: "14 MB", savings: "92%" },
      { label: "Drone hero (4K)", beforeSize: "9.2 MB", afterSize: "720 KB", savings: "92%" },
    ],
    recommendedPlan: "Creator",
    ctaLabel: "Speed up my travel blog",
  },
];

export const getIndustry = (slug: string) => INDUSTRIES.find((i) => i.slug === slug);
