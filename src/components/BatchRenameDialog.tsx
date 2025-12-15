import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, FileText, Info } from 'lucide-react';
import { VideoCompressionResult } from '@/hooks/useVideoCompression';

interface BatchRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  compressions: VideoCompressionResult[];
  onDownload: (renamedFiles: { compression: VideoCompressionResult; newName: string }[]) => void;
}

const PATTERN_TOKENS = [
  { token: '{original}', description: 'Original filename (without extension)' },
  { token: '{date}', description: 'Current date (YYYY-MM-DD)' },
  { token: '{time}', description: 'Current time (HH-MM-SS)' },
  { token: '{num}', description: 'Sequential number (001, 002...)' },
  { token: '{size}', description: 'File size (e.g., 2.5MB)' },
  { token: '{ratio}', description: 'Compression ratio (e.g., 45%)' },
];

const PRESET_PATTERNS = [
  { label: 'Compressed + Original', pattern: 'compressed_{original}' },
  { label: 'Date + Original', pattern: '{date}_{original}' },
  { label: 'Numbered', pattern: 'video_{num}' },
  { label: 'Original + Size', pattern: '{original}_{size}' },
  { label: 'Full Timestamp', pattern: '{date}_{time}_{original}' },
];

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i];
};

export const BatchRenameDialog = ({ isOpen, onClose, compressions, onDownload }: BatchRenameDialogProps) => {
  const [pattern, setPattern] = useState('compressed_{original}');
  const [startNumber, setStartNumber] = useState(1);

  const completedCompressions = compressions.filter(c => c.status === 'completed' && c.compressedVideo);

  const applyPattern = (comp: VideoCompressionResult, index: number): string => {
    const now = new Date();
    const originalName = comp.fileName.replace(/\.[^/.]+$/, '');
    
    let result = pattern
      .replace(/{original}/g, originalName)
      .replace(/{date}/g, now.toISOString().split('T')[0])
      .replace(/{time}/g, now.toTimeString().split(' ')[0].replace(/:/g, '-'))
      .replace(/{num}/g, String(startNumber + index).padStart(3, '0'))
      .replace(/{size}/g, formatFileSize(comp.compressedSize))
      .replace(/{ratio}/g, `${Math.round(comp.compressionRatio)}pct`);

    // Sanitize filename
    result = result.replace(/[<>:"/\\|?*]/g, '_');
    
    return result;
  };

  const previewNames = useMemo(() => {
    return completedCompressions.map((comp, index) => ({
      compression: comp,
      newName: applyPattern(comp, index)
    }));
  }, [completedCompressions, pattern, startNumber]);

  const handleDownload = () => {
    onDownload(previewNames);
    onClose();
  };

  const insertToken = (token: string) => {
    setPattern(prev => prev + token);
  };

  if (completedCompressions.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Batch Rename & Download
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pattern Input */}
          <div className="space-y-2">
            <Label>Naming Pattern</Label>
            <div className="flex gap-2">
              <Input
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                placeholder="Enter naming pattern..."
                className="flex-1"
              />
              <Select onValueChange={(v) => setPattern(v)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Presets" />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_PATTERNS.map((preset) => (
                    <SelectItem key={preset.pattern} value={preset.pattern}>
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Token Buttons */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="w-3 h-3" />
              Click to insert tokens
            </Label>
            <div className="flex flex-wrap gap-2">
              {PATTERN_TOKENS.map((item) => (
                <Button
                  key={item.token}
                  variant="outline"
                  size="sm"
                  onClick={() => insertToken(item.token)}
                  className="text-xs"
                  title={item.description}
                >
                  {item.token}
                </Button>
              ))}
            </div>
          </div>

          {/* Start Number */}
          <div className="flex items-center gap-4">
            <Label className="text-sm">Start numbering from:</Label>
            <Input
              type="number"
              value={startNumber}
              onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-20"
              min={1}
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Preview ({completedCompressions.length} files)</span>
              <Badge variant="secondary">.{completedCompressions[0]?.outputFormat || 'webm'}</Badge>
            </Label>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-3 space-y-2">
                {previewNames.map(({ compression, newName }, index) => (
                  <div 
                    key={compression.id} 
                    className="flex items-center gap-3 p-2 rounded bg-muted/50 text-sm"
                  >
                    <span className="text-muted-foreground w-8 text-right">{index + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground truncate">{compression.fileName}</p>
                      <p className="font-medium truncate text-primary">
                        {newName}.{compression.outputFormat || 'webm'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatFileSize(compression.compressedSize)}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download {completedCompressions.length} File(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};