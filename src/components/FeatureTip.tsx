import React from 'react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureTipProps {
  title: string;
  description: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  isNew?: boolean;
  children?: React.ReactNode;
  className?: string;
}

export const FeatureTip = ({ 
  title, 
  description, 
  side = 'top',
  isNew = false,
  children,
  className 
}: FeatureTipProps) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children || (
            <button 
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full",
                "bg-muted hover:bg-muted/80 transition-colors",
                "text-muted-foreground hover:text-foreground",
                className
              )}
            >
              {isNew ? (
                <Sparkles className="w-3 h-3 text-primary" />
              ) : (
                <HelpCircle className="w-3 h-3" />
              )}
            </button>
          )}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs p-3">
          <div className="space-y-1">
            <p className="font-medium text-sm flex items-center gap-2">
              {title}
              {isNew && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
                  NEW
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">
              {description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Inline tip that shows as a subtle hint
interface InlineTipProps {
  text: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info';
  className?: string;
}

export const InlineTip = ({ 
  text, 
  icon,
  variant = 'default',
  className 
}: InlineTipProps) => {
  const variantStyles = {
    default: 'bg-muted/50 text-muted-foreground',
    success: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  };

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg border text-xs",
      variantStyles[variant],
      className
    )}>
      {icon || <Sparkles className="w-3 h-3 flex-shrink-0" />}
      <span>{text}</span>
    </div>
  );
};

// Animated spotlight for highlighting new features
interface SpotlightProps {
  children: React.ReactNode;
  isActive?: boolean;
  pulseColor?: string;
}

export const Spotlight = ({ 
  children, 
  isActive = true,
  pulseColor = 'primary'
}: SpotlightProps) => {
  if (!isActive) return <>{children}</>;

  return (
    <div className="relative">
      <div className={cn(
        "absolute -inset-1 rounded-lg opacity-75",
        `bg-${pulseColor}/20 animate-pulse`
      )} />
      <div className="relative">
        {children}
      </div>
    </div>
  );
};
