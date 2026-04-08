import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  Menu,
  Minimize2,
} from "lucide-react";
import { ToolCategory } from "./DashboardSidebar";
import { useState } from "react";

interface MobileDashboardNavProps {
  activeTool: ToolCategory;
  onToolChange: (tool: ToolCategory) => void;
  isSubscribed?: boolean;
}

const toolCategories = [
  {
    label: "Images",
    icon: Image,
    tools: [
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

  // Find active tool info
  const activeToolInfo = toolCategories
    .flatMap(c => c.tools)
    .find(t => t.id === activeTool);

  return (
    <div className="lg:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <Minimize2 className="w-5 h-5 text-primary" />
          <span className="font-bold">Pixelsqueeze</span>
        </div>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Menu className="w-4 h-4" />
              {activeToolInfo && (
                <span className="flex items-center gap-1.5">
                  <activeToolInfo.icon className="w-4 h-4" />
                  {activeToolInfo.label}
                </span>
              )}
            </Button>
          </SheetTrigger>
           <SheetContent side="left" className="w-80 p-0" aria-label="Navigation menu">
             <SheetHeader className="sr-only">
               <SheetTitle>Navigation</SheetTitle>
             </SheetHeader>
             <div className="p-4 border-b border-border">
               <div className="flex items-center gap-2">
                 <Minimize2 className="w-6 h-6 text-primary" aria-hidden="true" />
                 <span className="text-lg font-bold">Pixelsqueeze</span>
               </div>
             </div>
            <ScrollArea className="h-[calc(100vh-80px)]">
              <nav className="p-4 space-y-6">
                {toolCategories.map((category) => (
                  <div key={category.label}>
                    <div className="flex items-center gap-2 mb-2">
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
                            "w-full justify-start gap-3 h-auto py-3",
                            activeTool === tool.id && "bg-primary/10 text-primary"
                          )}
                          onClick={() => handleToolChange(tool.id)}
                        >
                          <tool.icon className="w-5 h-5" />
                          <span className="flex-1 text-left">{tool.label}</span>
                          {tool.pro && !isSubscribed && (
                            <Badge variant="outline" className="text-[10px] border-amber-500 text-amber-600">
                              <Crown className="w-2.5 h-2.5 mr-0.5" />
                              PRO
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>

      {/* Quick Tab Bar */}
      <div className="flex overflow-x-auto border-b border-border bg-card/50 px-2 py-1 gap-1 no-scrollbar">
        {toolCategories.slice(0, 2).flatMap(c => c.tools.slice(0, 2)).map((tool) => (
          <Button
            key={tool.id}
            variant={activeTool === tool.id ? "secondary" : "ghost"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => onToolChange(tool.id)}
          >
            <tool.icon className="w-4 h-4" />
            {tool.label}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 text-muted-foreground"
          onClick={() => setOpen(true)}
        >
          More...
        </Button>
      </div>
    </div>
  );
}
