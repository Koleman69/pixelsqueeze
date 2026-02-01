import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  ChevronRight,
  Minimize2,
} from "lucide-react";

export type ToolCategory = 
  | "compress-image"
  | "edit-image"
  | "batch-process"
  | "pro-optimize"
  | "compress-video"
  | "enhance-video"
  | "ai-captions"
  | "ai-analyze"
  | "social-export"
  | "analytics"
  | "competitor";

interface DashboardSidebarProps {
  activeTool: ToolCategory;
  onToolChange: (tool: ToolCategory) => void;
  isSubscribed?: boolean;
}

const toolCategories = [
  {
    label: "Images",
    icon: Image,
    tools: [
      { id: "compress-image" as ToolCategory, label: "Compress", icon: Upload, description: "Reduce file size" },
      { id: "edit-image" as ToolCategory, label: "Edit & Transform", icon: Wand2, description: "AI editing" },
      { id: "batch-process" as ToolCategory, label: "Batch Process", icon: Package, description: "Multiple images" },
      { id: "pro-optimize" as ToolCategory, label: "Pro Optimizer", icon: Sparkles, description: "Max quality", pro: true },
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
];

export function DashboardSidebar({ activeTool, onToolChange, isSubscribed }: DashboardSidebarProps) {
  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Minimize2 className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">Pixelsqueeze</span>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-6">
          {toolCategories.map((category) => (
            <div key={category.label}>
              <div className="flex items-center gap-2 px-3 mb-2">
                <category.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {category.label}
                </span>
              </div>
              <div className="space-y-1">
                {category.tools.map((tool) => (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 h-auto py-2.5 px-3",
                      activeTool === tool.id && "bg-primary/10 text-primary border-l-2 border-primary rounded-l-none"
                    )}
                    onClick={() => onToolChange(tool.id)}
                  >
                    <tool.icon className="w-4 h-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{tool.label}</span>
                        {tool.pro && !isSubscribed && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500 text-amber-600">
                            <Crown className="w-2.5 h-2.5 mr-0.5" />
                            PRO
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{tool.description}</span>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      activeTool === tool.id && "text-primary"
                    )} />
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Upgrade CTA */}
      {!isSubscribed && (
        <div className="p-4 border-t border-border">
          <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-lg p-4">
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
      )}
    </aside>
  );
}
