import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, XCircle, Download, Eye } from "lucide-react";

interface CompressionStatusProps {
  id?: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  status: "completed" | "processing" | "failed";
  error?: string;
}

export const CompressionStatus = ({ 
  id,
  fileName, 
  originalSize, 
  compressedSize, 
  compressionRatio, 
  quality, 
  status,
  error
}: CompressionStatusProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'completed': return 'profit';
      case 'processing': return 'warning';
      case 'failed': return 'loss';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'processing': return <AlertCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
    }
  };

  const statusColor = getStatusColor();
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {fileName}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <Badge 
              variant="outline" 
              className={
                statusColor === 'profit' ? 'border-profit text-profit' :
                statusColor === 'loss' ? 'border-loss text-loss' :
                'border-warning text-warning'
              }
            >
              {getStatusIcon()}
              <span className="ml-1 uppercase">{status}</span>
            </Badge>
            {status === 'completed' && (
              <Badge variant="secondary">
                {compressionRatio}% smaller
              </Badge>
            )}
          </div>
        </div>
      </div>

      {status === 'completed' && (
        <>
          <div className="space-y-3 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Original Size</span>
              <span className="text-sm font-medium">{formatFileSize(originalSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Compressed Size</span>
              <span className="text-sm font-medium text-profit">{formatFileSize(compressedSize)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Quality Retained</span>
              <span className="text-sm font-medium">{quality}%</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={status === 'completed' ? 'default' : 'outline'}
              className={status === 'completed' ? 'bg-gradient-profit hover:opacity-90' : ''}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
          </div>
        </>
      )}

      {status === 'processing' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Processing...</span>
            <span className="text-sm font-medium text-warning">Please wait</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div className="bg-warning rounded-full h-2 w-2/3 animate-pulse"></div>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-3">
          <div className="text-destructive text-sm">
            {error || 'Compression failed. Please try again.'}
          </div>
          <Button size="sm" variant="outline" className="w-full">
            Try Again
          </Button>
        </div>
      )}
    </Card>
  );
};