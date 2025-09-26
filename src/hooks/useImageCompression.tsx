import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompressionResult {
  id: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  status: 'processing' | 'completed' | 'failed';
  compressedImage?: string;
  error?: string;
}

export const useImageCompression = () => {
  const [compressions, setCompressions] = useState<CompressionResult[]>([]);
  const { toast } = useToast();

  const compressImage = async (file: File, quality: number = 80): Promise<string> => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    
    // Add initial compression entry
    const newCompression: CompressionResult = {
      id,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: 0,
      compressionRatio: 0,
      quality,
      status: 'processing'
    };

    setCompressions(prev => [newCompression, ...prev]);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Call compression function
      const { data, error } = await supabase.functions.invoke('compress-image', {
        body: {
          file: base64,
          fileName: file.name,
          quality,
          maxWidth: 1920,
          maxHeight: 1920
        }
      });

      if (error) throw error;

      if (data.success) {
        // Update compression result
        setCompressions(prev => prev.map(comp => 
          comp.id === id 
            ? {
                ...comp,
                compressedSize: data.compressedSize,
                compressionRatio: data.compressionRatio,
                status: 'completed' as const,
                compressedImage: data.compressedImage
              }
            : comp
        ));

        toast({
          title: "Compression Complete",
          description: `${file.name} compressed by ${data.compressionRatio}%`,
        });

        return id;
      } else {
        throw new Error(data.error || 'Compression failed');
      }
    } catch (error) {
      console.error('Compression error:', error);
      
      // Update compression result with error
      setCompressions(prev => prev.map(comp => 
        comp.id === id 
          ? {
              ...comp,
              status: 'failed' as const,
              error: error.message
            }
          : comp
      ));

      toast({
        title: "Compression Failed",
        description: `Failed to compress ${file.name}: ${error.message}`,
        variant: "destructive"
      });

      throw error;
    }
  };

  const compressMultipleImages = async (files: FileList, quality: number = 80): Promise<string[]> => {
    const promises = Array.from(files).map(file => compressImage(file, quality));
    
    try {
      const results = await Promise.allSettled(promises);
      const successful = results
        .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
        .map(result => result.value);
      
      const failed = results.filter(result => result.status === 'rejected').length;
      
      if (failed > 0) {
        toast({
          title: "Partial Success",
          description: `${successful.length} images compressed, ${failed} failed`,
          variant: "destructive"
        });
      }
      
      return successful;
    } catch (error) {
      toast({
        title: "Compression Failed",
        description: "Failed to compress images",
        variant: "destructive"
      });
      throw error;
    }
  };

  const clearCompressions = () => {
    setCompressions([]);
  };

  const downloadCompressed = (compressionId: string) => {
    const compression = compressions.find(c => c.id === compressionId);
    if (compression?.compressedImage) {
      const link = document.createElement('a');
      link.href = `data:image/jpeg;base64,${compression.compressedImage}`;
      link.download = `compressed_${compression.fileName}`;
      link.click();
    }
  };

  return {
    compressions,
    compressImage,
    compressMultipleImages,
    clearCompressions,
    downloadCompressed
  };
};