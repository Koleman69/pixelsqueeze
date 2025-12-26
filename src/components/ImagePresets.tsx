import React from 'react';
import { Globe, Printer, Share2, Instagram, Twitter, Facebook, Linkedin, Monitor, Sparkles } from 'lucide-react';
import { CompressionSettings } from '@/hooks/useImageCompression';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface ImagePreset {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  settings: CompressionSettings;
  badge?: string;
}

export const imagePresets: ImagePreset[] = [
  {
    key: 'web',
    label: 'Web',
    description: 'Fast loading websites',
    icon: Globe,
    settings: {
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      dpi: 72
    }
  },
  {
    key: 'print',
    label: 'Print',
    description: 'High-res documents',
    icon: Printer,
    settings: {
      quality: 95,
      maxWidth: 3000,
      maxHeight: 3000,
      dpi: 300
    },
    badge: 'Pro'
  },
  {
    key: 'social',
    label: 'Social',
    description: 'Instagram, Facebook',
    icon: Share2,
    settings: {
      quality: 85,
      maxWidth: 1080,
      maxHeight: 1080,
      dpi: 72
    }
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: '1:1 square format',
    icon: Instagram,
    settings: {
      quality: 85,
      maxWidth: 1080,
      maxHeight: 1080,
      dpi: 72
    }
  },
  {
    key: 'twitter',
    label: 'Twitter/X',
    description: '16:9 landscape',
    icon: Twitter,
    settings: {
      quality: 85,
      maxWidth: 1200,
      maxHeight: 675,
      dpi: 72
    }
  },
  {
    key: 'linkedin',
    label: 'LinkedIn',
    description: 'Professional posts',
    icon: Linkedin,
    settings: {
      quality: 90,
      maxWidth: 1200,
      maxHeight: 627,
      dpi: 72
    }
  },
  {
    key: 'thumbnail',
    label: 'Thumbnail',
    description: 'Small previews',
    icon: Monitor,
    settings: {
      quality: 75,
      maxWidth: 400,
      maxHeight: 400,
      dpi: 72
    }
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Newsletter images',
    icon: Share2,
    settings: {
      quality: 70,
      maxWidth: 600,
      maxHeight: 600,
      dpi: 72
    }
  }
];

interface ImagePresetsProps {
  selectedPreset: string;
  onSelectPreset: (key: string, settings: CompressionSettings) => void;
  isSubscribed: boolean;
}

export const ImagePresets = ({ selectedPreset, onSelectPreset, isSubscribed }: ImagePresetsProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Quick Presets</span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {imagePresets.map((preset) => {
          const PresetIcon = preset.icon;
          const isActive = selectedPreset === preset.key;
          const isLocked = preset.badge === 'Pro' && !isSubscribed;
          
          return (
            <button
              key={preset.key}
              onClick={() => !isLocked && onSelectPreset(preset.key, preset.settings)}
              disabled={isLocked}
              className={cn(
                "relative p-3 rounded-lg border-2 text-left transition-all",
                isActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border bg-background hover:border-primary/50',
                isLocked && 'opacity-50 cursor-not-allowed'
              )}
            >
              {preset.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 bg-gradient-primary text-primary-foreground"
                >
                  {preset.badge}
                </Badge>
              )}
              <PresetIcon className={cn(
                "w-5 h-5 mb-1",
                isActive ? 'text-primary' : 'text-muted-foreground'
              )} />
              <p className={cn(
                "text-sm font-medium truncate",
                isActive && 'text-primary'
              )}>
                {preset.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {preset.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
