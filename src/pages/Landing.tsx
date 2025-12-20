import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Minimize2, 
  Zap, 
  Shield, 
  TrendingDown, 
  Upload, 
  Crown, 
  CheckCircle,
  Image,
  Sparkles,
  ArrowRight,
  Star,
  Quote,
  HelpCircle,
  Download
} from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import weddingBefore from "@/assets/wedding-before.jpg";
import weddingAfter from "@/assets/wedding-after.jpg";
import manBefore from "@/assets/man-before.jpg";
import manAfter from "@/assets/man-after.jpg";
import heroImage from "@/assets/compression-hero.jpg";

const Landing = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Pixelsqueeze",
    "applicationCategory": "MultimediaApplication",
    "operatingSystem": "Web",
    "description": "AI-powered image compression tool that reduces file sizes by up to 80% while maintaining stunning visual quality.",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "description": "Free tier with 3 compressions"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "2847",
      "bestRating": "5"
    }
  };

  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Pixelsqueeze",
    "url": "https://pixelsqueeze.com",
    "logo": "https://pixelsqueeze.com/logo.png",
    "description": "Professional image compression and optimization platform"
  };

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "How does Pixelsqueeze compress images without losing quality?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Pixelsqueeze uses advanced AI algorithms to analyze each image and identify areas where file size can be reduced without visible quality loss. Our technology removes unnecessary metadata, optimizes color profiles, and applies smart compression that preserves important visual details."
        }
      },
      {
        "@type": "Question",
        "name": "What image formats are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support all major image formats including JPEG, PNG, WebP, GIF, and TIFF. You can also convert between formats during compression."
        }
      },
      {
        "@type": "Question",
        "name": "Are my images stored on your servers?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Your privacy is our priority. Images are processed in real-time and automatically deleted from our servers within 1 hour. All transfers are encrypted with 256-bit SSL."
        }
      },
      {
        "@type": "Question",
        "name": "Can I compress multiple images at once?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! Pro subscribers can upload and compress up to 50 images at once with our bulk processing feature and download all compressed images as a single ZIP file."
        }
      },
      {
        "@type": "Question",
        "name": "Can I cancel my subscription anytime?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! You can cancel your Pro subscription at any time from your account settings. Your access will continue until the end of your current billing period."
        }
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Pixelsqueeze - AI Image Compression | Reduce File Size by 80%</title>
        <meta name="description" content="Compress images without losing quality. AI-powered image compression reduces file sizes by up to 80%. Perfect for web optimization, faster loading times, and storage savings. Start free today." />
        <meta name="keywords" content="image compression, compress images, reduce image size, image optimizer, photo compressor, web optimization, AI compression, bulk image compression" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Pixelsqueeze - AI Image Compression" />
        <meta property="og:description" content="Reduce image file sizes by up to 80% without losing quality. AI-powered compression for professionals." />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="640" />
        <meta property="og:image:alt" content="Pixelsqueeze - Compress Images Fast" />
        <meta property="og:url" content="https://pixelsqueeze.com" />
        <meta property="og:site_name" content="Pixelsqueeze" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pixelsqueeze - AI Image Compression" />
        <meta name="twitter:description" content="Reduce image file sizes by up to 80% without losing quality. Start compressing for free." />
        <meta name="twitter:image" content="/og-image.png" />
        <meta name="twitter:image:alt" content="Pixelsqueeze - Compress Images Fast" />
        
        {/* Additional SEO */}
        <meta name="robots" content="index, follow" />
        <meta name="author" content="Pixelsqueeze" />
        <link rel="canonical" href="https://pixelsqueeze.com" />
        
        {/* Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(organizationData)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqData)}
        </script>
      </Helmet>
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Minimize2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Pixelsqueeze
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/install" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            </Link>
            <Link to="/blog">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link to="/company" className="hidden sm:block">
              <Button variant="ghost" size="sm">Company</Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-primary">Get Started Free</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-24 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <Badge variant="outline" className="mb-6 px-4 py-2 border-primary text-primary animate-pulse">
            <Sparkles className="w-4 h-4 mr-2" />
            AI-Powered Compression Technology
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              Compress Images
            </span>
            <br />
            <span className="text-foreground">Without Losing Quality</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto">
            Reduce file sizes by up to <span className="text-primary font-semibold">80%</span> while maintaining stunning visual quality. 
            Perfect for web optimization, faster loading times, and storage savings.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/auth">
              <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8 py-6 text-lg">
                <Upload className="w-5 h-5 mr-2" />
                Start Compressing Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground">No credit card required • 3 free compressions</p>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>256-bit Encryption</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <span>Instant Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-primary" />
              <span>Up to 80% Reduction</span>
            </div>
          </div>
        </div>
      </section>

      {/* Before/After Showcase */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
              <Zap className="w-4 h-4 mr-2" />
              See the Difference
            </Badge>
            <h2 className="section-title">
              AI-Powered Transformations
            </h2>
            <p className="section-subtitle !mb-8">
              Slide to see the stunning before and after results of our compression technology
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BeforeAfterSlider
              beforeImage={weddingBefore}
              afterImage={weddingAfter}
              title="Wedding Photo Enhancement"
              description="Crystal-clear memories preserved perfectly"
            />
            <BeforeAfterSlider
              beforeImage={manBefore}
              afterImage={manAfter}
              title="Portrait Perfection"
              description="Professional quality in seconds"
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">
            Everything You Need
          </h2>
          <p className="section-subtitle">
            Professional-grade image compression with powerful features
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <TrendingDown className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Compression</h3>
              <p className="text-muted-foreground">
                AI analyzes each image to find the optimal compression level without visible quality loss.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Bulk Processing</h3>
              <p className="text-muted-foreground">
                Upload and compress hundreds of images at once. Save hours of manual work.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Format Support</h3>
              <p className="text-muted-foreground">
                Works with JPG, PNG, WebP, and more. Convert between formats seamlessly.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Processing</h3>
              <p className="text-muted-foreground">
                Your images are encrypted and automatically deleted after processing.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Process images in seconds, not minutes. Optimized for speed and efficiency.
              </p>
            </Card>

            <Card className="p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Enhancement</h3>
              <p className="text-muted-foreground">
                Not just compression - enhance, upscale, and transform your images with AI.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
              <Star className="w-4 h-4 mr-2 fill-primary" />
              Trusted by Professionals
            </Badge>
            <h2 className="section-title">
              Loved by 50,000+ Users
            </h2>
            <p className="section-subtitle !mb-8">
              See what our customers are saying about Pixelsqueeze
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <Card className="p-6 relative">
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "Pixelsqueeze cut our page load times in half. The quality is indistinguishable from the originals but files are 70% smaller. Essential for any web developer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                  SM
                </div>
                <div>
                  <p className="font-semibold">Sarah Mitchell</p>
                  <p className="text-sm text-muted-foreground">Lead Developer, TechFlow</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 2 */}
            <Card className="p-6 relative">
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "As a photographer, I was skeptical about compression. But Pixelsqueeze maintains the detail I need while making sharing so much easier. Game changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                  JC
                </div>
                <div>
                  <p className="font-semibold">James Chen</p>
                  <p className="text-sm text-muted-foreground">Professional Photographer</p>
                </div>
              </div>
            </Card>

            {/* Testimonial 3 */}
            <Card className="p-6 relative">
              <Quote className="absolute top-4 right-4 w-8 h-8 text-primary/20" />
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6">
                "We process thousands of product images daily. The bulk feature saves us hours every week. The ROI paid for itself in the first month."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold">
                  EW
                </div>
                <div>
                  <p className="font-semibold">Emily Watson</p>
                  <p className="text-sm text-muted-foreground">E-commerce Manager, StyleHub</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Social Proof Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-primary">50K+</p>
              <p className="text-muted-foreground">Active Users</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">10M+</p>
              <p className="text-muted-foreground">Images Compressed</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">4.9/5</p>
              <p className="text-muted-foreground">Average Rating</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">99.9%</p>
              <p className="text-muted-foreground">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <h2 className="section-title">
            Simple, Transparent Pricing
          </h2>
          <p className="section-subtitle">
            Start free, upgrade when you need more
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="p-8">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <p className="text-muted-foreground mb-6">Perfect for trying it out</p>
              <div className="text-4xl font-bold mb-6">$0<span className="text-lg text-muted-foreground">/month</span></div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>3 free compressions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Standard quality (85%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Up to 1920px dimensions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>72 DPI output</span>
                </li>
              </ul>

              <Link to="/auth">
                <Button variant="outline" className="w-full">Get Started Free</Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="p-8 border-primary relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-gradient-primary text-primary-foreground px-4 py-1 text-sm font-medium">
                Popular
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-6 h-6 text-primary" />
                <h3 className="text-2xl font-bold">Pro</h3>
              </div>
              <p className="text-muted-foreground mb-6">For professionals and teams</p>
              <div className="text-4xl font-bold mb-6">$6.95<span className="text-lg text-muted-foreground">/month</span></div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Unlimited compressions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Premium quality (up to 100%)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Up to 4096px dimensions</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Custom DPI (up to 300)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Bulk download as ZIP</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>AI image editing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                  <span>Priority support</span>
                </li>
              </ul>

              <Link to="/auth">
                <Button className="w-full bg-gradient-primary">Start Pro Trial</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Thousands
            </h2>
            <p className="text-xl text-muted-foreground">
              See what our users are saying
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "Pixelsqueeze saved me hours every week. The quality is incredible and the speed is unmatched!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  SM
                </div>
                <div>
                  <p className="font-semibold">Sarah Mitchell</p>
                  <p className="text-sm text-muted-foreground">E-commerce Manager</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "As a photographer, file sizes were killing my storage. Pixelsqueeze reduced them by 75% with no quality loss!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-profit flex items-center justify-center text-profit-foreground font-bold">
                  JR
                </div>
                <div>
                  <p className="font-semibold">James Rodriguez</p>
                  <p className="text-sm text-muted-foreground">Professional Photographer</p>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-500 text-yellow-500" />
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "Our website load time improved by 60% after using Pixelsqueeze. Game changer for SEO!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  MK
                </div>
                <div>
                  <p className="font-semibold">Michael Kim</p>
                  <p className="text-sm text-muted-foreground">Web Developer</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
              <HelpCircle className="w-4 h-4 mr-2" />
              Got Questions?
            </Badge>
            <h2 className="section-title">
              Frequently Asked Questions
            </h2>
            <p className="section-subtitle !mb-8">
              Everything you need to know about Pixelsqueeze
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                How does Pixelsqueeze compress images without losing quality?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Pixelsqueeze uses advanced AI algorithms to analyze each image and identify areas where file size can be reduced without visible quality loss. Our technology removes unnecessary metadata, optimizes color profiles, and applies smart compression that preserves important visual details while eliminating redundant data.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                What image formats are supported?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                We support all major image formats including JPEG, PNG, WebP, GIF, and TIFF. You can also convert between formats during compression. For example, you can upload a PNG and download an optimized WebP for even better compression.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                Is there a file size limit?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Free users can upload images up to 10MB each. Pro subscribers can upload images up to 50MB each. There is no limit on the number of images you can process with a Pro subscription.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                Are my images stored on your servers?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Your privacy is our priority. Images are processed in real-time and automatically deleted from our servers within 1 hour. We never store, share, or use your images for any purpose other than compression. All transfers are encrypted with 256-bit SSL.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                Can I compress multiple images at once?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Yes! Pro subscribers can upload and compress up to 50 images at once with our bulk processing feature. You can also download all compressed images as a single ZIP file for convenience.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                What is the difference between Free and Pro?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Free users get 3 compressions with standard quality (85%) and 72 DPI output. Pro subscribers get unlimited compressions, premium quality up to 100%, custom DPI settings up to 300, larger image dimensions up to 4096px, bulk processing, ZIP downloads, and AI-powered image editing features.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                Can I cancel my subscription anytime?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Absolutely! You can cancel your Pro subscription at any time from your account settings. Your access will continue until the end of your current billing period. No questions asked, no hidden fees.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8" className="bg-card rounded-lg border px-6">
              <AccordionTrigger className="text-left text-lg font-medium hover:no-underline">
                Do you offer refunds?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                Yes, we offer a 7-day money-back guarantee. If you are not satisfied with Pixelsqueeze Pro for any reason, contact our support team within 7 days of your purchase for a full refund.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <section className="section-padding bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="section-title">
            Ready to Optimize Your Images?
          </h2>
          <p className="section-subtitle !mb-8">
            Join thousands of users saving time and storage with Pixelsqueeze
          </p>
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-10 py-6 text-lg">
              <Upload className="w-5 h-5 mr-2" />
              Start Compressing Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <Minimize2 className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">Pixelsqueeze</span>
            </div>
            <div className="flex gap-6 text-muted-foreground">
              <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link to="/company" className="hover:text-foreground transition-colors">Company</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Pixelsqueeze. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
