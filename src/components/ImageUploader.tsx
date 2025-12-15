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
import { Settings, Upload, Crown, Download, Zap, Image, Video, Volume2, VolumeX } from 'lucide-react';
import { CompressionSettings, useImageCompression } from '@/hooks/useImageCompression';
import { useVideoCompression, VideoCompressionSettings, VideoOutputFormat } from '@/hooks/useVideoCompression';
import { VideoCompressionResults } from '@/components/VideoCompressionResults';
import { useToast } from '@/hooks/use-toast';

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
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
    compressVideo,
    compressVideoBatch,
    downloadCompressedVideo,
    downloadAllVideos,
    clearVideoCompressions,
    pauseCompression,
    resumeCompression
  } = useVideoCompression();
  
  const { toast } = useToast();

  useEffect(() => {
    checkSubscription();
  }, []);

  const handleFileSelect = () => {
    if (activeTab === 'video') {
      videoInputRef.current?.click();
    } else {
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
    const files = event.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      const fileArray = Array.from(files);
      
      toast({
        title: "Processing Videos",
        description: `Compressing ${fileArray.length} video(s)...`,
      });

      try {
        if (fileArray.length === 1) {
          await compressVideo(fileArray[0], videoSettings);
        } else {
          await compressVideoBatch(fileArray, videoSettings);
        }
      } catch (error) {
        console.error('Video compression failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
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

      setIsUploading(true);

      toast({
        title: "Processing Videos",
        description: `Compressing ${videoFiles.length} video(s)...`,
      });

      try {
        if (videoFiles.length === 1) {
          await compressVideo(videoFiles[0], videoSettings);
        } else {
          await compressVideoBatch(videoFiles, videoSettings);
        }
      } catch (error) {
        console.error('Video compression failed:', error);
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
            <h2 className="text-2xl font-bold">Media Compression Studio</h2>
            <p className="text-muted-foreground">
              Compress your images and videos with advanced settings
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
            <div className="flex flex-col items-end gap-2">
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
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
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
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Quality: {settings.quality}%</Badge>
              <Badge variant="outline">Size: {settings.maxWidth}×{settings.maxHeight}</Badge>
              <Badge variant="outline">DPI: {settings.dpi}</Badge>
              {requiresSubscription && (
                <Badge variant="destructive">Pro Required</Badge>
              )}
            </div>
          </TabsContent>

          <TabsContent value="video" className="space-y-6 mt-6">
            {/* Video Settings */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Label>Quality:</Label>
                <Select 
                  value={videoSettings.quality} 
                  onValueChange={(v) => setVideoSettings(prev => ({ ...prev, quality: v as 'low' | 'medium' | 'high' }))}
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
                  onValueChange={(v) => setVideoSettings(prev => ({ ...prev, outputFormat: v as VideoOutputFormat }))}
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
                  onCheckedChange={(checked) => setVideoSettings(prev => ({ ...prev, preserveAudio: checked }))}
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
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                isDragging 
                  ? 'border-primary bg-primary/5 scale-[1.02]' 
                  : 'border-border hover:border-primary'
              }`}
              onClick={handleFileSelect}
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
                  MP4, WebM, MOV • Multiple files supported • Processed locally
                </p>
              )}
              
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                multiple
                className="hidden"
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

            {/* Video Compression Results */}
            <VideoCompressionResults 
              compressions={videoCompressions}
              onDownload={downloadCompressedVideo}
              onPause={pauseCompression}
              onResume={resumeCompression}
            />
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};