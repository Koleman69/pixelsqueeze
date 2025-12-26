import React, { useState } from 'react';
import { 
  Sparkles, Wand2, Loader2, Instagram, Twitter, Facebook, Linkedin, 
  Youtube, Globe, Mail, Printer, ShoppingBag, Check, ChevronRight,
  Palette, Zap, Eye, ArrowRight, Star, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompressionSettings } from '@/hooks/useImageCompression';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformRecommendation {
  platform: string;
  score: number;
  reason: string;
  recommendedSettings: CompressionSettings;
  aspectRatio?: string;
}

interface StyleEnhancement {
  name: string;
  description: string;
  intensity: 'subtle' | 'moderate' | 'strong';
  cssFilter?: string;
}

interface AnalysisResult {
  imageType: string;
  dominantColors: string[];
  composition: string;
  platforms: PlatformRecommendation[];
  styleEnhancements: StyleEnhancement[];
  aestheticScore: number;
  suggestions: string[];
}

interface SmartImageAnalysisProps {
  imageFile: File | null;
  imagePreview: string | null;
  onApplySettings: (settings: CompressionSettings, presetKey: string) => void;
  onApplyFilter: (filter: string) => void;
  isSubscribed: boolean;
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Instagram Feed': Instagram,
  'Instagram Stories': Instagram,
  'Instagram Reels': Instagram,
  'Twitter/X': Twitter,
  'Facebook': Facebook,
  'LinkedIn': Linkedin,
  'Pinterest': Globe,
  'TikTok': Globe,
  'YouTube Thumbnail': Youtube,
  'Website Hero': Globe,
  'Email Newsletter': Mail,
  'Print': Printer,
  'E-commerce': ShoppingBag,
  'Web': Globe,
};

export const SmartImageAnalysis = ({
  imageFile,
  imagePreview,
  onApplySettings,
  onApplyFilter,
  isSubscribed
}: SmartImageAnalysisProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('platforms');
  const { toast } = useToast();

  const analyzeImage = async () => {
    if (!imageFile || !imagePreview) return;

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await supabase.functions.invoke('analyze-image', {
        body: {
          imageBase64: imagePreview,
          fileName: imageFile.name
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (response.data?.analysis) {
        setAnalysis(response.data.analysis);
        toast({
          title: "Analysis Complete",
          description: `Detected: ${response.data.analysis.imageType} image with ${response.data.analysis.aestheticScore}% aesthetic score`,
        });
      }
    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Could not analyze image",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyPlatform = (platform: PlatformRecommendation) => {
    setSelectedPlatform(platform.platform);
    onApplySettings(platform.recommendedSettings, platform.platform.toLowerCase().replace(/\s+/g, '-'));
    toast({
      title: "Settings Applied",
      description: `Optimized for ${platform.platform}`,
    });
  };

  const handleApplyFilter = (style: StyleEnhancement) => {
    if (style.cssFilter) {
      setSelectedFilter(style.name);
      onApplyFilter(style.cssFilter);
      toast({
        title: "Style Applied",
        description: `${style.name} filter applied`,
      });
    }
  };

  if (!imageFile || !imagePreview) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Wand2 className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              AI Smart Analysis
              <Badge variant="secondary" className="bg-gradient-primary text-primary-foreground text-[10px]">
                NEW
              </Badge>
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload an image to get AI-powered platform recommendations and style suggestions
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="font-medium">Analyzing your image with AI...</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Detecting content type</span>
              <Check className="w-4 h-4 text-primary" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Analyzing composition</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground/50">
              <span>Finding best platforms</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground/50">
              <span>Generating style suggestions</span>
            </div>
          </div>
          <Progress value={45} className="h-1" />
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="w-16 h-16 rounded-lg object-cover border-2 border-primary/20"
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Ready for AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Get platform-specific optimizations and style suggestions
              </p>
            </div>
          </div>
          <Button onClick={analyzeImage} className="bg-gradient-primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Analyze Image
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                AI Analysis Complete
                <Badge className="bg-primary/20 text-primary text-[10px]">
                  {analysis.imageType}
                </Badge>
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  {analysis.aestheticScore}% aesthetic score
                </span>
                <span>•</span>
                <span>{analysis.platforms.length} platforms matched</span>
              </div>
            </div>
          </div>
          
          {/* Color Palette */}
          <div className="flex items-center gap-1">
            {analysis.dominantColors.map((color, i) => (
              <div 
                key={i}
                className="w-6 h-6 rounded-full border-2 border-background shadow-sm"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="p-4">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="platforms" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Platforms
          </TabsTrigger>
          <TabsTrigger value="styles" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Styles
          </TabsTrigger>
          <TabsTrigger value="tips" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Tips
          </TabsTrigger>
        </TabsList>

        <TabsContent value="platforms" className="space-y-3 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.platforms
              .sort((a, b) => b.score - a.score)
              .slice(0, 6)
              .map((platform) => {
                const Icon = platformIcons[platform.platform] || Globe;
                const isSelected = selectedPlatform === platform.platform;
                
                return (
                  <button
                    key={platform.platform}
                    onClick={() => handleApplyPlatform(platform)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all hover:shadow-md",
                      isSelected 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={cn(
                          "w-5 h-5",
                          isSelected ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className="font-medium">{platform.platform}</span>
                      </div>
                      <Badge 
                        variant={platform.score >= 80 ? "default" : "secondary"}
                        className={platform.score >= 80 ? "bg-green-500" : ""}
                      >
                        {platform.score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {platform.reason}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-[10px]">
                        {platform.recommendedSettings.maxWidth}×{platform.recommendedSettings.maxHeight}
                      </Badge>
                      {platform.aspectRatio && (
                        <Badge variant="outline" className="text-[10px]">
                          {platform.aspectRatio}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        Q{platform.recommendedSettings.quality}%
                      </Badge>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                        <Check className="w-3 h-3" />
                        Settings applied
                      </div>
                    )}
                  </button>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="styles" className="space-y-3 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.styleEnhancements.map((style) => {
              const isSelected = selectedFilter === style.name;
              
              return (
                <button
                  key={style.name}
                  onClick={() => handleApplyFilter(style)}
                  className={cn(
                    "group p-4 rounded-lg border-2 text-left transition-all overflow-hidden",
                    isSelected 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Palette className={cn(
                        "w-4 h-4",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                      <span className="font-medium">{style.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {style.intensity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {style.description}
                  </p>
                  
                  {/* Preview */}
                  <div className="relative h-16 rounded overflow-hidden border">
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-all"
                      style={{ 
                        backgroundImage: `url(${imagePreview})`,
                        filter: style.cssFilter || 'none'
                      }}
                    />
                    <div className="absolute bottom-1 right-1">
                      <Badge className="bg-background/80 text-foreground text-[10px]">
                        <Eye className="w-2 h-2 mr-1" />
                        Preview
                      </Badge>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                      <Check className="w-3 h-3" />
                      Filter applied
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setSelectedFilter(null);
              onApplyFilter('none');
            }}
            className="w-full"
          >
            Reset to Original
          </Button>
        </TabsContent>

        <TabsContent value="tips" className="space-y-3 mt-0">
          <div className="space-y-2">
            {analysis.suggestions.map((suggestion, i) => (
              <div 
                key={i}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
              >
                <div className="p-1.5 rounded-full bg-primary/10 mt-0.5">
                  <Zap className="w-3 h-3 text-primary" />
                </div>
                <p className="text-sm flex-1">{suggestion}</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <p className="text-sm font-medium mb-1">Pro Tip</p>
            <p className="text-xs text-muted-foreground">
              {analysis.composition}
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="p-4 bg-muted/30 border-t flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => {
            setAnalysis(null);
            setSelectedPlatform(null);
            setSelectedFilter(null);
          }}
        >
          Reset Analysis
        </Button>
        <Button 
          variant="outline"
          size="sm"
          onClick={analyzeImage}
        >
          Re-analyze
          <ArrowRight className="w-3 h-3 ml-2" />
        </Button>
      </div>
    </Card>
  );
};
