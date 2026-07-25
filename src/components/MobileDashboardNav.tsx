import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Image as ImageIcon,
  Video,
  Sparkles,
  BarChart3,
  Upload,
  Wand2,
  MessageSquare,
  Package,
  Share2,
  Brain,
  Target,
  Crown,
  Menu,
  Home,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import { ToolCategory } from "./DashboardSidebar";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileDashboardNavProps {
  activeTool: ToolCategory;
  onToolChange: (tool: ToolCategory) => void;
  isSubscribed?: boolean;
}

// 5 primary tabs shown in the bottom bar
const PRIMARY_TABS: { id: ToolCategory; label: string; icon: any }[] = [
  { id: "overview", label: "Home", icon: Home },
  { id: "magic-optimize", label: "Optimize", icon: Sparkles },
  { id: "batch-process", label: "Batch", icon: Package },
  { id: "ai-analyze", label: "AI", icon: Brain },
];

const toolCategories = [
  {
    label: "Images",
    icon: ImageIcon,
    tools: [
      { id: "overview" as ToolCategory, label: "Dashboard", icon: Home },
      { id: "magic-optimize" as ToolCategory, label: "Magic Optimize", icon: Sparkles },
      { id: "compress-image" as ToolCategory, label: "Compress", icon: Upload },
      { id: "edit-image" as ToolCategory, label: "Edit", icon: Wand2 },
      { id: "batch-process" as ToolCategory, label: "Batch", icon: Package },
      { id: "pro-optimize" as ToolCategory, label: "Pro", icon: Sparkles, pro: true },
    ],
  },
  {
    label: "Video",
    icon: Video,
    tools: [
      { id: "compress-video" as ToolCategory, label: "Compress", icon: Video },
      { id: "enhance-video" as ToolCategory, label: "Enhance", icon: Sparkles, pro: true },
    ],
  },
  {
    label: "AI",
    icon: Brain,
    tools: [
      { id: "ai-captions" as ToolCategory, label: "Captions", icon: MessageSquare },
      { id: "ai-analyze" as ToolCategory, label: "Analyze", icon: Brain },
      { id: "social-export" as ToolCategory, label: "Export", icon: Share2 },
    ],
  },
  {
    label: "Stats",
    icon: BarChart3,
    tools: [
      { id: "analytics" as ToolCategory, label: "Dashboard", icon: BarChart3 },
      { id: "competitor" as ToolCategory, label: "Intel", icon: Target, pro: true },
    ],
  },
];

export function MobileDashboardNav({ activeTool, onToolChange, isSubscribed }: MobileDashboardNavProps) {
  const [open, setOpen] = useState(false);

  const handleToolChange = (tool: ToolCategory) => {
    onToolChange(tool);
    setOpen(false);
  };

  // Edge-swipe from left to open the drawer
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (t.clientX <= 24) touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    };
    const onEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = Math.abs(t.clientY - touchStart.current.y);
      const dt = Date.now() - touchStart.current.t;
      if (dx > 60 && dy < 40 && dt < 500) setOpen(true);
      touchStart.current = null;
    };
    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchend", onEnd);
    };
  }, []);

  return (
    <div className="lg:hidden">
      {/* Compact top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border/60 bg-background/85 px-3 py-2 backdrop-blur-xl safe-top">
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white shadow-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </div>
          <span className="truncate font-display text-base font-bold">PixelSqueeze</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-11 w-11 rounded-xl"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm p-0" aria-label="Navigation menu">
            <SheetHeader className="border-b border-border p-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-secondary text-white">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span>PixelSqueeze</span>
              </SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100dvh-72px)]">
              <nav className="space-y-6 p-4 pb-24" aria-label="Primary">
                {toolCategories.map((category) => (
                  <div key={category.label}>
                    <div className="mb-2 flex items-center gap-2">
                      <category.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {category.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {category.tools.map((tool) => (
                        <button
                          key={tool.id}
                          onClick={() => handleToolChange(tool.id)}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-colors min-h-[48px]",
                            activeTool === tool.id
                              ? "bg-primary/10 text-primary"
                              : "hover:bg-muted"
                          )}
                        >
                          <tool.icon className="h-5 w-5 shrink-0" />
                          <span className="flex-1 truncate">{tool.label}</span>
                          {tool.pro && !isSubscribed && (
                            <Badge variant="outline" className="border-amber-500 text-[10px] text-amber-600">
                              <Crown className="mr-0.5 h-2.5 w-2.5" />
                              PRO
                            </Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bottom navigation */}
      <nav
        aria-label="Bottom navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-xl shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.25)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-5">
          {PRIMARY_TABS.map((tab) => {
            const active = activeTool === tab.id;
            return (
              <li key={tab.id}>
                <button
                  onClick={() => onToolChange(tab.id)}
                  aria-label={tab.label}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex w-full flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[56px] transition-colors",
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        layoutId="mobile-tab-indicator"
                        className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>
                  <tab.icon className={cn("h-5 w-5", active && "drop-shadow")} />
                  <span className="text-[10px] font-medium leading-none">{tab.label}</span>
                </button>
              </li>
            );
          })}
          <li>
            <button
              onClick={() => setOpen(true)}
              aria-label="More options"
              className="flex w-full flex-col items-center justify-center gap-0.5 px-1 py-2 min-h-[56px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-none">More</span>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}
