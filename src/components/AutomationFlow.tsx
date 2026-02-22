import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Cloud,
  HardDrive,
  ShoppingBag,
  FolderOpen,
  Settings2,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Unplug,
  Plug,
  Image,
  Zap,
  Clock,
  TrendingDown,
  AlertTriangle,
  Trash2,
  ExternalLink,
  Eye,
  Crown,
} from 'lucide-react';

type Provider = 'google_drive' | 'dropbox' | 'shopify' | 'local_folder';

interface AutomationConnection {
  id: string;
  user_id: string;
  provider: Provider;
  display_name: string;
  credentials: Record<string, unknown>;
  config: Record<string, unknown>;
  is_active: boolean;
  last_synced_at: string | null;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

interface AutomationJob {
  id: string;
  user_id: string;
  connection_id: string;
  source_file_name: string;
  source_file_path: string | null;
  source_file_size: number | null;
  processed_file_path: string | null;
  processed_file_size: number | null;
  compression_ratio: number | null;
  output_format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped';
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface ProviderConfig {
  id: Provider;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  configFields: { key: string; label: string; type: 'text' | 'select'; options?: string[] }[];
}

const providers: ProviderConfig[] = [
  {
    id: 'google_drive',
    name: 'Google Drive',
    icon: Cloud,
    description: 'Auto-optimize images uploaded to your Google Drive folders',
    color: 'text-blue-500',
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'Your Google Drive API key', type: 'password' },
      { key: 'folder_id', label: 'Folder ID', placeholder: 'Google Drive folder ID to watch' },
    ],
    configFields: [
      { key: 'watch_folder', label: 'Watch Folder Path', type: 'text' },
      { key: 'output_format', label: 'Output Format', type: 'select', options: ['webp', 'avif', 'jpeg', 'png'] },
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: HardDrive,
    description: 'Monitor Dropbox folders and compress new images automatically',
    color: 'text-indigo-500',
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'Dropbox access token', type: 'password' },
      { key: 'folder_path', label: 'Folder Path', placeholder: '/path/to/watch' },
    ],
    configFields: [
      { key: 'watch_folder', label: 'Watch Folder Path', type: 'text' },
      { key: 'output_format', label: 'Output Format', type: 'select', options: ['webp', 'avif', 'jpeg', 'png'] },
    ],
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: ShoppingBag,
    description: 'Auto-optimize product images in your Shopify store',
    color: 'text-green-500',
    fields: [
      { key: 'store_url', label: 'Store URL', placeholder: 'your-store.myshopify.com' },
      { key: 'access_token', label: 'Admin API Token', placeholder: 'shpat_xxxxx', type: 'password' },
    ],
    configFields: [
      { key: 'output_format', label: 'Output Format', type: 'select', options: ['webp', 'avif', 'jpeg', 'png'] },
    ],
  },
  {
    id: 'local_folder',
    name: 'Local Folder',
    icon: FolderOpen,
    description: 'Watch a local folder and process new images as they appear',
    color: 'text-amber-500',
    fields: [],
    configFields: [
      { key: 'output_format', label: 'Output Format', type: 'select', options: ['webp', 'avif', 'jpeg', 'png'] },
    ],
  },
];

const statusColors: Record<string, string> = {
  connected: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  disconnected: 'bg-muted text-muted-foreground border-border',
  error: 'bg-destructive/10 text-destructive border-destructive/30',
  syncing: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
};

const jobStatusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  processing: 'bg-blue-500/10 text-blue-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  failed: 'bg-destructive/10 text-destructive',
  skipped: 'bg-amber-500/10 text-amber-600',
};

export const AutomationFlow = () => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<AutomationConnection[]>([]);
  const [jobs, setJobs] = useState<AutomationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectDialog, setConnectDialog] = useState<ProviderConfig | null>(null);
  const [configDialog, setConfigDialog] = useState<AutomationConnection | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [config, setConfig] = useState<Record<string, string>>({});
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('connections');
  const localFolderInputRef = useRef<HTMLInputElement>(null);

  const fetchConnections = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('automation_connections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setConnections(data as unknown as AutomationConnection[]);
  }, [user]);

  const fetchJobs = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('automation_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setJobs(data as unknown as AutomationJob[]);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchConnections(), fetchJobs()]);
      setLoading(false);
    };
    load();
  }, [fetchConnections, fetchJobs]);

  // Poll for job updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchJobs();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleConnect = async (provider: ProviderConfig) => {
    if (provider.id === 'local_folder') {
      await handleLocalFolderConnect();
      return;
    }
    setConnectDialog(provider);
    setCredentials({});
    setConfig({});
  };

  const handleLocalFolderConnect = async () => {
    if (!user) return;
    try {
      // Use File System Access API if available
      if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'read' });
        const { error } = await supabase.from('automation_connections').upsert({
          user_id: user.id,
          provider: 'local_folder',
          display_name: dirHandle.name,
          credentials: {},
          config: { folder_name: dirHandle.name, output_format: 'webp' },
          is_active: true,
          status: 'connected',
        }, { onConflict: 'user_id,provider' });

        if (error) throw error;

        // Process files from the directory
        const imageFiles: File[] = [];
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (file.type.startsWith('image/')) {
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          toast.success(`Found ${imageFiles.length} images in "${dirHandle.name}". Processing...`);
          await processLocalFiles(imageFiles);
        } else {
          toast.info(`No images found in "${dirHandle.name}"`);
        }

        await fetchConnections();
      } else {
        toast.error('Your browser does not support folder selection. Try Chrome or Edge.');
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        toast.error('Failed to connect local folder');
      }
    }
  };

  const processLocalFiles = async (files: File[]) => {
    if (!user) return;
    const connData = connections.find(c => c.provider === 'local_folder') 
      || (await supabase.from('automation_connections').select('*').eq('user_id', user.id).eq('provider', 'local_folder').single()).data;
    
    if (!connData) return;
    const conn = connData as unknown as AutomationConnection;

    for (const file of files.slice(0, 50)) {
      // Create job record
      await supabase.from('automation_jobs').insert({
        user_id: user.id,
        connection_id: conn.id,
        source_file_name: file.name,
        source_file_size: file.size,
        status: 'processing',
        output_format: 'webp',
      });

      // Process via canvas (client-side compression)
      try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(bitmap.width, 2048);
        canvas.height = Math.round(bitmap.height * (canvas.width / bitmap.width));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
          const blob = await new Promise<Blob | null>(resolve =>
            canvas.toBlob(resolve, 'image/webp', 0.85)
          );
          if (blob) {
            const ratio = Math.round((1 - blob.size / file.size) * 100);
            await supabase
              .from('automation_jobs')
              .update({
                status: 'completed',
                processed_file_size: blob.size,
                compression_ratio: ratio,
              })
              .eq('source_file_name', file.name)
              .eq('user_id', user.id);
          }
        }
        bitmap.close();
      } catch {
        await supabase
          .from('automation_jobs')
          .update({ status: 'failed', error_message: 'Processing failed' })
          .eq('source_file_name', file.name)
          .eq('user_id', user.id);
      }
    }
    await fetchJobs();
  };

  const submitConnection = async () => {
    if (!user || !connectDialog) return;
    setConnecting(true);
    try {
      // Validate required fields
      for (const field of connectDialog.fields) {
        if (!credentials[field.key]?.trim()) {
          toast.error(`${field.label} is required`);
          setConnecting(false);
          return;
        }
      }

      const { error } = await supabase.from('automation_connections').upsert({
        user_id: user.id,
        provider: connectDialog.id,
        display_name: connectDialog.name,
        credentials,
        config: { output_format: 'webp', ...config },
        is_active: true,
        status: 'connected',
      }, { onConflict: 'user_id,provider' });

      if (error) throw error;

      toast.success(`${connectDialog.name} connected successfully!`);
      setConnectDialog(null);
      await fetchConnections();
    } catch (err: any) {
      toast.error(`Failed to connect: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async (conn: AutomationConnection) => {
    const { error } = await supabase
      .from('automation_connections')
      .delete()
      .eq('id', conn.id);
    if (error) {
      toast.error('Failed to disconnect');
    } else {
      toast.success(`${conn.display_name} disconnected`);
      await fetchConnections();
    }
  };

  const handleToggleActive = async (conn: AutomationConnection) => {
    const { error } = await supabase
      .from('automation_connections')
      .update({ is_active: !conn.is_active })
      .eq('id', conn.id);
    if (error) {
      toast.error('Failed to update');
    } else {
      toast.success(conn.is_active ? 'Automation paused' : 'Automation resumed');
      await fetchConnections();
    }
  };

  const handleSync = async (conn: AutomationConnection) => {
    setSyncing(conn.id);
    try {
      // Trigger sync via edge function
      const { data, error } = await supabase.functions.invoke('process-automation', {
        body: { connection_id: conn.id, action: 'sync' },
      });
      if (error) throw error;
      toast.success(`Syncing ${conn.display_name}...`);
      await fetchConnections();
      await fetchJobs();
    } catch (err: any) {
      toast.error(`Sync failed: ${err.message}`);
    } finally {
      setSyncing(null);
    }
  };

  const handleClearJobs = async (connectionId?: string) => {
    const query = supabase
      .from('automation_jobs')
      .delete()
      .eq('user_id', user!.id);
    if (connectionId) query.eq('connection_id', connectionId);
    
    const { error } = await query;
    if (!error) {
      toast.success('Job history cleared');
      await fetchJobs();
    }
  };

  const getProviderConfig = (id: Provider) => providers.find(p => p.id === id)!;
  const getConnection = (providerId: Provider) => connections.find(c => c.provider === providerId);

  const stats = {
    totalProcessed: jobs.filter(j => j.status === 'completed').length,
    totalFailed: jobs.filter(j => j.status === 'failed').length,
    totalPending: jobs.filter(j => j.status === 'pending' || j.status === 'processing').length,
    totalSaved: jobs.reduce((acc, j) => {
      if (j.status === 'completed' && j.source_file_size && j.processed_file_size) {
        return acc + (j.source_file_size - j.processed_file_size);
      }
      return acc;
    }, 0),
    avgCompression: (() => {
      const completed = jobs.filter(j => j.status === 'completed' && j.compression_ratio != null);
      if (completed.length === 0) return 0;
      return Math.round(completed.reduce((acc, j) => acc + (j.compression_ratio || 0), 0) / completed.length);
    })(),
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Image className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalProcessed}</p>
              <p className="text-xs text-muted-foreground">Processed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <TrendingDown className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgCompression}%</p>
              <p className="text-xs text-muted-foreground">Avg Saved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <HardDrive className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatBytes(stats.totalSaved)}</p>
              <p className="text-xs text-muted-foreground">Total Saved</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.totalPending}</p>
              <p className="text-xs text-muted-foreground">In Queue</p>
            </div>
          </div>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connections">
            <Plug className="h-4 w-4 mr-2" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Zap className="h-4 w-4 mr-2" />
            Activity ({jobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connections" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {providers.map((provider) => {
              const conn = getConnection(provider.id);
              const Icon = provider.icon;

              return (
                <Card key={provider.id} className={`relative overflow-hidden transition-all ${conn?.is_active ? 'ring-2 ring-primary/20' : ''}`}>
                  {/* Active indicator */}
                  {conn?.is_active && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
                  )}

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-muted ${provider.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{provider.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">{provider.description}</CardDescription>
                        </div>
                      </div>
                      {conn && (
                        <Badge className={statusColors[conn.status]}>
                          {conn.status === 'syncing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                          {conn.status}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {conn ? (
                      <div className="space-y-3">
                        {/* Connection info */}
                        {conn.last_synced_at && (
                          <p className="text-xs text-muted-foreground">
                            Last synced: {new Date(conn.last_synced_at).toLocaleString()}
                          </p>
                        )}
                        {conn.error_message && (
                          <div className="flex items-start gap-2 p-2 rounded-lg bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                            <p className="text-xs text-destructive">{conn.error_message}</p>
                          </div>
                        )}

                        {/* Controls */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={conn.is_active}
                              onCheckedChange={() => handleToggleActive(conn)}
                            />
                            <span className="text-xs text-muted-foreground">
                              {conn.is_active ? 'Active' : 'Paused'}
                            </span>
                          </div>
                          <div className="flex-1" />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSync(conn)}
                            disabled={syncing === conn.id || !conn.is_active}
                          >
                            {syncing === conn.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const provConfig = getProviderConfig(conn.provider);
                              setConfigDialog(conn);
                              setConfig((conn.config || {}) as Record<string, string>);
                            }}
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDisconnect(conn)}
                          >
                            <Unplug className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        className="w-full"
                        variant="outline"
                        onClick={() => handleConnect(provider)}
                      >
                        <Plug className="h-4 w-4 mr-2" />
                        Connect {provider.name}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Processing Activity</CardTitle>
                {jobs.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => handleClearJobs()}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No automation activity yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Connect a service to start auto-processing images</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {jobs.map((job) => {
                      const conn = connections.find(c => c.id === job.connection_id);
                      const providerConf = conn ? getProviderConfig(conn.provider) : null;
                      const ProviderIcon = providerConf?.icon || Image;

                      return (
                        <div
                          key={job.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <ProviderIcon className={`h-4 w-4 shrink-0 ${providerConf?.color || 'text-muted-foreground'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{job.source_file_name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {job.source_file_size && (
                                <span className="text-xs text-muted-foreground">
                                  {formatBytes(job.source_file_size)}
                                </span>
                              )}
                              {job.status === 'completed' && job.compression_ratio != null && (
                                <span className="text-xs text-emerald-500 font-medium">
                                  -{job.compression_ratio}%
                                </span>
                              )}
                              {job.error_message && (
                                <span className="text-xs text-destructive truncate max-w-[200px]">
                                  {job.error_message}
                                </span>
                              )}
                            </div>
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${jobStatusColors[job.status]}`}>
                            {job.status === 'processing' && <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />}
                            {job.status === 'completed' && <CheckCircle2 className="h-2.5 w-2.5 mr-1" />}
                            {job.status === 'failed' && <XCircle className="h-2.5 w-2.5 mr-1" />}
                            {job.status}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {new Date(job.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Connect Dialog */}
      <Dialog open={!!connectDialog} onOpenChange={(open) => !open && setConnectDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectDialog && (() => {
                const Icon = connectDialog.icon;
                return <Icon className={`h-5 w-5 ${connectDialog.color}`} />;
              })()}
              Connect {connectDialog?.name}
            </DialogTitle>
            <DialogDescription>
              Enter your credentials to connect. Your data is encrypted and stored securely.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {connectDialog?.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type={field.type || 'text'}
                  placeholder={field.placeholder}
                  value={credentials[field.key] || ''}
                  onChange={(e) => setCredentials(prev => ({ ...prev, [field.key]: e.target.value }))}
                />
              </div>
            ))}
            {connectDialog?.configFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                {field.type === 'select' ? (
                  <Select value={config[field.key] || field.options?.[0]} onValueChange={(v) => setConfig(prev => ({ ...prev, [field.key]: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map(opt => (
                        <SelectItem key={opt} value={opt}>{opt.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={config[field.key] || ''}
                    onChange={(e) => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectDialog(null)}>Cancel</Button>
            <Button onClick={submitConnection} disabled={connecting}>
              {connecting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plug className="h-4 w-4 mr-2" />}
              Connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Config Dialog */}
      <Dialog open={!!configDialog} onOpenChange={(open) => !open && setConfigDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connection Settings</DialogTitle>
            <DialogDescription>Configure how {configDialog?.display_name} processes your images.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Output Format</Label>
              <Select
                value={(config.output_format as string) || 'webp'}
                onValueChange={(v) => setConfig(prev => ({ ...prev, output_format: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP</SelectItem>
                  <SelectItem value="avif">AVIF</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfigDialog(null)}>Cancel</Button>
            <Button onClick={async () => {
              if (!configDialog) return;
              await supabase
                .from('automation_connections')
                .update({ config })
                .eq('id', configDialog.id);
              toast.success('Settings saved');
              setConfigDialog(null);
              await fetchConnections();
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
