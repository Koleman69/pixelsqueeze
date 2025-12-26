import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Copy, 
  Check, 
  Instagram, 
  Twitter, 
  Youtube, 
  Facebook,
  Loader2,
  RefreshCw,
  Wand2,
  Hash,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AICaptionGeneratorProps {
  imageContext?: string;
  onCaptionGenerated?: (caption: string, platform: string) => void;
}

type ToneType = 'professional' | 'funny' | 'viral' | 'luxury' | 'casual' | 'brand-safe';
type PlatformType = 'instagram' | 'twitter' | 'youtube' | 'facebook' | 'pinterest';

const tones: { id: ToneType; label: string; emoji: string }[] = [
  { id: 'viral', label: 'Viral', emoji: '🔥' },
  { id: 'professional', label: 'Professional', emoji: '💼' },
  { id: 'funny', label: 'Funny', emoji: '😂' },
  { id: 'luxury', label: 'Luxury', emoji: '✨' },
  { id: 'casual', label: 'Casual', emoji: '😎' },
  { id: 'brand-safe', label: 'Brand-Safe', emoji: '🛡️' },
];

const platforms: { id: PlatformType; label: string; icon: typeof Instagram; color: string }[] = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'bg-black' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
];

export const AICaptionGenerator = ({ imageContext, onCaptionGenerated }: AICaptionGeneratorProps) => {
  const [selectedTone, setSelectedTone] = useState<ToneType>('viral');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformType>('instagram');
  const [customPrompt, setCustomPrompt] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [generatedHashtags, setGeneratedHashtags] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateCaption = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-caption', {
        body: {
          platform: selectedPlatform,
          tone: selectedTone,
          context: customPrompt || imageContext || 'A beautiful image',
        }
      });

      if (error) throw error;

      setGeneratedCaption(data.caption);
      setGeneratedHashtags(data.hashtags || []);
      onCaptionGenerated?.(data.caption, selectedPlatform);

      toast({
        title: "Caption Generated!",
        description: `Perfect ${selectedTone} caption for ${selectedPlatform}`,
      });
    } catch (error) {
      console.error('Caption generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate caption. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    const fullCaption = generatedHashtags.length > 0 
      ? `${generatedCaption}\n\n${generatedHashtags.join(' ')}`
      : generatedCaption;
      
    await navigator.clipboard.writeText(fullCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied!",
      description: "Caption copied to clipboard",
    });
  };

  return (
    <Card className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold">AI Caption Generator</h3>
          <p className="text-sm text-muted-foreground">
            Create viral captions optimized for each platform
          </p>
        </div>
      </div>

      {/* Platform Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          Select Platform
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {platforms.map((platform) => {
            const Icon = platform.icon;
            const isSelected = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className={`p-1 rounded ${platform.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">{platform.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tone Selection */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <Wand2 className="w-4 h-4" />
          Select Tone
        </label>
        <div className="flex flex-wrap gap-2">
          {tones.map((tone) => (
            <Button
              key={tone.id}
              variant={selectedTone === tone.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTone(tone.id)}
              className="gap-1"
            >
              <span>{tone.emoji}</span>
              {tone.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Context */}
      <div className="space-y-3">
        <label className="text-sm font-medium flex items-center gap-2">
          <Hash className="w-4 h-4" />
          Describe Your Content (optional)
        </label>
        <Textarea
          placeholder="E.g., A sunset photo at the beach, launching my new product, behind-the-scenes at my studio..."
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          className="min-h-[80px]"
        />
      </div>

      {/* Generate Button */}
      <Button 
        onClick={generateCaption}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Generate Caption
          </>
        )}
      </Button>

      {/* Generated Result */}
      {generatedCaption && (
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Your Caption
            </h4>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline"
                onClick={generateCaption}
                disabled={isGenerating}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Regenerate
              </Button>
              <Button 
                size="sm" 
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-foreground whitespace-pre-wrap">{generatedCaption}</p>
            
            {generatedHashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2 border-t border-border/50">
                {generatedHashtags.map((tag, i) => (
                  <Badge 
                    key={i} 
                    variant="secondary" 
                    className="text-xs"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Platform-specific tips */}
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              {selectedPlatform === 'instagram' && '💡 Tip: Instagram shows only the first 125 characters before "more". Hook them early!'}
              {selectedPlatform === 'twitter' && '💡 Tip: Keep it punchy! Tweets under 100 characters get 17% more engagement.'}
              {selectedPlatform === 'youtube' && '💡 Tip: Include a CTA like "Subscribe" or "Watch more" in your description.'}
              {selectedPlatform === 'facebook' && '💡 Tip: Posts with questions get 100% more comments on Facebook.'}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
