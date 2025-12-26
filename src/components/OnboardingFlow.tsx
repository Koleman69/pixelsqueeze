import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Upload, Zap, Image, Palette, Share2, 
  ChevronRight, ChevronLeft, X, Check, Wand2,
  Instagram, Globe, Printer, Crown, ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
}

interface Step {
  id: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  tip: string;
}

export const OnboardingFlow = ({ onComplete }: OnboardingFlowProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('pixelsqueeze_onboarding_complete');
    if (!seen) {
      // Delay showing onboarding to let the page load
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setHasSeenOnboarding(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem('pixelsqueeze_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem('pixelsqueeze_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
    setIsOpen(false);
  };

  const steps: Step[] = [
    {
      id: 1,
      title: "Welcome to Pixelsqueeze! 🎉",
      subtitle: "Your AI-powered image compression studio",
      icon: Sparkles,
      tip: "Reduce file sizes by up to 80% without losing quality",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/20 border border-blue-500/20 text-center">
              <Image className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm font-medium">Images</p>
              <p className="text-xs text-muted-foreground">JPG, PNG, WebP</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/20 border border-purple-500/20 text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm font-medium">Videos</p>
              <p className="text-xs text-muted-foreground">MP4, WebM, MOV</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-600/20 border border-green-500/20 text-center">
              <Wand2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm font-medium">AI Edit</p>
              <p className="text-xs text-muted-foreground">Enhance & Transform</p>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm">
              <strong>Get started with 3 free compressions</strong> — no credit card required. 
              Upgrade anytime for unlimited access.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Smart Platform Presets",
      subtitle: "One-click optimization for any platform",
      icon: Globe,
      tip: "Click a preset to instantly optimize for that platform",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Instagram, name: 'Instagram', desc: '1080×1080' },
              { icon: Globe, name: 'Web', desc: '1920×1080' },
              { icon: Share2, name: 'Social', desc: 'Optimized' },
              { icon: Printer, name: 'Print', desc: '300 DPI' },
            ].map((platform, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:border-primary/50 transition-all cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <platform.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{platform.name}</p>
                  <p className="text-xs text-muted-foreground">{platform.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <p className="text-xs">
              <strong>AI Analysis</strong> automatically detects the best platform for your image!
            </p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "AI-Powered Analysis",
      subtitle: "Get smart recommendations for every image",
      icon: Wand2,
      tip: "Upload an image and click 'Analyze' for AI suggestions",
      content: (
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
            <div className="absolute top-2 right-2">
              <Badge className="bg-gradient-primary text-[10px]">NEW</Badge>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Smart Image Analysis</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Our AI analyzes your image content to suggest:
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Best platforms for your image
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Optimal compression settings
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    Style enhancement filters
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 4,
      title: "Upload & Compress",
      subtitle: "It's as easy as drag and drop",
      icon: Upload,
      tip: "Drag files or click to browse — we handle the rest!",
      content: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-primary/50 rounded-xl p-8 text-center bg-primary/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary animate-bounce" />
            </div>
            <p className="font-medium mb-1">Drag & Drop</p>
            <p className="text-sm text-muted-foreground">
              or click to browse files
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-primary">80%</p>
              <p className="text-xs text-muted-foreground">Avg. Size Reduction</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-green-500">95%</p>
              <p className="text-xs text-muted-foreground">Quality Retained</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 5,
      title: "You're All Set! 🚀",
      subtitle: "Start compressing like a pro",
      icon: Check,
      tip: "Your first 3 compressions are free!",
      content: (
        <div className="space-y-6">
          <div className="text-center py-6">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow">
              <Check className="w-10 h-10 text-primary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Ready to Compress!</h3>
            <p className="text-muted-foreground">
              You've learned the basics. Time to optimize your images!
            </p>
          </div>
          <div className="p-4 rounded-lg bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-amber-500" />
              <div>
                <p className="font-medium text-sm">Try Pro Free for 7 Days</p>
                <p className="text-xs text-muted-foreground">
                  Unlimited compressions, AI features & more
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const StepIcon = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (hasSeenOnboarding) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-primary/20">
        {/* Header */}
        <div className="relative p-6 pb-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-primary/20">
              <StepIcon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <Badge variant="outline" className="mb-1 text-[10px]">
                Step {currentStep + 1} of {steps.length}
              </Badge>
              <h2 className="text-xl font-bold">{currentStepData.title}</h2>
            </div>
          </div>
          
          <p className="text-muted-foreground text-sm">
            {currentStepData.subtitle}
          </p>
          
          <Progress value={progress} className="h-1 mt-4" />
        </div>

        {/* Content */}
        <div className="p-6 pt-2">
          <div className="min-h-[240px]">
            {currentStepData.content}
          </div>

          {/* Tip */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mt-4">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Tip:</strong> {currentStepData.tip}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={cn(currentStep === 0 && "invisible")}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  i === currentStep 
                    ? "bg-primary w-4" 
                    : i < currentStep 
                      ? "bg-primary/50" 
                      : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={nextStep}
            className="bg-gradient-primary"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Get Started
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper component to trigger onboarding manually
export const OnboardingTrigger = ({ children }: { children: React.ReactNode }) => {
  const resetOnboarding = () => {
    localStorage.removeItem('pixelsqueeze_onboarding_complete');
    window.location.reload();
  };

  return (
    <button onClick={resetOnboarding}>
      {children}
    </button>
  );
};
