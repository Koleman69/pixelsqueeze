import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Video, CheckCircle, XCircle, Loader2, Pause, Play, X, Ban, Eye } from 'lucide-react';
import { VideoCompressionResult } from '@/hooks/useVideoCompression';
import { VideoComparison } from './VideoComparison';

interface VideoCompressionResultsProps {
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
  if (seconds < 60) return `~${Math.ceil(seconds)}s remaining`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `~${minutes}m ${secs}s remaining`;
};

export const VideoCompressionResults = ({ compressions, onDownload, onPause, onResume, onCancel }: VideoCompressionResultsProps) => {
  const [comparisonVideo, setComparisonVideo] = useState<VideoCompressionResult | null>(null);

  if (compressions.length === 0) return null;

  return (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Compression Results
        </h3>
        
        <div className="grid gap-4">
          {compressions.map((compression) => (
            <Card key={compression.id} className="p-4">
              <div className="flex items-start gap-4">
                {/* Video Preview */}
                <div 
                  className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0 cursor-pointer group relative"
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
                  {compression.status === 'completed' && (
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Eye className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium truncate">{compression.fileName}</span>
                    {compression.status === 'processing' && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Processing
                      </Badge>
                    )}
                    {compression.status === 'paused' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Pause className="w-3 h-3" />
                        Paused
                      </Badge>
                    )}
                    {compression.status === 'completed' && (
                      <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Completed
                      </Badge>
                    )}
                    {compression.status === 'failed' && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </Badge>
                    )}
                    {compression.status === 'cancelled' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Ban className="w-3 h-3" />
                        Cancelled
                      </Badge>
                    )}
                  </div>

                  {(compression.status === 'processing' || compression.status === 'paused') && (
                    <div className="space-y-1">
                      <Progress value={compression.progress} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{compression.progress.toFixed(0)}% complete</span>
                        {compression.status === 'processing' && compression.estimatedTimeRemaining !== undefined && compression.estimatedTimeRemaining > 0 && (
                          <span className="text-primary">{formatTimeRemaining(compression.estimatedTimeRemaining)}</span>
                        )}
                        {compression.status === 'paused' && (
                          <span className="text-muted-foreground">Paused</span>
                        )}
                      </div>
                    </div>
                  )}

                  {compression.status === 'completed' && (
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span>Original: {formatFileSize(compression.originalSize)}</span>
                      <span>Compressed: {formatFileSize(compression.compressedSize)}</span>
                      <span className="text-primary font-medium">
                        {compression.compressionRatio > 0 
                          ? `-${compression.compressionRatio.toFixed(1)}%`
                          : 'No reduction'
                        }
                      </span>
                      {compression.outputFormat && (
                        <span className="uppercase font-medium">{compression.outputFormat}</span>
                      )}
                    </div>
                  )}

                  {compression.status === 'failed' && compression.error && (
                    <p className="text-sm text-destructive">{compression.error}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex-shrink-0 flex gap-2">
                  {compression.status === 'processing' && onPause && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onPause(compression.id)}
                    >
                      <Pause className="w-4 h-4" />
                    </Button>
                  )}
                  {compression.status === 'paused' && onResume && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onResume(compression.id)}
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  {(compression.status === 'processing' || compression.status === 'paused') && onCancel && (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => onCancel(compression.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {compression.status === 'completed' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setComparisonVideo(compression)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Compare
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => onDownload(compression.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
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
