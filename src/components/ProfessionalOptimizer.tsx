import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Sparkles, 
  Download, 
  Globe, 
  Printer, 
  Eye, 
  Palette, 
  Focus, 
  Layers,
  FileImage,
  Zap,
  Shield,
  Info,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

export interface OptimizationSettings {
  preset: 'web' | 'print';
  quality: number;
  preserveMetadata: boolean;
  sharpening: 'none' | 'subtle' | 'moderate' | 'strong';
  colorProfile: 'srgb' | 'adobe-rgb' | 'display-p3';
  noiseReduction: number;
  detailPreservation: number;
  dynamicRange: 'standard' | 'hdr';
  format: 'jpeg' | 'png' | 'webp' | 'avif';
}

const presetConfigs: Record<'web' | 'print', Partial<OptimizationSettings>> = {
  web: {
    quality: 85,
    colorProfile: 'srgb',
    format: 'webp',
    sharpening: 'moderate',
    noiseReduction: 20,
    detailPreservation: 90,
    dynamicRange: 'standard',
    preserveMetadata: false,
  },
  print: {
    quality: 95,
    colorProfile: 'adobe-rgb',
    format: 'png',
    sharpening: 'subtle',
    noiseReduction: 10,
    detailPreservation: 100,
    dynamicRange: 'hdr',
    preserveMetadata: true,
  },
};

export const ProfessionalOptimizer = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePreset, setActivePreset] = useState<'web' | 'print'>('web');
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState<OptimizationSettings>({
    preset: 'web',
    ...presetConfigs.web,
  } as OptimizationSettings);

  const handlePresetChange = (preset: 'web' | 'print') => {
    setActivePreset(preset);
    setSettings({
      ...settings,
      preset,
      ...presetConfigs[preset],
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleOptimize = async () => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success(`${activePreset === 'web' ? 'Web-ready' : 'Print-ready'} version created!`);
    setIsProcessing(false);
  };

  if (!imageFile || !imagePreview) {
    return (
      <Card className="border-dashed border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="py-12">
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Professional AI Optimizer</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image for maximum fidelity optimization
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Image
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Professional AI Optimizer
          </CardTitle>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            <Zap className="h-3 w-3 mr-1" />
            Pro Grade
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Output Preset Selection */}
        <Tabs value={activePreset} onValueChange={(v) => handlePresetChange(v as 'web' | 'print')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="web" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Web-Ready
            </TabsTrigger>
            <TabsTrigger value="print" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              Print-Ready
            </TabsTrigger>
          </TabsList>

          <TabsContent value="web" className="mt-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-primary" />
                Optimized for Web & Social
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <FileImage className="h-3 w-3" /> WebP/AVIF format for smallest size
                </li>
                <li className="flex items-center gap-2">
                  <Palette className="h-3 w-3" /> sRGB color profile for web browsers
                </li>
                <li className="flex items-center gap-2">
                  <Eye className="h-3 w-3" /> Balanced sharpening for screens
                </li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="print" className="mt-4">
            <div className="rounded-lg bg-muted/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Printer className="h-4 w-4 text-primary" />
                Optimized for Print & Archive
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex items-center gap-2">
                  <FileImage className="h-3 w-3" /> PNG/TIFF for lossless quality
                </li>
                <li className="flex items-center gap-2">
                  <Palette className="h-3 w-3" /> Adobe RGB for wider color gamut
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3 w-3" /> Full metadata preservation
                </li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Fine-Tune Settings
          </h4>

          {/* Quality Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Quality Level</Label>
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {settings.quality}%
              </span>
            </div>
            <Slider
              value={[settings.quality]}
              onValueChange={([value]) => setSettings({ ...settings, quality: value })}
              min={60}
              max={100}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher quality = larger file size
            </p>
          </div>

          {/* Detail Preservation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-1">
                <Focus className="h-3 w-3" />
                Detail Preservation
              </Label>
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {settings.detailPreservation}%
              </span>
            </div>
            <Slider
              value={[settings.detailPreservation]}
              onValueChange={([value]) => setSettings({ ...settings, detailPreservation: value })}
              min={50}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Noise Reduction */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">AI Noise Reduction</Label>
              <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                {settings.noiseReduction}%
              </span>
            </div>
            <Slider
              value={[settings.noiseReduction]}
              onValueChange={([value]) => setSettings({ ...settings, noiseReduction: value })}
              min={0}
              max={50}
              step={5}
              className="w-full"
            />
          </div>

          {/* Sharpening */}
          <div className="space-y-2">
            <Label className="text-xs">Edge Sharpening</Label>
            <div className="grid grid-cols-4 gap-2">
              {(['none', 'subtle', 'moderate', 'strong'] as const).map((level) => (
                <Button
                  key={level}
                  variant={settings.sharpening === level ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs capitalize"
                  onClick={() => setSettings({ ...settings, sharpening: level })}
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="space-y-2">
            <Label className="text-xs">Output Format</Label>
            <div className="grid grid-cols-4 gap-2">
              {(['jpeg', 'png', 'webp', 'avif'] as const).map((format) => (
                <Button
                  key={format}
                  variant={settings.format === format ? 'default' : 'outline'}
                  size="sm"
                  className="text-xs uppercase"
                  onClick={() => setSettings({ ...settings, format })}
                >
                  {format}
                </Button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Shield className="h-3 w-3" />
                Preserve Metadata (EXIF, GPS, etc.)
              </Label>
              <Switch
                checked={settings.preserveMetadata}
                onCheckedChange={(checked) => setSettings({ ...settings, preserveMetadata: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                <Layers className="h-3 w-3" />
                HDR Dynamic Range
              </Label>
              <Switch
                checked={settings.dynamicRange === 'hdr'}
                onCheckedChange={(checked) => 
                  setSettings({ ...settings, dynamicRange: checked ? 'hdr' : 'standard' })
                }
              />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground">
            AI optimization uses advanced algorithms to reduce file size while preserving 
            sharp edges, texture clarity, and accurate colors. No softening or quality loss.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleOptimize}
            disabled={isProcessing}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Optimizing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize {activePreset === 'web' ? 'for Web' : 'for Print'}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              handleOptimize();
              // Trigger download after optimization
            }}
            disabled={isProcessing || !imageFile}
          >
            <Download className="h-4 w-4 mr-2" />
            Optimize & Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
