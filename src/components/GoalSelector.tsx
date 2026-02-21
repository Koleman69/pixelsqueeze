import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Mail,
  Instagram,
  ShoppingBag,
  Building2,
  Hotel,
  Store,
  Lock,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { CompressionSettings } from "@/hooks/useImageCompression";

export interface OptimizationGoal {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  isPaid: boolean;
  settings: CompressionSettings;
  outputFormat: "jpeg" | "png" | "webp" | "avif";
  renamePattern?: string;
  maxFileSizeKB?: number;
  dimensionPreset?: { width: number; height: number };
}

export const optimizationGoals: OptimizationGoal[] = [
  {
    id: "website-speed",
    label: "Website Speed",
    description: "Max quality per KB, responsive-ready, lazy-load compatible",
    icon: Globe,
    isPaid: false,
    settings: { quality: 80, maxWidth: 1920, maxHeight: 1080, dpi: 72 },
    outputFormat: "webp",
  },
  {
    id: "email-attachment",
    label: "Email Attachment",
    description: "Strict KB limit, progressive JPEG, email-safe",
    icon: Mail,
    isPaid: false,
    settings: { quality: 65, maxWidth: 1200, maxHeight: 800, dpi: 72 },
    outputFormat: "jpeg",
    maxFileSizeKB: 500,
  },
  {
    id: "social-media",
    label: "Social Media",
    description: "Platform-optimized dimensions, vivid colors preserved",
    icon: Instagram,
    isPaid: false,
    settings: { quality: 85, maxWidth: 1080, maxHeight: 1080, dpi: 72 },
    outputFormat: "jpeg",
  },
  {
    id: "shopify-product",
    label: "Shopify Product",
    description: "Square crop, white background ready, Shopify compliant",
    icon: ShoppingBag,
    isPaid: true,
    settings: { quality: 85, maxWidth: 2048, maxHeight: 2048, dpi: 72 },
    outputFormat: "webp",
    dimensionPreset: { width: 2048, height: 2048 },
  },
  {
    id: "real-estate",
    label: "Real Estate Listing",
    description: "MLS-compliant, HDR-preserving, fast gallery loading",
    icon: Building2,
    isPaid: true,
    settings: { quality: 82, maxWidth: 2400, maxHeight: 1600, dpi: 72 },
    outputFormat: "jpeg",
  },
  {
    id: "hotel-ota",
    label: "Hotel OTA Upload",
    description: "Booking.com, Expedia & Airbnb optimized sizes",
    icon: Hotel,
    isPaid: true,
    settings: { quality: 80, maxWidth: 2880, maxHeight: 1920, dpi: 72 },
    outputFormat: "jpeg",
  },
  {
    id: "marketplace",
    label: "Marketplace Listing",
    description: "eBay, Amazon & Etsy size limits and requirements",
    icon: Store,
    isPaid: true,
    settings: { quality: 85, maxWidth: 1600, maxHeight: 1600, dpi: 72 },
    outputFormat: "jpeg",
    dimensionPreset: { width: 1600, height: 1600 },
  },
];

interface GoalSelectorProps {
  selectedGoal: OptimizationGoal | null;
  onSelectGoal: (goal: OptimizationGoal) => void;
  onClearGoal: () => void;
  isSubscribed: boolean;
  onUpgrade: () => void;
}

export const GoalSelector = ({
  selectedGoal,
  onSelectGoal,
  onClearGoal,
  isSubscribed,
  onUpgrade,
}: GoalSelectorProps) => {
  if (selectedGoal) {
    const Icon = selectedGoal.icon;
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              Optimizing for: <span className="text-primary">{selectedGoal.label}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {selectedGoal.outputFormat.toUpperCase()} • {selectedGoal.settings.quality}% quality • {selectedGoal.settings.maxWidth}×{selectedGoal.settings.maxHeight}
              {selectedGoal.maxFileSizeKB && ` • Max ${selectedGoal.maxFileSizeKB}KB`}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClearGoal}>
          <RotateCcw className="w-3.5 h-3.5 mr-1" />
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h3 className="text-base font-semibold text-foreground">What's your goal?</h3>
        <p className="text-sm text-muted-foreground">
          We'll apply the best settings automatically
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {optimizationGoals.map((goal) => {
          const Icon = goal.icon;
          const locked = goal.isPaid && !isSubscribed;

          return (
            <button
              key={goal.id}
              onClick={() => {
                if (locked) {
                  onUpgrade();
                  return;
                }
                onSelectGoal(goal);
              }}
              className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all duration-150
                ${locked
                  ? "border-border/40 bg-muted/30 cursor-pointer hover:border-primary/30"
                  : "border-border hover:border-primary hover:bg-primary/5 hover:shadow-sm cursor-pointer"
                }`}
            >
              {locked && (
                <Lock className="absolute top-2 right-2 w-3 h-3 text-muted-foreground/50" />
              )}
              <div className={`p-2 rounded-lg ${locked ? "bg-muted" : "bg-secondary"}`}>
                <Icon className={`w-4 h-4 ${locked ? "text-muted-foreground/50" : "text-foreground"}`} />
              </div>
              <span className={`text-xs font-medium leading-tight ${locked ? "text-muted-foreground/50" : "text-foreground"}`}>
                {goal.label}
              </span>
              {locked && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">
                  Creator+
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
