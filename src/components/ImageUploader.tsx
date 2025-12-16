import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Upload, Crown, Download, Zap, Image, Video, Volume2, VolumeX, Smartphone, Globe, Archive, SlidersHorizontal, Save, Star, Trash2, Plus, FileUp, FileDown } from 'lucide-react';
import { CompressionSettings, useImageCompression } from '@/hooks/useImageCompression';
import { useVideoCompression, VideoCompressionSettings, VideoOutputFormat } from '@/hooks/useVideoCompression';
import { VideoCompressionResults } from '@/components/VideoCompressionResults';
import { VideoQueue } from '@/components/VideoQueue';
import { BatchRenameDialog } from '@/components/BatchRenameDialog';
import { useToast } from '@/hooks/use-toast';
import { CompressionStatus } from '@/components/CompressionStatus';

interface ImageUploaderProps {
  onUpload?: (files: FileList) => void;
}

export const ImageUploader = ({ onUpload }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'image' | 'video'>('image');
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1920,
    dpi: 72
  });
  const [videoSettings, setVideoSettings] = useState<VideoCompressionSettings>({
    quality: 'medium',
    maxWidth: 1280,
    maxHeight: 720,
    videoBitrate: 1000,
    outputFormat: 'webm',
    preserveAudio: true
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('custom');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [savedPresets, setSavedPresets] = useState<Record<string, { label: string; settings: VideoCompressionSettings }>>({});
  const [newPresetName, setNewPresetName] = useState('');
  const [showSavePreset, setShowSavePreset] = useState(false);
  const [showBatchRename, setShowBatchRename] = useState(false);

  // Load saved presets from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('videoCompressionPresets');
    if (stored) {
      try {
        setSavedPresets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to load saved presets:', e);
      }
    }
  }, []);

  // Save presets to localStorage when they change
  const savePresetsToStorage = (presets: Record<string, { label: string; settings: VideoCompressionSettings }>) => {
    localStorage.setItem('videoCompressionPresets', JSON.stringify(presets));
    setSavedPresets(presets);
  };

  const saveCurrentAsPreset = () => {
    if (!newPresetName.trim()) return;
    const key = `saved_${Date.now()}`;
    const newPresets = {
      ...savedPresets,
      [key]: {
        label: newPresetName.trim(),
        settings: { ...videoSettings }
      }
    };
    savePresetsToStorage(newPresets);
    setSelectedPreset(key);
    setNewPresetName('');
    setShowSavePreset(false);
    toast({
      title: "Preset Saved",
      description: `"${newPresetName.trim()}" has been saved for future use`,
    });
  };

  const deleteSavedPreset = (key: string) => {
    const newPresets = { ...savedPresets };
    delete newPresets[key];
    savePresetsToStorage(newPresets);
    if (selectedPreset === key) {
      setSelectedPreset('custom');
    }
    toast({
      title: "Preset Deleted",
      description: "Custom preset has been removed",
    });
  };

  const exportPresets = () => {
    if (Object.keys(savedPresets).length === 0) {
      toast({
        title: "No Presets to Export",
        description: "Save some custom presets first",
        variant: "destructive"
      });
      return;
    }

    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      presets: savedPresets
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-presets-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Presets Exported",
      description: `${Object.keys(savedPresets).length} preset(s) exported successfully`,
    });
  };

  const importPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        if (!data.presets || typeof data.presets !== 'object') {
          throw new Error('Invalid preset file format');
        }

        // Validate each preset has required fields
        const validPresets: Record<string, { label: string; settings: VideoCompressionSettings }> = {};
        let importedCount = 0;

        for (const [key, preset] of Object.entries(data.presets)) {
          const p = preset as { label?: string; settings?: VideoCompressionSettings };
          if (p.label && p.settings && typeof p.settings === 'object') {
            // Generate new key to avoid conflicts
            const newKey = `imported_${Date.now()}_${importedCount}`;
            validPresets[newKey] = {
              label: p.label,
              settings: {
                quality: p.settings.quality || 'medium',
                maxWidth: p.settings.maxWidth || 1280,
                maxHeight: p.settings.maxHeight || 720,
                videoBitrate: p.settings.videoBitrate || 1000,
                outputFormat: p.settings.outputFormat || 'webm',
                preserveAudio: p.settings.preserveAudio !== false
              }
            };
            importedCount++;
          }
        }

        if (importedCount === 0) {
          throw new Error('No valid presets found in file');
        }

        const mergedPresets = { ...savedPresets, ...validPresets };
        savePresetsToStorage(mergedPresets);

        toast({
          title: "Presets Imported",
          description: `${importedCount} preset(s) imported successfully`,
        });
      } catch (error) {
        console.error('Failed to import presets:', error);
        toast({
          title: "Import Failed",
          description: error instanceof Error ? error.message : "Invalid preset file",
          variant: "destructive"
        });
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  // Built-in video compression presets
  const builtInPresets: Record<string, { label: string; description: string; icon: typeof Globe; settings: VideoCompressionSettings }> = {
    web: {
      label: 'Web Optimized',
      description: 'Small file size, fast loading',
      icon: Globe,
      settings: {
        quality: 'medium',
        maxWidth: 1280,
        maxHeight: 720,
        videoBitrate: 1000,
        outputFormat: 'webm',
        preserveAudio: true
      }
    },
    mobile: {
      label: 'Mobile',
      description: 'Optimized for phones',
      icon: Smartphone,
      settings: {
        quality: 'low',
        maxWidth: 854,
        maxHeight: 480,
        videoBitrate: 500,
        outputFormat: 'mp4',
        preserveAudio: true
      }
    },
    archive: {
      label: 'Archive Quality',
      description: 'High quality preservation',
      icon: Archive,
      settings: {
        quality: 'high',
        maxWidth: 1920,
        maxHeight: 1080,
        videoBitrate: 2500,
        outputFormat: 'webm',
        preserveAudio: true
      }
    },
    social: {
      label: 'Social Media',
      description: 'Balanced for sharing',
      icon: Zap,
      settings: {
        quality: 'medium',
        maxWidth: 1080,
        maxHeight: 1080,
        videoBitrate: 1500,
        outputFormat: 'mp4',
        preserveAudio: true
      }
    }
  };

  const applyPreset = (presetKey: string) => {
    if (presetKey === 'custom') {
      setSelectedPreset('custom');
      return;
    }
    // Check built-in presets first
    const builtIn = builtInPresets[presetKey];
    if (builtIn) {
      setVideoSettings(builtIn.settings);
      setSelectedPreset(presetKey);
      return;
    }
    // Check saved presets
    const saved = savedPresets[presetKey];
    if (saved) {
      setVideoSettings(saved.settings);
      setSelectedPreset(presetKey);
    }
  };
  
  const { 
    compressImages, 
    subscription, 
    checkSubscription, 
    createCheckout,
    openCustomerPortal,
    downloadBulk,
    compressions 
  } = useImageCompression();

  const {
    videoCompressions,
    videoQueue,
    isQueueProcessing,
    compressVideo,
    compressVideoBatch,
    downloadCompressedVideo,
    downloadWithCustomNames,
    downloadAllVideos,
    clearVideoCompressions,
    pauseCompression,
    resumeCompression,
    cancelCompression,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    processQueue,
    updatePriority,
    setAllPriority
  } = useVideoCompression();
  
  const { toast } = useToast();

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleFileSelect = () => {
    console.log('[FileSelect] activeTab:', activeTab, 'isUploading:', isUploading);
    if (activeTab === 'video') {
      console.log('[FileSelect] Triggering video input click');
      videoInputRef.current?.click();
    } else {
      console.log('[FileSelect] Triggering image input click');
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(files);
      setIsUploading(true);
      
      if (onUpload) {
        onUpload(files);
      }

      // Show upload toast
      toast({
        title: "Uploading Images",
        description: `Processing ${files.length} image(s)...`,
      });

      // Start compression immediately
      try {
        await compressImages(files, settings, files.length > 1);
        // Refresh subscription status to update compression counter
        await checkSubscription();
      } catch (error) {
        console.error('Compression failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[VideoUpload] handleVideoChange triggered');
    const files = event.target.files;
    console.log('[VideoUpload] Files selected:', files?.length);
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      console.log('[VideoUpload] Adding to queue:', fileArray.map(f => ({ name: f.name, size: f.size, type: f.type })));
      // Add videos to queue instead of processing immediately
      addToQueue(fileArray);
    }
    // Reset input value so same file can be selected again
    event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent, type: 'image' | 'video') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    if (type === 'image') {
      // Filter for image files only
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        toast({
          title: "Invalid Files",
          description: "Please drop image files only",
          variant: "destructive"
        });
        return;
      }

      // Create a DataTransfer to convert array back to FileList
      const dt = new DataTransfer();
      imageFiles.forEach(file => dt.items.add(file));
      const fileList = dt.files;

      setSelectedFiles(fileList);
      setIsUploading(true);

      if (onUpload) {
        onUpload(fileList);
      }

      toast({
        title: "Uploading Images",
        description: `Processing ${imageFiles.length} image(s)...`,
      });

      try {
        await compressImages(fileList, settings, imageFiles.length > 1);
        await checkSubscription();
      } catch (error) {
        console.error('Compression failed:', error);
      } finally {
        setIsUploading(false);
      }
    } else {
      // Filter for video files only
      const videoFiles = Array.from(files).filter(file => file.type.startsWith('video/'));
      if (videoFiles.length === 0) {
        toast({
          title: "Invalid Files",
          description: "Please drop video files only",
          variant: "destructive"
        });
        return;
      }

      // Add videos to queue instead of processing immediately
      addToQueue(videoFiles);
    }
  };

  const handleBulkCompress = async () => {
    if (!selectedFiles) return;
    
    try {
      await compressImages(selectedFiles, settings, true);
    } catch (error) {
      console.error('Bulk compression failed:', error);
    }
  };

  const handleBulkDownload = () => {
    const completedCompressions = compressions
      .filter(c => c.status === 'completed')
      .slice(0, 10); // Limit to recent compressions
      
    if (completedCompressions.length === 0) {
      toast({
        title: "No Images Ready",
        description: "No compressed images available for download",
        variant: "destructive"
      });
      return;
    }
    
    downloadBulk(completedCompressions.map(c => c.id));
  };

  const isAdvancedSettings = settings.dpi > 72 || settings.maxWidth > 1920 || settings.maxHeight > 1920;
  const requiresSubscription = !subscription.subscribed && isAdvancedSettings;

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <h2 className="section-title">Media Compression Studio</h2>
          <p className="section-subtitle">
            Compress your images and videos with advanced settings
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          
          {subscription.subscribed ? (
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-gradient-primary">
                <Crown className="w-3 h-3 mr-1" />
                Pro User
              </Badge>
              <Button variant="outline" size="sm" onClick={openCustomerPortal}>
                Manage Subscription
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {subscription.free_compressions_used || 0}/3 Free Compressions Used
              </Badge>
              <Button onClick={createCheckout} className="bg-gradient-primary">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Pro - $6.95/month
              </Button>
            </div>
          )}
        </div>

        {/* Media Type Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'image' | 'video')}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs mx-auto">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Images
            </TabsTrigger>
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="space-y-6 mt-6">
            {/* Image Settings */}
            <div className="flex items-center gap-4">
              <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Image Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Image Compression Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label>Quality: {settings.quality}%</Label>
                      <Slider
                        value={[settings.quality]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, quality: value }))}
                        max={subscription.subscribed ? 100 : 85}
                        min={10}
                        step={5}
                      />
                      {!subscription.subscribed && (
                        <p className="text-xs text-muted-foreground">
                          Pro users can use up to 100% quality
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Width</Label>
                        <Input
                          type="number"
                          value={settings.maxWidth}
                          onChange={(e) => setSettings(prev => ({ ...prev, maxWidth: parseInt(e.target.value) || 1920 }))}
                          max={subscription.subscribed ? 4096 : 1920}
                          min={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Max Height</Label>
                        <Input
                          type="number"
                          value={settings.maxHeight}
                          onChange={(e) => setSettings(prev => ({ ...prev, maxHeight: parseInt(e.target.value) || 1920 }))}
                          max={subscription.subscribed ? 4096 : 1920}
                          min={100}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>DPI: {settings.dpi}</Label>
                      <Slider
                        value={[settings.dpi]}
                        onValueChange={([value]) => setSettings(prev => ({ ...prev, dpi: value }))}
                        max={subscription.subscribed ? 300 : 72}
                        min={72}
                        step={1}
                      />
                      {!subscription.subscribed && (
                        <p className="text-xs text-muted-foreground">
                          Pro users can set custom DPI up to 300
                        </p>
                      )}
                    </div>

                    {requiresSubscription && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <p className="text-sm text-orange-800">
                          <Crown className="w-4 h-4 inline mr-1" />
                          Advanced settings require Pro subscription
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              {subscription.subscribed && selectedFiles && selectedFiles.length > 1 && (
                <Button onClick={handleBulkCompress} variant="outline">
                  <Zap className="w-4 h-4 mr-2" />
                  Bulk Compress ({selectedFiles.length} files)
                </Button>
              )}

              {compressions.some(c => c.status === 'completed') && (
                <Button onClick={handleBulkDownload} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download All
                </Button>
              )}
            </div>

            {/* Image Upload Area */}
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary'
              }`}
              onClick={handleFileSelect}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'image')}
            >
              <Upload className={`w-12 h-12 mx-auto mb-4 text-muted-foreground ${isUploading ? 'animate-bounce' : isDragging ? 'text-primary animate-pulse' : ''}`} />
              <h3 className="text-lg font-semibold mb-2">
                {isUploading ? 'Processing Images...' : isDragging ? 'Drop Images Here' : 'Upload Images'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isUploading 
                  ? `Compressing ${selectedFiles?.length || 0} image(s)...` 
                  : 'Click to browse or drag and drop your images here'
                }
              </p>
              {!isUploading && (
                <p className="text-sm text-muted-foreground">
                  {subscription.subscribed 
                    ? "Unlimited files • All formats • Up to 50MB each" 
                    : "Up to 3 files • JPEG, PNG, WebP • Up to 10MB each"
                  }
                </p>
              )}
              
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

            {/* Image Settings Display */}
            <div className="flex flex-wrap gap-2 mb-6">
              <Badge variant="outline">Quality: {settings.quality}%</Badge>
              <Badge variant="outline">Size: {settings.maxWidth}×{settings.maxHeight}</Badge>
              <Badge variant="outline">DPI: {settings.dpi}</Badge>
              {requiresSubscription && (
                <Badge variant="destructive">Pro Required</Badge>
              )}
            </div>

            {/* Recent Image Compressions */}
            {compressions.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Recent compressed images (tap Download to save to your device)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {compressions.slice(0, 4).map((compression) => (
                    <CompressionStatus key={compression.id} {...compression} />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="video" className="space-y-6 mt-6">
            {/* Video Presets */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Quick Presets</Label>
                {!showSavePreset ? (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowSavePreset(true)}
                    className="h-7"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save Current
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="Preset name..."
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="h-7 w-32 text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCurrentAsPreset();
                        if (e.key === 'Escape') {
                          setShowSavePreset(false);
                          setNewPresetName('');
                        }
                      }}
                      autoFocus
                    />
                    <Button 
                      size="sm" 
                      onClick={saveCurrentAsPreset}
                      disabled={!newPresetName.trim()}
                      className="h-7"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setShowSavePreset(false);
                        setNewPresetName('');
                      }}
                      className="h-7"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>

              {/* Built-in presets */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {Object.entries(builtInPresets).map(([key, preset]) => {
                  const PresetIcon = preset.icon;
                  const isActive = selectedPreset === key;
                  return (
                    <button
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                        isActive 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      <PresetIcon className={`w-5 h-5 mb-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-medium ${isActive ? 'text-primary' : ''}`}>{preset.label}</p>
                      <p className="text-xs text-muted-foreground">{preset.description}</p>
                    </button>
                  );
                })}
                <button
                  onClick={() => setSelectedPreset('custom')}
                  className={`p-3 rounded-lg border-2 text-left transition-all hover:border-primary/50 ${
                    selectedPreset === 'custom' 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border bg-background hover:bg-muted/50'
                  }`}
                >
                  <SlidersHorizontal className={`w-5 h-5 mb-1 ${selectedPreset === 'custom' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${selectedPreset === 'custom' ? 'text-primary' : ''}`}>Custom</p>
                  <p className="text-xs text-muted-foreground">Manual settings</p>
                </button>
              </div>

              {/* Saved custom presets */}
              {Object.keys(savedPresets).length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-muted-foreground">Your Saved Presets</Label>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={exportPresets}
                        className="h-6 px-2 text-xs"
                        title="Export presets"
                      >
                        <FileDown className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                      <label className="cursor-pointer">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs pointer-events-none"
                          title="Import presets"
                          asChild
                        >
                          <span>
                            <FileUp className="w-3 h-3 mr-1" />
                            Import
                          </span>
                        </Button>
                        <input
                          type="file"
                          accept=".json"
                          className="hidden"
                          onChange={importPresets}
                        />
                      </label>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(savedPresets).map(([key, preset]) => {
                      const isActive = selectedPreset === key;
                      return (
                        <div
                          key={key}
                          className={`group flex items-center gap-1 px-3 py-1.5 rounded-full border-2 transition-all ${
                            isActive 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <button
                            onClick={() => applyPreset(key)}
                            className="flex items-center gap-1"
                          >
                            <Star className={`w-3 h-3 ${isActive ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                            <span className={`text-sm ${isActive ? 'text-primary font-medium' : ''}`}>
                              {preset.label}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSavedPreset(key);
                            }}
                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Import button when no presets exist */}
              {Object.keys(savedPresets).length === 0 && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>No saved presets yet.</span>
                  <label className="cursor-pointer text-primary hover:underline">
                    Import presets
                    <input
                      type="file"
                      accept=".json"
                      className="hidden"
                      onChange={importPresets}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Video Settings */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label>Quality:</Label>
                <Select 
                  value={videoSettings.quality} 
                  onValueChange={(v) => {
                    setVideoSettings(prev => ({ ...prev, quality: v as 'low' | 'medium' | 'high' }));
                    setSelectedPreset('custom');
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low (500kbps)</SelectItem>
                    <SelectItem value="medium">Medium (1Mbps)</SelectItem>
                    <SelectItem value="high">High (2.5Mbps)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Resolution:</Label>
                <Select 
                  value={`${videoSettings.maxWidth}x${videoSettings.maxHeight}`}
                  onValueChange={(v) => {
                    const [w, h] = v.split('x').map(Number);
                    setVideoSettings(prev => ({ ...prev, maxWidth: w, maxHeight: h }));
                    setSelectedPreset('custom');
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="640x360">360p</SelectItem>
                    <SelectItem value="854x480">480p</SelectItem>
                    <SelectItem value="1280x720">720p</SelectItem>
                    <SelectItem value="1920x1080">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label>Format:</Label>
                <Select 
                  value={videoSettings.outputFormat}
                  onValueChange={(v) => {
                    setVideoSettings(prev => ({ ...prev, outputFormat: v as VideoOutputFormat }));
                    setSelectedPreset('custom');
                  }}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webm">WebM (VP9)</SelectItem>
                    <SelectItem value="mp4">MP4 (H.264)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="flex items-center gap-2 cursor-pointer">
                  {videoSettings.preserveAudio ? (
                    <Volume2 className="w-4 h-4 text-primary" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-muted-foreground" />
                  )}
                  Audio:
                </Label>
                <Switch
                  checked={videoSettings.preserveAudio}
                  onCheckedChange={(checked) => {
                    setVideoSettings(prev => ({ ...prev, preserveAudio: checked }));
                    setSelectedPreset('custom');
                  }}
                />
                <span className="text-sm text-muted-foreground">
                  {videoSettings.preserveAudio ? 'Keep' : 'Remove'}
                </span>
              </div>

              {videoCompressions.some(c => c.status === 'completed') && (
                <Button onClick={downloadAllVideos} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download All Videos
                </Button>
              )}
            </div>

            {/* Video Upload Area */}
            <div 
              className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'video')}
            >
              <Video className={`w-12 h-12 mx-auto mb-4 text-muted-foreground ${isUploading ? 'animate-pulse' : isDragging ? 'text-primary animate-pulse' : ''}`} />
              <h3 className="text-lg font-semibold mb-2">
                {isUploading ? 'Processing Videos...' : isDragging ? 'Drop Videos Here' : 'Upload Videos'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isUploading 
                  ? 'Compressing videos in your browser...' 
                  : 'Click to browse or drag and drop your videos here'
                }
              </p>
              {!isUploading && (
                <p className="text-sm text-muted-foreground">
                  MP4, WebM, MOV • Up to 30 minutes • Multiple files • Processed locally
                </p>
              )}
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*,.mp4,.mov,.webm,.m4v"
                multiple
                style={{ 
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
                onChange={handleVideoChange}
                disabled={isUploading}
              />
            </div>

            {/* Video Settings Display */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Quality: {videoSettings.quality}</Badge>
              <Badge variant="outline">Resolution: {videoSettings.maxWidth}×{videoSettings.maxHeight}</Badge>
              <Badge variant="secondary">Browser Processing</Badge>
            </div>

            {/* Video Queue */}
            <VideoQueue
              queue={videoQueue}
              isProcessing={isQueueProcessing}
              onReorder={reorderQueue}
              onRemove={removeFromQueue}
              onStartProcessing={() => processQueue(videoSettings)}
              onClearQueue={clearQueue}
              onUpdatePriority={updatePriority}
              onSetAllPriority={setAllPriority}
            />

            {/* Video Compression Results */}
            <VideoCompressionResults 
              compressions={videoCompressions}
              onDownload={downloadCompressedVideo}
              onPause={pauseCompression}
              onResume={resumeCompression}
              onCancel={cancelCompression}
              onBatchRename={() => setShowBatchRename(true)}
            />

            {/* Batch Rename Dialog */}
            <BatchRenameDialog
              isOpen={showBatchRename}
              onClose={() => setShowBatchRename(false)}
              compressions={videoCompressions}
              onDownload={downloadWithCustomNames}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};