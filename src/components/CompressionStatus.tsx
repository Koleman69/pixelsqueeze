import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, XCircle, Download, Eye } from "lucide-react";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface CompressionStatusProps {
  id?: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  status: "completed" | "processing" | "failed";
  error?: string;
  originalImage?: string;
  compressedImage?: string;
}

export const CompressionStatus = ({ 
  id,
  fileName, 
  originalSize, 
  compressedSize, 
  compressionRatio, 
  quality, 
  status,
  error,
  originalImage,
  compressedImage
}: CompressionStatusProps) => {
  const [showSlider, setShowSlider] = useState(false);
  const { toast } = useToast();
  
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

  const handleDownload = () => {
    if (compressedImage) {
      try {
        // Convert base64 to binary data for better browser compatibility
        const base64Data = compressedImage;
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        // Infer MIME type from file extension
        const extension = fileName.toLowerCase().split('.').pop();
        let mimeType = 'image/jpeg';
        if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'gif') mimeType = 'image/gif';

        const blob = new Blob([bytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `compressed_${fileName}`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: "Download Started",
          description: `Downloading ${fileName}`,
        });
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download Failed",
          description: "We couldn't start the download. Please try again.",
          variant: "destructive",
        });
      }
    }
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
          {originalImage && compressedImage && (
            <div className="mb-4">
              <BeforeAfterSlider
                beforeImage={originalImage}
                afterImage={`data:image/jpeg;base64,${compressedImage}`}
                title={fileName}
                description={`${compressionRatio}% size reduction with ${quality}% quality retained`}
              />
            </div>
          )}

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
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
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