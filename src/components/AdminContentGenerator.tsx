import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, Copy, Check, Loader2, 
  MessageSquare, Image, Search, Zap, Mail,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type ContentType = 'caption' | 'visual' | 'seo' | 'social_hooks' | 'email_sequence';

const contentTabs: { id: ContentType; label: string; icon: typeof MessageSquare; description: string }[] = [
  { id: 'caption', label: 'Captions', icon: MessageSquare, description: 'Auto-generate social media captions' },
  { id: 'visual', label: 'Visuals', icon: Image, description: 'Produce visual concepts & templates' },
  { id: 'seo', label: 'SEO', icon: Search, description: 'SEO-optimized descriptions & meta' },
  { id: 'social_hooks', label: 'Hooks', icon: Zap, description: 'Viral social hooks & openers' },
  { id: 'email_sequence', label: 'Emails', icon: Mail, description: 'Email sequences & campaigns' },
];

interface ContentResult {
  title: string;
  content: string;
  [key: string]: any;
}

export const AdminContentGenerator = () => {
  const [activeTab, setActiveTab] = useState<ContentType>('caption');
  const [context, setContext] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [results, setResults] = useState<ContentResult[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const generate = async () => {
    if (!context.trim()) {
      toast({ title: 'Enter a topic', description: 'Describe what you want to generate content for.', variant: 'destructive' });
      return;
    }
    setIsGenerating(true);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('generate-content', {
        body: { contentType: activeTab, context, customInstructions: customInstructions || undefined },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
      toast({ title: 'Content generated!', description: `${data.results?.length || 0} items created.` });
    } catch (err: any) {
      console.error('Generation error:', err);
      toast({ title: 'Generation failed', description: err.message || 'Try again.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyResult = async (index: number) => {
    const r = results[index];
    const text = r.subject_line
      ? `Subject: ${r.subject_line}\nPreview: ${r.preview_text || ''}\n\n${r.content}\n\nCTA: ${r.cta_text || ''}`
      : r.content;
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast({ title: 'Copied!' });
  };

  const renderResultMeta = (r: ContentResult) => {
    const badges: string[] = [];
    if (r.platform) badges.push(r.platform);
    if (r.trigger) badges.push(r.trigger);
    if (r.send_timing) badges.push(r.send_timing);
    if (r.dimensions) badges.push(r.dimensions);
    if (r.readability_score) badges.push(`Readability: ${r.readability_score}`);
    return badges;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>AI Content Generator</CardTitle>
            <CardDescription>Generate marketing content for PixelSqueeze</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as ContentType); setResults([]); }}>
          <TabsList className="grid grid-cols-5 w-full">
            {contentTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger key={tab.id} value={tab.id} className="gap-1 text-xs sm:text-sm">
                  <Icon className="w-4 h-4 hidden sm:block" />
                  {tab.label}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {contentTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id}>
              <p className="text-sm text-muted-foreground mb-4">{tab.description}</p>
            </TabsContent>
          ))}
        </Tabs>

        <div className="space-y-3">
          <label className="text-sm font-medium">Topic / Product / Campaign</label>
          <Textarea
            placeholder="e.g., PixelSqueeze image compression tool for e-commerce stores, Black Friday sale, new WebP format feature..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="min-h-[80px]"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium">Custom Instructions (optional)</label>
          <Input
            placeholder="e.g., Target audience: Shopify store owners, Tone: casual, Language: Spanish"
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
          />
        </div>

        <Button
          onClick={generate}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Generating...</>
          ) : (
            <><Sparkles className="w-5 h-5 mr-2" />Generate {contentTabs.find(t => t.id === activeTab)?.label}</>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{results.length} Results</h4>
              <Button size="sm" variant="outline" onClick={generate} disabled={isGenerating}>
                <RefreshCw className="w-4 h-4 mr-1" /> Regenerate
              </Button>
            </div>

            {results.map((r, i) => (
              <Card key={i} className="bg-muted/30">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="font-medium text-sm">{r.title}</h5>
                    <Button size="sm" variant="ghost" onClick={() => copyResult(i)}>
                      {copiedIndex === i ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>

                  {r.subject_line && (
                    <div className="text-xs space-y-1">
                      <p><span className="font-medium">Subject:</span> {r.subject_line}</p>
                      {r.preview_text && <p><span className="font-medium">Preview:</span> {r.preview_text}</p>}
                    </div>
                  )}

                  <p className="text-sm whitespace-pre-wrap">{r.content}</p>

                  {r.meta_title && (
                    <div className="text-xs bg-background/50 rounded p-2 space-y-1">
                      <p><span className="font-medium">Meta Title:</span> {r.meta_title}</p>
                      <p><span className="font-medium">Meta Desc:</span> {r.meta_description}</p>
                    </div>
                  )}

                  {r.copy_overlay && (
                    <p className="text-xs"><span className="font-medium">Copy Overlay:</span> {r.copy_overlay}</p>
                  )}

                  {r.follow_up && (
                    <p className="text-xs text-muted-foreground"><span className="font-medium">Follow-up:</span> {r.follow_up}</p>
                  )}

                  {r.cta_text && (
                    <p className="text-xs"><span className="font-medium">CTA:</span> {r.cta_text}</p>
                  )}

                  {r.style_notes && (
                    <p className="text-xs text-muted-foreground italic">{r.style_notes}</p>
                  )}

                  <div className="flex flex-wrap gap-1">
                    {renderResultMeta(r).map((badge, bi) => (
                      <Badge key={bi} variant="secondary" className="text-xs">{badge}</Badge>
                    ))}
                    {r.hashtags?.map((tag: string, ti: number) => (
                      <Badge key={`h-${ti}`} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                    {r.keywords?.map((kw: string, ki: number) => (
                      <Badge key={`k-${ki}`} variant="outline" className="text-xs">{kw}</Badge>
                    ))}
                    {r.colors?.map((c: string, ci: number) => (
                      <span key={ci} className="inline-flex items-center gap-1 text-xs">
                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c }} />
                        {c}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
