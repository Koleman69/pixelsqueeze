import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CalendarDays, Clock, Zap, Recycle, Trash2, Loader2, Plus,
  Play, Instagram, Twitter, Youtube, Facebook, Globe, Sparkles,
  Gift, Rocket, Tag, ChevronDown, ChevronUp, Send
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Workflow {
  id: string;
  name: string;
  workflow_type: string;
  is_active: boolean;
  platforms: string[];
  posts_per_week: number;
  preferred_times: string[];
  preferred_days: string[];
  recycle_after_days: number;
  recycle_min_engagement: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  trigger_type: string;
  trigger_date: string | null;
  trigger_recurring: boolean;
  platforms: string[];
  content_template: string | null;
  hashtags: string[];
  tone: string;
  is_active: boolean;
  auto_generate: boolean;
  posts_count: number;
  days_before: number;
  last_triggered_at: string | null;
  created_at: string;
}

const platformOptions = [
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'twitter', label: 'X', icon: Twitter },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'linkedin', label: 'LinkedIn', icon: Globe },
  { id: 'tiktok', label: 'TikTok', icon: Zap },
];

const dayOptions = [
  { id: 'mon', label: 'M' }, { id: 'tue', label: 'T' }, { id: 'wed', label: 'W' },
  { id: 'thu', label: 'T' }, { id: 'fri', label: 'F' }, { id: 'sat', label: 'S' }, { id: 'sun', label: 'S' },
];

const presetCampaigns = [
  { type: 'holiday', label: '🎄 Holiday Season', icon: Gift },
  { type: 'launch', label: '🚀 Product Launch', icon: Rocket },
  { type: 'offer', label: '🏷️ Special Offer', icon: Tag },
  { type: 'event', label: '📅 Custom Event', icon: CalendarDays },
];

export const PostingWorkflows = () => {
  const [activeTab, setActiveTab] = useState('auto-schedule');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [runningId, setRunningId] = useState<string | null>(null);

  // Auto-schedule form
  const [wfName, setWfName] = useState('Weekly PixelSqueeze Posts');
  const [wfPlatforms, setWfPlatforms] = useState<string[]>(['instagram', 'twitter']);
  const [wfPostsPerWeek, setWfPostsPerWeek] = useState(10);
  const [wfTimes, setWfTimes] = useState<string[]>(['09:00', '12:00', '15:00', '18:00', '20:00']);
  const [wfDays, setWfDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  const [wfRecycleDays, setWfRecycleDays] = useState(30);
  const [wfMinEngagement, setWfMinEngagement] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  // Campaign form
  const [campName, setCampName] = useState('');
  const [campType, setCampType] = useState('holiday');
  const [campDate, setCampDate] = useState('');
  const [campPlatforms, setCampPlatforms] = useState<string[]>(['instagram', 'twitter', 'facebook']);
  const [campTemplate, setCampTemplate] = useState('');
  const [campHashtags, setCampHashtags] = useState('');
  const [campTone, setCampTone] = useState('viral');
  const [campPostsCount, setCampPostsCount] = useState(3);
  const [campDaysBefore, setCampDaysBefore] = useState(3);
  const [campRecurring, setCampRecurring] = useState(false);

  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [wfRes, campRes] = await Promise.all([
        supabase.functions.invoke('posting-workflows', { body: { action: 'list_workflows' } }),
        supabase.functions.invoke('posting-workflows', { body: { action: 'list_campaigns' } }),
      ]);
      setWorkflows(wfRes.data?.workflows || []);
      setCampaigns(campRes.data?.campaigns || []);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (id: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const toggleDay = (id: string) => {
    setWfDays(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
  };

  const saveWorkflow = async () => {
    if (!wfName.trim()) return;
    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('posting-workflows', {
        body: {
          action: 'save_workflow',
          name: wfName,
          workflow_type: 'auto_schedule',
          platforms: wfPlatforms,
          posts_per_week: wfPostsPerWeek,
          preferred_times: wfTimes,
          preferred_days: wfDays,
          recycle_after_days: wfRecycleDays,
          recycle_min_engagement: wfMinEngagement,
        },
      });
      if (error) throw error;
      toast({ title: 'Workflow saved!' });
      setShowNewWorkflow(false);
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const runAutoSchedule = async (id: string) => {
    setRunningId(id);
    try {
      const { data, error } = await supabase.functions.invoke('posting-workflows', {
        body: { action: 'run_auto_schedule', id },
      });
      if (error) throw error;
      toast({ title: '📅 Posts Scheduled!', description: `${data.slotsGenerated} posts auto-generated and scheduled.` });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRunningId(null);
    }
  };

  const recycleTopPosts = async (id: string) => {
    setRunningId(id);
    try {
      const { data, error } = await supabase.functions.invoke('posting-workflows', {
        body: { action: 'recycle_top_posts', id },
      });
      if (error) throw error;
      toast({ title: '♻️ Posts Recycled!', description: data.message });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRunningId(null);
    }
  };

  const toggleWorkflow = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('posting-workflows', {
        body: { action: 'toggle_workflow', id },
      });
      if (error) throw error;
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const deleteWorkflow = async (id: string) => {
    try {
      await supabase.functions.invoke('posting-workflows', { body: { action: 'delete_workflow', id } });
      setWorkflows(prev => prev.filter(w => w.id !== id));
    } catch {}
  };

  const saveCampaign = async () => {
    if (!campName.trim()) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('posting-workflows', {
        body: {
          action: 'save_campaign',
          name: campName,
          trigger_type: campType,
          trigger_date: campDate || null,
          trigger_recurring: campRecurring,
          platforms: campPlatforms,
          content_template: campTemplate || null,
          hashtags: campHashtags.split(',').map(t => t.trim()).filter(Boolean),
          tone: campTone,
          posts_count: campPostsCount,
          days_before: campDaysBefore,
        },
      });
      if (error) throw error;
      toast({ title: 'Campaign created!' });
      setShowNewCampaign(false);
      setCampName('');
      setCampTemplate('');
      setCampHashtags('');
      setCampDate('');
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const triggerCampaign = async (id: string) => {
    setRunningId(id);
    try {
      const { data, error } = await supabase.functions.invoke('posting-workflows', {
        body: { action: 'trigger_campaign', id },
      });
      if (error) throw error;
      toast({ title: '🚀 Campaign Triggered!', description: data.message });
      await loadAll();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setRunningId(null);
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      await supabase.functions.invoke('posting-workflows', { body: { action: 'delete_campaign', id } });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch {}
  };

  const PlatformPicker = ({ selected, onToggle }: { selected: string[]; onToggle: (id: string) => void }) => (
    <div className="flex flex-wrap gap-1.5">
      {platformOptions.map(p => {
        const Icon = p.icon;
        const sel = selected.includes(p.id);
        return (
          <button
            key={p.id}
            onClick={() => onToggle(p.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs transition-all ${
              sel ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Icon className="w-3 h-3" />
            {p.label}
          </button>
        );
      })}
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Posting Workflows</CardTitle>
            <CardDescription>Auto-post 10×/week, recycle winners & trigger campaigns</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="auto-schedule" className="gap-1 text-xs sm:text-sm">
              <Clock className="w-4 h-4" /> Auto-Post
            </TabsTrigger>
            <TabsTrigger value="recycle" className="gap-1 text-xs sm:text-sm">
              <Recycle className="w-4 h-4" /> Recycle
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4" /> Campaigns
            </TabsTrigger>
          </TabsList>

          {/* ── AUTO-SCHEDULE ── */}
          <TabsContent value="auto-schedule" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Auto-Post Workflows</h4>
                <p className="text-xs text-muted-foreground">AI generates & schedules posts automatically</p>
              </div>
              <Button size="sm" onClick={() => setShowNewWorkflow(!showNewWorkflow)}>
                {showNewWorkflow ? <ChevronUp className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {showNewWorkflow ? 'Cancel' : 'New Workflow'}
              </Button>
            </div>

            {showNewWorkflow && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-4">
                  <Input placeholder="Workflow name" value={wfName} onChange={e => setWfName(e.target.value)} />

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Platforms</label>
                    <PlatformPicker selected={wfPlatforms} onToggle={id => togglePlatform(id, setWfPlatforms)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Posts/Week</label>
                      <Select value={String(wfPostsPerWeek)} onValueChange={v => setWfPostsPerWeek(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[3, 5, 7, 10, 14, 21].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} posts</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Recycle After (days)</label>
                      <Select value={String(wfRecycleDays)} onValueChange={v => setWfRecycleDays(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[14, 30, 60, 90].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} days</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Active Days</label>
                    <div className="flex gap-1">
                      {dayOptions.map((d, i) => (
                        <button
                          key={d.id}
                          onClick={() => toggleDay(d.id)}
                          className={`w-8 h-8 rounded-full text-xs font-medium transition-all ${
                            wfDays.includes(d.id) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button onClick={saveWorkflow} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Workflow
                  </Button>
                </CardContent>
              </Card>
            )}

            {workflows.length === 0 && !showNewWorkflow && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No workflows yet. Create one to start auto-posting!
              </div>
            )}

            {workflows.map(wf => (
              <Card key={wf.id} className="bg-muted/20">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{wf.name}</h5>
                      <Badge variant={wf.is_active ? 'default' : 'secondary'} className="text-xs">
                        {wf.is_active ? 'Active' : 'Paused'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">{wf.posts_per_week}/week</Badge>
                    </div>
                    <Switch checked={wf.is_active} onCheckedChange={() => toggleWorkflow(wf.id)} />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {wf.platforms.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                  </div>

                  {wf.last_run_at && (
                    <p className="text-xs text-muted-foreground">
                      Last run: {new Date(wf.last_run_at).toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => runAutoSchedule(wf.id)} disabled={runningId === wf.id}>
                      {runningId === wf.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-1" />}
                      Generate & Schedule
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => recycleTopPosts(wf.id)} disabled={runningId === wf.id}>
                      <Recycle className="w-3.5 h-3.5 mr-1" /> Recycle Top Posts
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => deleteWorkflow(wf.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* ── RECYCLE ── */}
          <TabsContent value="recycle" className="space-y-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Recycle className="w-5 h-5 text-primary" />
                <h4 className="font-medium">Smart Post Recycling</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Automatically recycles your best-performing posts with AI-refreshed content.
                Posts older than the recycle threshold with high engagement are rewritten with fresh hooks and rescheduled.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{workflows.reduce((sum, w) => sum + w.recycle_after_days, 0) / Math.max(workflows.length, 1)}</p>
                  <p className="text-xs text-muted-foreground">Avg recycle age (days)</p>
                </div>
                <div className="bg-background rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{workflows.reduce((sum, w) => sum + w.recycle_min_engagement, 0) / Math.max(workflows.length, 1)}</p>
                  <p className="text-xs text-muted-foreground">Min engagement score</p>
                </div>
              </div>
              {workflows.length > 0 ? (
                <div className="space-y-2 pt-2">
                  {workflows.map(wf => (
                    <Button
                      key={wf.id}
                      variant="outline"
                      className="w-full justify-between"
                      onClick={() => recycleTopPosts(wf.id)}
                      disabled={runningId === wf.id}
                    >
                      <span className="flex items-center gap-2">
                        <Recycle className="w-4 h-4" />
                        Recycle for "{wf.name}"
                      </span>
                      {runningId === wf.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  Create an auto-post workflow first to enable recycling.
                </p>
              )}
            </div>
          </TabsContent>

          {/* ── CAMPAIGNS ── */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Campaign Triggers</h4>
                <p className="text-xs text-muted-foreground">Auto-fire posts on holidays, launches & offers</p>
              </div>
              <Button size="sm" onClick={() => setShowNewCampaign(!showNewCampaign)}>
                {showNewCampaign ? <ChevronUp className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                {showNewCampaign ? 'Cancel' : 'New Campaign'}
              </Button>
            </div>

            {showNewCampaign && (
              <Card className="bg-muted/30">
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {presetCampaigns.map(pc => {
                      const Icon = pc.icon;
                      return (
                        <button
                          key={pc.type}
                          onClick={() => { setCampType(pc.type); setCampName(pc.label.replace(/^[^\s]+\s/, '')); }}
                          className={`p-2 rounded-lg border-2 text-xs text-center transition-all ${
                            campType === pc.type ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="w-4 h-4 mx-auto mb-1" />
                          {pc.label}
                        </button>
                      );
                    })}
                  </div>

                  <Input placeholder="Campaign name" value={campName} onChange={e => setCampName(e.target.value)} />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Event Date</label>
                      <Input type="date" value={campDate} onChange={e => setCampDate(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Posts to Generate</label>
                      <Select value={String(campPostsCount)} onValueChange={v => setCampPostsCount(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 5, 7, 10].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} posts</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Start Posting (days before)</label>
                      <Select value={String(campDaysBefore)} onValueChange={v => setCampDaysBefore(Number(v))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 5, 7, 14].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} days before</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Tone</label>
                      <Select value={campTone} onValueChange={setCampTone}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="viral">🔥 Viral</SelectItem>
                          <SelectItem value="professional">💼 Professional</SelectItem>
                          <SelectItem value="funny">😂 Funny</SelectItem>
                          <SelectItem value="luxury">✨ Luxury</SelectItem>
                          <SelectItem value="casual">😎 Casual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium">Platforms</label>
                    <PlatformPicker selected={campPlatforms} onToggle={id => togglePlatform(id, setCampPlatforms)} />
                  </div>

                  <Textarea
                    placeholder="Campaign brief / content template (optional)... e.g., 'Announce 50% off all plans for Black Friday'"
                    value={campTemplate}
                    onChange={e => setCampTemplate(e.target.value)}
                    className="min-h-[60px]"
                  />

                  <Input
                    placeholder="Campaign hashtags (comma-separated)"
                    value={campHashtags}
                    onChange={e => setCampHashtags(e.target.value)}
                  />

                  <div className="flex items-center gap-2">
                    <Switch checked={campRecurring} onCheckedChange={setCampRecurring} />
                    <label className="text-xs">Recurring annually</label>
                  </div>

                  <Button onClick={saveCampaign} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}

            {campaigns.length === 0 && !showNewCampaign && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No campaigns yet. Set one up for your next launch or holiday!
              </div>
            )}

            {campaigns.map(camp => (
              <Card key={camp.id} className="bg-muted/20">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">{camp.name}</h5>
                      <Badge variant="outline" className="text-xs">{camp.trigger_type}</Badge>
                      <Badge variant={camp.is_active ? 'default' : 'secondary'} className="text-xs">
                        {camp.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {camp.platforms.map(p => (
                      <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                    ))}
                    <Badge variant="outline" className="text-xs">{camp.posts_count} posts</Badge>
                    <Badge variant="outline" className="text-xs">{camp.tone}</Badge>
                    {camp.trigger_recurring && <Badge variant="outline" className="text-xs">🔁 Recurring</Badge>}
                  </div>

                  {camp.trigger_date && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      Event: {new Date(camp.trigger_date).toLocaleDateString()} (starts {camp.days_before}d before)
                    </p>
                  )}

                  {camp.last_triggered_at && (
                    <p className="text-xs text-muted-foreground">
                      Last triggered: {new Date(camp.last_triggered_at).toLocaleString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => triggerCampaign(camp.id)} disabled={runningId === camp.id}>
                      {runningId === camp.id ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
                      Trigger Now
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={() => deleteCampaign(camp.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
