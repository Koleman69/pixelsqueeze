import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Send, Clock, Globe, Trash2, Loader2, Plus, 
  Instagram, Twitter, Youtube, Facebook, 
  FileText, Zap, Check, ExternalLink, CalendarDays,
  Rss
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  platforms: string[];
  status: string;
  post_type: string;
  scheduled_at: string | null;
  published_at: string | null;
  hashtags: string[];
  media_urls: string[];
  blog_slug: string | null;
  blog_excerpt: string | null;
  blog_category: string | null;
  seo_title: string | null;
  seo_description: string | null;
  platform_results: Record<string, any>;
  metadata: Record<string, any>;
  created_at: string;
}

const platformOptions = [
  { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
  { id: 'twitter', label: 'X / Twitter', icon: Twitter, color: 'bg-foreground' },
  { id: 'youtube', label: 'YouTube', icon: Youtube, color: 'bg-red-600' },
  { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-blue-600' },
  { id: 'linkedin', label: 'LinkedIn', icon: Globe, color: 'bg-blue-700' },
  { id: 'tiktok', label: 'TikTok', icon: Zap, color: 'bg-foreground' },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  scheduled: 'bg-yellow-500/20 text-yellow-700',
  published: 'bg-green-500/20 text-green-700',
  syndicated: 'bg-blue-500/20 text-blue-700',
  failed: 'bg-destructive/20 text-destructive',
};

export const ContentDistributor = () => {
  const [activeTab, setActiveTab] = useState('compose');
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  // Compose form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postType, setPostType] = useState('social');
  const [scheduledAt, setScheduledAt] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogCategory, setBlogCategory] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('distribute-content', {
        body: { action: 'list_posts' },
      });
      if (error) throw error;
      setPosts(data.posts || []);
    } catch (err: any) {
      console.error('Load posts error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setSelectedPlatforms([]);
    setPostType('social');
    setScheduledAt('');
    setHashtags('');
    setBlogSlug('');
    setBlogExcerpt('');
    setBlogCategory('');
    setSeoTitle('');
    setSeoDescription('');
  };

  const handleSave = async (publishNow = false) => {
    if (!title.trim() || !content.trim()) {
      toast({ title: 'Missing fields', description: 'Title and content are required.', variant: 'destructive' });
      return;
    }
    if (selectedPlatforms.length === 0) {
      toast({ title: 'Select platforms', description: 'Pick at least one platform.', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('distribute-content', {
        body: {
          action: 'create_post',
          title,
          content,
          platforms: selectedPlatforms,
          post_type: postType,
          scheduled_at: scheduledAt || null,
          hashtags: hashtags.split(',').map(t => t.trim()).filter(Boolean),
          blog_slug: blogSlug || null,
          blog_excerpt: blogExcerpt || null,
          blog_category: blogCategory || null,
          seo_title: seoTitle || null,
          seo_description: seoDescription || null,
        },
      });
      if (error) throw error;

      if (publishNow && data.post?.id) {
        await handlePublish(data.post.id);
      }

      toast({ title: publishNow ? 'Published!' : 'Saved!', description: `Post ${publishNow ? 'published' : scheduledAt ? 'scheduled' : 'saved as draft'}.` });
      resetForm();
      await loadPosts();
      setActiveTab('queue');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async (id: string) => {
    setPublishingId(id);
    try {
      const { data, error } = await supabase.functions.invoke('distribute-content', {
        body: { action: 'publish_now', id },
      });
      if (error) throw error;
      toast({ title: 'Published!', description: `Distributed to ${Object.keys(data.platformResults || {}).length} platforms.` });
      await loadPosts();
    } catch (err: any) {
      toast({ title: 'Publish failed', description: err.message, variant: 'destructive' });
    } finally {
      setPublishingId(null);
    }
  };

  const handleSyndicate = async (id: string) => {
    setPublishingId(id);
    try {
      const { error } = await supabase.functions.invoke('distribute-content', {
        body: { action: 'syndicate_blog', id },
      });
      if (error) throw error;
      toast({ title: 'Syndicated!', description: 'Blog post syndicated with auto-generated SEO.' });
      await loadPosts();
    } catch (err: any) {
      toast({ title: 'Syndication failed', description: err.message, variant: 'destructive' });
    } finally {
      setPublishingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.functions.invoke('distribute-content', {
        body: { action: 'delete_post', id },
      });
      if (error) throw error;
      setPosts(prev => prev.filter(p => p.id !== id));
      toast({ title: 'Deleted' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Send className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Content Distribution Hub</CardTitle>
            <CardDescription>Publish, schedule, syndicate & automate cross-platform</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full mb-6">
            <TabsTrigger value="compose" className="gap-1">
              <Plus className="w-4 h-4" /> Compose
            </TabsTrigger>
            <TabsTrigger value="queue" className="gap-1">
              <Clock className="w-4 h-4" /> Queue
              {posts.filter(p => p.status === 'scheduled').length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs h-5 px-1.5">
                  {posts.filter(p => p.status === 'scheduled').length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="published" className="gap-1">
              <Check className="w-4 h-4" /> Published
            </TabsTrigger>
          </TabsList>

          {/* COMPOSE TAB */}
          <TabsContent value="compose" className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">Post Type</label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social Post</SelectItem>
                  <SelectItem value="blog">Blog Article</SelectItem>
                  <SelectItem value="email">Email Blast</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input placeholder="Post title or headline..." value={title} onChange={e => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                placeholder="Write your post content..."
                value={content}
                onChange={e => setContent(e.target.value)}
                className="min-h-[120px]"
              />
            </div>

            {/* Platform Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Distribute To</label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {platformOptions.map(p => {
                  const Icon = p.icon;
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => togglePlatform(p.id)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all text-xs ${
                        selected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className={`p-1 rounded ${p.color}`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hashtags (comma-separated)</label>
              <Input placeholder="#pixelsqueeze, #imageoptimization, #webperf" value={hashtags} onChange={e => setHashtags(e.target.value)} />
            </div>

            {/* Blog-specific fields */}
            {postType === 'blog' && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                <h4 className="text-sm font-medium flex items-center gap-2"><Rss className="w-4 h-4" /> Blog & SEO Settings</h4>
                <Input placeholder="URL slug (e.g., image-compression-guide)" value={blogSlug} onChange={e => setBlogSlug(e.target.value)} />
                <Textarea placeholder="Blog excerpt / summary..." value={blogExcerpt} onChange={e => setBlogExcerpt(e.target.value)} className="min-h-[60px]" />
                <Input placeholder="Category (e.g., Tutorials, News)" value={blogCategory} onChange={e => setBlogCategory(e.target.value)} />
                <Input placeholder="SEO Title (under 60 chars)" value={seoTitle} onChange={e => setSeoTitle(e.target.value)} />
                <Input placeholder="Meta Description (under 160 chars)" value={seoDescription} onChange={e => setSeoDescription(e.target.value)} />
              </div>
            )}

            {/* Schedule */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarDays className="w-4 h-4" /> Schedule (optional)
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={e => setScheduledAt(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleSave(false)} disabled={isSaving} variant="outline" className="flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Clock className="w-4 h-4 mr-2" />}
                {scheduledAt ? 'Schedule' : 'Save Draft'}
              </Button>
              <Button onClick={() => handleSave(true)} disabled={isSaving} className="flex-1">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Publish Now
              </Button>
            </div>
          </TabsContent>

          {/* QUEUE TAB */}
          <TabsContent value="queue" className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
            ) : posts.filter(p => ['draft', 'scheduled'].includes(p.status)).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No pending posts. Create one!</div>
            ) : (
              posts
                .filter(p => ['draft', 'scheduled'].includes(p.status))
                .map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    publishingId={publishingId}
                    onPublish={() => handlePublish(post.id)}
                    onSyndicate={() => handleSyndicate(post.id)}
                    onDelete={() => handleDelete(post.id)}
                  />
                ))
            )}
          </TabsContent>

          {/* PUBLISHED TAB */}
          <TabsContent value="published" className="space-y-3">
            {posts.filter(p => ['published', 'syndicated'].includes(p.status)).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No published posts yet.</div>
            ) : (
              posts
                .filter(p => ['published', 'syndicated'].includes(p.status))
                .map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    publishingId={publishingId}
                    onPublish={() => handlePublish(post.id)}
                    onSyndicate={() => handleSyndicate(post.id)}
                    onDelete={() => handleDelete(post.id)}
                  />
                ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

function PostCard({ post, publishingId, onPublish, onSyndicate, onDelete }: {
  post: ScheduledPost;
  publishingId: string | null;
  onPublish: () => void;
  onSyndicate: () => void;
  onDelete: () => void;
}) {
  const isProcessing = publishingId === post.id;

  return (
    <Card className="bg-muted/20">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h5 className="font-medium text-sm">{post.title}</h5>
              <Badge className={`text-xs ${statusColors[post.status] || ''}`}>{post.status}</Badge>
              <Badge variant="outline" className="text-xs">{post.post_type}</Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-destructive hover:text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1">
          {post.platforms.map(p => (
            <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
          ))}
          {post.hashtags?.map((h, i) => (
            <Badge key={i} variant="outline" className="text-xs">{h}</Badge>
          ))}
        </div>

        {post.scheduled_at && post.status === 'scheduled' && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Scheduled: {new Date(post.scheduled_at).toLocaleString()}
          </p>
        )}

        {post.published_at && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Check className="w-3 h-3" />
            Published: {new Date(post.published_at).toLocaleString()}
          </p>
        )}

        {post.platform_results && Object.keys(post.platform_results).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(post.platform_results).map(([platform, result]: [string, any]) => (
              <a
                key={platform}
                href={result.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> {platform}
              </a>
            ))}
          </div>
        )}

        {!['published', 'syndicated'].includes(post.status) && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={onPublish} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1" />}
              Publish
            </Button>
            {post.post_type === 'blog' && (
              <Button size="sm" variant="outline" onClick={onSyndicate} disabled={isProcessing}>
                <Rss className="w-3.5 h-3.5 mr-1" /> Syndicate
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
