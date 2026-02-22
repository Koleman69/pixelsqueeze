import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/StatsCard";
import {
  ImageIcon,
  Timer,
  Search,
  HardDrive,
  TrendingUp,
  Activity,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface AggregatedStats {
  totalImages: number;
  totalOriginalBytes: number;
  totalOptimizedBytes: number;
  totalSavedBytes: number;
  avgCompressionRatio: number;
  totalProcessingMs: number;
}

interface HistoryPoint {
  date: string;
  score: number;
  images: number;
  saved: number;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function estimateLoadTimeSaved(savedBytes: number): string {
  // Assume average 3G speed ~1.5 Mbps = 187.5 KB/s
  const seconds = savedBytes / (187.5 * 1024);
  if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${(seconds / 60).toFixed(1)}min`;
}

function estimateSeoScore(avgRatio: number, totalImages: number): number {
  if (totalImages === 0) return 0;
  // Base score from compression efficiency + volume bonus
  const compressionScore = Math.min(avgRatio * 1.2, 80);
  const volumeBonus = Math.min(totalImages * 0.5, 20);
  return Math.round(Math.min(compressionScore + volumeBonus, 100));
}

export function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AggregatedStats>({
    totalImages: 0,
    totalOriginalBytes: 0,
    totalOptimizedBytes: 0,
    totalSavedBytes: 0,
    avgCompressionRatio: 0,
    totalProcessingMs: 0,
  });
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchStats() {
      setLoading(true);
      const { data, error } = await supabase
        .from("batch_processing_stats")
        .select("*")
        .eq("user_id", user!.id)
        .order("processed_at", { ascending: true });

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Aggregate
      let totalImages = 0;
      let totalOriginal = 0;
      let totalOptimized = 0;
      let totalSaved = 0;
      let weightedRatio = 0;
      let totalMs = 0;

      const dailyMap = new Map<string, { images: number; saved: number; ratioSum: number; count: number }>();

      for (const row of data) {
        totalImages += row.image_count;
        totalOriginal += Number(row.total_original_size);
        totalOptimized += Number(row.total_optimized_size);
        totalSaved += Number(row.total_saved);
        weightedRatio += row.avg_compression_ratio * row.image_count;
        totalMs += row.processing_time_ms;

        const day = new Date(row.processed_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        const existing = dailyMap.get(day) || { images: 0, saved: 0, ratioSum: 0, count: 0 };
        existing.images += row.image_count;
        existing.saved += Number(row.total_saved);
        existing.ratioSum += row.avg_compression_ratio * row.image_count;
        existing.count += row.image_count;
        dailyMap.set(day, existing);
      }

      const avgRatio = totalImages > 0 ? Math.round(weightedRatio / totalImages) : 0;

      setStats({
        totalImages,
        totalOriginalBytes: totalOriginal,
        totalOptimizedBytes: totalOptimized,
        totalSavedBytes: totalSaved,
        avgCompressionRatio: avgRatio,
        totalProcessingMs: totalMs,
      });

      // Build history (last 14 entries max)
      const historyPoints: HistoryPoint[] = [];
      let cumulativeImages = 0;
      let cumulativeSaved = 0;

      for (const [date, day] of dailyMap) {
        cumulativeImages += day.images;
        cumulativeSaved += day.saved;
        const dayAvgRatio = day.count > 0 ? day.ratioSum / day.count : 0;
        historyPoints.push({
          date,
          score: estimateSeoScore(dayAvgRatio, cumulativeImages),
          images: cumulativeImages,
          saved: Math.round(cumulativeSaved / 1024),
        });
      }

      setHistory(historyPoints.slice(-14));
      setLoading(false);
    }

    fetchStats();
  }, [user]);

  const seoScore = estimateSeoScore(stats.avgCompressionRatio, stats.totalImages);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Images Optimized"
          value={stats.totalImages.toLocaleString()}
          subtitle={stats.totalImages > 0 ? `${stats.avgCompressionRatio}% avg reduction` : "Upload images to get started"}
          icon={<ImageIcon className="w-6 h-6" />}
        />
        <StatsCard
          title="Load Time Saved"
          value={estimateLoadTimeSaved(stats.totalSavedBytes)}
          subtitle="Estimated on 3G connection"
          icon={<Timer className="w-6 h-6" />}
        />
        <StatsCard
          title="SEO Score"
          value={`${seoScore}/100`}
          change={seoScore >= 70 ? "Good" : seoScore >= 40 ? "Needs work" : undefined}
          subtitle="Based on compression & volume"
          icon={<Search className="w-6 h-6" />}
        />
        <StatsCard
          title="Storage Saved"
          value={formatBytes(stats.totalSavedBytes)}
          subtitle={stats.totalOriginalBytes > 0 ? `${formatBytes(stats.totalOriginalBytes)} → ${formatBytes(stats.totalOptimizedBytes)}` : "No data yet"}
          icon={<HardDrive className="w-6 h-6" />}
        />
      </div>

      {/* Performance Score History Chart */}
      {history.length > 1 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Performance Score History</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 100]}
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === "score") return [`${value}/100`, "SEO Score"];
                    if (name === "images") return [value, "Total Images"];
                    if (name === "saved") return [`${value} KB`, "Total Saved"];
                    return [value, name];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="url(#scoreGradient)"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="images"
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-primary rounded" />
              <span>SEO Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-muted-foreground rounded border-dashed" />
              <span>Cumulative Images</span>
            </div>
          </div>
        </Card>
      )}

      {/* Empty state */}
      {stats.totalImages === 0 && (
        <Card className="p-8 text-center border-dashed border-2">
          <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No optimization data yet</h3>
          <p className="text-sm text-muted-foreground">
            Start compressing images to see your performance metrics here.
          </p>
        </Card>
      )}
    </div>
  );
}
