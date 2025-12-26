import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Sparkles, 
  Download, 
  Upload,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  FolderOpen,
  Package,
  Clock,
  ImageIcon,
  SplitSquareHorizontal,
  Rocket,
  Scale,
  Crown,
  Plus,
  Settings2,
  Save,
  Pencil,
  FileDown,
  FileUp
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebGLImageProcessor } from '@/hooks/useWebGLImageProcessor';
import { ImageCompareSlider } from '@/components/ImageCompareSlider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import JSZip from 'jszip';

interface BatchImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    blob: Blob;
    url: string;
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    processingTime: number;
  };
  error?: string;
}

interface BatchSettings {
  quality: number;
  sharpening: 'none' | 'subtle' | 'moderate' | 'strong';
  noiseReduction: number;
  format: 'jpeg' | 'png' | 'webp';
}

type BuiltInPresetType = 'fast' | 'balanced' | 'quality';

interface CustomPreset {
  id: string;
  name: string;
  description: string;
  settings: BatchSettings;
}

interface Preset {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: BatchSettings;
  color: string;
}

const builtInPresets: Record<BuiltInPresetType, Preset> = {
  fast: {
    name: 'Fast',
    description: 'Maximum speed, good compression',
    icon: Rocket,
    color: 'text-orange-500 border-orange-500/30 bg-orange-500/10',
    settings: {
      quality: 70,
      sharpening: 'none',
      noiseReduction: 0,
      format: 'webp',
    },
  },
  balanced: {
    name: 'Balanced',
    description: 'Best mix of speed and quality',
    icon: Scale,
    color: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    settings: {
      quality: 85,
      sharpening: 'moderate',
      noiseReduction: 20,
      format: 'webp',
    },
  },
  quality: {
    name: 'Quality',
    description: 'Maximum quality preservation',
    icon: Crown,
    color: 'text-purple-500 border-purple-500/30 bg-purple-500/10',
    settings: {
      quality: 95,
      sharpening: 'subtle',
      noiseReduction: 30,
      format: 'png',
    },
  },
};

const CUSTOM_PRESETS_KEY = 'batch-optimizer-custom-presets';

const loadCustomPresets = (): CustomPreset[] => {
  try {
    const stored = localStorage.getItem(CUSTOM_PRESETS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveCustomPresets = (presets: CustomPreset[]) => {
  localStorage.setItem(CUSTOM_PRESETS_KEY, JSON.stringify(presets));
};

const sharpeningStrengths = {
  none: 0,
  subtle: 0.3,
  moderate: 0.6,
  strong: 1.2,
};

const sharpeningKernels = {
  none: null,
  subtle: [0, -0.5, 0, -0.5, 3, -0.5, 0, -0.5, 0],
  moderate: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  strong: [-1, -1, -1, -1, 9, -1, -1, -1, -1],
};

export const BatchOptimizer = () => {
  const [images, setImages] = useState<BatchImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [compareImage, setCompareImage] = useState<BatchImage | null>(null);
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customSettings, setCustomSettings] = useState<BatchSettings>(builtInPresets.balanced.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<BatchSettings>(builtInPresets.balanced.settings);

  // Load custom presets on mount
  useEffect(() => {
    setCustomPresets(loadCustomPresets());
  }, []);

  const handleBuiltInPresetChange = (preset: BuiltInPresetType) => {
    setActivePreset(preset);
    setSettings(builtInPresets[preset].settings);
    toast.success(`Switched to ${builtInPresets[preset].name} preset`);
  };

  const handleCustomPresetChange = (preset: CustomPreset) => {
    setActivePreset(preset.id);
    setSettings(preset.settings);
    toast.success(`Switched to ${preset.name} preset`);
  };

  const openCreatePresetDialog = () => {
    setEditingPreset(null);
    setCustomName('');
    setCustomDescription('');
    setCustomSettings({ ...settings });
    setShowCustomDialog(true);
  };

  const openEditPresetDialog = (preset: CustomPreset) => {
    setEditingPreset(preset);
    setCustomName(preset.name);
    setCustomDescription(preset.description);
    setCustomSettings({ ...preset.settings });
    setShowCustomDialog(true);
  };

  const saveCustomPreset = () => {
    const trimmedName = customName.trim();
    if (!trimmedName) {
      toast.error('Please enter a preset name');
      return;
    }
    if (trimmedName.length > 30) {
      toast.error('Name must be less than 30 characters');
      return;
    }

    if (editingPreset) {
      // Update existing
      const updated = customPresets.map(p => 
        p.id === editingPreset.id 
          ? { ...p, name: trimmedName, description: customDescription.trim().slice(0, 50), settings: customSettings }
          : p
      );
      setCustomPresets(updated);
      saveCustomPresets(updated);
      setSettings(customSettings);
      toast.success(`Updated "${trimmedName}" preset`);
    } else {
      // Create new
      const newPreset: CustomPreset = {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        description: customDescription.trim().slice(0, 50),
        settings: customSettings,
      };
      const updated = [...customPresets, newPreset];
      setCustomPresets(updated);
      saveCustomPresets(updated);
      setActivePreset(newPreset.id);
      setSettings(customSettings);
      toast.success(`Created "${trimmedName}" preset`);
    }
    setShowCustomDialog(false);
  };

  const deleteCustomPreset = (id: string) => {
    const updated = customPresets.filter(p => p.id !== id);
    setCustomPresets(updated);
    saveCustomPresets(updated);
    if (activePreset === id) {
      setActivePreset('balanced');
      setSettings(builtInPresets.balanced.settings);
    }
    toast.success('Preset deleted');
  };

  const exportPresets = () => {
    if (customPresets.length === 0) {
      toast.error('No custom presets to export');
      return;
    }
    
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      presets: customPresets.map(({ name, description, settings }) => ({
        name,
        description,
        settings,
      })),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch-optimizer-presets-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${customPresets.length} preset${customPresets.length > 1 ? 's' : ''}`);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.presets || !Array.isArray(data.presets)) {
          throw new Error('Invalid preset file format');
        }
        
        const validFormats = ['jpeg', 'png', 'webp'];
        const validSharpening = ['none', 'subtle', 'moderate', 'strong'];
        
        const importedPresets: CustomPreset[] = data.presets
          .filter((p: unknown) => {
            if (!p || typeof p !== 'object') return false;
            const preset = p as Record<string, unknown>;
            if (!preset.name || typeof preset.name !== 'string') return false;
            if (!preset.settings || typeof preset.settings !== 'object') return false;
            const settings = preset.settings as Record<string, unknown>;
            if (typeof settings.quality !== 'number' || settings.quality < 10 || settings.quality > 100) return false;
            if (!validFormats.includes(settings.format as string)) return false;
            if (!validSharpening.includes(settings.sharpening as string)) return false;
            if (typeof settings.noiseReduction !== 'number' || settings.noiseReduction < 0 || settings.noiseReduction > 100) return false;
            return true;
          })
          .map((p: { name: string; description?: string; settings: BatchSettings }) => ({
            id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: String(p.name).slice(0, 30),
            description: String(p.description || '').slice(0, 50),
            settings: {
              quality: p.settings.quality,
              format: p.settings.format,
              sharpening: p.settings.sharpening,
              noiseReduction: p.settings.noiseReduction,
            },
          }));
        
        if (importedPresets.length === 0) {
          throw new Error('No valid presets found in file');
        }
        
        const updated = [...customPresets, ...importedPresets];
        setCustomPresets(updated);
        saveCustomPresets(updated);
        
        toast.success(`Imported ${importedPresets.length} preset${importedPresets.length > 1 ? 's' : ''}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to import presets');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const { processImage: processWithWebGL, isWebGLSupported } = useWebGLImageProcessor();
  const webGLAvailable = isWebGLSupported();

  const addFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files');
      return;
    }

    if (imageFiles.length !== fileArray.length) {
      toast.warning(`${fileArray.length - imageFiles.length} non-image files were skipped`);
    }
    
    imageFiles.forEach((file) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImages(prev => [...prev, {
          id,
          file,
          preview,
          status: 'pending',
          progress: 0,
        }]);
      };
      
      reader.readAsDataURL(file);
    });

    toast.success(`Added ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`);
  }, []);

  const handleFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    addFiles(files);
    event.target.value = '';
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCount = prev - 1;
      if (newCount === 0) {
        setIsDragging(false);
      }
      return newCount;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);
    
    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      addFiles(files);
    }
  }, [addFiles]);

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
    setOverallProgress(0);
  };

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

  const processImageCPU = useCallback((img: HTMLImageElement): ImageData => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    const kernel = sharpeningKernels[settings.sharpening];
    if (kernel) {
      imageData = applyConvolution(imageData, kernel);
    }

    return imageData;
  }, [settings.sharpening, applyConvolution]);

  const processImageWebGL = useCallback(async (img: HTMLImageElement): Promise<ImageData | null> => {
    return await processWithWebGL(img, {
      sharpenStrength: sharpeningStrengths[settings.sharpening],
      noiseReduction: settings.noiseReduction / 100,
      detailEnhancement: 0,
      contrast: 1.0,
      saturation: 1.0,
      brightness: 0,
    });
  }, [processWithWebGL, settings]);

  const optimizeSingleImage = useCallback(async (batchImage: BatchImage): Promise<BatchImage> => {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { 
            willReadFrequently: true,
            alpha: settings.format === 'png' 
          });
          
          if (!ctx) {
            resolve({ ...batchImage, status: 'failed', error: 'Canvas error' });
            return;
          }

          canvas.width = img.width;
          canvas.height = img.height;

          let imageData: ImageData | null = null;
          
          // Try WebGL first
          if (webGLAvailable) {
            try {
              imageData = await processImageWebGL(img);
            } catch (e) {
              console.warn('WebGL failed, using CPU:', e);
            }
          }

          // Fallback to CPU
          if (!imageData) {
            imageData = processImageCPU(img);
          }

          ctx.putImageData(imageData, 0, 0);

          const mimeType = `image/${settings.format}`;
          const quality = settings.quality / 100;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve({ ...batchImage, status: 'failed', error: 'Blob creation failed' });
                return;
              }

              const url = URL.createObjectURL(blob);
              const processingTime = Math.round(performance.now() - startTime);

              resolve({
                ...batchImage,
                status: 'completed',
                progress: 100,
                result: {
                  blob,
                  url,
                  originalSize: batchImage.file.size,
                  optimizedSize: blob.size,
                  compressionRatio: Math.round((1 - blob.size / batchImage.file.size) * 100),
                  processingTime,
                },
              });
            },
            mimeType,
            settings.format === 'png' ? undefined : quality
          );
        } catch (error) {
          resolve({ 
            ...batchImage, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      };

      img.onerror = () => {
        resolve({ ...batchImage, status: 'failed', error: 'Failed to load image' });
      };

      img.src = batchImage.preview;
    });
  }, [settings, webGLAvailable, processImageWebGL, processImageCPU]);

  const processBatch = async () => {
    const pendingImages = images.filter(img => img.status === 'pending' || img.status === 'failed');
    if (pendingImages.length === 0) {
      toast.error('No images to process');
      return;
    }

    setIsProcessing(true);
    setOverallProgress(0);

    let completed = 0;
    const total = pendingImages.length;

    for (const batchImage of pendingImages) {
      // Update status to processing
      setImages(prev => prev.map(img => 
        img.id === batchImage.id ? { ...img, status: 'processing' as const, progress: 0 } : img
      ));

      const result = await optimizeSingleImage(batchImage);
      
      // Update with result
      setImages(prev => prev.map(img => 
        img.id === batchImage.id ? result : img
      ));

      completed++;
      setOverallProgress(Math.round((completed / total) * 100));
    }

    setIsProcessing(false);
    
    const successCount = images.filter(img => img.status === 'completed').length + 
                         pendingImages.filter(img => images.find(i => i.id === img.id)?.status === 'completed').length;
    
    toast.success(`Batch complete! ${completed} images processed${webGLAvailable ? ' (GPU accelerated)' : ''}`);
  };

  const downloadAll = async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.result);
    if (completedImages.length === 0) {
      toast.error('No optimized images to download');
      return;
    }

    if (completedImages.length === 1) {
      // Single file download
      const img = completedImages[0];
      const link = document.createElement('a');
      link.href = img.result!.url;
      link.download = `${img.file.name.replace(/\.[^/.]+$/, '')}_optimized.${settings.format}`;
      link.click();
      return;
    }

    // Multiple files - create ZIP
    toast.loading('Creating ZIP file...');
    
    const zip = new JSZip();
    
    for (const img of completedImages) {
      const baseName = img.file.name.replace(/\.[^/.]+$/, '');
      zip.file(`${baseName}_optimized.${settings.format}`, img.result!.blob);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `batch_optimized_${Date.now()}.zip`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.dismiss();
    toast.success('ZIP download started!');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const completedCount = images.filter(img => img.status === 'completed').length;
  const totalSaved = images
    .filter(img => img.status === 'completed' && img.result)
    .reduce((acc, img) => acc + (img.result!.originalSize - img.result!.optimizedSize), 0);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5 text-primary" />
            Batch Optimizer
          </CardTitle>
          <div className="flex items-center gap-2">
            {webGLAvailable && (
              <Badge variant="outline" className="text-green-600 border-green-600/30">
                <Zap className="h-3 w-3 mr-1" />
                GPU Ready
              </Badge>
            )}
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {images.length} images
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Area with Drag & Drop */}
        <div 
          ref={dropZoneRef}
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg shadow-primary/20' 
              : 'border-primary/30 hover:border-primary/50 hover:bg-primary/5'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFilesSelect}
          />
          
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-lg z-10 pointer-events-none">
              <div className="text-center animate-pulse">
                <Download className="h-12 w-12 mx-auto text-primary mb-2" />
                <p className="text-lg font-semibold text-primary">Drop images here</p>
                <p className="text-sm text-primary/70">Release to add to queue</p>
              </div>
            </div>
          )}
          
          {/* Default state */}
          <div className={isDragging ? 'opacity-0' : 'opacity-100 transition-opacity'}>
            <div className="relative mx-auto w-16 h-16 mb-3">
              <FolderOpen className={`h-10 w-10 mx-auto text-primary/60 transition-transform ${isDragging ? 'scale-110' : ''}`} />
              <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                <Upload className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>
            <p className="text-sm font-medium">Drag & drop images here</p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse • Supports JPG, PNG, WebP
            </p>
            <div className="flex items-center justify-center gap-4 mt-3">
              <Badge variant="outline" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Multiple files
              </Badge>
              {webGLAvailable && (
                <Badge variant="outline" className="text-xs text-green-600 border-green-600/30">
                  <Zap className="h-3 w-3 mr-1" />
                  GPU accelerated
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Processing Preset
            </h4>
            <div className="flex items-center gap-1">
              {customPresets.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={exportPresets}
                  disabled={isProcessing}
                  className="h-7 text-xs"
                  title="Export presets"
                >
                  <FileDown className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => importInputRef.current?.click()}
                disabled={isProcessing}
                className="h-7 text-xs"
                title="Import presets"
              >
                <FileUp className="h-3 w-3" />
              </Button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={openCreatePresetDialog}
                disabled={isProcessing}
                className="h-7 text-xs"
              >
                <Plus className="h-3 w-3 mr-1" />
                Custom
              </Button>
            </div>
          </div>

          {/* Built-in Presets */}
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(builtInPresets) as BuiltInPresetType[]).map((key) => {
              const preset = builtInPresets[key];
              const Icon = preset.icon;
              const isActive = activePreset === key;
              
              return (
                <button
                  key={key}
                  onClick={() => handleBuiltInPresetChange(key)}
                  disabled={isProcessing}
                  className={`
                    relative p-3 rounded-lg border-2 transition-all duration-200
                    ${isActive 
                      ? `${preset.color} border-current shadow-md` 
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                    }
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className={`h-5 w-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                    <span className={`text-sm font-medium ${isActive ? '' : 'text-foreground'}`}>
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">
                      {preset.description}
                    </span>
                  </div>
                  {isActive && (
                    <div className="absolute -top-1 -right-1">
                      <CheckCircle2 className="h-4 w-4 text-current" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Presets */}
          {customPresets.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Custom Presets</p>
              <div className="grid grid-cols-2 gap-2">
                {customPresets.map((preset) => {
                  const isActive = activePreset === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all duration-200 group
                        ${isActive 
                          ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shadow-md' 
                          : 'border-border hover:border-primary/50 hover:bg-primary/5'
                        }
                        ${isProcessing ? 'opacity-50' : 'cursor-pointer'}
                      `}
                      onClick={() => !isProcessing && handleCustomPresetChange(preset)}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Settings2 className={`h-5 w-5 ${isActive ? '' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isActive ? '' : 'text-foreground'}`}>
                          {preset.name}
                        </span>
                        {preset.description && (
                          <span className="text-[10px] text-muted-foreground leading-tight text-center line-clamp-1">
                            {preset.description}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <div className="absolute -top-1 -right-1">
                          <CheckCircle2 className="h-4 w-4 text-current" />
                        </div>
                      )}
                      {/* Edit/Delete buttons */}
                      <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditPresetDialog(preset); }}
                          className="p-1 rounded bg-background/80 hover:bg-primary/20"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCustomPreset(preset.id); }}
                          className="p-1 rounded bg-background/80 hover:bg-destructive/20 text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-2">
            <Badge variant="outline" className="font-normal">
              Quality: {settings.quality}%
            </Badge>
            <Badge variant="outline" className="font-normal">
              Format: {settings.format.toUpperCase()}
            </Badge>
            <Badge variant="outline" className="font-normal">
              Sharpening: {settings.sharpening}
            </Badge>
          </div>
        </div>

        {/* Custom Preset Dialog */}
        <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                {editingPreset ? 'Edit Preset' : 'Create Custom Preset'}
              </DialogTitle>
              <DialogDescription>
                Configure your optimization settings and save them for reuse.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  placeholder="My Custom Preset"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={30}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-description">Description (optional)</Label>
                <Input
                  id="preset-description"
                  placeholder="For social media images..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  maxLength={50}
                />
              </div>

              <div className="space-y-2">
                <Label>Quality: {customSettings.quality}%</Label>
                <Slider
                  value={[customSettings.quality]}
                  onValueChange={([v]) => setCustomSettings(s => ({ ...s, quality: v }))}
                  min={10}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label>Output Format</Label>
                <Select
                  value={customSettings.format}
                  onValueChange={(v) => setCustomSettings(s => ({ ...s, format: v as BatchSettings['format'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP (Best compression)</SelectItem>
                    <SelectItem value="jpeg">JPEG (Wide compatibility)</SelectItem>
                    <SelectItem value="png">PNG (Lossless)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sharpening</Label>
                <Select
                  value={customSettings.sharpening}
                  onValueChange={(v) => setCustomSettings(s => ({ ...s, sharpening: v as BatchSettings['sharpening'] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="subtle">Subtle</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="strong">Strong</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Noise Reduction: {customSettings.noiseReduction}%</Label>
                <Slider
                  value={[customSettings.noiseReduction]}
                  onValueChange={([v]) => setCustomSettings(s => ({ ...s, noiseReduction: v }))}
                  min={0}
                  max={100}
                  step={5}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveCustomPreset}>
                <Save className="h-4 w-4 mr-2" />
                {editingPreset ? 'Update' : 'Save'} Preset
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Image Queue */}
        {images.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Image Queue</h4>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={isProcessing}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <ScrollArea className="h-[240px] rounded-md border">
              <div className="p-2 space-y-2">
                {images.map((img) => (
                  <div 
                    key={img.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors"
                  >
                    {/* Thumbnail */}
                    <div 
                      className="w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-muted cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                      onClick={() => img.status === 'completed' && img.result && setCompareImage(img)}
                      title={img.status === 'completed' ? 'Click to compare' : undefined}
                    >
                      <img 
                        src={img.status === 'completed' && img.result ? img.result.url : img.preview} 
                        alt={img.file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{img.file.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatBytes(img.file.size)}</span>
                        {img.result && (
                          <>
                            <span>→</span>
                            <span className="text-primary font-medium">
                              {formatBytes(img.result.optimizedSize)} (-{img.result.compressionRatio}%)
                            </span>
                          </>
                        )}
                      </div>
                      {img.status === 'processing' && (
                        <Progress value={img.progress} className="h-1 mt-1" />
                      )}
                    </div>

                    {/* Compare button for completed */}
                    {img.status === 'completed' && img.result && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => setCompareImage(img)}
                        title="Compare original vs optimized"
                      >
                        <SplitSquareHorizontal className="h-4 w-4 text-primary" />
                      </Button>
                    )}

                    {/* Status */}
                    <div className="flex-shrink-0">
                      {img.status === 'pending' && (
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      )}
                      {img.status === 'processing' && (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      )}
                      {img.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                      {img.status === 'failed' && (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>

                    {/* Remove */}
                    {!isProcessing && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 flex-shrink-0"
                        onClick={() => removeImage(img.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Stats */}
            {completedCount > 0 && (
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{completedCount}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{formatBytes(totalSaved)}</p>
                  <p className="text-xs text-muted-foreground">Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {images.filter(i => i.result).reduce((acc, i) => acc + i.result!.compressionRatio, 0) / completedCount || 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Reduction</p>
                </div>
              </div>
            )}

            {/* Overall Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Processing batch...
                  </span>
                  <span className="font-mono">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={processBatch}
                disabled={isProcessing || images.filter(i => i.status === 'pending').length === 0}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Optimize All ({images.filter(i => i.status === 'pending' || i.status === 'failed').length})
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={downloadAll}
                disabled={isProcessing || completedCount === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download {completedCount > 1 ? 'ZIP' : ''} ({completedCount})
              </Button>
            </div>
          </>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Add images to start batch optimization</p>
          </div>
        )}
      </CardContent>

      {/* Comparison Dialog */}
      <Dialog open={!!compareImage} onOpenChange={() => setCompareImage(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SplitSquareHorizontal className="h-5 w-5 text-primary" />
              Compare: {compareImage?.file.name}
            </DialogTitle>
          </DialogHeader>
          {compareImage && compareImage.result && (
            <div className="space-y-4">
              <ImageCompareSlider
                beforeImage={compareImage.preview}
                afterImage={compareImage.result.url}
                beforeLabel="Original"
                afterLabel="Optimized"
                beforeSize={formatBytes(compareImage.file.size)}
                afterSize={formatBytes(compareImage.result.optimizedSize)}
                compressionRatio={compareImage.result.compressionRatio}
              />
              <div className="grid grid-cols-3 gap-4 p-3 rounded-lg bg-muted/50 text-center">
                <div>
                  <p className="text-lg font-bold">{formatBytes(compareImage.file.size)}</p>
                  <p className="text-xs text-muted-foreground">Original</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-primary">{formatBytes(compareImage.result.optimizedSize)}</p>
                  <p className="text-xs text-muted-foreground">Optimized</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-green-500">-{compareImage.result.compressionRatio}%</p>
                  <p className="text-xs text-muted-foreground">Saved</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
