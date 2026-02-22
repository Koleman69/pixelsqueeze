import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code, Copy, Check, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OptimizationBadgeProps {
  secondsSaved: string;
  imageCount: number;
}

export function OptimizationBadge({ secondsSaved, imageCount }: OptimizationBadgeProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const badgeHtml = `<!-- PixelSqueeze Optimization Badge -->
<a href="https://pixelsqueeze.lovable.app" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px;background:#0f172a;color:#f8fafc;font-family:system-ui,sans-serif;font-size:13px;text-decoration:none;border:1px solid #334155;">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#818cf8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15V6"/><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"/><path d="M12 12H3"/><path d="M16 6H3"/><path d="M12 18H3"/></svg>
  <span>This site loads <strong>${secondsSaved}</strong> faster with PixelSqueeze</span>
</a>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(badgeHtml);
      setCopied(true);
      toast({ title: "Copied!", description: "Badge HTML copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Code className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold">Shareable Badge</h3>
        <Badge variant="secondary" className="text-[10px]">Embed</Badge>
      </div>

      {/* Live Preview */}
      <div className="bg-muted/50 rounded-lg p-4 flex justify-center">
        <a
          href="https://pixelsqueeze.lovable.app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground text-background text-xs font-medium no-underline border border-border/20 hover:opacity-90 transition-opacity"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15V6" /><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
            <path d="M12 12H3" /><path d="M16 6H3" /><path d="M12 18H3" />
          </svg>
          <span>
            This site loads <strong>{secondsSaved}</strong> faster with PixelSqueeze
          </span>
        </a>
      </div>

      {/* Code Snippet */}
      <div className="relative">
        <pre className="bg-muted rounded-lg p-3 text-xs overflow-x-auto max-h-32 text-muted-foreground font-mono leading-relaxed">
          {badgeHtml}
        </pre>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Add this badge to your website footer to show visitors your site is optimized.
        Based on {imageCount} optimized image{imageCount !== 1 ? "s" : ""}.
      </p>
    </Card>
  );
}
