import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, 
  Lightbulb, 
  Sparkles, 
  Clock, 
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  Image as ImageIcon,
  Palette,
  Zap
} from "lucide-react";
import { AnalysisResult } from "@/types/analysis";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface AnalysisBoardProps {
  results: AnalysisResult[];
  onClear: () => void;
}

export const AnalysisBoard = ({ results, onClear }: AnalysisBoardProps) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const copyToClipboard = async (result: AnalysisResult) => {
    const text = `
File: ${result.fileName}
Type: ${result.fileType}
Size: ${(result.fileSize / 1024).toFixed(2)} KB

Analysis:
${result.analysis}

Key Insights:
${result.insights.map(i => `• ${i}`).join('\n')}

Suggestions:
${result.suggestions.map(s => `• ${s}`).join('\n')}
    `.trim();

    await navigator.clipboard.writeText(text);
    setCopiedId(result.id);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (results.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Brain className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">No analyses yet</p>
          <p className="text-sm text-muted-foreground text-center">
            Upload files or images to get AI-powered insights
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Brain className="h-5 w-5 text-primary" />
          Analysis Results
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-2">
          <Trash2 className="h-4 w-4" />
          Clear All
        </Button>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {results.map((result) => (
              <div
                key={result.id}
                className="border border-border/50 rounded-lg overflow-hidden"
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleExpand(result.id)}
                >
                  <div className="flex items-center gap-3">
                    {result.isImage && result.preview ? (
                      <img 
                        src={result.preview} 
                        alt={result.fileName}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : result.isImage ? (
                      <ImageIcon className="h-5 w-5 text-purple-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-primary" />
                    )}
                    <div>
                      <p className="font-medium text-foreground">{result.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            result.isImage && "border-purple-500/50 text-purple-500"
                          )}
                        >
                          {result.isImage ? "🖼️ Vision AI" : result.fileType}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(result);
                      }}
                      className="h-8 w-8"
                    >
                      {copiedId === result.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    {expandedId === result.id ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <div
                  className={cn(
                    "overflow-hidden transition-all duration-300",
                    expandedId === result.id ? "max-h-[1000px]" : "max-h-0"
                  )}
                >
                  <div className="p-4 space-y-4 border-t border-border/50">
                    {/* Image Preview for image analysis */}
                    {result.isImage && result.preview && (
                      <div className="mb-4">
                        <img 
                          src={result.preview} 
                          alt={result.fileName}
                          className="max-h-48 rounded-lg object-contain mx-auto"
                        />
                      </div>
                    )}

                    {/* Analysis */}
                    <div>
                      <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                        {result.isImage ? (
                          <>
                            <Palette className="h-4 w-4 text-purple-500" />
                            Image Analysis
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 text-primary" />
                            Analysis
                          </>
                        )}
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {result.analysis}
                      </p>
                    </div>

                    {/* Insights */}
                    {result.insights.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          {result.isImage ? "Quality & Technical Insights" : "Key Insights"}
                        </h4>
                        <ul className="space-y-1">
                          {result.insights.map((insight, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-primary mt-1">•</span>
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggestions */}
                    {result.suggestions.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-orange-500" />
                          {result.isImage ? "Optimization Suggestions" : "Suggestions"}
                        </h4>
                        <ul className="space-y-1">
                          {result.suggestions.map((suggestion, i) => (
                            <li
                              key={i}
                              className="text-sm text-muted-foreground flex items-start gap-2"
                            >
                              <span className="text-orange-500 mt-1">→</span>
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
