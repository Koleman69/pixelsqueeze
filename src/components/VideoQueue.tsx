import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Video, Trash2, Play, X, Flame, Minus, ArrowDown, GripVertical, Keyboard } from 'lucide-react';
import { QueuedVideo, QueuePriority } from '@/hooks/useVideoCompression';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface VideoQueueProps {
  queue: QueuedVideo[];
  isProcessing: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onStartProcessing: () => void;
  onClearQueue: () => void;
  onUpdatePriority: (id: string, priority: QueuePriority) => void;
  onSetAllPriority: (priority: QueuePriority) => void;
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
  onReorder,
  onRemove, 
  onStartProcessing,
  onClearQueue,
  onUpdatePriority,
  onSetAllPriority
}: VideoQueueProps) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reset selection when queue changes
  useEffect(() => {
    if (selectedIndex !== null && selectedIndex >= queue.length) {
      setSelectedIndex(queue.length > 0 ? queue.length - 1 : null);
    }
  }, [queue.length, selectedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (isProcessing || queue.length === 0) return;
    
    // Only handle keys if the container or its children are focused
    if (!containerRef.current?.contains(document.activeElement) && 
        document.activeElement !== containerRef.current) {
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === null) return 0;
          return Math.max(0, prev - 1);
        });
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          if (prev === null) return 0;
          return Math.min(queue.length - 1, prev + 1);
        });
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        if (selectedIndex !== null && queue[selectedIndex]) {
          onRemove(queue[selectedIndex].id);
        }
        break;
      case '1':
        e.preventDefault();
        if (selectedIndex !== null && queue[selectedIndex]) {
          onUpdatePriority(queue[selectedIndex].id, 'high');
        }
        break;
      case '2':
        e.preventDefault();
        if (selectedIndex !== null && queue[selectedIndex]) {
          onUpdatePriority(queue[selectedIndex].id, 'normal');
        }
        break;
      case '3':
        e.preventDefault();
        if (selectedIndex !== null && queue[selectedIndex]) {
          onUpdatePriority(queue[selectedIndex].id, 'low');
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (queue.length > 0) {
          onStartProcessing();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setSelectedIndex(null);
        containerRef.current?.blur();
        break;
    }
  }, [isProcessing, queue, selectedIndex, onRemove, onUpdatePriority, onStartProcessing]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (queue.length === 0) return null;

  // Count by priority for summary
  const priorityCounts = {
    high: queue.filter(q => q.priority === 'high').length,
    normal: queue.filter(q => q.priority === 'normal').length,
    low: queue.filter(q => q.priority === 'low').length
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (isProcessing) return;
    setDraggedIndex(index);
    setSelectedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isProcessing || draggedIndex === null) return;
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (isProcessing || draggedIndex === null) return;
    
    if (draggedIndex !== toIndex) {
      onReorder(draggedIndex, toIndex);
      setSelectedIndex(toIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleItemClick = (index: number) => {
    setSelectedIndex(index);
    containerRef.current?.focus();
  };

  return (
    <div 
      ref={containerRef}
      className="space-y-4 outline-none"
      tabIndex={0}
    >
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
        <div className="flex gap-2 flex-wrap">
          {/* Batch Priority Controls */}
          <div className="flex items-center gap-1 border rounded-md px-1">
            <span className="text-xs text-muted-foreground px-1">Set all:</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onSetAllPriority('high')}
              disabled={isProcessing}
            >
              <Flame className="w-3 h-3 mr-1" />
              High
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 hover:bg-muted"
              onClick={() => onSetAllPriority('normal')}
              disabled={isProcessing}
            >
              <Minus className="w-3 h-3 mr-1" />
              Normal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => onSetAllPriority('low')}
              disabled={isProcessing}
            >
              <ArrowDown className="w-3 h-3 mr-1" />
              Low
            </Button>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Keyboard className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="text-xs space-y-1">
                  <p className="font-semibold mb-2">Keyboard Shortcuts</p>
                  <p><kbd className="px-1 bg-muted rounded">↑↓</kbd> Navigate items</p>
                  <p><kbd className="px-1 bg-muted rounded">1</kbd> High priority</p>
                  <p><kbd className="px-1 bg-muted rounded">2</kbd> Normal priority</p>
                  <p><kbd className="px-1 bg-muted rounded">3</kbd> Low priority</p>
                  <p><kbd className="px-1 bg-muted rounded">Del</kbd> Remove item</p>
                  <p><kbd className="px-1 bg-muted rounded">Enter</kbd> Start processing</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
        Drag to reorder • Click to select • Use keyboard shortcuts for quick actions
      </p>

      <div className="space-y-2">
        {queue.map((item, index) => {
          const config = priorityConfig[item.priority];
          const PriorityIcon = config.icon;
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index && draggedIndex !== index;
          const isSelected = selectedIndex === index;
          
          return (
            <Card 
              key={item.id} 
              className={`p-3 transition-all duration-200 ${
                isDragging ? 'opacity-50 scale-[0.98]' : ''
              } ${
                isDragOver ? 'border-primary border-2 bg-primary/5' : ''
              } ${
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              } ${
                !isProcessing ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
              draggable={!isProcessing}
              onClick={() => handleItemClick(index)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center gap-3">
                {/* Drag handle */}
                <div className={`flex-shrink-0 ${isProcessing ? 'opacity-30' : 'opacity-60 hover:opacity-100'}`}>
                  <GripVertical className="w-5 h-5 text-muted-foreground" />
                </div>

                {/* Position indicator with priority color */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
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
                  <SelectTrigger className="w-28 h-8" onClick={(e) => e.stopPropagation()}>
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

                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(item.id);
                  }}
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
