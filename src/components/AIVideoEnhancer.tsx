import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Sparkles, 
  Zap, 
  Download, 
  Share2, 
  Play, 
  Pause,
  Trash2,
  CheckCircle2,
  Loader2,
  Video,
  Wand2,
  Minimize2,
  ArrowRight,
  Eye,
  Mail,
  Link2,
  Cloud,
  HardDrive,
  Copy,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { useVideoEnhance, VideoEnhanceResult, ShareOptions } from '@/hooks/useVideoEnhance';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Format file size helper
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Video Card Component
const VideoCard = ({ 
  video, 
  onEnhanceL1, 
  onEnhanceL2, 
  onCompress, 
  onShare, 
  onRemove,
  isProcessing 
}: {
  video: VideoEnhanceResult;
  onEnhanceL1: () => void;
  onEnhanceL2: () => void;
  onCompress: () => void;
  onShare: (options: ShareOptions) => void;
  onRemove: () => void;
  isProcessing: boolean;
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [previewMode, setPreviewMode] = useState<'original' | 'enhanced' | 'compressed'>('original');
  const [customName, setCustomName] = useState('');
  const [emailMessage, setEmailMessage] = useState('Check out this video I enhanced with PixelSqueeze AI Video Boost!');

  const getStatusBadge = () => {
    switch (video.status) {
      case 'uploading':
        return <Badge variant="secondary" className="animate-pulse"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Uploading</Badge>;
      case 'uploaded':
        return <Badge variant="outline" className="text-green-600 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Ready</Badge>;
      case 'enhancing':
        return <Badge className="bg-purple-500"><Sparkles className="w-3 h-3 mr-1 animate-pulse" />Enhancing</Badge>;
      case 'enhanced':
        return <Badge className="bg-gradient-to-r from-purple-500 to-pink-500"><Wand2 className="w-3 h-3 mr-1" />Enhanced L{video.enhanceLevel === 'level2' ? '2' : '1'}</Badge>;
      case 'compressing':
        return <Badge className="bg-blue-500"><Minimize2 className="w-3 h-3 mr-1 animate-pulse" />Compressing</Badge>;
      case 'ready':
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-500"><CheckCircle2 className="w-3 h-3 mr-1" />Ready to Share</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const getCurrentUrl = () => {
    if (previewMode === 'compressed' && video.compressedUrl) return video.compressedUrl;
    if (previewMode === 'enhanced' && video.enhancedUrl) return video.enhancedUrl;
    return video.originalUrl;
  };

  const isEnhancing = video.status === 'enhancing';
  const isCompressing = video.status === 'compressing';
  const canEnhanceL1 = video.status === 'uploaded' && !isProcessing;
  const canEnhanceL2 = video.enhanceLevel === 'level1' && video.status === 'enhanced' && !isProcessing;
  const canCompress = (video.status === 'enhanced' || video.status === 'uploaded') && !isProcessing;
  const canShare = video.status === 'ready' || video.status === 'enhanced';

  return (
    <>
      <Card className="overflow-hidden border-2 hover:border-primary/50 transition-all duration-300">
        <div className="relative aspect-video bg-black/5">
          {/* Video Thumbnail/Preview */}
          <video 
            src={video.originalUrl} 
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
          
          {/* Processing Overlay */}
          {(isEnhancing || isCompressing || video.status === 'uploading') && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
              <Loader2 className="w-10 h-10 animate-spin mb-3" />
              <p className="font-medium mb-2">
                {video.status === 'uploading' ? 'Uploading...' : 
                 isEnhancing ? 'Enhancing Video...' : 'Compressing...'}
              </p>
              <div className="w-48">
                <Progress value={video.progress} className="h-2" />
              </div>
              <p className="text-sm mt-2 text-white/70">{Math.round(video.progress)}%</p>
            </div>
          )}

          {/* Preview Button */}
          {!isEnhancing && !isCompressing && video.status !== 'uploading' && (
            <Button
              variant="secondary"
              size="sm"
              className="absolute bottom-3 right-3 shadow-lg"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            {getStatusBadge()}
          </div>
        </div>

        <CardContent className="p-4">
          {/* File Info */}
          <div className="mb-4">
            <h3 className="font-semibold truncate" title={video.fileName}>{video.fileName}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <span>Original: {formatFileSize(video.originalSize)}</span>
              {video.compressedSize && (
                <>
                  <ArrowRight className="w-3 h-3" />
                  <span className="text-green-600 font-medium">{formatFileSize(video.compressedSize)}</span>
                  <Badge variant="outline" className="text-green-600 border-green-200 text-xs">
                    -{video.estimatedSavings?.toFixed(0)}%
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Enhancement Level Indicator */}
          {video.enhanceLevel !== 'none' && (
            <div className="mb-4 p-2 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <Wand2 className="w-4 h-4 text-purple-500" />
                <span className="font-medium">Enhancement Level {video.enhanceLevel === 'level2' ? '2' : '1'}</span>
                {video.enhanceLevel === 'level1' && (
                  <span className="text-xs text-muted-foreground">(Clarity + Sharpness)</span>
                )}
                {video.enhanceLevel === 'level2' && (
                  <span className="text-xs text-muted-foreground">(Maximum + Edge Definition)</span>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {/* Primary Action Row */}
            <div className="flex gap-2">
              {canEnhanceL1 && (
                <Button 
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={onEnhanceL1}
                  disabled={isProcessing}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Enhance Video (AI)
                </Button>
              )}

              {canEnhanceL2 && (
                <Button 
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700"
                  onClick={onEnhanceL2}
                  disabled={isProcessing}
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Enhance Even More
                </Button>
              )}

              {canCompress && (
                <Button 
                  variant={video.enhanceLevel !== 'none' ? 'secondary' : 'default'}
                  className={video.enhanceLevel === 'none' ? 'flex-1' : ''}
                  onClick={onCompress}
                  disabled={isProcessing}
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Compress Video
                </Button>
              )}
            </div>

            {/* Share Row */}
            {canShare && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => onShare({ platform: 'download' })}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowShare(true)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            )}

            {/* Remove Button */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-muted-foreground hover:text-destructive"
              onClick={onRemove}
              disabled={isProcessing && (isEnhancing || isCompressing)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="w-5 h-5" />
              Video Preview
            </DialogTitle>
            <DialogDescription>{video.fileName}</DialogDescription>
          </DialogHeader>

          {/* Preview Mode Tabs */}
          <Tabs value={previewMode} onValueChange={(v) => setPreviewMode(v as any)} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="original">Original</TabsTrigger>
              {video.enhancedUrl && <TabsTrigger value="enhanced">Enhanced</TabsTrigger>}
              {video.compressedUrl && <TabsTrigger value="compressed">Compressed</TabsTrigger>}
            </TabsList>
            
            <TabsContent value={previewMode} className="mt-4">
              <div className="rounded-lg overflow-hidden bg-black aspect-video">
                <video 
                  key={getCurrentUrl()}
                  src={getCurrentUrl()} 
                  controls 
                  className="w-full h-full"
                  autoPlay={false}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {previewMode === 'original' && `Original: ${formatFileSize(video.originalSize)}`}
                  {previewMode === 'enhanced' && video.enhancedSize && `Enhanced: ${formatFileSize(video.enhancedSize)}`}
                  {previewMode === 'compressed' && video.compressedSize && `Compressed: ${formatFileSize(video.compressedSize)}`}
                </span>
                {previewMode === 'compressed' && video.estimatedSavings && (
                  <Badge variant="outline" className="text-green-600">
                    {video.estimatedSavings.toFixed(1)}% smaller
                  </Badge>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share Video
            </DialogTitle>
            <DialogDescription>Choose how you want to share your enhanced video</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Custom Name */}
            <div className="space-y-2">
              <Label htmlFor="customName">File Name (optional)</Label>
              <Input 
                id="customName"
                placeholder="my-awesome-video"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>

            {/* Download & Storage */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Download & Storage</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => { onShare({ platform: 'download', customName }); setShowShare(false); }}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => onShare({ platform: 'icloud', customName })}>
                  <Cloud className="w-4 h-4 mr-2" />
                  iCloud
                </Button>
              </div>
            </div>

            {/* Cloud Integrations */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Cloud Storage</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => onShare({ platform: 'gdrive', customName })}>
                  <HardDrive className="w-4 h-4 mr-2" />
                  Google Drive
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => onShare({ platform: 'dropbox', customName })}>
                  <HardDrive className="w-4 h-4 mr-2" />
                  Dropbox
                </Button>
              </div>
            </div>

            {/* Share Link */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Share Link</Label>
              <Button variant="outline" className="w-full justify-start" onClick={() => { onShare({ platform: 'link', customName }); setShowShare(false); }}>
                <Link2 className="w-4 h-4 mr-2" />
                Generate Shareable Link
                <Copy className="w-4 h-4 ml-auto" />
              </Button>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Email</Label>
              <Textarea 
                placeholder="Add a message..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="justify-start" onClick={() => { onShare({ platform: 'gmail', customName, message: emailMessage }); setShowShare(false); }}>
                  <Mail className="w-4 h-4 mr-2" />
                  Gmail
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => { onShare({ platform: 'outlook', customName, message: emailMessage }); setShowShare(false); }}>
                  <Mail className="w-4 h-4 mr-2" />
                  Outlook
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => { onShare({ platform: 'yahoo', customName, message: emailMessage }); setShowShare(false); }}>
                  <Mail className="w-4 h-4 mr-2" />
                  Yahoo Mail
                </Button>
                <Button variant="outline" className="justify-start" onClick={() => { onShare({ platform: 'mail', customName, message: emailMessage }); setShowShare(false); }}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Default Mail
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Main Component
export const AIVideoEnhancer = () => {
  const { 
    videos, 
    isProcessing, 
    uploadVideo, 
    enhanceLevel1, 
    enhanceLevel2, 
    compressVideo, 
    shareVideo, 
    removeVideo,
    clearAll
  } = useVideoEnhance();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('video/'));
    for (const file of files) {
      await uploadVideo(file);
    }
  }, [uploadVideo]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (const file of Array.from(files)) {
        await uploadVideo(file);
      }
    }
    e.target.value = '';
  }, [uploadVideo]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <Badge variant="outline" className="mb-4 px-4 py-2 border-primary text-primary">
          <Sparkles className="w-4 h-4 mr-2" />
          AI Video Boost
        </Badge>
        <h2 className="text-3xl font-bold mb-2">AI Video Enhance</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload, enhance, and compress your videos with AI. Lightning fast processing for HD and 4K quality.
        </p>
      </div>

      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-all duration-300 ${
          isDragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className={`p-4 rounded-full mb-4 transition-all ${
            isDragOver ? 'bg-primary/20 scale-110' : 'bg-muted'
          }`}>
            <Upload className={`w-8 h-8 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
          </div>
          
          <h3 className="text-lg font-semibold mb-2">
            {isDragOver ? 'Drop your videos here!' : 'Upload Videos'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">
            Drag and drop your videos here, or click to browse. Supports HD and 4K videos up to 2GB.
          </p>
          
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            onClick={() => fileInputRef.current?.click()}
          >
            <Video className="w-5 h-5 mr-2" />
            Select Videos
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </CardContent>
      </Card>

      {/* Video Grid */}
      {videos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Video className="w-5 h-5" />
              Your Videos
              <Badge variant="secondary">{videos.length}</Badge>
            </h3>
            {videos.length > 1 && (
              <Button variant="outline" size="sm" onClick={clearAll} disabled={isProcessing}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map(video => (
              <VideoCard
                key={video.id}
                video={video}
                onEnhanceL1={() => enhanceLevel1(video.id)}
                onEnhanceL2={() => enhanceLevel2(video.id)}
                onCompress={() => compressVideo(video.id)}
                onShare={(options) => shareVideo(video.id, options)}
                onRemove={() => removeVideo(video.id)}
                isProcessing={isProcessing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Workflow Guide */}
      {videos.length === 0 && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-none">
          <CardContent className="py-8">
            <h3 className="text-lg font-semibold text-center mb-6">How It Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { icon: Upload, title: 'Upload', desc: 'Drop or select your video' },
                { icon: Sparkles, title: 'Enhance (L1)', desc: 'AI improves clarity & sharpness' },
                { icon: Zap, title: 'Enhance (L2)', desc: 'Maximum edge definition' },
                { icon: Minimize2, title: 'Compress', desc: 'Reduce size, keep quality' },
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center p-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 text-white">
                    <step.icon className="w-6 h-6" />
                  </div>
                  <h4 className="font-medium">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIVideoEnhancer;
