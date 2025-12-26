import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  BarChart3, 
  TrendingDown, 
  Images, 
  Clock, 
  Calendar,
  RefreshCw,
  HardDrive,
  Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface ProcessingStat {
  id: string;
  processed_at: string;
  image_count: number;
  success_count: number;
  total_original_size: number;
  total_optimized_size: number;
  total_saved: number;
  avg_compression_ratio: number;
  processing_time_ms: number;
  preset_name: string | null;
}

interface DailyAggregate {
  date: string;
  displayDate: string;
  images: number;
  saved: number;
  batches: number;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const BatchAnalyticsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProcessingStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(30);

  const fetchStats = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const startDate = subDays(new Date(), timeRange).toISOString();
      
      // Use type assertion since table was just created
      const { data, error } = await (supabase.from('batch_processing_stats' as 'batch_jobs') as unknown as ReturnType<typeof supabase.from>)
        .select('*')
        .gte('processed_at', startDate)
        .order('processed_at', { ascending: true });

      if (error) throw error;
      setStats(data || []);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [user, timeRange]);

  // Calculate totals
  const totals = stats.reduce((acc, stat) => ({
    images: acc.images + stat.image_count,
    saved: acc.saved + stat.total_saved,
    batches: acc.batches + 1,
    time: acc.time + stat.processing_time_ms,
    originalSize: acc.originalSize + stat.total_original_size,
  }), { images: 0, saved: 0, batches: 0, time: 0, originalSize: 0 });

  const avgCompressionRatio = stats.length > 0
    ? Math.round(stats.reduce((acc, s) => acc + s.avg_compression_ratio, 0) / stats.length)
    : 0;

  // Aggregate by day for charts
  const dailyData: DailyAggregate[] = [];
  const dateMap = new Map<string, DailyAggregate>();

  // Initialize all days in range
  for (let i = timeRange - 1; i >= 0; i--) {
    const date = startOfDay(subDays(new Date(), i));
    const dateKey = format(date, 'yyyy-MM-dd');
    dateMap.set(dateKey, {
      date: dateKey,
      displayDate: format(date, 'MMM d'),
      images: 0,
      saved: 0,
      batches: 0,
    });
  }

  // Fill with actual data
  stats.forEach(stat => {
    const dateKey = format(new Date(stat.processed_at), 'yyyy-MM-dd');
    const existing = dateMap.get(dateKey);
    if (existing) {
      existing.images += stat.image_count;
      existing.saved += stat.total_saved;
      existing.batches += 1;
    }
  });

  dateMap.forEach(value => dailyData.push(value));

  if (!user) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="py-8 text-center">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">Sign in to view your analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5 text-primary" />
            Analytics Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {([7, 30, 90] as const).map(days => (
                <Button
                  key={days}
                  variant={timeRange === days ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(days)}
                  className="h-7 text-xs"
                >
                  {days}d
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchStats}
              disabled={loading}
              className="h-7"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-lg p-4 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Images className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Images Processed</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{totals.images.toLocaleString()}</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Storage Saved</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatBytes(totals.saved)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Avg Compression</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{avgCompressionRatio}%</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg p-4 border border-orange-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Total Batches</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{totals.batches}</p>
          </div>
        </div>

        {/* Images Processed Chart */}
        {stats.length > 0 ? (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Images className="h-4 w-4 text-primary" />
                Images Processed Over Time
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <defs>
                      <linearGradient id="colorImages" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="images" 
                      stroke="hsl(var(--primary))" 
                      fillOpacity={1}
                      fill="url(#colorImages)"
                      name="Images"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-green-500" />
                Storage Saved Per Day (MB)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="displayDate" 
                      tick={{ fontSize: 10 }}
                      interval="preserveStartEnd"
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => (value / (1024 * 1024)).toFixed(1)}
                      className="text-muted-foreground"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatBytes(value), 'Saved']}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar 
                      dataKey="saved" 
                      fill="hsl(142, 76%, 36%)"
                      radius={[4, 4, 0, 0]}
                      name="Saved"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No processing data yet</p>
            <p className="text-sm text-muted-foreground">Process some images to see your analytics</p>
          </div>
        )}

        {/* Recent Activity */}
        {stats.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Recent Activity
            </h4>
            <ScrollArea className="h-[150px]">
              <div className="space-y-2">
                {[...stats].reverse().slice(0, 10).map((stat) => (
                  <div 
                    key={stat.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(stat.processed_at), 'MMM d, HH:mm')}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stat.image_count} images
                      </Badge>
                      {stat.preset_name && (
                        <Badge variant="secondary" className="text-xs">
                          {stat.preset_name}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium text-xs">
                        -{stat.avg_compression_ratio}%
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {formatBytes(stat.total_saved)} saved
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
