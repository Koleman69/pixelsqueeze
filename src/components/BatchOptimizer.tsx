import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  runOptimizationPipeline,
  type GoalPreset,
  type PipelineResult,
  type ContentType,
} from '@/services/imageOptimizationPipeline';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
  FileUp,
  Share2,
  Copy,
  Link,
  QrCode,
  History,
  RotateCcw,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useWebGLImageProcessor } from '@/hooks/useWebGLImageProcessor';
import { ImageCompareSlider } from '@/components/ImageCompareSlider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import JSZip from 'jszip';
import { QRCodeSVG } from 'qrcode.react';

interface BatchImage {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  seoFileName?: string;
  altText?: string;
  contentType?: ContentType;
  detectedFormat?: string;
  pipelineResult?: PipelineResult;
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

interface BulkOptions {
  seoRename: boolean;
  seoPrefix: string;
  generateAltText: boolean;
  stripMetadata: boolean;
}

type BuiltInPresetType = 'fast' | 'balanced' | 'quality';

interface CustomPreset {
  id: string;
  name: string;
  description: string;
  settings: BatchSettings;
}

interface ProcessingHistoryEntry {
  id: string;
  timestamp: string;
  imageCount: number;
  successCount: number;
  failedCount: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
  totalSaved: number;
  avgCompressionRatio: number;
  totalProcessingTime: number;
  settings: BatchSettings;
  presetName?: string;
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

const PROCESSING_HISTORY_KEY = 'batch-optimizer-history';
const MAX_HISTORY_ENTRIES = 20;

const loadProcessingHistory = (): ProcessingHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(PROCESSING_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveProcessingHistory = (history: ProcessingHistoryEntry[]) => {
  localStorage.setItem(PROCESSING_HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY_ENTRIES)));
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

const generateSeoFileName = (originalName: string, prefix: string, index: number): string => {
  // Clean the original name: lowercase, replace spaces/special chars with hyphens
  let seoName = originalName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  
  // Add prefix if provided
  if (prefix.trim()) {
    const cleanPrefix = prefix.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    seoName = `${cleanPrefix}-${seoName}`;
  }
  
  // Add index for uniqueness
  seoName = `${seoName}-${String(index).padStart(3, '0')}`;
  
  // Truncate if too long
  if (seoName.length > 80) seoName = seoName.substring(0, 80).replace(/-+$/, '');
  
  return seoName;
};

export const BatchOptimizer = () => {
  const { user } = useAuth();
  const [images, setImages] = useState<BatchImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [compareImage, setCompareImage] = useState<BatchImage | null>(null);
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [customPresets, setCustomPresets] = useState<CustomPreset[]>([]);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [processingHistory, setProcessingHistory] = useState<ProcessingHistoryEntry[]>([]);
  const [sharePreset, setSharePreset] = useState<CustomPreset | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [editingPreset, setEditingPreset] = useState<CustomPreset | null>(null);
  const [customName, setCustomName] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customSettings, setCustomSettings] = useState<BatchSettings>(builtInPresets.balanced.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<BatchSettings>(builtInPresets.balanced.settings);
  const [bulkOptions, setBulkOptions] = useState<BulkOptions>({
    seoRename: true,
    seoPrefix: '',
    generateAltText: false,
    stripMetadata: true,
  });
  // Load custom presets and history on mount and check for shared preset in URL
  useEffect(() => {
    setCustomPresets(loadCustomPresets());
    setProcessingHistory(loadProcessingHistory());
    
    // Check for shared preset in URL
    const params = new URLSearchParams(window.location.search);
    const sharedPreset = params.get('preset');
    if (sharedPreset) {
      try {
        const decoded = JSON.parse(atob(sharedPreset));
        if (decoded.name && decoded.settings) {
          const validFormats = ['jpeg', 'png', 'webp'];
          const validSharpening = ['none', 'subtle', 'moderate', 'strong'];
          const s = decoded.settings;
          
          if (
            typeof s.quality === 'number' && s.quality >= 10 && s.quality <= 100 &&
            validFormats.includes(s.format) &&
            validSharpening.includes(s.sharpening) &&
            typeof s.noiseReduction === 'number' && s.noiseReduction >= 0 && s.noiseReduction <= 100
          ) {
            const newPreset: CustomPreset = {
              id: `shared-${Date.now()}`,
              name: String(decoded.name).slice(0, 30),
              description: String(decoded.description || 'Shared preset').slice(0, 50),
              settings: {
                quality: s.quality,
                format: s.format,
                sharpening: s.sharpening,
                noiseReduction: s.noiseReduction,
              },
            };
            
            setCustomPresets(prev => {
              const exists = prev.some(p => 
                p.name === newPreset.name && 
                JSON.stringify(p.settings) === JSON.stringify(newPreset.settings)
              );
              if (exists) {
                toast.info('This preset already exists in your collection');
                return prev;
              }
              const updated = [...prev, newPreset];
              saveCustomPresets(updated);
              toast.success(`Added shared preset: ${newPreset.name}`);
              return updated;
            });
            
            setActivePreset(newPreset.id);
            setSettings(newPreset.settings);
            
            // Clean URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      } catch {
        // Invalid preset data, ignore
      }
    }
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

  const openSharePresetDialog = (preset: CustomPreset) => {
    const presetData = {
      name: preset.name,
      description: preset.description,
      settings: preset.settings,
    };
    const encoded = btoa(JSON.stringify(presetData));
    const url = `${window.location.origin}${window.location.pathname}?preset=${encoded}`;
    setSharePreset(preset);
    setShareUrl(url);
    setShowShareDialog(true);
  };

  const copyShareUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const applyHistorySettings = (entry: ProcessingHistoryEntry) => {
    setSettings(entry.settings);
    setActivePreset('custom');
    setShowHistoryDialog(false);
    toast.success(`Applied settings from ${new Date(entry.timestamp).toLocaleDateString()}`);
  };

  const clearHistory = () => {
    setProcessingHistory([]);
    saveProcessingHistory([]);
    toast.success('History cleared');
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
    
    imageFiles.forEach((file, idx) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const reader = new FileReader();
      
      // Generate SEO-friendly filename
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const seoName = bulkOptions.seoRename
        ? generateSeoFileName(baseName, bulkOptions.seoPrefix, idx + 1)
        : baseName;
      
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setImages(prev => [...prev, {
          id,
          file,
          preview,
          seoFileName: seoName,
          status: 'pending',
          progress: 0,
        }]);
      };
      
      reader.readAsDataURL(file);
    });

    toast.success(`Added ${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''}`);
  }, [bulkOptions.seoRename, bulkOptions.seoPrefix]);

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

  const optimizeSingleImage = useCallback(async (batchImage: BatchImage, index: number): Promise<BatchImage> => {
    try {
      // Map batch settings format to pipeline GoalPreset
      const goalMap: Record<string, GoalPreset> = {
        fast: 'web',
        balanced: 'web',
        quality: 'print',
      };
      const goal: GoalPreset = goalMap[activePreset] || 'web';

      const pipelineResult = await runOptimizationPipeline(batchImage.file, {
        goal,
        forceFormat: settings.format === 'webp' ? 'webp' : settings.format === 'png' ? 'png' : 'jpeg',
        quality: settings.quality,
        stripMetadata: bulkOptions.stripMetadata,
        seoRename: bulkOptions.seoRename,
        seoPrefix: bulkOptions.seoPrefix,
        generateAltText: bulkOptions.generateAltText,
        storeMetrics: true,
        userId: user?.id,
      }, index);

      return {
        ...batchImage,
        status: 'completed',
        progress: 100,
        seoFileName: pipelineResult.seoFileName.replace(/\.[^/.]+$/, ''),
        altText: pipelineResult.altText,
        contentType: pipelineResult.contentType,
        detectedFormat: pipelineResult.format,
        pipelineResult,
        result: {
          blob: pipelineResult.blob,
          url: pipelineResult.url,
          originalSize: pipelineResult.originalSize,
          optimizedSize: pipelineResult.optimizedSize,
          compressionRatio: pipelineResult.compressionRatio,
          processingTime: pipelineResult.processingTimeMs,
        },
      };
    } catch (error) {
      return {
        ...batchImage,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, [settings, activePreset, bulkOptions, user?.id]);

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

    for (let i = 0; i < pendingImages.length; i++) {
      const batchImage = pendingImages[i];
      // Update status to processing
      setImages(prev => prev.map(img => 
        img.id === batchImage.id ? { ...img, status: 'processing' as const, progress: 0 } : img
      ));

      const result = await optimizeSingleImage(batchImage, i);
      
      // Update with result
      setImages(prev => prev.map(img => 
        img.id === batchImage.id ? result : img
      ));

      completed++;
      setOverallProgress(Math.round((completed / total) * 100));
    }

    setIsProcessing(false);
    
    // Calculate stats for history
    const completedImages = images.filter(img => img.status === 'completed' && img.result);
    const updatedCompleted = pendingImages.filter(img => {
      const updated = images.find(i => i.id === img.id);
      return updated?.status === 'completed' && updated?.result;
    });
    const allCompleted = [...completedImages, ...updatedCompleted];
    
    if (allCompleted.length > 0 || completed > 0) {
      // Get current preset name
      let presetName = activePreset;
      if (builtInPresets[activePreset as BuiltInPresetType]) {
        presetName = builtInPresets[activePreset as BuiltInPresetType].name;
      } else {
        const customPreset = customPresets.find(p => p.id === activePreset);
        if (customPreset) presetName = customPreset.name;
      }
      
      // Recalculate from current state after processing
      const finalImages = images.map(img => {
        const pending = pendingImages.find(p => p.id === img.id);
        if (pending) {
          return images.find(i => i.id === pending.id) || img;
        }
        return img;
      });
      
      const finalCompleted = finalImages.filter(img => img.status === 'completed' && img.result);
      const totalOriginal = finalCompleted.reduce((acc, img) => acc + (img.result?.originalSize || 0), 0);
      const totalOptimized = finalCompleted.reduce((acc, img) => acc + (img.result?.optimizedSize || 0), 0);
      const totalTime = finalCompleted.reduce((acc, img) => acc + (img.result?.processingTime || 0), 0);
      const avgRatio = finalCompleted.length > 0 
        ? Math.round(finalCompleted.reduce((acc, img) => acc + (img.result?.compressionRatio || 0), 0) / finalCompleted.length)
        : 0;
      
      const historyEntry: ProcessingHistoryEntry = {
        id: `history-${Date.now()}`,
        timestamp: new Date().toISOString(),
        imageCount: pendingImages.length,
        successCount: completed,
        failedCount: pendingImages.length - completed,
        totalOriginalSize: totalOriginal,
        totalOptimizedSize: totalOptimized,
        totalSaved: totalOriginal - totalOptimized,
        avgCompressionRatio: avgRatio,
        totalProcessingTime: totalTime,
        settings: { ...settings },
        presetName,
      };
      
      setProcessingHistory(prev => {
        const updated = [historyEntry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
        saveProcessingHistory(updated);
        return updated;
      });

      // Save to database if user is logged in
      if (user) {
        try {
          const statsData = {
            user_id: user.id,
            processed_at: new Date().toISOString(),
            image_count: pendingImages.length,
            success_count: completed,
            failed_count: pendingImages.length - completed,
            total_original_size: totalOriginal,
            total_optimized_size: totalOptimized,
            total_saved: totalOriginal - totalOptimized,
            avg_compression_ratio: avgRatio,
            processing_time_ms: totalTime,
            preset_name: presetName,
            settings: settings as unknown,
          };
          // Use type assertion since table was just created and types may not be updated
          await (supabase.from('batch_processing_stats' as 'batch_jobs') as unknown as ReturnType<typeof supabase.from>).insert(statsData);
        } catch (err) {
          console.error('Failed to save stats:', err);
        }
      }
    }
    
    toast.success(`Batch complete! ${completed} images processed${webGLAvailable ? ' (GPU accelerated)' : ''}`);
  };

  const downloadAll = async () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.result);
    if (completedImages.length === 0) {
      toast.error('No optimized images to download');
      return;
    }

    const getDownloadName = (img: BatchImage) => {
      if (img.pipelineResult?.seoFileName) return img.pipelineResult.seoFileName;
      const name = img.seoFileName || img.file.name.replace(/\.[^/.]+$/, '');
      return `${name}.${img.detectedFormat || settings.format}`;
    };

    if (completedImages.length === 1) {
      const img = completedImages[0];
      const link = document.createElement('a');
      link.href = img.result!.url;
      link.download = getDownloadName(img);
      link.click();
      return;
    }

    // Multiple files - create ZIP
    toast.loading('Creating ZIP file...');
    
    const zip = new JSZip();

    // Add manifest CSV with alt text and metadata
    let manifest = 'filename,alt_text,content_type,format,original_size_bytes,optimized_size_bytes,compression_ratio,dimensions\n';
    
    for (const img of completedImages) {
      zip.file(getDownloadName(img), img.result!.blob);
      const pr = img.pipelineResult;
      const alt = (img.altText || '').replace(/"/g, '""');
      manifest += `"${getDownloadName(img)}","${alt}","${img.contentType || 'unknown'}","${img.detectedFormat || settings.format}",${img.result!.originalSize},${img.result!.optimizedSize},${img.result!.compressionRatio}%,"${pr ? `${pr.outputWidth}x${pr.outputHeight}` : ''}"\n`;
    }
    
    zip.file('manifest.csv', manifest);

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(zipBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `optimized-images-${Date.now()}.zip`;
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
            {processingHistory.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHistoryDialog(true)}
                className="h-8"
                title="Processing history"
              >
                <History className="h-4 w-4" />
              </Button>
            )}
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
          aria-label="Upload image files" />
          
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

        {/* Bulk Options */}
        {images.length > 0 && (
          <div className="p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Bulk Options
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="seo-rename" className="text-xs text-muted-foreground cursor-pointer">
                  SEO-friendly filenames
                </Label>
                <input
                  id="seo-rename"
                  type="checkbox"
                  checked={bulkOptions.seoRename}
                  onChange={(e) => setBulkOptions(prev => ({ ...prev, seoRename: e.target.checked }))}
                  className="rounded border-border"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="strip-meta" className="text-xs text-muted-foreground cursor-pointer">
                  Strip EXIF metadata
                </Label>
                <input
                  id="strip-meta"
                  type="checkbox"
                  checked={bulkOptions.stripMetadata}
                  onChange={(e) => setBulkOptions(prev => ({ ...prev, stripMetadata: e.target.checked }))}
                  className="rounded border-border"
                />
              </div>
            </div>
            {bulkOptions.seoRename && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Filename prefix (optional)</Label>
                <Input
                  value={bulkOptions.seoPrefix}
                  onChange={(e) => setBulkOptions(prev => ({ ...prev, seoPrefix: e.target.value }))}
                  placeholder="e.g. product, hero, blog"
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  Preview: {generateSeoFileName('My Photo', bulkOptions.seoPrefix, 1)}.{settings.format}
                </p>
              </div>
            )}
          </div>
        )}

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
              aria-label="Import JSON file" />
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
                      {/* Edit/Delete/Share buttons */}
                      <div className="absolute top-1 left-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); openSharePresetDialog(preset); }}
                          className="p-1 rounded bg-background/80 hover:bg-primary/20"
                          title="Share preset"
                        >
                          <Share2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditPresetDialog(preset); }}
                          className="p-1 rounded bg-background/80 hover:bg-primary/20"
                          title="Edit preset"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteCustomPreset(preset.id); }}
                          className="p-1 rounded bg-background/80 hover:bg-destructive/20 text-destructive"
                          title="Delete preset"
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

        {/* Share Preset Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-primary" />
                Share Preset
              </DialogTitle>
              <DialogDescription>
                Share "{sharePreset?.name}" with others via link or QR code.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="link" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="link" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Link
                </TabsTrigger>
                <TabsTrigger value="qr" className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR Code
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="link" className="space-y-4 mt-4">
                <div className="flex gap-2">
                  <Input 
                    readOnly 
                    value={shareUrl} 
                    className="text-xs font-mono"
                  />
                  <Button onClick={copyShareUrl} size="icon" variant="outline">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Anyone with this link can import this preset into their Batch Optimizer.
                </p>
              </TabsContent>
              
              <TabsContent value="qr" className="flex flex-col items-center gap-4 mt-4">
                <div className="p-4 bg-white rounded-lg">
                  <QRCodeSVG 
                    value={shareUrl} 
                    size={200}
                    level="M"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Scan this QR code to import the preset on another device.
                </p>
              </TabsContent>
            </Tabs>

            {sharePreset && (
              <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
                <p className="text-sm font-medium">{sharePreset.name}</p>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">
                    Quality: {sharePreset.settings.quality}%
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {sharePreset.settings.format.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Sharpening: {sharePreset.settings.sharpening}
                  </Badge>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* History Dialog */}
        <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
          <DialogContent className="sm:max-w-lg max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Processing History
              </DialogTitle>
              <DialogDescription>
                View past optimizations and reuse their settings.
              </DialogDescription>
            </DialogHeader>
            
            {processingHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No processing history yet</p>
                <p className="text-sm">Complete a batch to see it here</p>
              </div>
            ) : (
              <ScrollArea className="max-h-[400px] pr-4">
                <div className="space-y-3">
                  {processingHistory.map((entry) => (
                    <div
                      key={entry.id}
                      className="border rounded-lg p-3 space-y-2 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.presetName && `${entry.presetName} • `}
                            {entry.successCount}/{entry.imageCount} images
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => applyHistorySettings(entry)}
                          className="h-7 text-xs"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Reuse
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-lg font-semibold text-green-600">
                            {entry.avgCompressionRatio}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">Avg Saved</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-lg font-semibold">
                            <TrendingDown className="h-4 w-4 inline mr-1 text-primary" />
                            {formatBytes(entry.totalSaved)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Total Saved</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2">
                          <p className="text-lg font-semibold">
                            {(entry.totalProcessingTime / 1000).toFixed(1)}s
                          </p>
                          <p className="text-[10px] text-muted-foreground">Duration</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          Q: {entry.settings.quality}%
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {entry.settings.format.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          Sharp: {entry.settings.sharpening}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <DialogFooter className="gap-2">
              {processingHistory.length > 0 && (
                <Button variant="destructive" size="sm" onClick={clearHistory}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear History
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
                Close
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
