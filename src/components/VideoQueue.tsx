import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Trash2, ChevronUp, ChevronDown, Play, X } from 'lucide-react';
import { QueuedVideo } from '@/hooks/useVideoCompression';

interface VideoQueueProps {
  queue: QueuedVideo[];
  isProcessing: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onStartProcessing: () => void;
  onClearQueue: () => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const VideoQueue = ({ 
  queue, 
  isProcessing,
  onMoveUp, 
  onMoveDown, 
  onRemove, 
  onStartProcessing,
  onClearQueue 
}: VideoQueueProps) => {
  if (queue.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Video className="w-5 h-5" />
          Compression Queue
          <Badge variant="secondary">{queue.length} video{queue.length > 1 ? 's' : ''}</Badge>
        </h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearQueue}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-1" />
            Clear Queue
          </Button>
          <Button 
            size="sm" 
            onClick={onStartProcessing}
            disabled={isProcessing || queue.length === 0}
          >
            <Play className="w-4 h-4 mr-1" />
            {isProcessing ? 'Processing...' : 'Start Compression'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {queue.map((item, index) => (
          <Card key={item.id} className="p-3">
            <div className="flex items-center gap-3">
              {/* Position indicator */}
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>

              {/* Video info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.fileName}</p>
                <p className="text-sm text-muted-foreground">{formatFileSize(item.fileSize)}</p>
              </div>

              {/* Reorder buttons */}
              <div className="flex flex-col gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMoveUp(item.id)}
                  disabled={index === 0 || isProcessing}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onMoveDown(item.id)}
                  disabled={index === queue.length - 1 || isProcessing}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>

              {/* Remove button */}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive hover:text-destructive"
                onClick={() => onRemove(item.id)}
                disabled={isProcessing}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
