import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy, Link, Cloud, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ShareButtonProps {
  /** Base64 image data or blob URL */
  imageData?: string;
  /** File name for the shared file */
  fileName?: string;
  /** Whether this is a video */
  isVideo?: boolean;
  /** Optional size variant */
  size?: 'sm' | 'default' | 'lg' | 'icon';
  /** Optional variant */
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  /** Optional className */
  className?: string;
}

export const ShareButton = ({
  imageData,
  fileName = 'compressed-image',
  isVideo = false,
  size = 'sm',
  variant = 'outline',
  className,
}: ShareButtonProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getMimeType = () => {
    if (isVideo) return 'video/mp4';
    const ext = fileName.toLowerCase().split('.').pop();
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif') return 'image/gif';
    return 'image/jpeg';
  };

  const getFileFromData = async (): Promise<File | null> => {
    if (!imageData) return null;

    try {
      let blob: Blob;

      // Check if it's a blob URL
      if (imageData.startsWith('blob:')) {
        const response = await fetch(imageData);
        blob = await response.blob();
      }
      // Check if it's a data URL
      else if (imageData.startsWith('data:')) {
        const response = await fetch(imageData);
        blob = await response.blob();
      }
      // Assume it's base64 without prefix
      else {
        const mimeType = getMimeType();
        const binaryData = atob(imageData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mimeType });
      }

      const ext = isVideo ? 'mp4' : fileName.split('.').pop() || 'jpg';
      return new File([blob], `${fileName}`, { type: blob.type || getMimeType() });
    } catch (error) {
      console.error('Error creating file from data:', error);
      return null;
    }
  };

  const getBase64FromData = async (): Promise<string | null> => {
    if (!imageData) return null;

    try {
      // If already base64 (no prefix), return as-is
      if (!imageData.startsWith('blob:') && !imageData.startsWith('data:')) {
        return imageData;
      }

      // Convert blob or data URL to base64
      const file = await getFileFromData();
      if (!file) return null;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Return with data URL prefix for the edge function
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      return null;
    }
  };

  const handleCloudShare = async () => {
    setIsUploading(true);

    try {
      const base64Data = await getBase64FromData();
      if (!base64Data) {
        throw new Error('Could not prepare file for upload');
      }

      const file = await getFileFromData();
      const fileSize = file?.size || 0;

      const { data, error } = await supabase.functions.invoke('upload-shared-file', {
        body: {
          fileData: base64Data,
          fileName,
          fileType: getMimeType(),
          fileSize,
        },
      });

      if (error) throw error;

      if (data.shareUrl) {
        // Copy share URL to clipboard
        await navigator.clipboard.writeText(data.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);

        toast({
          title: "Share Link Created!",
          description: "Link copied to clipboard. Expires in 7 days.",
        });
      }
    } catch (error: any) {
      console.error('Cloud share error:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Could not create share link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleNativeShare = async () => {
    const file = await getFileFromData();
    
    if (!file) {
      toast({
        title: "Share Failed",
        description: "Could not prepare file for sharing",
        variant: "destructive",
      });
      return;
    }

    // Check if Web Share API is available and supports files
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: fileName,
          text: `Check out this ${isVideo ? 'video' : 'image'} compressed with Pixelsqueeze!`,
        });
        toast({
          title: "Shared!",
          description: "File shared successfully",
        });
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
          toast({
            title: "Share Failed",
            description: "Could not share file. Try copying instead.",
            variant: "destructive",
          });
        }
      }
    } else {
      // Fallback: copy image to clipboard
      await handleCopyImage();
    }
  };

  const handleCopyImage = async () => {
    if (!imageData) return;

    try {
      const file = await getFileFromData();
      if (!file) throw new Error('Could not create file');

      // Try to copy image to clipboard
      if (navigator.clipboard && 'write' in navigator.clipboard) {
        const blob = file.slice(0, file.size, file.type);
        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]: blob,
          }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({
          title: "Copied!",
          description: "Image copied to clipboard",
        });
      } else {
        throw new Error('Clipboard API not supported');
      }
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback: download the file
      toast({
        title: "Copy not supported",
        description: "Your browser doesn't support copying images. Use download instead.",
        variant: "destructive",
      });
    }
  };

  // Check if native share is available
  const hasNativeShare = typeof navigator !== 'undefined' && 'share' in navigator;

  if (!imageData) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size={size} variant={variant} className={className} disabled={isUploading}>
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : copied ? (
            <Check className="w-4 h-4 mr-2" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          {isUploading ? 'Uploading...' : copied ? 'Copied!' : 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleCloudShare} disabled={isUploading}>
          <Cloud className="w-4 h-4 mr-2" />
          Create Share Link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {hasNativeShare && (
          <DropdownMenuItem onClick={handleNativeShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share to Apps
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={handleCopyImage}>
          <Copy className="w-4 h-4 mr-2" />
          Copy {isVideo ? 'Video' : 'Image'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
