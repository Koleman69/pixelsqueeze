import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Trash2, ChevronUp, ChevronDown, Play, X, Flame, Minus, ArrowDown } from 'lucide-react';
import { QueuedVideo, QueuePriority } from '@/hooks/useVideoCompression';

interface VideoQueueProps {
  queue: QueuedVideo[];
  isProcessing: boolean;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onRemove: (id: string) => void;
  onStartProcessing: () => void;
  onClearQueue: () => void;
  onUpdatePriority: (id: string, priority: QueuePriority) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const priorityConfig: Record<QueuePriority, { label: string; icon: typeof Flame; className: string }> = {
  high: { label: 'High', icon: Flame, className: 'text-red-500' },
  normal: { label: 'Normal', icon: Minus, className: 'text-muted-foreground' },
  low: { label: 'Low', icon: ArrowDown, className: 'text-blue-500' }
};

export const VideoQueue = ({ 
  queue, 
  isProcessing,
  onMoveUp, 
  onMoveDown, 
  onRemove, 
  onStartProcessing,
  onClearQueue,
  onUpdatePriority
}: VideoQueueProps) => {
  if (queue.length === 0) return null;

  // Count by priority for summary
  const priorityCounts = {
    high: queue.filter(q => q.priority === 'high').length,
    normal: queue.filter(q => q.priority === 'normal').length,
    low: queue.filter(q => q.priority === 'low').length
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="w-5 h-5" />
            Compression Queue
          </h3>
          <Badge variant="secondary">{queue.length} video{queue.length > 1 ? 's' : ''}</Badge>
          {priorityCounts.high > 0 && (
            <Badge variant="outline" className="text-red-500 border-red-200">
              <Flame className="w-3 h-3 mr-1" />
              {priorityCounts.high} High
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClearQueue}
            disabled={isProcessing}
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
          <Button 
            size="sm" 
            onClick={onStartProcessing}
            disabled={isProcessing || queue.length === 0}
          >
            <Play className="w-4 h-4 mr-1" />
            {isProcessing ? 'Processing...' : 'Start'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        High priority videos will be processed first when starting compression.
      </p>

      <div className="space-y-2">
        {queue.map((item, index) => {
          const config = priorityConfig[item.priority];
          const PriorityIcon = config.icon;
          
          return (
            <Card key={item.id} className="p-3">
              <div className="flex items-center gap-3">
                {/* Position indicator with priority color */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  item.priority === 'high' ? 'bg-red-100 text-red-600' :
                  item.priority === 'low' ? 'bg-blue-100 text-blue-600' :
                  'bg-muted'
                }`}>
                  {index + 1}
                </div>

                {/* Video info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.fileName}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(item.fileSize)}</p>
                </div>

                {/* Priority selector */}
                <Select
                  value={item.priority}
                  onValueChange={(value: QueuePriority) => onUpdatePriority(item.id, value)}
                  disabled={isProcessing}
                >
                  <SelectTrigger className="w-28 h-8">
                    <div className="flex items-center gap-1">
                      <PriorityIcon className={`w-3 h-3 ${config.className}`} />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flame className="w-3 h-3 text-red-500" />
                        High
                      </div>
                    </SelectItem>
                    <SelectItem value="normal">
                      <div className="flex items-center gap-2">
                        <Minus className="w-3 h-3 text-muted-foreground" />
                        Normal
                      </div>
                    </SelectItem>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <ArrowDown className="w-3 h-3 text-blue-500" />
                        Low
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

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
          );
        })}
      </div>
    </div>
  );
};
