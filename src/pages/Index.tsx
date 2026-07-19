import { useState, useRef, useEffect, lazy, Suspense } from "react";
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
import { motion, AnimatePresence } from "framer-motion";

// Lazy-loaded tool components for faster initial render
const ImageUploader = lazy(() => import("@/components/ImageUploader").then(m => ({ default: m.ImageUploader })));
const ImageEditor = lazy(() => import("@/components/ImageEditor").then(m => ({ default: m.ImageEditor })));
const BatchOptimizer = lazy(() => import("@/components/BatchOptimizer").then(m => ({ default: m.BatchOptimizer })));
const ProfessionalOptimizer = lazy(() => import("@/components/ProfessionalOptimizer").then(m => ({ default: m.ProfessionalOptimizer })));
const PrintOptimizer = lazy(() => import("@/components/PrintOptimizer").then(m => ({ default: m.PrintOptimizer })));
const EnhancedVideoProgress = lazy(() => import("@/components/EnhancedVideoProgress").then(m => ({ default: m.EnhancedVideoProgress })));
const AIVideoEnhancer = lazy(() => import("@/components/AIVideoEnhancer").then(m => ({ default: m.AIVideoEnhancer })));
const AICaptionGenerator = lazy(() => import("@/components/AICaptionGenerator").then(m => ({ default: m.AICaptionGenerator })));
const FileProcessor = lazy(() => import("@/components/FileProcessor").then(m => ({ default: m.FileProcessor })));
const AnalysisBoard = lazy(() => import("@/components/AnalysisBoard").then(m => ({ default: m.AnalysisBoard })));
const SocialMediaExporter = lazy(() => import("@/components/SocialMediaExporter").then(m => ({ default: m.SocialMediaExporter })));
const BatchAnalyticsDashboard = lazy(() => import("@/components/BatchAnalyticsDashboard").then(m => ({ default: m.BatchAnalyticsDashboard })));
const CompetitorTracker = lazy(() => import("@/components/CompetitorTracker"));
const AutomationFlow = lazy(() => import("@/components/AutomationFlow").then(m => ({ default: m.AutomationFlow })));
const DashboardOverview = lazy(() => import("@/components/DashboardOverview").then(m => ({ default: m.DashboardOverview })));
const QuickOptimize = lazy(() => import("@/components/QuickOptimize").then(m => ({ default: m.QuickOptimize })));
const MagicOptimize = lazy(() => import("@/components/MagicOptimize").then(m => ({ default: m.MagicOptimize })));
const AIEnhanceStudio = lazy(() => import("@/components/AIEnhanceStudio").then(m => ({ default: m.AIEnhanceStudio })));
const ContentDistributor = lazy(() => import("@/components/ContentDistributor").then(m => ({ default: m.ContentDistributor })));
const PostingWorkflows = lazy(() => import("@/components/PostingWorkflows").then(m => ({ default: m.PostingWorkflows })));

// Navigation
import { DashboardSidebar, ToolCategory } from "@/components/DashboardSidebar";
import { MobileDashboardNav } from "@/components/MobileDashboardNav";

const ToolLoader = () => (
  <div className="flex items-center justify-center py-20">
    <div className="relative">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
      <div className="absolute inset-0 w-12 h-12 rounded-xl border-2 border-primary/30 animate-spin" style={{ animationDuration: '2s' }} />
    </div>
  </div>
);

const toolTitles: Record<ToolCategory, { title: string; description: string; gradient: string }> = {
  overview: {
    title: "Dashboard",
    description: "Your optimization performance at a glance",
    gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
  },
  "magic-optimize": {
    title: "Magic Optimize",
    description: "Pick a destination and we'll optimize automatically — Apple-level simple",
    gradient: "from-primary/20 via-accent/10 to-transparent",
  },
  "ai-enhance": {
    title: "AI Enhance Studio",
    description: "Upscale, sharpen, denoise, remove backgrounds & more — one click each",
    gradient: "from-indigo-500/20 via-purple-500/10 to-transparent",
  },
  "quick-optimize": {
    title: "Quick Optimize",
    description: "Upload images, pick a goal, and get optimized files instantly",
    gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
  },
  "compress-image": {
    title: "Image Compression",
    description: "Reduce file sizes by up to 80% without losing quality",
    gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
  },
  "edit-image": {
    title: "AI Image Editor",
    description: "Crop, resize, and apply AI-powered transformations",
    gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
  },
  "batch-process": {
    title: "Batch Processor",
    description: "Process multiple images at once with GPU acceleration",
    gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
  },
  "pro-optimize": {
    title: "Professional Optimizer",
    description: "Maximum fidelity with minimal file size for web & print",
    gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
  },
  "print-prep": {
    title: "Print Preparation",
    description: "Crop, resize, and upscale images for professional printing",
    gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
  },
  "compress-video": {
    title: "Video Compression",
    description: "Reduce video file sizes while maintaining quality",
    gradient: "from-red-500/10 via-orange-500/5 to-transparent",
  },
  "enhance-video": {
    title: "AI Video Enhancer",
    description: "Upscale, sharpen, and improve video quality with AI",
    gradient: "from-fuchsia-500/10 via-pink-500/5 to-transparent",
  },
  "ai-captions": {
    title: "AI Social Captions",
    description: "Generate viral captions for every social platform",
    gradient: "from-lime-500/10 via-green-500/5 to-transparent",
  },
  "ai-analyze": {
    title: "AI File Analyzer",
    description: "Get instant AI-powered insights and recommendations",
    gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
  },
  "social-export": {
    title: "Platform Export",
    description: "Auto-resize images for Instagram, YouTube, Twitter & more",
    gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
  },
  "social-studio": {
    title: "Social Studio",
    description: "One image, every platform — instant social pack",
    gradient: "from-fuchsia-500/10 via-pink-500/5 to-transparent",
  },
  "analytics": {
    title: "Analytics Dashboard",
    description: "Track your optimization history and storage savings",
    gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
  },
  "competitor": {
    title: "Competitor Intelligence",
    description: "Monitor competitor websites with AI-powered insights",
    gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
  },
  "automation": {
    title: "Automation Flow",
    description: "Connect cloud services and auto-process images continuously",
    gradient: "from-purple-500/10 via-violet-500/5 to-transparent",
  },
  "distribute": {
    title: "Content Distribution",
    description: "Publish to socials, schedule posts, syndicate blogs & automate distribution",
    gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
  },
  "workflows": {
    title: "Posting Workflows",
    description: "Auto-post 10×/week, recycle top performers & trigger event campaigns",
    gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
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
  const [activeTool, setActiveTool] = useState<ToolCategory>("magic-optimize");

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

  const [dailyUsage, setDailyUsage] = useState({ images: 0, videos: 0 });
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);

  const handleAnalysisComplete = (result: AnalysisResult) => {
    setAnalysisResults(prev => [result, ...prev]);
  };

  const clearAnalysisResults = () => {
    setAnalysisResults([]);
  };

  useEffect(() => {
    if (user) checkSubscription();
  }, [user]);

  const handleSignOut = async () => { await signOut(); };

  const handleFileUpload = () => { fileInputRef.current?.click(); };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (!subscription.subscribed && !subscription.is_trialing) {
        if (dailyUsage.images >= FREE_LIMITS.images) {
          toast({ title: "Daily Limit Reached", description: "Upgrade to Pro for unlimited compressions", variant: "destructive" });
          return;
        }
      }
      setIsUploading(true);
      toast({ title: "Processing images", description: `Processing ${files.length} image(s)...` });
      try {
        await compressImages(files);
        if (!subscription.subscribed && !subscription.is_trialing) {
          setDailyUsage(prev => ({ ...prev, images: prev.images + files.length }));
        }
      } finally { setIsUploading(false); }
    }
  };

  const handleVideoUpload = () => {
    if (!subscription.subscribed && !subscription.is_trialing) {
      if (dailyUsage.videos >= FREE_LIMITS.videos) {
        toast({ title: "Daily Limit Reached", description: "Upgrade to Pro for unlimited video compressions", variant: "destructive" });
        return;
      }
    }
    videoInputRef.current?.click();
  };

  const handleVideoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      toast({ title: "Processing video", description: `Compressing ${file.name}...` });
      try {
        await compressVideo(file);
        if (!subscription.subscribed && !subscription.is_trialing) {
          setDailyUsage(prev => ({ ...prev, videos: prev.videos + 1 }));
        }
      } catch (error) { console.error('Video compression error:', error); }
    }
  };

  const renderToolContent = () => {
    const content = (() => {
      switch (activeTool) {
        case "overview":
          return <DashboardOverview isSubscribed={subscription.subscribed} onQuickAction={(t) => setActiveTool(t as any)} />;
        case "magic-optimize":
          return <MagicOptimize isSubscribed={subscription.subscribed} />;
        case "ai-enhance":
          return <AIEnhanceStudio />;
        case "quick-optimize":
          return <QuickOptimize isSubscribed={subscription.subscribed} />;
        case "compress-image":
          return (
            <div className="space-y-6">
              <ImageUploader />
              {compressions.length > 0 && (
                <Card className="p-4 glass-card">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Recent Compressions</h3>
                    <Button variant="outline" size="sm" onClick={() => {
                      const completedIds = compressions.filter(c => c.status === 'completed').map(c => c.id);
                      downloadBulk(completedIds);
                    }}>
                      Download All ({compressions.filter(c => c.status === 'completed').length})
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {compressions.slice(0, 5).map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg backdrop-blur-sm">
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
              <Card className="p-8 text-center border-dashed border-2 glass-card">
                <div className="max-w-md mx-auto">
                  <h3 className="text-lg font-semibold mb-2">Upload Video to Compress</h3>
                  <p className="text-muted-foreground mb-4">
                    Reduce video file sizes while maintaining quality. Supports MP4, WebM, and more.
                  </p>
                  <Button onClick={handleVideoUpload} size="lg" disabled={isUploading} className="glow-btn">
                    {isUploading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                    ) : "Select Video"}
                  </Button>
                  <input ref={videoInputRef} type="file" accept="video/*" className="hidden" onChange={handleVideoChange} aria-label="Upload video for compression" />
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
    })();

    return (
      <Suspense fallback={<ToolLoader />}>
        {content}
      </Suspense>
    );
  };

  const currentTool = toolTitles[activeTool];

  return (
    <div className="min-h-screen bg-background flex overflow-x-hidden" role="application" aria-label="PixelSqueeze Dashboard">

      <OnboardingFlow onComplete={() => setShowWelcome(true)} />

      <label htmlFor="file-upload" className="sr-only">Upload images</label>
      <input id="file-upload" ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={isUploading} aria-label="Upload images for compression" />

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <DashboardSidebar activeTool={activeTool} onToolChange={handleToolChange} isSubscribed={subscription.subscribed} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <MobileDashboardNav activeTool={activeTool} onToolChange={handleToolChange} isSubscribed={subscription.subscribed} />

        {/* Desktop Header */}
        <header className="hidden lg:flex items-center justify-between border-b border-border/50 px-6 py-3 bg-card/80 backdrop-blur-xl" role="banner">
          <div className="flex items-center gap-4">
            <Link to="/blog">
              <Button variant="ghost" size="sm"><BookOpen className="w-4 h-4 mr-2" />Blog</Button>
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
              <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/20 animate-shimmer">
                <Crown className="w-3 h-3 mr-1" />Pro
              </Badge>
            )}
            <OnboardingTrigger>
              <Button variant="ghost" size="sm"><HelpCircle className="w-4 h-4 mr-2" />Help</Button>
            </OnboardingTrigger>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="w-4 h-4 mr-2" />Sign Out</Button>
          </div>
        </header>

        {/* Welcome Banner */}
        <AnimatePresence>
          {showWelcome && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gradient-to-r from-primary/10 via-accent/5 to-transparent border-b border-primary/20 px-6 py-3 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm"><strong>Welcome!</strong> Select a tool from the sidebar to get started.</p>
                <Button variant="ghost" size="sm" onClick={() => setShowWelcome(false)}>Dismiss</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Usage Limits */}
        {(!subscription.subscribed && !subscription.is_trialing) && (
          <div className="px-6 py-4 border-b border-border/50">
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
        <main
          id="main-content"
          className="flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6 pb-24 lg:pb-6"
          aria-label={currentTool.title}
        >
          <div className="max-w-5xl mx-auto">
            {/* Tool Header with gradient */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="mb-4 sm:mb-6"
              >
                <div className={`relative mb-2 overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-r ${currentTool.gradient} p-4 sm:p-6 backdrop-blur-xl`}>
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)/0.35),transparent_55%)]" />
                  <div className="absolute -right-12 top-0 h-36 w-36 rounded-full bg-primary/10 blur-3xl" />
                  <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />
                  <h1 className="text-xl sm:text-2xl font-bold mb-1 relative">{currentTool.title}</h1>
                  <p className="text-sm sm:text-base text-muted-foreground relative">{currentTool.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Tool Content with fade */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool + "-content"}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                {renderToolContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};


export default Index;
