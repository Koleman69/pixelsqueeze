import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Image,
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
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Printer,
  Workflow,
  LayoutDashboard,
  Send,
  Zap,
  Gauge,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ToolCategory = 
  | "overview"
  | "magic-optimize"
  | "quick-optimize"
  | "compress-image"
  | "edit-image"
  | "batch-process"
  | "batch-studio"
  | "pro-optimize"
  | "print-prep"
  | "compress-video"
  | "enhance-video"
  | "ai-captions"
  | "ai-analyze"
  | "social-export"
  | "social-studio"
  | "analytics"
  | "competitor"
  | "automation"
  | "distribute"
  | "workflows"
  | "ai-enhance"
  | "image-score";

interface DashboardSidebarProps {
  activeTool: ToolCategory;
  onToolChange: (tool: ToolCategory) => void;
  isSubscribed?: boolean;
}

const toolCategories = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    tools: [
      { id: "overview" as ToolCategory, label: "Dashboard", icon: LayoutDashboard, description: "Stats & scores" },
    ],
  },
  {
    label: "Images",
    icon: Image,
    tools: [
      { id: "magic-optimize" as ToolCategory, label: "Magic Optimize", icon: Sparkles, description: "One-click by destination" },
      { id: "ai-enhance" as ToolCategory, label: "AI Enhance", icon: Zap, description: "Upscale, sharpen, denoise & more" },
      { id: "image-score" as ToolCategory, label: "AI Image Score", icon: Gauge, description: "Grade & one-click fixes" },
      { id: "quick-optimize" as ToolCategory, label: "Quick Optimize", icon: Sparkles, description: "Goal-based optimization" },
      { id: "compress-image" as ToolCategory, label: "Compress", icon: Upload, description: "Reduce file size" },
      { id: "edit-image" as ToolCategory, label: "Edit & Transform", icon: Wand2, description: "AI editing" },
      { id: "batch-process" as ToolCategory, label: "Batch Process", icon: Package, description: "Multiple images" },
      { id: "pro-optimize" as ToolCategory, label: "Pro Optimizer", icon: Sparkles, description: "Max quality", pro: true },
      { id: "print-prep" as ToolCategory, label: "Print Prep", icon: Printer, description: "Print-ready sizes" },
    ],
  },
  {
    label: "Video",
    icon: Video,
    tools: [
      { id: "compress-video" as ToolCategory, label: "Compress", icon: Video, description: "Reduce video size" },
      { id: "enhance-video" as ToolCategory, label: "AI Enhance", icon: Sparkles, description: "Upscale & sharpen", pro: true },
    ],
  },
  {
    label: "AI Tools",
    icon: Brain,
    tools: [
      { id: "ai-captions" as ToolCategory, label: "Social Captions", icon: MessageSquare, description: "Generate captions" },
      { id: "ai-analyze" as ToolCategory, label: "File Analyzer", icon: Brain, description: "AI insights" },
      { id: "social-export" as ToolCategory, label: "Platform Export", icon: Share2, description: "Auto-resize" },
      { id: "social-studio" as ToolCategory, label: "Social Studio", icon: Sparkles, description: "One image → every platform" },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    tools: [
      { id: "analytics" as ToolCategory, label: "Dashboard", icon: BarChart3, description: "Usage stats" },
      { id: "competitor" as ToolCategory, label: "Competitor Intel", icon: Target, description: "Market tracking", pro: true },
    ],
  },
  {
    label: "Automation",
    icon: Workflow,
    tools: [
      { id: "automation" as ToolCategory, label: "Auto Process", icon: Workflow, description: "Cloud sync", pro: true },
      { id: "distribute" as ToolCategory, label: "Distribute", icon: Send, description: "Publish & schedule" },
      { id: "workflows" as ToolCategory, label: "Workflows", icon: Zap, description: "Auto-post & campaigns" },
    ],
  },
];

const SIDEBAR_STATE_KEY = "pixelsqueeze-sidebar-collapsed";

function SidebarCollapseButton() {
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="h-8 w-8"
    >
      {isCollapsed ? (
        <ChevronRight className="h-4 w-4" />
      ) : (
        <ChevronLeft className="h-4 w-4" />
      )}
      <span className="sr-only">Toggle sidebar</span>
    </Button>
  );
}

interface SidebarContentAreaProps {
  activeTool: ToolCategory;
  onToolChange: (tool: ToolCategory) => void;
  isSubscribed?: boolean;
}

function SidebarContentArea({ activeTool, onToolChange, isSubscribed }: SidebarContentAreaProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" aria-label="Dashboard tools">
      <SidebarHeader className="border-b border-sidebar-border/70 bg-sidebar-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5 shadow-[var(--shadow-glow)]">
              <Minimize2 className="h-4 w-4 text-primary shrink-0" />
            </div>
            {!isCollapsed && (
              <span className="text-lg font-bold">Pixelsqueeze</span>
            )}
          </div>
          {!isCollapsed && <SidebarCollapseButton />}
        </div>
        {isCollapsed && (
          <div className="flex justify-center py-1">
            <SidebarCollapseButton />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {toolCategories.map((category) => (
          <SidebarGroup key={category.label}>
            <SidebarGroupLabel>
              <category.icon className="h-4 w-4 mr-2" />
              {!isCollapsed && category.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {category.tools.map((tool) => (
                  <SidebarMenuItem key={tool.id}>
                    {isCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            isActive={activeTool === tool.id}
                            onClick={() => onToolChange(tool.id)}
                          >
                            <tool.icon className="h-4 w-4" />
                          </SidebarMenuButton>
                        </TooltipTrigger>
                         <TooltipContent side="right" className="flex items-center gap-2 border border-border/50 bg-popover/95 backdrop-blur-xl">
                          {tool.label}
                          {tool.pro && !isSubscribed && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600">
                              PRO
                            </Badge>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        isActive={activeTool === tool.id}
                        onClick={() => onToolChange(tool.id)}
                         className="justify-between rounded-xl border border-transparent data-[active=true]:border-primary/20 data-[active=true]:bg-primary/10 data-[active=true]:shadow-[var(--shadow-glow)]"
                      >
                        <div className="flex items-center gap-2">
                          <tool.icon className="h-4 w-4 shrink-0" />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{tool.label}</span>
                            <span className="text-xs text-muted-foreground">{tool.description}</span>
                          </div>
                        </div>
                        {tool.pro && !isSubscribed && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600 shrink-0">
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            PRO
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {!isSubscribed && !isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border">
            <div className="p-2">
            <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/10 to-background/40 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-sm">Upgrade to Pro</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Unlock unlimited compressions, AI video enhancement, and more.
              </p>
              <Button size="sm" className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                Start Free Trial
              </Button>
            </div>
          </div>
        </SidebarFooter>
      )}

      {!isSubscribed && isCollapsed && (
        <SidebarFooter className="border-t border-sidebar-border">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="mx-auto my-2 text-amber-500">
                <Crown className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              Upgrade to Pro
            </TooltipContent>
          </Tooltip>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}

// Read initial state synchronously from localStorage
function getInitialSidebarState(): boolean {
  if (typeof window === "undefined") return true;
  const stored = localStorage.getItem(SIDEBAR_STATE_KEY);
  // stored === "true" means collapsed, so we return !collapsed for "open"
  return stored !== "true";
}

export function DashboardSidebar({ activeTool, onToolChange, isSubscribed }: DashboardSidebarProps) {
  // Initialize state synchronously from localStorage
  const [isOpen, setIsOpen] = useState(getInitialSidebarState);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    localStorage.setItem(SIDEBAR_STATE_KEY, (!open).toString());
  };

  return (
    <TooltipProvider delayDuration={0}>
      <SidebarProvider open={isOpen} onOpenChange={handleOpenChange}>
        <SidebarContentArea
          activeTool={activeTool}
          onToolChange={onToolChange}
          isSubscribed={isSubscribed}
        />
      </SidebarProvider>
    </TooltipProvider>
  );
}
