import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check, Copy, Cloud, Loader2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';

interface ShareButtonProps {
  imageData?: string;
  fileName?: string;
  isVideo?: boolean;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  className?: string;
}

type ExpirationOption = {
  label: string;
  days: number | null;
};

const EXPIRATION_OPTIONS: ExpirationOption[] = [
  { label: '1 day', days: 1 },
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: 'Never', days: null },
];

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

      if (imageData.startsWith('blob:')) {
        const response = await fetch(imageData);
        blob = await response.blob();
      } else if (imageData.startsWith('data:')) {
        const response = await fetch(imageData);
        blob = await response.blob();
      } else {
        const mimeType = getMimeType();
        const binaryData = atob(imageData);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: mimeType });
      }

      return new File([blob], `${fileName}`, { type: blob.type || getMimeType() });
    } catch (error) {
      console.error('Error creating file from data:', error);
      return null;
    }
  };

  const getBase64FromData = async (): Promise<string | null> => {
    if (!imageData) return null;

    try {
      if (!imageData.startsWith('blob:') && !imageData.startsWith('data:')) {
        return imageData;
      }

      const file = await getFileFromData();
      if (!file) return null;

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.readAsDataURL(file);
      });
    } catch (error) {
      console.error('Error converting to base64:', error);
      return null;
    }
  };

  const handleCloudShare = async (expirationDays: number | null) => {
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
          expirationDays,
        },
      });

      if (error) throw error;

      if (data.shareUrl) {
        await navigator.clipboard.writeText(data.shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);

        const expirationText = expirationDays === null 
          ? "Link never expires." 
          : `Expires in ${expirationDays} day${expirationDays > 1 ? 's' : ''}.`;

        toast({
          title: "Share Link Created!",
          description: `Link copied to clipboard. ${expirationText}`,
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
      await handleCopyImage();
    }
  };

  const handleCopyImage = async () => {
    if (!imageData) return;

    try {
      const file = await getFileFromData();
      if (!file) throw new Error('Could not create file');

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
      toast({
        title: "Copy not supported",
        description: "Your browser doesn't support copying images. Use download instead.",
        variant: "destructive",
      });
    }
  };

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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger disabled={isUploading}>
            <Cloud className="w-4 h-4 mr-2" />
            Create Share Link
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              {EXPIRATION_OPTIONS.map((option) => (
                <DropdownMenuItem 
                  key={option.label} 
                  onClick={() => handleCloudShare(option.days)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
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