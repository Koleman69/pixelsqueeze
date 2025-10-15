import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Settings, Upload, Crown, Download, Zap } from 'lucide-react';
import { CompressionSettings, useImageCompression } from '@/hooks/useImageCompression';
import { useToast } from '@/hooks/use-toast';
import { useRef, useEffect } from 'react';

interface ImageUploaderProps {
  onUpload?: (files: FileList) => void;
}

export const ImageUploader = ({ onUpload }: ImageUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 80,
    maxWidth: 1920,
    maxHeight: 1920,
    dpi: 72
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { 
    compressImages, 
    subscription, 
    checkSubscription, 
    createCheckout,
    openCustomerPortal,
    downloadBulk,
    compressions 
  } = useImageCompression();
  
  const { toast } = useToast();

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
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
      } catch (error) {
        console.error('Compression failed:', error);
      } finally {
        setIsUploading(false);
      }
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Image Compression Studio</h2>
            <p className="text-muted-foreground">
              Upload and compress your images with advanced settings
            </p>
          </div>
          
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
            <Button onClick={createCheckout} className="bg-gradient-primary">
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Pro - $6.95/month
            </Button>
          )}
        </div>

        {/* Settings */}
        <div className="flex items-center gap-4">
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Compression Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Compression Settings</DialogTitle>
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

        {/* Upload Area */}
        <div 
          className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
          onClick={handleFileSelect}
        >
          <Upload className={`w-12 h-12 mx-auto mb-4 text-muted-foreground ${isUploading ? 'animate-bounce' : ''}`} />
          <h3 className="text-lg font-semibold mb-2">
            {isUploading ? 'Processing Images...' : 'Upload Images'}
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

        {/* Current Settings Display */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">Quality: {settings.quality}%</Badge>
          <Badge variant="outline">Size: {settings.maxWidth}×{settings.maxHeight}</Badge>
          <Badge variant="outline">DPI: {settings.dpi}</Badge>
          {requiresSubscription && (
            <Badge variant="destructive">Pro Required</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};