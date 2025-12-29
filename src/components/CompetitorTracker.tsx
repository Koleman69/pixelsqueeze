import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Plus, 
  Globe, 
  TrendingUp, 
  Bell, 
  Eye, 
  Trash2, 
  RefreshCw, 
  ExternalLink,
  Target,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
  LineChart
} from 'lucide-react';

interface Competitor {
  id: string;
  name: string;
  website_url: string;
  description: string | null;
  industry: string | null;
  tracking_frequency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Snapshot {
  id: string;
  competitor_id: string;
  snapshot_type: string;
  title: string;
  description: string | null;
  change_detected: boolean;
  data: Record<string, unknown> | null;
  captured_at: string;
}

interface Alert {
  id: string;
  competitor_id: string | null;
  alert_type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: string;
  created_at: string;
}

const CompetitorTracker = () => {
  const { user } = useAuth();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const [newCompetitor, setNewCompetitor] = useState({
    name: '',
    website_url: '',
    description: '',
    industry: '',
    tracking_frequency: 'daily'
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Use any to bypass strict type checking for tables not in types.ts
      const [competitorsRes, snapshotsRes, alertsRes] = await Promise.all([
        (supabase as any)
          .from('tracked_competitors')
          .select('*')
          .order('created_at', { ascending: false }),
        (supabase as any)
          .from('competitor_snapshots')
          .select('*')
          .order('captured_at', { ascending: false })
          .limit(50),
        (supabase as any)
          .from('competitor_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20)
      ]);

      if (competitorsRes.data) setCompetitors(competitorsRes.data as unknown as Competitor[]);
      if (snapshotsRes.data) setSnapshots(snapshotsRes.data as unknown as Snapshot[]);
      if (alertsRes.data) setAlerts(alertsRes.data as unknown as Alert[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addCompetitor = async () => {
    if (!user || !newCompetitor.name || !newCompetitor.website_url) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      // Use any to bypass strict type checking for tables not in types.ts
      const { error } = await (supabase as any)
        .from('tracked_competitors')
        .insert({
          user_id: user.id,
          name: newCompetitor.name,
          website_url: newCompetitor.website_url,
          description: newCompetitor.description || null,
          industry: newCompetitor.industry || null,
          tracking_frequency: newCompetitor.tracking_frequency
        });

      if (error) throw error;

      toast.success('Competitor added successfully!');
      setAddDialogOpen(false);
      setNewCompetitor({
        name: '',
        website_url: '',
        description: '',
        industry: '',
        tracking_frequency: 'daily'
      });
      fetchData();
    } catch (error) {
      console.error('Error adding competitor:', error);
      toast.error('Failed to add competitor');
    }
  };

  const deleteCompetitor = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('tracked_competitors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Competitor removed');
      fetchData();
    } catch (error) {
      console.error('Error deleting competitor:', error);
      toast.error('Failed to delete competitor');
    }
  };

  const analyzeCompetitor = async (competitor: Competitor) => {
    setAnalyzing(competitor.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-competitor', {
        body: { 
          url: competitor.website_url,
          competitorId: competitor.id,
          competitorName: competitor.name
        }
      });

      if (error) throw error;

      toast.success(`Analysis complete for ${competitor.name}`);
      fetchData();
    } catch (error) {
      console.error('Error analyzing competitor:', error);
      toast.error('Failed to analyze competitor website');
    } finally {
      setAnalyzing(null);
    }
  };

  const markAlertRead = async (alertId: string) => {
    try {
      await (supabase as any)
        .from('competitor_alerts')
        .update({ is_read: true })
        .eq('id', alertId);
      
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_read: true } : a));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const unreadAlerts = alerts.filter(a => !a.is_read);
  const recentChanges = snapshots.filter(s => s.change_detected);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-muted';
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Competitor Tracking</h3>
          <p className="text-muted-foreground text-center">
            Sign in to start tracking your competitors and receive intelligent insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Competitor Intelligence
          </h2>
          <p className="text-muted-foreground">Track, analyze, and stay ahead of your competition</p>
        </div>
        
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Competitor</DialogTitle>
              <DialogDescription>
                Enter details about the competitor you want to track.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Company Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Acme Corp"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="url">Website URL *</Label>
                <Input
                  id="url"
                  placeholder="https://example.com"
                  value={newCompetitor.website_url}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, website_url: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., SaaS, E-commerce"
                  value={newCompetitor.industry}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, industry: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Notes</Label>
                <Textarea
                  id="description"
                  placeholder="Any additional notes about this competitor..."
                  value={newCompetitor.description}
                  onChange={(e) => setNewCompetitor({ ...newCompetitor, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="frequency">Tracking Frequency</Label>
                <Select
                  value={newCompetitor.tracking_frequency}
                  onValueChange={(value) => setNewCompetitor({ ...newCompetitor, tracking_frequency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={addCompetitor}>Add Competitor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tracking</p>
                <p className="text-2xl font-bold">{competitors.filter(c => c.is_active).length}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Changes Detected</p>
                <p className="text-2xl font-bold">{recentChanges.length}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread Alerts</p>
                <p className="text-2xl font-bold">{unreadAlerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Snapshots</p>
                <p className="text-2xl font-bold">{snapshots.length}</p>
              </div>
              <LineChart className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="competitors" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="competitors" className="gap-2">
            <Target className="h-4 w-4" />
            Competitors
          </TabsTrigger>
          <TabsTrigger value="alerts" className="gap-2">
            <Bell className="h-4 w-4" />
            Alerts
            {unreadAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="competitors" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : competitors.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No competitors yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Start tracking your competitors to gain valuable market insights.
                </p>
                <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Competitor
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {competitors.map((competitor) => (
                <Card key={competitor.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{competitor.name}</h3>
                          {competitor.is_active ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Paused
                            </Badge>
                          )}
                          {competitor.industry && (
                            <Badge variant="secondary">{competitor.industry}</Badge>
                          )}
                        </div>
                        <a 
                          href={competitor.website_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
                        >
                          {competitor.website_url}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                        {competitor.description && (
                          <p className="text-sm text-muted-foreground">{competitor.description}</p>
                        )}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {competitor.tracking_frequency} tracking
                          </span>
                          <span>
                            Added {new Date(competitor.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex sm:flex-col gap-2">
                        <Button
                          size="sm"
                          onClick={() => analyzeCompetitor(competitor)}
                          disabled={analyzing === competitor.id}
                          className="gap-2"
                        >
                          {analyzing === competitor.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Analyze
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCompetitor(competitor.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
                <p className="text-muted-foreground text-center">
                  Alerts will appear here when we detect changes in your competitors' websites.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <Card 
                  key={alert.id} 
                  className={`cursor-pointer transition-all ${!alert.is_read ? 'border-primary/50 bg-primary/5' : ''}`}
                  onClick={() => markAlertRead(alert.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getPriorityColor(alert.priority)}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={`font-medium ${!alert.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {alert.title}
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <Badge variant="outline" className="mt-2 text-xs">
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Insights</CardTitle>
              <CardDescription>
                AI-powered analysis of your competitive landscape
              </CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Start analyzing competitors to see insights here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {snapshots.slice(0, 6).map((snapshot) => (
                      <Card key={snapshot.id} className="bg-muted/50">
                        <CardContent className="py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={snapshot.change_detected ? 'default' : 'outline'}>
                                  {snapshot.snapshot_type}
                                </Badge>
                                {snapshot.change_detected && (
                                  <Badge variant="destructive" className="text-xs">
                                    Change Detected
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium">{snapshot.title}</h4>
                              {snapshot.description && (
                                <p className="text-sm text-muted-foreground mt-1">{snapshot.description}</p>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(snapshot.captured_at).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitorTracker;
