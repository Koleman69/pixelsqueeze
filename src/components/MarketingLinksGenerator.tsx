import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, ExternalLink, Target, DollarSign } from "lucide-react";
import { buildUtmLink } from "@/hooks/useUtmTracking";
import { toast } from "sonner";

const BASE_URL = "https://pixelsqueeze.lovable.app";

interface CampaignPreset {
  name: string;
  source: string;
  medium: string;
  campaign: string;
  content?: string;
  budget: string;
  description: string;
  platform: string;
}

/** Pre-built $100-budget campaign presets optimized for clicks */
const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    name: "Google Search — Brand",
    source: "google",
    medium: "cpc",
    campaign: "brand_awareness_2025",
    content: "image-optimizer-search",
    budget: "$30",
    description: "Target 'image compressor' and 'optimize images for website' keywords. CPC ~$0.15–0.40 = 75–200 clicks.",
    platform: "Google Ads",
  },
  {
    name: "Facebook — Shopify Owners",
    source: "facebook",
    medium: "cpc",
    campaign: "shopify_speed_2025",
    content: "shopify-store-speed",
    budget: "$25",
    description: "Target Shopify store owners interested in page speed. CPC ~$0.20–0.50 = 50–125 clicks.",
    platform: "Meta Ads",
  },
  {
    name: "Reddit — Web Dev Communities",
    source: "reddit",
    medium: "cpc",
    campaign: "webdev_launch_2025",
    content: "reddit-webdev-promoted",
    budget: "$15",
    description: "Promoted posts in r/webdev, r/Shopify, r/SEO. CPC ~$0.10–0.30 = 50–150 clicks.",
    platform: "Reddit Ads",
  },
  {
    name: "Twitter/X — SEO Audience",
    source: "twitter",
    medium: "cpc",
    campaign: "seo_pagespeed_2025",
    content: "twitter-seo-audience",
    budget: "$15",
    description: "Target SEO professionals and web developers. CPC ~$0.25–0.60 = 25–60 clicks.",
    platform: "X Ads",
  },
  {
    name: "Product Hunt Launch",
    source: "producthunt",
    medium: "referral",
    campaign: "ph_launch_2025",
    budget: "$0 (free)",
    description: "Submit to Product Hunt for free organic traffic. Typically 500–2000 visits on launch day.",
    platform: "Product Hunt",
  },
  {
    name: "LinkedIn — Agency Owners",
    source: "linkedin",
    medium: "cpc",
    campaign: "agency_speed_2025",
    content: "linkedin-agency-targeting",
    budget: "$15",
    description: "Target digital marketing agencies. CPC ~$1–2 but high-intent users. 8–15 high-quality clicks.",
    platform: "LinkedIn Ads",
  },
];

const MarketingLinksGenerator = () => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const handleCopy = async (url: string, idx: number) => {
    await navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    toast.success("Campaign link copied!");
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const totalBudget = CAMPAIGN_PRESETS.reduce((sum, c) => {
    const num = parseFloat(c.budget.replace("$", "")) || 0;
    return sum + num;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              $100 Marketing Plan
              <Badge variant="secondary" className="text-xs">
                <DollarSign className="w-3 h-3 mr-0.5" />
                {totalBudget} allocated
              </Badge>
            </CardTitle>
            <CardDescription>
              Pre-built UTM-tracked campaign links optimized for maximum clicks. Estimated 300–700+ total clicks.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {CAMPAIGN_PRESETS.map((preset, idx) => {
          const url = buildUtmLink(BASE_URL, preset.source, preset.medium, preset.campaign, preset.content);
          return (
            <div key={idx} className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{preset.name}</h4>
                  <Badge variant="outline" className="text-xs">{preset.budget}</Badge>
                </div>
                <Badge className="text-xs">{preset.platform}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{preset.description}</p>
              <div className="flex items-center gap-2">
                <Input
                  value={url}
                  readOnly
                  className="text-xs h-8 bg-muted font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => handleCopy(url, idx)}
                >
                  {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => window.open(url, "_blank")}
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}

        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <h4 className="font-medium">Quick Start Guide</h4>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
            <li>Copy the UTM link for each platform above</li>
            <li>Create ads on each platform using these links as the destination URL</li>
            <li>Set the budgets as shown (total = ${totalBudget})</li>
            <li>Track conversions in your dashboard — UTM data is captured automatically</li>
            <li>Submit to Product Hunt for free organic traffic</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketingLinksGenerator;
