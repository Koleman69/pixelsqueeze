import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export interface CompressionSettings {
  quality: number;
  maxWidth: number;
  maxHeight: number;
  dpi: number;
}

export interface CompressionResult {
  id: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
  status: 'processing' | 'completed' | 'failed';
  compressedImage?: string;
  originalImage?: string;
  error?: string;
}

export interface SubscriptionStatus {
  subscribed: boolean;
  is_trialing?: boolean;
  trial_end?: string;
  product_id?: string;
  subscription_end?: string;
  free_compressions_used?: number;
}

export const useImageCompression = () => {
  const [compressions, setCompressions] = useState<CompressionResult[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus>({ subscribed: false });
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setSubscription({ subscribed: false });
        return { subscribed: false };
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      // Get or create subscriber record with free compressions count
      let subscriberData = await supabase
        .from('subscribers')
        .select('free_compressions_used, subscribed')
        .eq('user_id', session.user.id)
        .single();

      // Create subscriber record if it doesn't exist
      if (!subscriberData.data) {
        const { data: newSubscriber } = await supabase
          .from('subscribers')
          .insert({
            user_id: session.user.id,
            email: session.user.email!,
            subscribed: false,
            free_compressions_used: 0
          })
          .select('free_compressions_used, subscribed')
          .single();
        
        subscriberData.data = newSubscriber;
      }

      const subscriptionData = {
        ...data,
        free_compressions_used: subscriberData.data?.free_compressions_used || 0
      };

      setSubscription(subscriptionData);
      return subscriptionData;
    } catch (error) {
      console.error('Subscription check failed:', error);
      return { subscribed: false };
    }
  };

  // Max files per batch to prevent memory issues on edge function
  const MAX_FILES_PER_BATCH = 5;
  
  const compressImages = async (
    files: FileList, 
    settings: CompressionSettings = { quality: 80, maxWidth: 1920, maxHeight: 1920, dpi: 72 },
    isBulk: boolean = false
  ): Promise<string[]> => {
    const fileArray = Array.from(files);
    
    // If more than MAX_FILES_PER_BATCH, process in batches
    if (fileArray.length > MAX_FILES_PER_BATCH) {
      toast({
        title: "Processing in Batches",
        description: `Large batch detected. Processing ${fileArray.length} files in smaller batches for stability.`,
      });
      
      const allIds: string[] = [];
      
      for (let i = 0; i < fileArray.length; i += MAX_FILES_PER_BATCH) {
        const batch = fileArray.slice(i, i + MAX_FILES_PER_BATCH);
        const dt = new DataTransfer();
        batch.forEach(file => dt.items.add(file));
        
        try {
          const batchIds = await processBatch(dt.files, settings, isBulk);
          allIds.push(...batchIds);
        } catch (error) {
          console.error(`Batch ${Math.floor(i / MAX_FILES_PER_BATCH) + 1} failed:`, error);
        }
        
        // Small delay between batches
        if (i + MAX_FILES_PER_BATCH < fileArray.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      toast({
        title: "Batch Processing Complete",
        description: `Processed ${allIds.length} of ${fileArray.length} files`,
      });
      
      return allIds;
    }
    
    return processBatch(files, settings, isBulk);
  };
  
  const processBatch = async (
    files: FileList, 
    settings: CompressionSettings,
    isBulk: boolean
  ): Promise<string[]> => {
    const fileArray = Array.from(files);
    const ids: string[] = [];

    // Add initial compression entries with original image data
    const newCompressions: CompressionResult[] = await Promise.all(
      fileArray.map(async (file) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        ids.push(id);
        
        // Store original image as data URL
        const originalDataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        return {
          id,
          fileName: file.name,
          originalSize: file.size,
          compressedSize: 0,
          compressionRatio: 0,
          quality: settings.quality,
          status: 'processing' as const,
          originalImage: originalDataUrl
        };
      })
    );

    setCompressions(prev => [...newCompressions, ...prev]);

    try {
      // Convert files to base64
      const filesData = await Promise.all(
        fileArray.map(async (file) => {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const result = reader.result as string;
              resolve(result.split(',')[1]); // Remove data:image/jpeg;base64, prefix
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          return { file: base64, fileName: file.name };
        })
      );

      // Call compression function
      const { data, error } = await supabase.functions.invoke('compress-image', {
        body: {
          files: filesData,
          quality: settings.quality,
          maxWidth: settings.maxWidth,
          maxHeight: settings.maxHeight,
          dpi: settings.dpi,
          isBulk
        }
      });

      if (error) throw error;

      if (data.requiresSubscription) {
        // Update all compressions to failed with subscription message
        setCompressions(prev => prev.map(comp => 
          ids.includes(comp.id) 
            ? { ...comp, status: 'failed' as const, error: data.error }
            : comp
        ));

        toast({
          title: "Subscription Required",
          description: data.error,
          variant: "destructive"
        });

        return [];
      }

      if (data.success) {
        // Update compression results
        data.results.forEach((result: any, index: number) => {
          const id = ids[index];
          setCompressions(prev => prev.map(comp => 
            comp.id === id 
              ? {
                  ...comp,
                  compressedSize: result.compressedSize,
                  compressionRatio: result.compressionRatio,
                  status: result.error ? 'failed' as const : 'completed' as const,
                  compressedImage: result.compressedImage,
                  error: result.error
                }
              : comp
          ));
        });

        // Handle bulk download
        if (data.bulkDownloadUrl && isBulk) {
          const link = document.createElement('a');
          link.href = data.bulkDownloadUrl;
          link.download = 'compressed-images.zip';
          link.click();
          
          toast({
            title: "Bulk Download Ready",
            description: `Successfully compressed ${data.results.length} images`,
          });
        } else {
          toast({
            title: "Compression Complete",
            description: `Successfully compressed ${data.results.filter((r: any) => !r.error).length} image(s)`,
          });
        }

        return ids;
      } else {
        throw new Error(data.error || 'Compression failed');
      }
    } catch (error) {
      console.error('Compression error:', error);
      
      // Update all compressions to failed
      setCompressions(prev => prev.map(comp => 
        ids.includes(comp.id) 
          ? { ...comp, status: 'failed' as const, error: error.message }
          : comp
      ));

      toast({
        title: "Compression Failed",
        description: `Failed to compress images: ${error.message}`,
        variant: "destructive"
      });

      throw error;
    }
  };

  const downloadCompressed = (compressionId: string) => {
    const compression = compressions.find(c => c.id === compressionId);
    if (compression?.compressedImage) {
      // Convert base64 to blob for better mobile compatibility
      const base64Data = compression.compressedImage;
      const binaryData = atob(base64Data);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      // Determine MIME type from filename
      const extension = compression.fileName.toLowerCase().split('.').pop();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'webp') mimeType = 'image/webp';
      else if (extension === 'gif') mimeType = 'image/gif';
      
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `compressed_${compression.fileName}`;
      link.rel = 'noopener';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      // Delay cleanup so the browser can complete the download
      setTimeout(() => {
        if (link.parentNode) document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 60000);
    }
  };

  const downloadBulk = async (compressionIds: string[]) => {
    const selectedCompressions = compressions.filter(c => 
      compressionIds.includes(c.id) && c.status === 'completed' && c.compressedImage
    );

    if (selectedCompressions.length === 0) {
      toast({
        title: "No Images to Download",
        description: "No completed compressions selected",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create a ZIP file with all compressed images
      const zip = new JSZip();
      
      selectedCompressions.forEach((compression) => {
        // Convert base64 to binary data
        const base64Data = compression.compressedImage!;
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        // Add file to ZIP
        zip.file(`compressed_${compression.fileName}`, bytes);
      });

      // Generate ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download the ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `compressed-images-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Bulk Download Complete",
        description: `Downloaded ${selectedCompressions.length} compressed images as ZIP`,
      });
    } catch (error) {
      console.error('Bulk download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file. Please try downloading images individually.",
        variant: "destructive"
      });
    }
  };

  const createCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      
      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      toast({
        title: "Portal Access Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const clearCompressions = () => {
    setCompressions([]);
  };

  return {
    compressions,
    subscription,
    compressImages,
    checkSubscription,
    clearCompressions,
    downloadCompressed,
    downloadBulk,
    createCheckout,
    openCustomerPortal
  };
};