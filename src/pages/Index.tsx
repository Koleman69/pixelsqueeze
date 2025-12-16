import { CompressionStatus } from "@/components/CompressionStatus";
import { StatsCard } from "@/components/StatsCard";
import { CompressionResults } from "@/components/CompressionResults";
import { ImageUploader } from "@/components/ImageUploader";
import { ImageEditor } from "@/components/ImageEditor";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Upload, Shield, TrendingDown, Zap, BarChart3, Target, LogOut, Image, FileImage, Minimize2, HardDrive, Crown, BookOpen, Loader2, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/compression-hero.jpg";
import weddingBefore from "@/assets/wedding-before.jpg";
import weddingAfter from "@/assets/wedding-after.jpg";
import manBefore from "@/assets/man-before.jpg";
import manAfter from "@/assets/man-after.jpg";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

const mockCompressions = [
  {
    fileName: "wedding_photo.jpg",
    originalSize: 12500000, // 12.5MB
    compressedSize: 3200000, // 3.2MB
    compressionRatio: 74,
    quality: 95,
    status: "completed" as const,
  },
  {
    fileName: "product_image.png",
    originalSize: 8300000, // 8.3MB
    compressedSize: 2100000, // 2.1MB
    compressionRatio: 75,
    quality: 98,
    status: "completed" as const,
  },
  {
    fileName: "portfolio_shot.jpg",
    originalSize: 15200000, // 15.2MB
    compressedSize: 0,
    compressionRatio: 0,
    quality: 0,
    status: "processing" as const,
  },
];

const compressionData = [
  { period: "Week 1", filesProcessed: 125, averageCompression: 65, spaceSaved: 2.1 },
  { period: "Week 2", filesProcessed: 243, averageCompression: 68, spaceSaved: 4.2 },
  { period: "Week 3", filesProcessed: 387, averageCompression: 72, spaceSaved: 7.8 },
  { period: "Week 4", filesProcessed: 512, averageCompression: 70, spaceSaved: 12.5 },
  { period: "Month 2", filesProcessed: 1248, averageCompression: 69, spaceSaved: 28.3 },
  { period: "Month 3", filesProcessed: 2156, averageCompression: 71, spaceSaved: 45.7 },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { compressions, subscription, createCheckout, checkSubscription, compressImages, downloadBulk } = useImageCompression();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      toast({
        title: "Processing images",
        description: `Processing ${files.length} image(s)...`,
      });
      try {
        await compressImages(files);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center">
              <Minimize2 className="w-6 h-6 text-primary mr-2" />
              <h1 className="text-xl font-bold">Pixelsqueeze</h1>
            </div>
            <Link to="/blog">
              <Button variant="ghost" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Blog
              </Button>
            </Link>
            <Link to="/company">
              <Button variant="ghost" size="sm">
                Company
              </Button>
            </Link>
            <Link to="/account">
              <Button variant="ghost" size="sm">
                Account
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-hero" />
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
                <Zap className="w-4 h-4 mr-2" />
                Up to 80% File Size Reduction
              </Badge>
            </div>
            {subscription.subscribed && (
              <Badge className="bg-gradient-primary">
                <Crown className="w-4 h-4 mr-2" />
                Pro Active
              </Badge>
            )}
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            Compress Images Without Quality Loss
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered image compression that reduces file sizes by up to 80% while maintaining stunning visual quality.
            Perfect for web optimization, storage savings, and faster loading times.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8 py-3" onClick={handleFileUpload} disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Start Compressing
                </>
              )}
            </Button>
            {compressions.some(c => c.status === 'completed') && (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground px-8 py-3"
                onClick={() => {
                  const completedIds = compressions.filter(c => c.status === 'completed').map(c => c.id);
                  downloadBulk(completedIds);
                }}
              >
                <Download className="w-5 h-5 mr-2" />
                Download All ({compressions.filter(c => c.status === 'completed').length})
              </Button>
            )}
            {!subscription.subscribed && (
              <Button size="lg" className="bg-gradient-profit text-profit-foreground shadow-profit hover:opacity-90 px-8 py-3" onClick={createCheckout}>
                <Crown className="w-5 h-5 mr-2" />
                Upgrade to Pro
              </Button>
            )}
          </div>
          
          <input
             ref={fileInputRef}
             type="file"
             accept="image/*"
             multiple
             className="hidden"
             onChange={handleFileChange}
             disabled={isUploading}
           />
        </div>
      </section>

      {/* AI Transformation Showcase */}
      <section className="section-padding bg-gradient-to-b from-secondary/20 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Transformations
            </Badge>
            <h2 className="section-title">
              See the Magic in Action
            </h2>
            <p className="section-subtitle !mb-8">
              Transform blurry, imperfect images into crystal-clear masterpieces with our AI-powered editing tools. 
              Slide to reveal the stunning difference.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <BeforeAfterSlider
              beforeImage={weddingBefore}
              afterImage={weddingAfter}
              title="Wedding Photo Enhancement"
              description="Turn blurry wedding moments into crystal-clear memories"
            />
            
            <BeforeAfterSlider
              beforeImage={manBefore}
              afterImage={manAfter}
              title="Portrait Perfection"
              description="Professional skin retouching and enhancement in seconds"
            />
          </div>

          <div className="text-center mt-12">
            <p className="text-lg font-semibold">{isUploading ? 'Processing your images...' : 'Try it with your own photos below!'}</p>
          </div>
        </div>
      </section>

      {/* Image Upload Studio */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <ImageUploader />
        </div>
      </section>

      {/* Image Editor */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <ImageEditor />
        </div>
      </section>

      {/* Stats Overview */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">Your Compression Stats</h2>
          <p className="section-subtitle">Track your image optimization performance over time</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Files Processed"
              value="2,847"
              change="+247 this week"
              icon={<FileImage className="w-6 h-6" />}
              subtitle="Total processed"
            />
            <StatsCard
              title="Space Saved"
              value="12.4 GB"
              change="+2.1 GB this week"
              icon={<HardDrive className="w-6 h-6" />}
              subtitle="Storage reduced"
            />
            <StatsCard
              title="Avg Compression"
              value="68%"
              change="+3% improvement"
              icon={<TrendingDown className="w-6 h-6" />}
              subtitle="Size reduction"
            />
            <StatsCard
              title="Quality Retained"
              value="95%"
              change="Consistent quality"
              icon={<Image className="w-6 h-6" />}
              subtitle="Visual quality"
            />
          </div>
        </div>
      </section>

      {/* Recent Compressions */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title">Recent Compressions</h2>
            <p className="section-subtitle !mb-8">Your latest image optimization results</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {compressions.length > 0 ? (
              compressions.slice(0, 3).map((compression) => (
                <CompressionStatus key={compression.id} {...compression} />
              ))
            ) : (
              mockCompressions.map((compression, index) => (
                <CompressionStatus key={index} {...compression} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">What Our Users Say</h2>
          <p className="section-subtitle">
            Join thousands of satisfied users who trust Pixelsqueeze for their image compression needs
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "Pixelsqueeze saved me so much time! I used to spend hours manually compressing images for my e-commerce site. Now it takes seconds, and the quality is amazing. Highly recommend!"
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
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "As a wedding photographer, file sizes were killing my storage budget. Pixelsqueeze reduced my files by 75% without any visible quality loss. It's a game changer!"
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
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "The AI editing feature is incredible! I can transform backgrounds and apply filters in seconds. Worth every penny of the Pro subscription."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  EL
                </div>
                <div>
                  <p className="font-semibold">Emily Lin</p>
                  <p className="text-sm text-muted-foreground">Social Media Manager</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "Our website load time improved by 60% after using Pixelsqueeze. Google rankings went up, and our bounce rate dropped significantly. This tool pays for itself!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-profit flex items-center justify-center text-profit-foreground font-bold">
                  MK
                </div>
                <div>
                  <p className="font-semibold">Michael Kim</p>
                  <p className="text-sm text-muted-foreground">Web Developer</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "I've tried many compression tools, but Pixelsqueeze is the only one that delivers professional results consistently. The bulk processing saves me hours every week."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  AP
                </div>
                <div>
                  <p className="font-semibold">Amanda Peterson</p>
                  <p className="text-sm text-muted-foreground">Graphic Designer</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className="text-yellow-500 text-xl">★</span>
                ))}
              </div>
              <p className="text-foreground mb-4 italic">
                "Simple, fast, and effective. Exactly what I needed for my blog. The quality retention is outstanding, and my readers are loading pages faster than ever."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-profit flex items-center justify-center text-profit-foreground font-bold">
                  DT
                </div>
                <div>
                  <p className="font-semibold">David Thompson</p>
                  <p className="text-sm text-muted-foreground">Content Creator</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <h2 className="section-title">Why Choose Pixelsqueeze</h2>
          <p className="section-subtitle">Professional-grade tools for all your image optimization needs</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-profit rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-profit-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
              <p className="text-muted-foreground">
                Track your compression performance with detailed analytics and optimization insights.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Process images in seconds with our optimized compression algorithms and cloud infrastructure.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Quality Guaranteed</h3>
              <p className="text-muted-foreground">
                Maintain visual quality while achieving maximum compression with smart quality preservation.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Analytics Section */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto">
          <h2 className="section-title">Compression Performance</h2>
          <p className="section-subtitle">
            Track your compression efficiency and storage savings over time with detailed analytics
          </p>
          
          <CompressionResults data={compressionData} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="section-title">Ready to Optimize Your Images?</h2>
          <p className="section-subtitle !mb-8">
            Start compressing your images today and experience the perfect balance of quality and file size reduction
          </p>
          
          <Button size="lg" className="bg-gradient-profit text-profit-foreground shadow-profit hover:opacity-90 px-8 py-4 text-lg" onClick={subscription.subscribed ? handleFileUpload : createCheckout}>
            {subscription.subscribed ? (
              <>
                <Upload className="w-6 h-6 mr-2" />
                Upload Your Images
              </>
            ) : (
              <>
                <Crown className="w-6 h-6 mr-2" />
                Get Pro Access
              </>
            )}
          </Button>
          
          <p className="text-sm text-muted-foreground mt-4">
            * Supports JPEG, PNG, WebP, and AVIF formats. Maximum file size: 50MB per image.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Index;