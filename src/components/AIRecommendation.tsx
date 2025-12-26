import React, { useState } from 'react';
import { Sparkles, Zap, Check, Loader2, AlertCircle, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompressionSettings } from '@/hooks/useImageCompression';
import { cn } from '@/lib/utils';

interface AIRecommendationProps {
  selectedFiles: FileList | null;
  currentSettings: CompressionSettings;
  onApplyRecommendation: (settings: CompressionSettings, presetKey: string) => void;
  isSubscribed: boolean;
}

interface Recommendation {
  preset: string;
  label: string;
  settings: CompressionSettings;
  reason: string;
  estimatedSizeReduction: string;
}

export const AIRecommendation = ({
  selectedFiles,
  currentSettings,
  onApplyRecommendation,
  isSubscribed
}: AIRecommendationProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const analyzeImage = async () => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    setIsAnalyzing(true);
    setRecommendation(null);

    // Simulate AI analysis based on file properties
    await new Promise(resolve => setTimeout(resolve, 1500));

    const file = selectedFiles[0];
    const fileSize = file.size;
    const fileName = file.name.toLowerCase();

    // Smart heuristics based on file characteristics
    let preset: Recommendation;

    if (fileSize > 5 * 1024 * 1024) {
      // Large file (>5MB) - needs aggressive compression
      preset = {
        preset: 'web',
        label: 'Web Optimized',
        settings: { quality: 75, maxWidth: 1920, maxHeight: 1080, dpi: 72 },
        reason: `Large file detected (${(fileSize / 1024 / 1024).toFixed(1)}MB). Recommended aggressive compression for web use.`,
        estimatedSizeReduction: '60-80%'
      };
    } else if (fileName.includes('print') || fileName.includes('poster') || fileName.includes('flyer')) {
      // Print-related filename
      preset = {
        preset: 'print',
        label: 'Print Quality',
        settings: { quality: 95, maxWidth: 3000, maxHeight: 3000, dpi: 300 },
        reason: 'Filename suggests print use. Preserving high quality and resolution.',
        estimatedSizeReduction: '20-40%'
      };
    } else if (fileName.includes('instagram') || fileName.includes('ig') || fileName.includes('story')) {
      // Social media filename
      preset = {
        preset: 'instagram',
        label: 'Instagram Ready',
        settings: { quality: 85, maxWidth: 1080, maxHeight: 1080, dpi: 72 },
        reason: 'Optimized for Instagram with 1:1 aspect ratio and ideal file size.',
        estimatedSizeReduction: '40-60%'
      };
    } else if (fileName.includes('thumb') || fileName.includes('preview') || fileName.includes('icon')) {
      // Thumbnail
      preset = {
        preset: 'thumbnail',
        label: 'Thumbnail',
        settings: { quality: 75, maxWidth: 400, maxHeight: 400, dpi: 72 },
        reason: 'Small preview or thumbnail detected. Using compact dimensions.',
        estimatedSizeReduction: '80-90%'
      };
    } else if (fileSize < 500 * 1024) {
      // Small file - minimal compression needed
      preset = {
        preset: 'social',
        label: 'Social Media',
        settings: { quality: 85, maxWidth: 1200, maxHeight: 1200, dpi: 72 },
        reason: 'File already compact. Light optimization for social sharing.',
        estimatedSizeReduction: '10-30%'
      };
    } else {
      // Default balanced recommendation
      preset = {
        preset: 'web',
        label: 'Web Balanced',
        settings: { quality: 80, maxWidth: 1920, maxHeight: 1080, dpi: 72 },
        reason: 'Balanced settings for general web use with good quality retention.',
        estimatedSizeReduction: '40-60%'
      };
    }

    setRecommendation(preset);
    setHasAnalyzed(true);
    setIsAnalyzing(false);
  };

  if (!selectedFiles || selectedFiles.length === 0) {
    return (
      <Card className="p-4 bg-muted/30 border-dashed">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Wand2 className="w-5 h-5" />
          <div>
            <p className="text-sm font-medium">AI Smart Recommendations</p>
            <p className="text-xs">Upload an image to get AI-powered compression suggestions</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "p-4 transition-all",
      recommendation ? "bg-primary/5 border-primary/30" : "bg-muted/30"
    )}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className={cn(
              "w-5 h-5",
              recommendation ? "text-primary" : "text-muted-foreground"
            )} />
            <span className="text-sm font-medium">AI Smart Recommendation</span>
            {!isSubscribed && (
              <Badge variant="outline" className="text-[10px]">Free</Badge>
            )}
          </div>
          
          {!hasAnalyzed && (
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeImage}
              disabled={isAnalyzing}
              className="h-8"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3 mr-2" />
                  Analyze Image
                </>
              )}
            </Button>
          )}
        </div>

        {isAnalyzing && (
          <div className="flex items-center gap-3 py-2">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div className="bg-primary h-full w-1/2 animate-pulse rounded-full" />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">Analyzing...</span>
          </div>
        )}

        {recommendation && (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Check className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{recommendation.label}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    -{recommendation.estimatedSizeReduction} size
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {recommendation.reason}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                Quality: {recommendation.settings.quality}%
              </Badge>
              <Badge variant="outline">
                {recommendation.settings.maxWidth}×{recommendation.settings.maxHeight}
              </Badge>
              <Badge variant="outline">
                {recommendation.settings.dpi} DPI
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onApplyRecommendation(recommendation.settings, recommendation.preset)}
                className="flex-1 bg-gradient-primary"
              >
                <Check className="w-3 h-3 mr-2" />
                Apply Recommendation
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setRecommendation(null);
                  setHasAnalyzed(false);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {hasAnalyzed && !recommendation && !isAnalyzing && (
          <div className="flex items-center gap-2 text-muted-foreground py-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs">Current settings are optimal for your image</span>
          </div>
        )}
      </div>
    </Card>
  );
};
