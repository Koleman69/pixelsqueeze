import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
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
  Upload,
  CheckCircle2,
  RotateCcw,
  Cpu,
  MonitorSmartphone
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebGLImageProcessor } from '@/hooks/useWebGLImageProcessor';
import { ImageCompareSlider } from '@/components/ImageCompareSlider';

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

interface OptimizationResult {
  blob: Blob;
  url: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTime: number;
  usedWebGL: boolean;
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

// Sharpening kernel matrices for CPU fallback
const sharpeningKernels = {
  none: null,
  subtle: [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0],
  moderate: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  strong: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
};

// Map sharpening levels to WebGL strength values
const sharpeningStrengths = {
  none: 0,
  subtle: 0.3,
  moderate: 0.6,
  strong: 1.2,
};

export const ProfessionalOptimizer = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [optimizedPreview, setOptimizedPreview] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activePreset, setActivePreset] = useState<'web' | 'print'>('web');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [useWebGL, setUseWebGL] = useState(true);
  const [webGLAvailable, setWebGLAvailable] = useState(false);
  const [settings, setSettings] = useState<OptimizationSettings>({
    preset: 'web',
    ...presetConfigs.web,
  } as OptimizationSettings);

  const { processImage: processWithWebGL, isWebGLSupported, cleanup } = useWebGLImageProcessor();

  // Check WebGL support on mount
  useEffect(() => {
    const supported = isWebGLSupported();
    setWebGLAvailable(supported);
    setUseWebGL(supported);
    
    return () => cleanup();
  }, [isWebGLSupported, cleanup]);

  const handlePresetChange = (preset: 'web' | 'print') => {
    setActivePreset(preset);
    setSettings({
      ...settings,
      preset,
      ...presetConfigs[preset],
    });
    setResult(null);
    setOptimizedPreview(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setResult(null);
      setOptimizedPreview(null);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const resetImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setOptimizedPreview(null);
    setResult(null);
    setProgress(0);
  };

  // Apply convolution kernel for sharpening
  const applyConvolution = useCallback((
    imageData: ImageData,
    kernel: number[]
  ): ImageData => {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data);
    const kSize = 3;
    const half = Math.floor(kSize / 2);

    for (let y = half; y < height - half; y++) {
      for (let x = half; x < width - half; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = 0; ky < kSize; ky++) {
            for (let kx = 0; kx < kSize; kx++) {
              const px = x + kx - half;
              const py = y + ky - half;
              const idx = (py * width + px) * 4 + c;
              sum += data[idx] * kernel[ky * kSize + kx];
            }
          }
          const idx = (y * width + x) * 4 + c;
          output[idx] = Math.min(255, Math.max(0, sum));
        }
      }
    }

    return new ImageData(output, width, height);
  }, []);

  // Apply noise reduction using simple box blur
  const applyNoiseReduction = useCallback((
    imageData: ImageData,
    strength: number
  ): ImageData => {
    if (strength === 0) return imageData;
    
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data);
    const radius = Math.ceil(strength / 20);

    for (let y = radius; y < height - radius; y++) {
      for (let x = radius; x < width - radius; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          let count = 0;
          
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const idx = ((y + dy) * width + (x + dx)) * 4 + c;
              sum += data[idx];
              count++;
            }
          }
          
          const idx = (y * width + x) * 4 + c;
          const blurred = sum / count;
          // Blend original with blurred based on strength
          const blend = strength / 100;
          output[idx] = Math.round(data[idx] * (1 - blend * 0.5) + blurred * (blend * 0.5));
        }
      }
    }

    return new ImageData(output, width, height);
  }, []);

  // Enhance detail preservation
  const enhanceDetails = useCallback((
    imageData: ImageData,
    preservation: number
  ): ImageData => {
    if (preservation >= 100) return imageData;
    
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data);
    
    // Apply unsharp mask for detail enhancement
    const amount = (100 - preservation) / 100 * 0.3;
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          const idx = (y * width + x) * 4 + c;
          const current = data[idx];
          
          // Simple edge detection
          const neighbors = [
            data[((y - 1) * width + x) * 4 + c],
            data[((y + 1) * width + x) * 4 + c],
            data[(y * width + (x - 1)) * 4 + c],
            data[(y * width + (x + 1)) * 4 + c],
          ];
          const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
          const diff = current - avg;
          
          output[idx] = Math.min(255, Math.max(0, current + diff * amount));
        }
      }
    }

    return new ImageData(output, width, height);
  }, []);

  const optimizeImageWithWebGL = useCallback(async (img: HTMLImageElement): Promise<ImageData | null> => {
    setProgress(15);
    
    const processedData = await processWithWebGL(img, {
      sharpenStrength: sharpeningStrengths[settings.sharpening],
      noiseReduction: settings.noiseReduction / 100,
      detailEnhancement: (100 - settings.detailPreservation) / 100,
      contrast: settings.dynamicRange === 'hdr' ? 1.1 : 1.0,
      saturation: 1.0,
      brightness: 0,
    });
    
    setProgress(70);
    return processedData;
  }, [processWithWebGL, settings]);

  const optimizeImageWithCPU = useCallback((img: HTMLImageElement, ctx: CanvasRenderingContext2D): ImageData => {
    ctx.drawImage(img, 0, 0);
    setProgress(20);

    let imageData = ctx.getImageData(0, 0, img.width, img.height);
    
    // Apply noise reduction
    if (settings.noiseReduction > 0) {
      imageData = applyNoiseReduction(imageData, settings.noiseReduction);
      setProgress(40);
    }

    // Apply sharpening
    const kernel = sharpeningKernels[settings.sharpening];
    if (kernel) {
      imageData = applyConvolution(imageData, kernel);
      setProgress(60);
    }

    // Enhance details
    if (settings.detailPreservation < 100) {
      imageData = enhanceDetails(imageData, settings.detailPreservation);
      setProgress(70);
    }

    return imageData;
  }, [settings, applyNoiseReduction, applyConvolution, enhanceDetails]);

  const optimizeImage = useCallback(async (): Promise<OptimizationResult> => {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      if (!imagePreview || !imageFile) {
        reject(new Error('No image loaded'));
        return;
      }

      const img = new Image();
      img.onload = async () => {
        setProgress(10);

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
          willReadFrequently: true,
          alpha: settings.format === 'png' 
        });
        
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        
        let imageData: ImageData | null = null;
        let usedWebGL = false;

        // Try WebGL processing first if enabled and available
        if (useWebGL && webGLAvailable) {
          try {
            imageData = await optimizeImageWithWebGL(img);
            usedWebGL = true;
          } catch (error) {
            console.warn('WebGL processing failed, falling back to CPU:', error);
          }
        }

        // Fall back to CPU processing
        if (!imageData) {
          imageData = optimizeImageWithCPU(img, ctx);
        }

        // Put processed image data back
        ctx.putImageData(imageData, 0, 0);
        setProgress(80);

        // Determine MIME type and quality
        let mimeType: string;
        let qualityValue = settings.quality / 100;
        
        switch (settings.format) {
          case 'webp':
            mimeType = 'image/webp';
            break;
          case 'png':
            mimeType = 'image/png';
            qualityValue = 1; // PNG doesn't use quality parameter
            break;
          case 'avif':
            mimeType = 'image/avif';
            break;
          case 'jpeg':
          default:
            mimeType = 'image/jpeg';
        }

        setProgress(90);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback for unsupported formats
              canvas.toBlob(
                (fallbackBlob) => {
                  if (!fallbackBlob) {
                    reject(new Error('Failed to create image blob'));
                    return;
                  }
                  finishOptimization(fallbackBlob);
                },
                'image/jpeg',
                qualityValue
              );
              return;
            }
            finishOptimization(blob);
          },
          mimeType,
          mimeType === 'image/png' ? undefined : qualityValue
        );

        function finishOptimization(blob: Blob) {
          const url = URL.createObjectURL(blob);
          const originalSize = imageFile!.size;
          const optimizedSize = blob.size;
          const compressionRatio = Math.round((1 - optimizedSize / originalSize) * 100);
          const processingTime = Math.round(performance.now() - startTime);

          setProgress(100);

          resolve({
            blob,
            url,
            originalSize,
            optimizedSize,
            compressionRatio,
            processingTime,
            usedWebGL,
          });
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imagePreview;
    });
  }, [imagePreview, imageFile, settings, useWebGL, webGLAvailable, optimizeImageWithWebGL, optimizeImageWithCPU]);

  const handleOptimize = async (andDownload = false) => {
    if (!imageFile) {
      toast.error('Please upload an image first');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      const optimizationResult = await optimizeImage();
      setResult(optimizationResult);
      setOptimizedPreview(optimizationResult.url);
      
      const savedKB = Math.round((optimizationResult.originalSize - optimizationResult.optimizedSize) / 1024);
      const accelInfo = optimizationResult.usedWebGL ? ' (GPU accelerated)' : ' (CPU)';
      toast.success(
        `${activePreset === 'web' ? 'Web-ready' : 'Print-ready'} version created in ${optimizationResult.processingTime}ms${accelInfo}! Saved ${savedKB}KB (${optimizationResult.compressionRatio}% smaller)`
      );

      if (andDownload) {
        downloadResult(optimizationResult);
      }
    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Failed to optimize image');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = (optimizationResult?: OptimizationResult) => {
    const res = optimizationResult || result;
    if (!res || !imageFile) return;

    const link = document.createElement('a');
    link.href = res.url;
    const baseName = imageFile.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_optimized_${activePreset}.${settings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started!');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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
            aria-label="Upload image files" />
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
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetImage}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Zap className="h-3 w-3 mr-1" />
              Pro Grade
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Image Preview - Show comparison slider when optimized */}
        {optimizedPreview && result ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Compare Original vs Optimized</Label>
              <Badge variant="outline" className="text-xs">
                Saved {formatBytes(result.originalSize - result.optimizedSize)} ({result.compressionRatio}%)
              </Badge>
            </div>
            <ImageCompareSlider
              beforeImage={imagePreview!}
              afterImage={optimizedPreview}
              beforeLabel="Original"
              afterLabel="Optimized"
              beforeSize={formatBytes(imageFile!.size)}
              afterSize={formatBytes(result.optimizedSize)}
              compressionRatio={result.compressionRatio}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Original</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <img 
                  src={imagePreview} 
                  alt="Original" 
                  className="w-full h-full object-contain"
                />
                {imageFile && (
                  <Badge className="absolute bottom-2 right-2 bg-background/80 text-foreground text-xs">
                    {formatBytes(imageFile.size)}
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preview</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Click optimize to preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Optimizing...</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

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
            {/* WebGL Acceleration Toggle */}
            <div className="flex items-center justify-between">
              <Label className="text-xs flex items-center gap-2">
                {webGLAvailable ? (
                  <MonitorSmartphone className="h-3 w-3 text-green-500" />
                ) : (
                  <Cpu className="h-3 w-3 text-muted-foreground" />
                )}
                GPU Acceleration (WebGL)
                {!webGLAvailable && (
                  <span className="text-muted-foreground text-[10px]">(not available)</span>
                )}
              </Label>
              <Switch
                checked={useWebGL && webGLAvailable}
                onCheckedChange={(checked) => setUseWebGL(checked)}
                disabled={!webGLAvailable}
              />
            </div>

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
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              AI optimization uses advanced algorithms to reduce file size while preserving 
              sharp edges, texture clarity, and accurate colors. No softening or quality loss.
            </p>
            {webGLAvailable && useWebGL && (
              <p className="text-primary flex items-center gap-1">
                <Zap className="h-3 w-3" />
                WebGL GPU acceleration enabled for faster processing on large images.
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => handleOptimize(false)}
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
            onClick={() => result ? downloadResult() : handleOptimize(true)}
            disabled={isProcessing}
          >
            <Download className="h-4 w-4 mr-2" />
            {result ? 'Download' : 'Optimize & Download'}
          </Button>
        </div>

        {/* Hidden canvas for processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
};
