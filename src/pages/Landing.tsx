import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
  Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import weddingBefore from "@/assets/wedding-before.jpg";
import weddingAfter from "@/assets/wedding-after.jpg";
import manBefore from "@/assets/man-before.jpg";
import manAfter from "@/assets/man-after.jpg";
import heroImage from "@/assets/compression-hero.jpg";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/80 backdrop-blur-sm border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Minimize2 className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold font-brand bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Pixelsqueeze
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="ghost" size="sm">Blog</Button>
            </Link>
            <Link to="/company">
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
      <section className="py-20 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
              <Zap className="w-4 h-4 mr-2" />
              See the Difference
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              AI-Powered Transformations
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade image compression with powerful features
            </p>
          </div>

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

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-secondary/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              Start free, upgrade when you need more
            </p>
          </div>

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

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Optimize Your Images?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
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
