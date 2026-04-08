import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook, 
  Image as ImageIcon,
  Video,
  Download,
  Check,
  Loader2,
  ChevronRight,
  Smartphone,
  Monitor,
  Square,
  RectangleHorizontal,
  RectangleVertical,
  Upload,
  Sparkles,
  Copy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PlatformFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  description: string;
  icon: 'square' | 'portrait' | 'landscape';
  recommended?: boolean;
}

interface Platform {
  id: string;
  name: string;
  icon: typeof Instagram;
  color: string;
  formats: PlatformFormat[];
}

const platforms: Platform[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'from-purple-600 to-pink-500',
    formats: [
      { id: 'ig-post', name: 'Feed Post', width: 1080, height: 1080, aspectRatio: '1:1', description: 'Square posts', icon: 'square', recommended: true },
      { id: 'ig-portrait', name: 'Portrait Post', width: 1080, height: 1350, aspectRatio: '4:5', description: 'Vertical feed', icon: 'portrait' },
      { id: 'ig-story', name: 'Story/Reel', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Full screen vertical', icon: 'portrait', recommended: true },
      { id: 'ig-landscape', name: 'Landscape', width: 1080, height: 566, aspectRatio: '1.91:1', description: 'Wide posts', icon: 'landscape' },
    ]
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'from-red-600 to-red-500',
    formats: [
      { id: 'yt-thumbnail', name: 'Thumbnail', width: 1280, height: 720, aspectRatio: '16:9', description: 'Video thumbnails', icon: 'landscape', recommended: true },
      { id: 'yt-banner', name: 'Channel Banner', width: 2560, height: 1440, aspectRatio: '16:9', description: 'Channel art', icon: 'landscape' },
      { id: 'yt-shorts', name: 'Shorts Cover', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Short videos', icon: 'portrait' },
      { id: 'yt-profile', name: 'Profile Picture', width: 800, height: 800, aspectRatio: '1:1', description: 'Channel avatar', icon: 'square' },
    ]
  },
  {
    id: 'twitter',
    name: 'X / Twitter',
    icon: Twitter,
    color: 'from-gray-900 to-gray-700',
    formats: [
      { id: 'tw-post', name: 'In-feed Image', width: 1200, height: 675, aspectRatio: '16:9', description: 'Timeline posts', icon: 'landscape', recommended: true },
      { id: 'tw-header', name: 'Header Photo', width: 1500, height: 500, aspectRatio: '3:1', description: 'Profile banner', icon: 'landscape' },
      { id: 'tw-profile', name: 'Profile Picture', width: 400, height: 400, aspectRatio: '1:1', description: 'Avatar', icon: 'square' },
      { id: 'tw-card', name: 'Card Image', width: 1200, height: 628, aspectRatio: '1.91:1', description: 'Link previews', icon: 'landscape' },
    ]
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'from-blue-600 to-blue-500',
    formats: [
      { id: 'fb-post', name: 'Feed Post', width: 1200, height: 630, aspectRatio: '1.91:1', description: 'Timeline images', icon: 'landscape', recommended: true },
      { id: 'fb-story', name: 'Story', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Full screen', icon: 'portrait' },
      { id: 'fb-cover', name: 'Cover Photo', width: 820, height: 312, aspectRatio: '2.63:1', description: 'Page banner', icon: 'landscape' },
      { id: 'fb-event', name: 'Event Cover', width: 1920, height: 1005, aspectRatio: '1.91:1', description: 'Event headers', icon: 'landscape' },
    ]
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: 'from-black to-gray-800',
    formats: [
      { id: 'tt-video', name: 'Video/Photo', width: 1080, height: 1920, aspectRatio: '9:16', description: 'Full screen vertical', icon: 'portrait', recommended: true },
      { id: 'tt-profile', name: 'Profile Picture', width: 200, height: 200, aspectRatio: '1:1', description: 'Avatar', icon: 'square' },
    ]
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: RectangleHorizontal,
    color: 'from-blue-700 to-blue-600',
    formats: [
      { id: 'li-post', name: 'Post Image', width: 1200, height: 627, aspectRatio: '1.91:1', description: 'Feed posts', icon: 'landscape', recommended: true },
      { id: 'li-banner', name: 'Banner', width: 1584, height: 396, aspectRatio: '4:1', description: 'Profile background', icon: 'landscape' },
      { id: 'li-profile', name: 'Profile Photo', width: 400, height: 400, aspectRatio: '1:1', description: 'Avatar', icon: 'square' },
      { id: 'li-company', name: 'Company Logo', width: 300, height: 300, aspectRatio: '1:1', description: 'Business page', icon: 'square' },
    ]
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: ImageIcon,
    color: 'from-red-700 to-red-600',
    formats: [
      { id: 'pin-standard', name: 'Standard Pin', width: 1000, height: 1500, aspectRatio: '2:3', description: 'Optimal pins', icon: 'portrait', recommended: true },
      { id: 'pin-square', name: 'Square Pin', width: 1000, height: 1000, aspectRatio: '1:1', description: 'Square format', icon: 'square' },
      { id: 'pin-long', name: 'Long Pin', width: 1000, height: 2100, aspectRatio: '1:2.1', description: 'Infographics', icon: 'portrait' },
    ]
  }
];

interface SocialMediaExporterProps {
  onExport?: (format: PlatformFormat, blob: Blob) => void;
}

export const SocialMediaExporter = ({ onExport }: SocialMediaExporterProps) => {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('instagram');
  const [selectedFormat, setSelectedFormat] = useState<string>('ig-post');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentPlatform = platforms.find(p => p.id === selectedPlatform)!;
  const currentFormat = currentPlatform.formats.find(f => f.id === selectedFormat) 
    || currentPlatform.formats[0];

  // Reset format when platform changes
  useEffect(() => {
    const platform = platforms.find(p => p.id === selectedPlatform);
    if (platform) {
      const defaultFormat = platform.formats.find(f => f.recommended) || platform.formats[0];
      setSelectedFormat(defaultFormat.id);
    }
  }, [selectedPlatform]);

  // Process image when format or image changes
  useEffect(() => {
    if (uploadedImage && currentFormat) {
      processImage();
    }
  }, [uploadedImage, selectedFormat]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async () => {
    if (!uploadedImage || !canvasRef.current) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to target dimensions
      canvas.width = currentFormat.width;
      canvas.height = currentFormat.height;
      
      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = uploadedImage;
      });
      
      // Calculate crop to fit target aspect ratio (cover mode)
      const targetAspect = currentFormat.width / currentFormat.height;
      const imgAspect = img.width / img.height;
      
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      
      if (imgAspect > targetAspect) {
        // Image is wider - crop sides
        sw = img.height * targetAspect;
        sx = (img.width - sw) / 2;
      } else {
        // Image is taller - crop top/bottom
        sh = img.width / targetAspect;
        sy = (img.height - sh) / 2;
      }
      
      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      
      // Get processed image
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setProcessedImage(dataUrl);
      
    } catch (error) {
      console.error('Image processing error:', error);
      toast({
        title: "Processing Failed",
        description: "Could not process the image",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.href = processedImage;
    link.download = `${currentPlatform.name.toLowerCase()}-${currentFormat.name.toLowerCase().replace(/\s+/g, '-')}.jpg`;
    link.click();
    
    toast({
      title: "Downloaded!",
      description: `Optimized for ${currentPlatform.name} ${currentFormat.name}`,
    });
  };

  const copyDimensions = () => {
    navigator.clipboard.writeText(`${currentFormat.width} x ${currentFormat.height}`);
    toast({
      title: "Copied!",
      description: `${currentFormat.width} x ${currentFormat.height}`,
    });
  };

  const FormatIcon = ({ type }: { type: 'square' | 'portrait' | 'landscape' }) => {
    switch (type) {
      case 'square': return <Square className="w-4 h-4" />;
      case 'portrait': return <RectangleVertical className="w-4 h-4" />;
      case 'landscape': return <RectangleHorizontal className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold">Social Media Exporter</h3>
          <p className="text-sm text-muted-foreground">
            Auto-resize images for every platform
          </p>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Select Platform</label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isActive = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                  isActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className={cn("p-1 rounded", `bg-gradient-to-r ${platform.color}`)}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{platform.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Format Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Select Format</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {currentPlatform.formats.map((format) => {
            const isActive = selectedFormat === format.id;
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={cn(
                  "relative p-3 rounded-lg border-2 text-left transition-all",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {format.recommended && (
                  <Badge className="absolute -top-2 -right-2 text-[10px] px-1.5 bg-green-500 text-white">
                    Best
                  </Badge>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <FormatIcon type={format.icon} />
                  <span className={cn("font-medium text-sm", isActive && "text-primary")}>
                    {format.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{format.description}</p>
                <p className="text-xs font-mono text-muted-foreground mt-1">
                  {format.width} × {format.height}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview & Upload Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload / Original */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Upload Image</label>
          {!uploadedImage ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium">Drop an image or click to upload</p>
              <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP up to 50MB</p>
            </div>
          ) : (
            <div className="relative group">
              <img 
                src={uploadedImage} 
                alt="Original" 
                className="w-full rounded-lg object-contain max-h-64"
              />
              <Button
                size="sm"
                variant="secondary"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => fileInputRef.current?.click()}
              >
                Change
              </Button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          aria-label="Upload image files" />
        </div>

        {/* Processed Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Preview</label>
            <button 
              onClick={copyDimensions}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              {currentFormat.width} × {currentFormat.height}
            </button>
          </div>
          <div 
            className="relative bg-muted rounded-lg overflow-hidden flex items-center justify-center"
            style={{ 
              aspectRatio: `${currentFormat.width} / ${currentFormat.height}`,
              maxHeight: '300px'
            }}
          >
            {isProcessing ? (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : processedImage ? (
              <img 
                src={processedImage} 
                alt="Processed" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6">
                <ImageIcon className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Upload an image to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Download Button */}
      {processedImage && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            size="lg" 
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download for {currentPlatform.name}
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              // Download all formats for this platform
              currentPlatform.formats.forEach((format, i) => {
                setTimeout(() => {
                  setSelectedFormat(format.id);
                  setTimeout(handleDownload, 500);
                }, i * 1000);
              });
            }}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Export All Sizes
          </Button>
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-muted/50 rounded-lg p-4">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Tip:</strong> {currentPlatform.id === 'instagram' && 'Instagram recommends 1080x1080 for best quality. Portrait (4:5) gets more visibility in feeds.'}
          {currentPlatform.id === 'youtube' && 'Use high-contrast, clear text on thumbnails. Faces and emotions perform best.'}
          {currentPlatform.id === 'twitter' && 'Images get 150% more retweets. Use 16:9 ratio for best display.'}
          {currentPlatform.id === 'facebook' && 'Posts with images get 2.3x more engagement. Use bright, eye-catching visuals.'}
          {currentPlatform.id === 'tiktok' && '9:16 vertical videos get 25% more reach. Fill the entire screen.'}
          {currentPlatform.id === 'linkedin' && 'Professional images with faces get 38% higher engagement.'}
          {currentPlatform.id === 'pinterest' && '2:3 vertical pins get the most saves. Use text overlays for context.'}
        </p>
      </div>
    </Card>
  );
};
