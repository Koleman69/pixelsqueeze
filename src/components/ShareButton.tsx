import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy, Link } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

  const handleCopyLink = async () => {
    // For now, just copy a generic message since we don't have hosted URLs
    const message = `I just compressed ${isVideo ? 'a video' : 'an image'} with Pixelsqueeze! Check it out at pixelsqueeze.lovable.app`;
    
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Link Copied!",
        description: "Share message copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
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
        <Button size={size} variant={variant} className={className}>
          {copied ? <Check className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
          {copied ? 'Copied!' : 'Share'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link className="w-4 h-4 mr-2" />
          Copy Share Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
