import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Crop, Maximize2, Download, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';

interface ImageEditorProps {
  onComplete?: (blob: Blob, fileName: string) => void;
}

export const ImageEditor = ({ onComplete }: ImageEditorProps) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropMode, setIsCropMode] = useState(false);
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
  const { toast } = useToast();

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const getResizedImg = async (
    imageSrc: string,
    width: number,
    height: number
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        }
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      const url = URL.createObjectURL(croppedImage);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `cropped_${fileName}`;
      link.click();

      toast({
        title: "Image Cropped",
        description: "Your cropped image has been downloaded",
      });

      if (onComplete) {
        onComplete(croppedImage, `cropped_${fileName}`);
      }
    } catch (error) {
      console.error('Crop error:', error);
      toast({
        title: "Crop Failed",
        description: "Failed to crop image",
        variant: "destructive",
      });
    }
  };

  const handleResize = async () => {
    if (!imageSrc) return;

    try {
      const resizedImage = await getResizedImg(imageSrc, customWidth, customHeight);
      const url = URL.createObjectURL(resizedImage);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `resized_${customWidth}x${customHeight}_${fileName}`;
      link.click();

      toast({
        title: "Image Resized",
        description: `Image resized to ${customWidth}x${customHeight}px`,
      });

      if (onComplete) {
        onComplete(resizedImage, `resized_${customWidth}x${customHeight}_${fileName}`);
      }
    } catch (error) {
      console.error('Resize error:', error);
      toast({
        title: "Resize Failed",
        description: "Failed to resize image",
        variant: "destructive",
      });
    }
  };

  const handleWidthChange = (value: number) => {
    setCustomWidth(value);
    if (maintainAspectRatio && imageSrc) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        setCustomHeight(Math.round(value * aspectRatio));
      };
      img.src = imageSrc;
    }
  };

  const handleHeightChange = (value: number) => {
    setCustomHeight(value);
    if (maintainAspectRatio && imageSrc) {
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        setCustomWidth(Math.round(value * aspectRatio));
      };
      img.src = imageSrc;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Image Editor</h2>
          <p className="text-muted-foreground">
            Crop and resize your images to exact dimensions
          </p>
        </div>

        {!imageSrc ? (
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Image to Edit</h3>
            <p className="text-muted-foreground mb-4">
              Select an image to start cropping or resizing
            </p>
            <Input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="max-w-xs mx-auto"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mode Selection */}
            <div className="flex gap-4">
              <Button
                variant={isCropMode ? "default" : "outline"}
                onClick={() => setIsCropMode(true)}
              >
                <Crop className="w-4 h-4 mr-2" />
                Crop Mode
              </Button>
              <Button
                variant={!isCropMode ? "default" : "outline"}
                onClick={() => setIsCropMode(false)}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Resize Mode
              </Button>
              <Button variant="outline" onClick={() => setImageSrc(null)}>
                Upload New Image
              </Button>
            </div>

            {isCropMode ? (
              <div className="space-y-4">
                <div className="relative h-96 bg-black rounded-lg overflow-hidden">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={undefined}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Zoom: {zoom.toFixed(1)}x</Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={([value]) => setZoom(value)}
                    min={1}
                    max={3}
                    step={0.1}
                  />
                </div>

                <Button onClick={handleCrop} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Cropped Image
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                  <img
                    src={imageSrc}
                    alt="Preview"
                    className="max-h-96 object-contain"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Width (px)</Label>
                    <Input
                      type="number"
                      value={customWidth}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value) || 1920)}
                      min={1}
                      max={8192}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Height (px)</Label>
                    <Input
                      type="number"
                      value={customHeight}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value) || 1080)}
                      min={1}
                      max={8192}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="aspectRatio"
                    checked={maintainAspectRatio}
                    onChange={(e) => setMaintainAspectRatio(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="aspectRatio" className="cursor-pointer">
                    Maintain aspect ratio
                  </Label>
                </div>

                <Button onClick={handleResize} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Download Resized Image ({customWidth}x{customHeight})
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
