import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';
import { VideoCompressionResult } from '@/hooks/useVideoCompression';

interface VideoComparisonProps {
  compression: VideoCompressionResult;
  isOpen: boolean;
  onClose: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const VideoComparison = ({ compression, isOpen, onClose }: VideoComparisonProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [viewMode, setViewMode] = useState<'side-by-side' | 'overlay'>('side-by-side');
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  const originalVideoRef = useRef<HTMLVideoElement>(null);
  const compressedVideoRef = useRef<HTMLVideoElement>(null);

  const syncVideos = () => {
    if (originalVideoRef.current && compressedVideoRef.current) {
      compressedVideoRef.current.currentTime = originalVideoRef.current.currentTime;
    }
  };

  const togglePlay = () => {
    if (originalVideoRef.current && compressedVideoRef.current) {
      if (isPlaying) {
        originalVideoRef.current.pause();
        compressedVideoRef.current.pause();
      } else {
        originalVideoRef.current.play();
        compressedVideoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (originalVideoRef.current && compressedVideoRef.current) {
      originalVideoRef.current.muted = !isMuted;
      compressedVideoRef.current.muted = true; // Always mute compressed to avoid echo
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (originalVideoRef.current) {
      setCurrentTime(originalVideoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (originalVideoRef.current) {
      setDuration(originalVideoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (originalVideoRef.current && compressedVideoRef.current) {
      originalVideoRef.current.currentTime = time;
      compressedVideoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const restart = () => {
    if (originalVideoRef.current && compressedVideoRef.current) {
      originalVideoRef.current.currentTime = 0;
      compressedVideoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const handleSliderMove = (clientX: number, rect: DOMRect) => {
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.max(5, Math.min((x / rect.width) * 100, 95));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.clientX, rect);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    handleSliderMove(e.touches[0].clientX, rect);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!compression.originalUrl || !compression.compressedUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Video Comparison: {compression.fileName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Bar */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Original</Badge>
              <span>{formatFileSize(compression.originalSize)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-600">Compressed</Badge>
              <span>{formatFileSize(compression.compressedSize)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-primary font-semibold">
                {compression.compressionRatio > 0 
                  ? `${compression.compressionRatio.toFixed(1)}% smaller`
                  : 'No size reduction'
                }
              </span>
            </div>
          </div>

          {/* View Mode Tabs */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'side-by-side' | 'overlay')}>
            <TabsList className="grid w-full grid-cols-2 max-w-xs">
              <TabsTrigger value="side-by-side">Side by Side</TabsTrigger>
              <TabsTrigger value="overlay">Overlay Slider</TabsTrigger>
            </TabsList>

            <TabsContent value="side-by-side" className="mt-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Original Video */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Original</Badge>
                    <span className="text-xs text-muted-foreground">{formatFileSize(compression.originalSize)}</span>
                  </div>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={originalVideoRef}
                      src={compression.originalUrl}
                      className="w-full h-full object-contain"
                      muted={isMuted}
                      playsInline
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onSeeked={syncVideos}
                    />
                  </div>
                </div>

                {/* Compressed Video */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="bg-green-600">Compressed</Badge>
                    <span className="text-xs text-muted-foreground">{formatFileSize(compression.compressedSize)}</span>
                    <span className="text-xs text-primary font-medium">-{compression.compressionRatio.toFixed(1)}%</span>
                  </div>
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video
                      ref={compressedVideoRef}
                      src={compression.compressedUrl}
                      className="w-full h-full object-contain"
                      muted
                      playsInline
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="overlay" className="mt-4">
              <div 
                className="relative aspect-video bg-black rounded-lg overflow-hidden cursor-col-resize select-none"
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setIsDragging(false)}
                onTouchStart={() => setIsDragging(true)}
                onTouchEnd={() => setIsDragging(false)}
                onTouchMove={handleTouchMove}
              >
                {/* Compressed Video (Background) */}
                <video
                  ref={compressedVideoRef}
                  src={compression.compressedUrl}
                  className="absolute inset-0 w-full h-full object-contain"
                  muted
                  playsInline
                />
                
                {/* Original Video (Clipped) */}
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                  <video
                    ref={originalVideoRef}
                    src={compression.originalUrl}
                    className="absolute inset-0 w-full h-full object-contain"
                    muted={isMuted}
                    playsInline
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onSeeked={syncVideos}
                  />
                </div>

                {/* Labels */}
                <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold pointer-events-none">
                  Original
                </div>
                <div className="absolute top-4 right-4 bg-green-600/90 text-white px-3 py-1 rounded-full text-sm font-semibold pointer-events-none">
                  Compressed
                </div>

                {/* Slider Line */}
                <div 
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-primary">
                    <div className="flex gap-0.5">
                      <div className="w-0.5 h-4 bg-primary"></div>
                      <div className="w-0.5 h-4 bg-primary"></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Playback Controls */}
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={togglePlay}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="icon" onClick={restart}>
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={toggleMute}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-10">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              />
              <span className="text-xs text-muted-foreground w-10">{formatTime(duration)}</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {viewMode === 'overlay' 
              ? 'Drag the slider to compare original and compressed quality'
              : 'Videos play in sync for easy comparison'
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
