import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Crop, Maximize2, Download, Upload, Sparkles, Crown, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useImageCompression } from '@/hooks/useImageCompression';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { BeforeAfterSlider } from './BeforeAfterSlider';

interface ImageEditorProps {
  onComplete?: (blob: Blob, fileName: string) => void;
}

type EditorMode = 'crop' | 'resize' | 'ai';

export const ImageEditor = ({ onComplete }: ImageEditorProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('crop');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiEditedImage, setAiEditedImage] = useState<string | null>(null);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const { toast } = useToast();
  const { subscription, createCheckout } = useImageCompression();

  const FREE_AI_EDITS = 3;

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setAiEditedImage(null);
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiEdit = async () => {
    if (!imageSrc || !aiPrompt.trim()) {
      toast({
        title: "Missing Information",
        description: "Please upload an image and enter a prompt",
        variant: "destructive",
      });
      return;
    }

    // Check if user has exceeded free tier
    if (!subscription.subscribed && aiUsageCount >= FREE_AI_EDITS) {
      toast({
        title: "Upgrade Required",
        description: `You've used your ${FREE_AI_EDITS} free AI edits. Upgrade to Pro for unlimited AI editing!`,
        variant: "destructive",
      });
      return;
    }

    setIsAiProcessing(true);

    try {
      // Get base64 image data (remove data URL prefix)
      const base64Data = imageSrc.split(',')[1];

      const { data, error } = await supabase.functions.invoke('ai-edit-image', {
        body: {
          imageBase64: base64Data,
          prompt: aiPrompt,
          editType: 'transform'
        }
      });

      if (error) throw error;

      if (!data.success) {
        throw new Error(data.error || 'AI editing failed');
      }

      setAiEditedImage(data.editedImage);
      setAiUsageCount(prev => prev + 1);

      toast({
        title: "AI Edit Complete",
        description: data.message || "Your image has been transformed!",
      });

    } catch (error: any) {
      console.error('AI edit error:', error);
      
      let errorMessage = "Failed to edit image with AI";
      if (error.message?.includes("Rate limit")) {
        errorMessage = "Too many requests. Please try again in a moment.";
      } else if (error.message?.includes("credits")) {
        errorMessage = "AI credits exhausted. Please add credits to your workspace.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "AI Edit Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleDownloadAiEdit = () => {
    if (!aiEditedImage) return;

    const link = document.createElement('a');
    link.href = aiEditedImage;
    link.download = `ai_edited_${fileName}`;
    link.click();

    toast({
      title: "Download Complete",
      description: "Your AI-edited image has been downloaded",
    });
  };

  const quickPrompts = [
    "Change the background to a sunny beach",
    "Make it look like a vintage photograph",
    "Add a dramatic sunset sky",
    "Convert to black and white with high contrast",
    "Make it look like a painting",
    "Add a bokeh blur effect to the background"
  ];

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
          <h2 className="text-2xl font-bold mb-2">Photo Perfection Studio</h2>
          <p className="text-muted-foreground">
            Upload your photo to see before/after transformations with the slider
          </p>
        </div>

        {!imageSrc ? (
          <div 
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Your Photo</h3>
            <p className="text-muted-foreground mb-4">
              Click to select an image and see instant before/after transformations
            </p>
            <Button variant="outline" className="mx-auto">
              <Upload className="w-4 h-4 mr-2" />
              Choose Image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Show Before/After Slider when image is uploaded */}
            {imageSrc && editorMode === 'ai' && aiEditedImage && (
              <div className="mb-6">
                <BeforeAfterSlider
                  beforeImage={imageSrc}
                  afterImage={aiEditedImage}
                  title="Your Photo Transformation"
                  description="Slide to see the AI-powered enhancement"
                />
              </div>
            )}

            {/* Show original image in slider format even before AI edit */}
            {imageSrc && !aiEditedImage && (
              <div className="mb-6">
                <BeforeAfterSlider
                  beforeImage={imageSrc}
                  afterImage={imageSrc}
                  title="Your Uploaded Photo"
                  description="Use AI Transform below to create stunning effects"
                />
              </div>
            )}

            {/* Mode Selection */}
            <div className="flex flex-wrap gap-4">
              <Button
                variant={editorMode === 'crop' ? "default" : "outline"}
                onClick={() => setEditorMode('crop')}
              >
                <Crop className="w-4 h-4 mr-2" />
                Crop
              </Button>
              <Button
                variant={editorMode === 'resize' ? "default" : "outline"}
                onClick={() => setEditorMode('resize')}
              >
                <Maximize2 className="w-4 h-4 mr-2" />
                Resize
              </Button>
              <Button
                variant={editorMode === 'ai' ? "default" : "outline"}
                onClick={() => setEditorMode('ai')}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Transform
                {!subscription.subscribed && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {FREE_AI_EDITS - aiUsageCount} free
                  </Badge>
                )}
              </Button>
              <Button variant="outline" onClick={() => { setImageSrc(null); setAiEditedImage(null); }}>
                <Upload className="w-4 h-4 mr-2" />
                Upload New Image
              </Button>
              {!subscription.subscribed && editorMode === 'ai' && (
                <Button onClick={createCheckout} size="sm" className="ml-auto bg-gradient-primary">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade for Unlimited AI
                </Button>
              )}
            </div>

            {editorMode === 'crop' ? (
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
            ) : editorMode === 'resize' ? (
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
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center bg-muted rounded-lg p-4">
                  <img
                    src={aiEditedImage || imageSrc}
                    alt="Preview"
                    className="max-h-96 object-contain"
                  />
                </div>

                {aiEditedImage && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI transformation complete! Download or try another edit.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>What would you like to do with this image?</Label>
                  <Textarea
                    placeholder="E.g., Change the background to a tropical beach, Add a vintage film filter, Make it look like a watercolor painting..."
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={3}
                    disabled={isAiProcessing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Quick Prompts</Label>
                  <div className="flex flex-wrap gap-2">
                    {quickPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => setAiPrompt(prompt)}
                        disabled={isAiProcessing}
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </div>

                {!subscription.subscribed && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <Crown className="w-4 h-4 inline mr-1" />
                      Free: {aiUsageCount}/{FREE_AI_EDITS} AI edits used. Upgrade for unlimited transformations!
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleAiEdit} 
                    className="flex-1 bg-gradient-primary"
                    disabled={isAiProcessing || !aiPrompt.trim() || (!subscription.subscribed && aiUsageCount >= FREE_AI_EDITS)}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isAiProcessing ? "Transforming..." : "Transform with AI"}
                  </Button>
                  
                  {aiEditedImage && (
                    <Button onClick={handleDownloadAiEdit} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
