import { CompressionStatus } from "@/components/CompressionStatus";
import { StatsCard } from "@/components/StatsCard";
import { CompressionResults } from "@/components/CompressionResults";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Upload, Shield, TrendingDown, Zap, BarChart3, Target, LogOut, Image, FileImage, Minimize2, HardDrive } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";
import heroImage from "@/assets/compression-hero.jpg";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileNames = Array.from(files).map(file => file.name).join(', ');
      toast({
        title: "Files selected",
        description: `Selected ${files.length} file(s): ${fileNames}. Compression feature coming soon!`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <Minimize2 className="w-6 h-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">Pixel Squeeze</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
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
          <Badge variant="outline" className="mb-6 px-4 py-2 border-primary text-primary">
            <Zap className="w-4 h-4 mr-2" />
            Up to 80% File Size Reduction
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
            Compress Images Without Quality Loss
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            AI-powered image compression that reduces file sizes by up to 80% while maintaining stunning visual quality.
            Perfect for web optimization, storage savings, and faster loading times.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 px-8 py-3" onClick={handleFileUpload}>
              <Upload className="w-5 h-5 mr-2" />
              Start Compressing
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-3">
              View Analytics
            </Button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Your Compression Stats</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
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
      <section className="py-16 px-6 bg-secondary/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recent Compressions</h2>
              <p className="text-muted-foreground">Your latest image optimization results</p>
            </div>
            <Badge variant="outline" className="border-profit text-profit px-4 py-2">
              <Target className="w-4 h-4 mr-2" />
              3 Processing
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {mockCompressions.map((compression, index) => (
              <CompressionStatus key={index} {...compression} />
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Pixel Squeeze</h2>
          
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
      <section className="py-16 px-6 bg-secondary/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Compression Performance</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Track your compression efficiency and storage savings over time with detailed analytics.
            </p>
          </div>
          
          <CompressionResults data={compressionData} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Optimize Your Images?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start compressing your images today and experience the perfect balance of quality and file size reduction.
          </p>
          
          <Button size="lg" className="bg-gradient-profit text-profit-foreground shadow-profit hover:opacity-90 px-8 py-4 text-lg" onClick={handleFileUpload}>
            <Upload className="w-6 h-6 mr-2" />
            Upload Your Images
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