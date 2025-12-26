import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Video, CheckCircle, XCircle, Loader2, Pause, Play, X, Ban, Eye, Clock, Zap, HardDrive } from 'lucide-react';
import { VideoCompressionResult } from '@/hooks/useVideoCompression';
import { VideoComparison } from './VideoComparison';
import { ShareButton } from './ShareButton';

interface EnhancedVideoProgressProps {
  compressions: VideoCompressionResult[];
  onDownload: (id: string) => void;
  onPause?: (id: string) => void;
  onResume?: (id: string) => void;
  onCancel?: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatTimeRemaining = (seconds: number | undefined): string => {
  if (seconds === undefined || seconds <= 0) return '';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${minutes}m ${secs}s`;
};

export const EnhancedVideoProgress = ({ 
  compressions, 
  onDownload, 
  onPause, 
  onResume, 
  onCancel 
}: EnhancedVideoProgressProps) => {
  const [comparisonVideo, setComparisonVideo] = useState<VideoCompressionResult | null>(null);

  if (compressions.length === 0) return null;

  const completedCount = compressions.filter(c => c.status === 'completed').length;
  const processingCount = compressions.filter(c => c.status === 'processing').length;

  return (
    <>
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Video className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Video Processing</h3>
              <p className="text-sm text-muted-foreground">
                {processingCount > 0 ? `${processingCount} processing` : ''} 
                {processingCount > 0 && completedCount > 0 ? ' • ' : ''}
                {completedCount > 0 ? `${completedCount} ready to download` : ''}
              </p>
            </div>
          </div>
          
          {/* Quick Download All Button */}
          {completedCount > 0 && (
            <Button 
              size="lg"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg"
              onClick={() => {
                compressions
                  .filter(c => c.status === 'completed')
                  .forEach(c => onDownload(c.id));
              }}
            >
              <Download className="w-5 h-5 mr-2" />
              Download All ({completedCount})
            </Button>
          )}
        </div>

        {/* Video Cards */}
        <div className="space-y-4">
          {compressions.map((compression) => (
            <Card 
              key={compression.id} 
              className={`p-5 transition-all duration-300 ${
                compression.status === 'completed' 
                  ? 'border-green-500/50 bg-green-500/5' 
                  : compression.status === 'processing'
                  ? 'border-primary/50 bg-primary/5'
                  : ''
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Video Preview */}
                <div 
                  className="w-full lg:w-48 h-32 bg-muted rounded-lg overflow-hidden flex-shrink-0 cursor-pointer group relative"
                  onClick={() => compression.status === 'completed' && setComparisonVideo(compression)}
                >
                  {compression.originalUrl && (
                    <video 
                      src={compression.compressedUrl || compression.originalUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  {compression.status === 'processing' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="text-center">
                        <div className="relative w-16 h-16 mx-auto">
                          <svg className="w-16 h-16 transform -rotate-90">
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              className="text-white/20"
                            />
                            <circle
                              cx="32"
                              cy="32"
                              r="28"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                              strokeDasharray={175.93}
                              strokeDashoffset={175.93 - (compression.progress / 100) * 175.93}
                              className="text-primary transition-all duration-300"
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-lg">
                            {Math.round(compression.progress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  {compression.status === 'completed' && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-4">
                  {/* File Info & Status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-lg truncate max-w-[300px]">
                      {compression.fileName}
                    </span>
                    {compression.status === 'processing' && (
                      <Badge className="bg-primary/20 text-primary border-primary/30 animate-pulse">
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Compressing
                      </Badge>
                    )}
                    {compression.status === 'paused' && (
                      <Badge variant="secondary">
                        <Pause className="w-3 h-3 mr-1" />
                        Paused
                      </Badge>
                    )}
                    {compression.status === 'completed' && (
                      <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ready
                      </Badge>
                    )}
                    {compression.status === 'failed' && (
                      <Badge variant="destructive">
                        <XCircle className="w-3 h-3 mr-1" />
                        Failed
                      </Badge>
                    )}
                    {compression.status === 'cancelled' && (
                      <Badge variant="secondary">
                        <Ban className="w-3 h-3 mr-1" />
                        Cancelled
                      </Badge>
                    )}
                  </div>

                  {/* Progress Bar for Processing */}
                  {(compression.status === 'processing' || compression.status === 'paused') && (
                    <div className="space-y-2">
                      <div className="relative">
                        <Progress 
                          value={compression.progress} 
                          className="h-3 bg-muted"
                        />
                        {/* Animated glow effect */}
                        <div 
                          className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary via-primary to-primary/50 rounded-full transition-all duration-300"
                          style={{ width: `${compression.progress}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg animate-pulse" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <span className="font-medium text-primary">
                            {compression.progress.toFixed(1)}% complete
                          </span>
                          {compression.estimatedTimeRemaining !== undefined && compression.estimatedTimeRemaining > 0 && (
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="w-4 h-4" />
                              {formatTimeRemaining(compression.estimatedTimeRemaining)} remaining
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Zap className="w-4 h-4" />
                          Processing...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completed Stats */}
                  {compression.status === 'completed' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Original</p>
                        <p className="font-semibold">{formatFileSize(compression.originalSize)}</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Compressed</p>
                        <p className="font-semibold text-primary">{formatFileSize(compression.compressedSize)}</p>
                      </div>
                      <div className="text-center p-3 bg-green-500/10 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Saved</p>
                        <p className="font-bold text-green-600">
                          {compression.compressionRatio > 0 
                            ? `-${compression.compressionRatio.toFixed(1)}%`
                            : 'N/A'
                          }
                        </p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Format</p>
                        <p className="font-semibold uppercase">{compression.outputFormat || 'webm'}</p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {compression.status === 'failed' && compression.error && (
                    <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                      {compression.error}
                    </p>
                  )}
                </div>

                {/* Action Buttons - Always Visible */}
                <div className="flex flex-row lg:flex-col gap-2 lg:w-auto justify-end">
                  {compression.status === 'processing' && onPause && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onPause(compression.id)}
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {compression.status === 'paused' && onResume && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onResume(compression.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {(compression.status === 'processing' || compression.status === 'paused') && onCancel && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onCancel(compression.id)}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  )}
                  {compression.status === 'completed' && (
                    <>
                      <Button 
                        size="lg"
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                        onClick={() => onDownload(compression.id)}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setComparisonVideo(compression)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <ShareButton 
                          imageData={compression.compressedUrl}
                          fileName={compression.fileName}
                          isVideo={true}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Video Comparison Dialog */}
      {comparisonVideo && (
        <VideoComparison
          compression={comparisonVideo}
          isOpen={!!comparisonVideo}
          onClose={() => setComparisonVideo(null)}
        />
      )}
    </>
  );
};
