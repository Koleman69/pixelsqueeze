import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, X, Sparkles, Loader2, CheckCircle, AlertCircle, Image as ImageIcon } from "lucide-react";
import { ProcessedFile, AnalysisResult } from "@/types/analysis";
import { GeminiService } from "@/services/geminiService";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FileProcessorProps {
  onAnalysisComplete: (result: AnalysisResult) => void;
}

export const FileProcessor = ({ onAnalysisComplete }: FileProcessorProps) => {
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const processFile = async (processedFile: ProcessedFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === processedFile.id ? { ...f, status: 'analyzing', progress: 50 } : f
      ));

      const isImage = GeminiService.isImageFile(processedFile.file);
      const fileType = GeminiService.getFileTypeCategory(processedFile.file);
      
      let content = '';
      let imageData: string | undefined;

      if (isImage) {
        imageData = await GeminiService.readImageAsBase64(processedFile.file);
      } else {
        content = await GeminiService.readFileContent(processedFile.file);
      }

      const result = await GeminiService.analyzeFile({
        fileName: processedFile.file.name,
        fileType,
        fileSize: processedFile.file.size,
        content,
        analysisType: 'detailed',
        isImage,
        imageData
      });

      const analysisResult: AnalysisResult = {
        id: processedFile.id,
        ...result,
        timestamp: new Date(),
        status: 'completed'
      };

      setFiles(prev => prev.map(f => 
        f.id === processedFile.id 
          ? { ...f, status: 'completed', progress: 100, result: analysisResult } 
          : f
      ));

      onAnalysisComplete(analysisResult);
      
      toast({
        title: isImage ? "Image Analyzed" : "Analysis Complete",
        description: `${processedFile.file.name} has been analyzed successfully.`,
      });

    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === processedFile.id 
          ? { ...f, status: 'error', progress: 0 } 
          : f
      ));
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const addFiles = async (newFiles: File[]) => {
    const processed: ProcessedFile[] = await Promise.all(newFiles.map(async file => {
      const isImage = GeminiService.isImageFile(file);
      let preview: string | undefined;
      
      if (isImage) {
        preview = await GeminiService.readImageAsBase64(file);
      }
      
      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview,
        status: 'pending' as const,
        progress: 0,
        isImage
      };
    }));
    
    setFiles(prev => [...prev, ...processed]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const analyzeFile = (processedFile: ProcessedFile) => {
    processFile(processedFile);
  };

  const analyzeAll = () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    pendingFiles.forEach(f => processFile(f));
  };

  const getStatusIcon = (pf: ProcessedFile) => {
    switch (pf.status) {
      case 'analyzing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return pf.isImage 
          ? <ImageIcon className="h-4 w-4 text-purple-500" />
          : <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Sparkles className="h-5 w-5 text-primary" />
          AI File Analyzer
          <Badge variant="secondary" className="ml-2 text-xs">Vision AI</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
            isDragging 
              ? "border-primary bg-primary/10 scale-[1.02]" 
              : "border-border/50 hover:border-primary/50"
          )}
        >
          <Upload className={cn(
            "h-12 w-12 mx-auto mb-4 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
          <p className="text-foreground font-medium mb-1">Drop files or images here</p>
          <p className="text-sm text-muted-foreground mb-4">
            AI vision analysis for images • Document insights for files
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept="*/*"
            />
            <Button variant="outline" size="sm" asChild>
              <span>Browse Files</span>
            </Button>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Files ({files.length})
              </span>
              {files.some(f => f.status === 'pending') && (
                <Button size="sm" onClick={analyzeAll} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Analyze All
                </Button>
              )}
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {files.map((pf) => (
                <div
                  key={pf.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {/* Image preview or icon */}
                  {pf.isImage && pf.preview ? (
                    <img 
                      src={pf.preview} 
                      alt={pf.file.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    getStatusIcon(pf)
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {pf.file.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          pf.isImage && "border-purple-500/50 text-purple-500"
                        )}
                      >
                        {pf.isImage ? "🖼️ Image" : GeminiService.getFileTypeCategory(pf.file)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {(pf.file.size / 1024).toFixed(1)} KB
                      </span>
                      {pf.status === 'analyzing' && (
                        <span className="text-xs text-primary animate-pulse">
                          {pf.isImage ? "Analyzing image..." : "Analyzing..."}
                        </span>
                      )}
                    </div>
                    {pf.status === 'analyzing' && (
                      <Progress value={pf.progress} className="h-1 mt-2" />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {pf.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => analyzeFile(pf)}
                        className="gap-1"
                      >
                        <Sparkles className="h-3 w-3" />
                        {pf.isImage ? "Analyze Image" : "Analyze"}
                      </Button>
                    )}
                    {pf.status === 'completed' && !pf.isImage && getStatusIcon(pf)}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFile(pf.id)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};