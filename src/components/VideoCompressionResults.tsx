import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Video, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { VideoCompressionResult } from '@/hooks/useVideoCompression';

interface VideoCompressionResultsProps {
  compressions: VideoCompressionResult[];
  onDownload: (id: string) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const VideoCompressionResults = ({ compressions, onDownload }: VideoCompressionResultsProps) => {
  if (compressions.length === 0) return null;

  return (
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
              <div className="w-32 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                {compression.originalUrl && (
                  <video 
                    src={compression.compressedUrl || compression.originalUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
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
                </div>

                {compression.status === 'processing' && (
                  <div className="space-y-1">
                    <Progress value={compression.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {compression.progress.toFixed(0)}% complete
                    </p>
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

              {/* Download Button */}
              {compression.status === 'completed' && (
                <Button 
                  size="sm" 
                  onClick={() => onDownload(compression.id)}
                  className="flex-shrink-0"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
