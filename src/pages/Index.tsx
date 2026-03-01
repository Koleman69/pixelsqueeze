import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { LogOut, Crown, BookOpen, HelpCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useImageCompression } from "@/hooks/useImageCompression";
import { useVideoCompression } from "@/hooks/useVideoCompression";
import { Link } from "react-router-dom";
import { OnboardingFlow, OnboardingTrigger } from "@/components/OnboardingFlow";
import { UsageLimits, FREE_LIMITS } from "@/components/UsageLimits";
import { AnalysisResult } from "@/types/analysis";

// Tool components
import { ImageUploader } from "@/components/ImageUploader";
import { ImageEditor } from "@/components/ImageEditor";
import { BatchOptimizer } from "@/components/BatchOptimizer";
import { ProfessionalOptimizer } from "@/components/ProfessionalOptimizer";
import { PrintOptimizer } from "@/components/PrintOptimizer";
import { EnhancedVideoProgress } from "@/components/EnhancedVideoProgress";
import { AIVideoEnhancer } from "@/components/AIVideoEnhancer";
import { AICaptionGenerator } from "@/components/AICaptionGenerator";
import { FileProcessor } from "@/components/FileProcessor";
import { AnalysisBoard } from "@/components/AnalysisBoard";
import { SocialMediaExporter } from "@/components/SocialMediaExporter";
import { BatchAnalyticsDashboard } from "@/components/BatchAnalyticsDashboard";
import CompetitorTracker from "@/components/CompetitorTracker";
import { AutomationFlow } from "@/components/AutomationFlow";
import { DashboardOverview } from "@/components/DashboardOverview";
import { QuickOptimize } from "@/components/QuickOptimize";
import { ContentDistributor } from "@/components/ContentDistributor";
import { PostingWorkflows } from "@/components/PostingWorkflows";

// Navigation
import { DashboardSidebar, ToolCategory } from "@/components/DashboardSidebar";
import { MobileDashboardNav } from "@/components/MobileDashboardNav";

const toolTitles: Record<ToolCategory, { title: string; description: string }> = {
  overview: {
    title: "Dashboard",
    description: "Your optimization performance at a glance",
  },
  "quick-optimize": {
    title: "Quick Optimize",
    description: "Upload images, pick a goal, and get optimized files instantly",
  },
  "compress-image": {
    title: "Image Compression",
    description: "Reduce file sizes by up to 80% without losing quality",
  },
  "edit-image": {
    title: "AI Image Editor",
    description: "Crop, resize, and apply AI-powered transformations",
  },
  "batch-process": {
    title: "Batch Processor",
    description: "Process multiple images at once with GPU acceleration",
  },
  "pro-optimize": {
    title: "Professional Optimizer",
    description: "Maximum fidelity with minimal file size for web & print",
  },
  "print-prep": {
    title: "Print Preparation",
    description: "Crop, resize, and upscale images for professional printing",
  },
  "compress-video": {
    title: "Video Compression",
    description: "Reduce video file sizes while maintaining quality",
  },
  "enhance-video": {
    title: "AI Video Enhancer",
    description: "Upscale, sharpen, and improve video quality with AI",
  },
  "ai-captions": {
    title: "AI Social Captions",
    description: "Generate viral captions for every social platform",
  },
  "ai-analyze": {
    title: "AI File Analyzer",
    description: "Get instant AI-powered insights and recommendations",
  },
  "social-export": {
    title: "Platform Export",
    description: "Auto-resize images for Instagram, YouTube, Twitter & more",
  },
  "analytics": {
    title: "Analytics Dashboard",
    description: "Track your optimization history and storage savings",
  },
  "competitor": {
    title: "Competitor Intelligence",
    description: "Monitor competitor websites with AI-powered insights",
  },
  "automation": {
    title: "Automation Flow",
    description: "Connect cloud services and auto-process images continuously",
  },
  "distribute": {
    title: "Content Distribution",
    description: "Publish to socials, schedule posts, syndicate blogs & automate distribution",
  },
  "workflows": {
    title: "Posting Workflows",
    description: "Auto-post 10×/week, recycle top performers & trigger event campaigns",
  },
};

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { compressions, subscription, createCheckout, checkSubscription, compressImages, downloadBulk, openCustomerPortal } = useImageCompression();
  const { videoCompressions, compressVideo, downloadCompressedVideo, pauseCompression, resumeCompression, cancelCompression } = useVideoCompression();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolCategory>("quick-optimize");

  // Pro-only tools — free users see upgrade prompt
  const PRO_TOOLS: ToolCategory[] = ["pro-optimize", "enhance-video", "competitor", "automation"];

  const handleToolChange = (tool: ToolCategory) => {
    if (PRO_TOOLS.includes(tool) && !subscription.subscribed && !subscription.is_trialing) {
      toast({
        title: "Upgrade Required",
        description: "This tool is available on Creator+ plans. Upgrade to unlock automation, scanning, and pro optimization.",
      });
      createCheckout();
      return;
    }
    setActiveTool(tool);
  };
  
  // Track daily usage
  const [dailyUsage, setDailyUsage] = useState({ images: 0, videos: 0 });
  
  // AI File Analysis state
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  
  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResults(prev => [result, ...prev]);
  };
  
  const clearAnalysisResults = () => {
    setAnalysisResults([]);
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (!subscription.subscribed && !subscription.is_trialing) {
        if (dailyUsage.images >= FREE_LIMITS.images) {
          toast({
            title: "Daily Limit Reached",
            description: "Upgrade to Pro for unlimited compressions",
            variant: "destructive"
          });
          return;
        }
      }
      
      setIsUploading(true);
      toast({
        title: "Processing images",
        description: `Processing ${files.length} image(s)...`,
      });
      try {
        await compressImages(files);
        if (!subscription.subscribed && !subscription.is_trialing) {
          setDailyUsage(prev => ({ ...prev, images: prev.images + files.length }));
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleVideoUpload = () => {
    if (!subscription.subscribed && !subscription.is_trialing) {
      if (dailyUsage.videos >= FREE_LIMITS.videos) {
        toast({
          title: "Daily Limit Reached",
          description: "Upgrade to Pro for unlimited video compressions",
          variant: "destructive"
        });
        return;
      }
    }
    videoInputRef.current?.click();
  };

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      toast({
        title: "Processing video",
        description: `Compressing ${file.name}...`,
      });
      try {
        await compressVideo(file);
        if (!subscription.subscribed && !subscription.is_trialing) {
          setDailyUsage(prev => ({ ...prev, videos: prev.videos + 1 }));
        }
      } catch (error) {
        console.error('Video compression error:', error);
      }
    }
  };

  const renderToolContent = () => {
    switch (activeTool) {
      case "overview":
        return <DashboardOverview isSubscribed={subscription.subscribed} />;

      case "quick-optimize":
        return <QuickOptimize isSubscribed={subscription.subscribed} />;

      case "compress-image":
        return (
          <div className="space-y-6">
            <ImageUploader />
            {compressions.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Recent Compressions</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const completedIds = compressions.filter(c => c.status === 'completed').map(c => c.id);
                      downloadBulk(completedIds);
                    }}
                  >
                    Download All ({compressions.filter(c => c.status === 'completed').length})
                  </Button>
                </div>
                <div className="space-y-2">
                  {compressions.slice(0, 5).map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm font-medium truncate flex-1">{c.fileName}</span>
                      <Badge variant={c.status === 'completed' ? 'default' : 'secondary'}>
                        {c.status === 'completed' ? `${c.compressionRatio}% saved` : c.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        );

      case "edit-image":
        return <ImageEditor />;

      case "batch-process":
        return <BatchOptimizer />;

      case "pro-optimize":
        return <ProfessionalOptimizer />;

      case "print-prep":
        return <PrintOptimizer />;

      case "compress-video":
        return (
          <div className="space-y-6">
            <Card className="p-8 text-center border-dashed border-2">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">Upload Video to Compress</h3>
                <p className="text-muted-foreground mb-4">
                  Reduce video file sizes while maintaining quality. Supports MP4, WebM, and more.
                </p>
                <Button onClick={handleVideoUpload} size="lg" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Select Video"
                  )}
                </Button>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                />
              </div>
            </Card>
            {videoCompressions.length > 0 && (
              <EnhancedVideoProgress
                compressions={videoCompressions}
                onDownload={downloadCompressedVideo}
                onPause={pauseCompression}
                onResume={resumeCompression}
                onCancel={cancelCompression}
              />
            )}
          </div>
        );

      case "enhance-video":
        return <AIVideoEnhancer />;

      case "ai-captions":
        return <AICaptionGenerator />;

      case "ai-analyze":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FileProcessor onAnalysisComplete={handleAnalysisComplete} />
            <AnalysisBoard results={analysisResults} onClear={clearAnalysisResults} />
          </div>
        );

      case "social-export":
        return <SocialMediaExporter />;

      case "analytics":
        return <BatchAnalyticsDashboard />;

      case "competitor":
        return <CompetitorTracker />;

      case "automation":
        return <AutomationFlow />;

      case "distribute":
        return <ContentDistributor />;

      case "workflows":
        return <PostingWorkflows />;

      default:
        return null;
    }
  };

  const currentTool = toolTitles[activeTool];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Onboarding Flow */}
      <OnboardingFlow onComplete={() => setShowWelcome(true)} />

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <DashboardSidebar 
          activeTool={activeTool} 
          onToolChange={handleToolChange}
          isSubscribed={subscription.subscribed}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Navigation */}
        <MobileDashboardNav 
          activeTool={activeTool} 
          onToolChange={handleToolChange}
          isSubscribed={subscription.subscribed}
        />

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="ghost" size="sm">
                <BookOpen className="w-4 h-4 mr-2" />
                Blog
              </Button>
            </Link>
            <Link to="/company">
              <Button variant="ghost" size="sm">Company</Button>
            </Link>
            <Link to="/account">
              <Button variant="ghost" size="sm">Account</Button>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {subscription.subscribed && (
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                <Crown className="w-3 h-3 mr-1" />
                Pro
              </Badge>
            )}
            <OnboardingTrigger>
              <Button variant="ghost" size="sm">
                <HelpCircle className="w-4 h-4 mr-2" />
                Help
              </Button>
            </OnboardingTrigger>
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Welcome Banner */}
        {showWelcome && (
          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-primary/20 px-6 py-3">
            <div className="flex items-center justify-between">
              <p className="text-sm">
                <strong>Welcome!</strong> Select a tool from the sidebar to get started.
              </p>
              <Button variant="ghost" size="sm" onClick={() => setShowWelcome(false)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Usage Limits */}
        {(!subscription.subscribed && !subscription.is_trialing) && (
          <div className="px-6 py-4 border-b border-border">
            <UsageLimits 
              imageUsed={dailyUsage.images}
              videoUsed={dailyUsage.videos}
              isSubscribed={subscription.subscribed}
              isTrialing={subscription.is_trialing || false}
              trialEndsAt={subscription.trial_end}
              onUpgrade={createCheckout}
            />
          </div>
        )}

        {/* Tool Content Area */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Tool Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">{currentTool.title}</h1>
              <p className="text-muted-foreground">{currentTool.description}</p>
            </div>

            {/* Tool Content */}
            {renderToolContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
