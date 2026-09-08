import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, Download, Crown, Building2, Loader2, UtensilsCrossed, Hotel, Landmark, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useImageCompression } from '@/hooks/useImageCompression';
import { BeforeAfterSlider } from './BeforeAfterSlider';

// Every preset shares the same guardrails: realistic, platform-safe
// enhancement (Expedia/Booking.com and similar platforms have real content
// policies against misleading listing photos), never altering what the
// property/food/room actually is. "Realistic," not "undetectable" -- see
// project notes. The model behind this (Gemini 2.5 Flash Image, called via
// the existing ai-edit-image function) is a genuine content-aware editor,
// not a canvas filter -- it can act on "remove that trash can" or "smooth
// the tablecloth" instructions, unlike AIEnhanceStudio's kernel-based
// "AI Upscale"/"AI Sharpen", which cannot.
type ListingPresetId = 'dish' | 'interior' | 'room' | 'exterior';

interface ListingPreset {
  id: ListingPresetId;
  label: string;
  description: string;
  icon: typeof UtensilsCrossed;
  prompt: string;
}

const LISTING_PRESETS: ListingPreset[] = [
  {
    id: 'dish',
    label: 'Food / Dish',
    description: 'Menu photos, plated dishes',
    icon: UtensilsCrossed,
    prompt:
      "Professionally retouch this food photo for a restaurant's website and travel booking listings, the way a professional food photographer would edit it. Improve lighting, color balance, and sharpness so the dish looks fresh and appetizing. Remove minor distracting background clutter (trash cans, cords, stray objects) if visible, and clean up the tablecloth or napkin (remove wrinkles and stains) without changing their color or pattern. Do not change the actual food, its portion size, its plating, or add/remove any dish. Keep the result realistic and true to the food actually served -- do not make it look artificial or overly stylized.",
  },
  {
    id: 'interior',
    label: 'Dining Room / Interior',
    description: 'Restaurant seating, lobby, common areas',
    icon: Landmark,
    prompt:
      "Professionally retouch this interior photo for a business's website and travel booking platforms like Expedia and Booking.com. Correct the lighting and white balance, increase clarity, and remove minor clutter and distracting objects from the background (trash cans, cables, stray items) without altering the room's actual layout, furniture, or decor. Do not add or remove furniture, walls, or fixtures. Keep the result realistic and representative of the true space -- guests must not be misled about what the space actually looks like.",
  },
  {
    id: 'room',
    label: 'Hotel Room',
    description: 'Guest rooms, suites',
    icon: Hotel,
    prompt:
      "Professionally retouch this hotel room photo for the hotel's website and travel booking platforms like Expedia and Booking.com. Correct lighting and color balance, increase clarity and sharpness, smooth and freshen bedding and linens (remove wrinkles) without changing their color or pattern, and remove minor background clutter (cords, trash cans, personal items) if visible. Do not alter the room's actual layout, furniture, or size. Keep the result realistic and representative of the true room -- guests must not be misled about what the room actually looks like.",
  },
  {
    id: 'exterior',
    label: 'Property Exterior',
    description: 'Building front, signage, grounds',
    icon: Building2,
    prompt:
      "Professionally retouch this property exterior photo for use on the business's website and travel booking platforms like Expedia and Booking.com. Correct lighting, sky, and color balance, increase clarity and sharpness, and remove minor clutter such as trash cans, cones, or stray vehicles from the frame if they are not central to the shot. Do not alter the building's actual structure, signage, or landscaping in a misleading way. Keep the result realistic and true to the property's real appearance.",
  },
];

const FREE_AI_EDITS = 3;

export const ListingPhotoOptimizer = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [presetId, setPresetId] = useState<ListingPresetId>('dish');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [aiUsageCount, setAiUsageCount] = useState(0);
  const { toast } = useToast();
  const { subscription, createCheckout } = useImageCompression();

  const activePreset = LISTING_PRESETS.find((p) => p.id === presetId) ?? LISTING_PRESETS[0];

  React.useEffect(() => {
    const fetchAiUsage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.rpc('count_daily_ai_usage', {
          target_user_id: user.id,
          feature: 'image_edit',
        });
        if (!error && data !== null) setAiUsageCount(data);
      } catch (err) {
        console.error('Error fetching AI usage:', err);
      }
    };
    fetchAiUsage();
  }, [subscription.subscribed]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResultImage(null);
    const reader = new FileReader();
    reader.onload = () => setImageSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleOptimize = async () => {
    if (!imageSrc) {
      toast({ title: 'No image selected', description: 'Upload a photo first', variant: 'destructive' });
      return;
    }

    if (!subscription.subscribed && aiUsageCount >= FREE_AI_EDITS) {
      toast({
        title: 'Upgrade Required',
        description: `You've used your ${FREE_AI_EDITS} free AI edits today. Upgrade to Pro for unlimited listing photo optimization!`,
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const base64Data = imageSrc.split(',')[1];
      const { data, error } = await supabase.functions.invoke('ai-edit-image', {
        body: {
          imageBase64: base64Data,
          prompt: activePreset.prompt,
          editType: 'listing-photo',
        },
      });

      if (error) throw error;
      if (!data.success) {
        if (data.limitReached) setAiUsageCount(data.usage?.used || FREE_AI_EDITS);
        throw new Error(data.error || 'Photo optimization failed');
      }

      setResultImage(data.editedImage);
      if (data.usage) setAiUsageCount(data.usage.used);

      toast({ title: 'Photo Optimized', description: 'Your listing photo is ready to download.' });
    } catch (error) {
      console.error('Listing photo optimization error:', error);
      const message = error instanceof Error ? error.message : undefined;
      let errorMessage = 'Failed to optimize photo';
      if (message?.includes('Rate limit')) {
        errorMessage = 'Too many requests. Please try again in a moment.';
      } else if (message?.includes('credits')) {
        errorMessage = 'AI credits exhausted. Please try again later.';
      } else if (message) {
        errorMessage = message;
      }
      toast({ title: 'Optimization Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const link = document.createElement('a');
    link.href = resultImage;
    link.download = `listing-optimized_${fileName || 'photo.jpg'}`;
    link.click();
    toast({ title: 'Download Complete', description: 'Your optimized photo has been downloaded.' });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Listing Photo Optimizer</h2>
          <Badge variant="secondary" className="ml-auto">
            {subscription.subscribed ? 'Unlimited' : `${Math.max(0, FREE_AI_EDITS - aiUsageCount)} free left today`}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Turn regular phone photos into listing-ready images for your website, Expedia, and Booking.com --
          no photo shoot required. Choose the photo type below for the right kind of touch-up.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              aria-label="Upload a listing photo"
            />

            {!imageSrc ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Click to upload a photo</span>
              </button>
            ) : (
              <div className="space-y-2">
                <img src={imageSrc} alt="Selected listing photo" className="w-full rounded-lg border" />
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Choose a different photo
                </Button>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Photo type</label>
              <Select value={presetId} onValueChange={(v) => setPresetId(v as ListingPresetId)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_PRESETS.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.label} -- {preset.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleOptimize}
              disabled={!imageSrc || isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Optimizing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" /> Optimize Photo
                </>
              )}
            </Button>

            {!subscription.subscribed && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => createCheckout()}>
                <Crown className="h-4 w-4 mr-2" /> Upgrade for unlimited optimizations
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {resultImage && imageSrc ? (
              <>
                <BeforeAfterSlider
                  beforeImage={imageSrc}
                  afterImage={resultImage}
                  title="Before / After"
                  description={`Optimized as: ${activePreset.label}`}
                />
                <Button variant="secondary" size="sm" className="w-full" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" /> Download optimized photo
                </Button>
              </>
            ) : (
              <div className="h-full min-h-[200px] rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground">
                Your optimized photo will appear here
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
