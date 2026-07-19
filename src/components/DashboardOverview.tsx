import { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Star,
  Folder,
  FolderPlus,
  Download,
  Sparkles,
  Wand2,
  HardDrive,
  Crown,
  Zap,
  ImageIcon,
  Gauge,
  TrendingUp,
  ArrowUpRight,
  Trash2,
  Timer,
  Plus,
  History,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useImageCompression } from "@/hooks/useImageCompression";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SharedFile {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string | null;
  share_code: string | null;
  download_count: number | null;
  created_at: string;
  expires_at: string | null;
  folder_id: string | null;
  is_favorite: boolean;
}

interface UserFolder {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

interface BatchStat {
  id: string;
  processed_at: string;
  image_count: number;
  total_original_size: number;
  total_optimized_size: number;
  total_saved: number;
  avg_compression_ratio: number;
  preset_name: string | null;
}

interface DashboardOverviewProps {
  isSubscribed?: boolean;
  onQuickAction?: (tool: string) => void;
}

type SortKey = "recent" | "oldest" | "largest" | "smallest" | "name";

const FOLDER_COLORS = [
  { name: "blue", cls: "bg-blue-500/15 text-blue-200 border-blue-400/30" },
  { name: "violet", cls: "bg-violet-500/15 text-violet-200 border-violet-400/30" },
  { name: "emerald", cls: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30" },
  { name: "amber", cls: "bg-amber-500/15 text-amber-200 border-amber-400/30" },
  { name: "rose", cls: "bg-rose-500/15 text-rose-200 border-rose-400/30" },
];

// Storage quota per tier (bytes)
const STORAGE_QUOTA: Record<string, number> = {
  free: 0,
  starter: 2 * 1024 ** 3,
  creator: 10 * 1024 ** 3,
  pro: 50 * 1024 ** 3,
  api: 500 * 1024 ** 3,
};

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (!bytes || bytes < 1024) return `${bytes || 0} B`;
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function relativeTime(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function folderTint(color: string) {
  return FOLDER_COLORS.find((c) => c.name === color)?.cls ?? FOLDER_COLORS[0].cls;
}

// ─── Component ─────────────────────────────────────────────────────────────

export function DashboardOverview({ isSubscribed = false, onQuickAction }: DashboardOverviewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscription, createCheckout, openCustomerPortal } = useImageCompression();

  const [files, setFiles] = useState<SharedFile[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [batches, setBatches] = useState<BatchStat[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");
  const [activeFolder, setActiveFolder] = useState<string | "all" | "favorites">("all");

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderColor, setNewFolderColor] = useState("blue");

  // ─── Data loaders ────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [filesRes, foldersRes, batchesRes] = await Promise.all([
      supabase
        .from("shared_files")
        .select("id,user_id,file_name,file_path,file_size,file_type,share_code,download_count,created_at,expires_at,folder_id,is_favorite")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("user_folders")
        .select("id,name,color,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("batch_processing_stats")
        .select("id,processed_at,image_count,total_original_size,total_optimized_size,total_saved,avg_compression_ratio,preset_name")
        .eq("user_id", user.id)
        .order("processed_at", { ascending: false })
        .limit(50),
    ]);
    if (filesRes.data) setFiles(filesRes.data as SharedFile[]);
    if (foldersRes.data) setFolders(foldersRes.data as UserFolder[]);
    if (batchesRes.data) setBatches(batchesRes.data as BatchStat[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ─── Derived data ────────────────────────────────────────────────────────
  const totals = useMemo(() => {
    const images = batches.reduce((a, b) => a + b.image_count, 0);
    const saved = batches.reduce((a, b) => a + Number(b.total_saved), 0);
    const original = batches.reduce((a, b) => a + Number(b.total_original_size), 0);
    const avgRatio =
      batches.length > 0
        ? Math.round(
            batches.reduce((a, b) => a + b.avg_compression_ratio * b.image_count, 0) /
              Math.max(1, images)
          )
        : 0;
    const downloads = files.reduce((a, f) => a + (f.download_count ?? 0), 0);
    const storageUsed = files.reduce((a, f) => a + (f.file_size ?? 0), 0);
    // "quality increase" proxy: retention derived from avg compression
    const qualityBoost = Math.min(24, Math.round(avgRatio * 0.3));
    return { images, saved, original, avgRatio, downloads, storageUsed, qualityBoost };
  }, [batches, files]);

  const tier = isSubscribed || subscription?.subscribed ? "creator" : "free";
  const storageQuota = STORAGE_QUOTA[tier] ?? STORAGE_QUOTA.free;
  const storagePct = storageQuota > 0 ? Math.min(100, (totals.storageUsed / storageQuota) * 100) : 0;


  const filteredFiles = useMemo(() => {
    let list = files;
    if (activeFolder === "favorites") list = list.filter((f) => f.is_favorite);
    else if (activeFolder !== "all") list = list.filter((f) => f.folder_id === activeFolder);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((f) => f.file_name.toLowerCase().includes(q));
    }
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "recent":
          return +new Date(b.created_at) - +new Date(a.created_at);
        case "oldest":
          return +new Date(a.created_at) - +new Date(b.created_at);
        case "largest":
          return (b.file_size ?? 0) - (a.file_size ?? 0);
        case "smallest":
          return (a.file_size ?? 0) - (b.file_size ?? 0);
        case "name":
          return a.file_name.localeCompare(b.file_name);
      }
    });
    return sorted;
  }, [files, activeFolder, search, sort]);

  const favorites = useMemo(() => files.filter((f) => f.is_favorite).slice(0, 6), [files]);

  // ─── Mutations ───────────────────────────────────────────────────────────
  const toggleFavorite = async (file: SharedFile) => {
    const next = !file.is_favorite;
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, is_favorite: next } : f)));
    const { error } = await supabase
      .from("shared_files")
      .update({ is_favorite: next })
      .eq("id", file.id);
    if (error) {
      setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, is_favorite: !next } : f)));
      toast({ title: "Couldn't update favorite", variant: "destructive" });
    }
  };

  const assignFolder = async (file: SharedFile, folderId: string | null) => {
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, folder_id: folderId } : f)));
    const { error } = await supabase
      .from("shared_files")
      .update({ folder_id: folderId })
      .eq("id", file.id);
    if (error) toast({ title: "Couldn't move file", variant: "destructive" });
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { data, error } = await supabase
      .from("user_folders")
      .insert({ user_id: user.id, name: newFolderName.trim(), color: newFolderColor })
      .select()
      .single();
    if (error || !data) {
      toast({ title: "Couldn't create folder", variant: "destructive" });
      return;
    }
    setFolders((prev) => [data as UserFolder, ...prev]);
    setNewFolderName("");
    setNewFolderColor("blue");
    setNewFolderOpen(false);
    toast({ title: "Folder created", description: data.name });
  };

  const deleteFolder = async (id: string) => {
    const { error } = await supabase.from("user_folders").delete().eq("id", id);
    if (error) return toast({ title: "Delete failed", variant: "destructive" });
    setFolders((prev) => prev.filter((f) => f.id !== id));
    if (activeFolder === id) setActiveFolder("all");
    setFiles((prev) => prev.map((f) => (f.folder_id === id ? { ...f, folder_id: null } : f)));
  };

  const getFileUrl = (path: string) => {
    const { data } = supabase.storage.from("shared-files").getPublicUrl(path);
    return data.publicUrl;
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="rounded-3xl bg-slate-950 p-4 md:p-6 text-slate-100 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)] ring-1 ring-slate-800/60">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* ═════════════ FEED ═════════════ */}
        <div className="space-y-5 min-w-0">
          {/* Search + Sort bar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search previous images…"
                className="h-11 border-slate-800 bg-slate-900/70 pl-9 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                aria-label="Search images"
              />
            </div>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-11 w-full md:w-52 border-slate-800 bg-slate-900/70 text-slate-100">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="largest">Largest first</SelectItem>
                <SelectItem value="smallest">Smallest first</SelectItem>
                <SelectItem value="name">Name (A→Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Folder rail */}
          <div className="flex flex-wrap items-center gap-2">
            <FolderChip
              active={activeFolder === "all"}
              onClick={() => setActiveFolder("all")}
              icon={<ImageIcon className="h-3.5 w-3.5" />}
              label="All images"
              count={files.length}
            />
            <FolderChip
              active={activeFolder === "favorites"}
              onClick={() => setActiveFolder("favorites")}
              icon={<Star className="h-3.5 w-3.5" />}
              label="Favorites"
              count={files.filter((f) => f.is_favorite).length}
              tone="amber"
            />
            {folders.map((f) => (
              <FolderChip
                key={f.id}
                active={activeFolder === f.id}
                onClick={() => setActiveFolder(f.id)}
                onDelete={() => deleteFolder(f.id)}
                icon={<Folder className="h-3.5 w-3.5" />}
                label={f.name}
                count={files.filter((x) => x.folder_id === f.id).length}
                colorClass={folderTint(f.color)}
              />
            ))}
            <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-slate-700 bg-slate-900/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-blue-500/60 hover:text-blue-300">
                  <FolderPlus className="h-3.5 w-3.5" /> New folder
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a folder</DialogTitle>
                  <DialogDescription>Group images into collections you can browse instantly.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <Input
                    autoFocus
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Collection name (e.g. Product hero)"
                    onKeyDown={(e) => e.key === "Enter" && createFolder()}
                  />
                  <div className="flex flex-wrap gap-2">
                    {FOLDER_COLORS.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => setNewFolderColor(c.name)}
                        className={cn(
                          "h-8 rounded-full border px-3 text-xs font-medium capitalize transition-all",
                          c.cls,
                          newFolderColor === c.name && "ring-2 ring-offset-2 ring-blue-500 ring-offset-slate-950"
                        )}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNewFolderOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFolder} disabled={!newFolderName.trim()}>
                    Create folder
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Favorites strip */}
          {favorites.length > 0 && activeFolder !== "favorites" && (
            <SectionCard
              title="Favorites"
              icon={<Star className="h-4 w-4 text-amber-300" />}
              actionLabel="See all"
              onAction={() => setActiveFolder("favorites")}
            >
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {favorites.map((f) => (
                  <FavoriteTile key={f.id} file={f} url={getFileUrl(f.file_path)} onToggle={() => toggleFavorite(f)} />
                ))}
              </div>
            </SectionCard>
          )}

          {/* Recent images grid */}
          <SectionCard
            title={
              activeFolder === "all"
                ? "Recent Images"
                : activeFolder === "favorites"
                ? "Favorites"
                : folders.find((f) => f.id === activeFolder)?.name ?? "Collection"
            }
            icon={<ImageIcon className="h-4 w-4 text-blue-300" />}
            subtitle={`${filteredFiles.length} image${filteredFiles.length === 1 ? "" : "s"}${search ? ` matching "${search}"` : ""}`}
          >
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-800/60" />
                ))}
              </div>
            ) : filteredFiles.length === 0 ? (
              <EmptyState
                icon={<ImageIcon className="h-6 w-6" />}
                title="No images yet"
                hint={search ? "Try a different search." : "Optimized images appear here after you save or share them."}
                cta={onQuickAction ? { label: "Optimize an image", onClick: () => onQuickAction("magic-optimize") } : undefined}
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                <AnimatePresence initial={false}>
                  {filteredFiles.map((f) => (
                    <ImageTile
                      key={f.id}
                      file={f}
                      url={getFileUrl(f.file_path)}
                      folders={folders}
                      onToggleFavorite={() => toggleFavorite(f)}
                      onAssignFolder={(folderId) => assignFolder(f, folderId)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </SectionCard>

          {/* Optimization history */}
          <SectionCard title="Optimization History" icon={<History className="h-4 w-4 text-emerald-300" />}>
            {batches.length === 0 ? (
              <EmptyState
                icon={<History className="h-6 w-6" />}
                title="No optimization runs yet"
                hint="Every batch you optimize shows up here with savings and quality metrics."
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800/70">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/70 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium">Preset</th>
                      <th className="px-3 py-2 font-medium text-right">Images</th>
                      <th className="px-3 py-2 font-medium text-right">Saved</th>
                      <th className="px-3 py-2 font-medium text-right">Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {batches.slice(0, 8).map((b) => (
                      <tr key={b.id} className="transition-colors hover:bg-slate-900/60">
                        <td className="px-3 py-2 text-slate-300">{relativeTime(b.processed_at)}</td>
                        <td className="px-3 py-2 capitalize text-slate-300">{b.preset_name ?? "custom"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{b.image_count}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-300">
                          {formatBytes(Number(b.total_saved))}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums text-blue-300">
                          {b.avg_compression_ratio}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* ═════════════ RIGHT RAIL ═════════════ */}
        <aside className="space-y-4">
          {/* Statistics */}
          <SectionCard title="Statistics" icon={<Gauge className="h-4 w-4 text-blue-300" />} padded={false}>
            <div className="grid grid-cols-2 gap-px bg-slate-800/60">
              <StatCell
                label="Images processed"
                value={totals.images.toLocaleString()}
                icon={<ImageIcon className="h-3.5 w-3.5" />}
                accent="text-blue-300"
              />
              <StatCell
                label="Space saved"
                value={formatBytes(totals.saved)}
                icon={<HardDrive className="h-3.5 w-3.5" />}
                accent="text-emerald-300"
              />
              <StatCell
                label="Avg quality boost"
                value={`+${totals.qualityBoost}%`}
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                accent="text-violet-300"
              />
              <StatCell
                label="Downloads"
                value={totals.downloads.toLocaleString()}
                icon={<Download className="h-3.5 w-3.5" />}
                accent="text-amber-300"
              />
            </div>
          </SectionCard>

          {/* Storage usage */}
          <SectionCard title="Storage Usage" icon={<HardDrive className="h-4 w-4 text-cyan-300" />}>
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-semibold tracking-tight text-slate-50">
                  {formatBytes(totals.storageUsed)}
                </span>
                <span className="text-xs text-slate-400">
                  {storageQuota > 0 ? `of ${formatBytes(storageQuota)}` : "Free plan — no storage"}
                </span>
              </div>
              <Progress
                value={storagePct}
                className="h-2 bg-slate-800 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-cyan-300"
              />
              <p className="text-xs text-slate-400">
                {storageQuota > 0
                  ? `${storagePct.toFixed(0)}% used · ${files.length} files stored`
                  : "Upgrade to Creator+ to keep processed files for 30 days."}
              </p>
              {storageQuota === 0 && (
                <Button size="sm" className="w-full bg-blue-500 hover:bg-blue-400" onClick={() => createCheckout()}>
                  <Crown className="mr-1.5 h-3.5 w-3.5" /> Unlock storage
                </Button>
              )}
            </div>
          </SectionCard>

          {/* Subscription status */}
          <SectionCard title="Subscription" icon={<Crown className="h-4 w-4 text-amber-300" />}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-400">Current plan</p>
                  <p className="text-lg font-semibold capitalize text-slate-50">
                    {subscription?.subscription_tier || (isSubscribed ? "Creator+" : "Free")}
                  </p>
                </div>
                <Badge
                  className={cn(
                    "border",
                    isSubscribed || subscription?.subscribed
                      ? "border-amber-400/30 bg-amber-500/15 text-amber-200"
                      : "border-slate-700 bg-slate-800/60 text-slate-300"
                  )}
                >
                  {subscription?.is_trialing ? "Trial" : isSubscribed || subscription?.subscribed ? "Active" : "Free"}
                </Badge>
              </div>
              {subscription?.subscription_end && (
                <p className="text-xs text-slate-400">
                  Renews {new Date(subscription.subscription_end).toLocaleDateString()}
                </p>
              )}
              <div className="flex gap-2">
                {isSubscribed || subscription?.subscribed ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
                    onClick={() => openCustomerPortal()}
                  >
                    Manage billing
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                    onClick={() => createCheckout()}
                  >
                    <Crown className="mr-1.5 h-3.5 w-3.5" /> Upgrade
                  </Button>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Quick actions */}
          <SectionCard title="Quick Actions" icon={<Zap className="h-4 w-4 text-yellow-300" />}>
            <div className="grid grid-cols-2 gap-2">
              <QuickAction
                icon={<Sparkles className="h-4 w-4" />}
                label="Magic Optimize"
                onClick={() => onQuickAction?.("magic-optimize")}
              />
              <QuickAction
                icon={<Wand2 className="h-4 w-4" />}
                label="AI Editor"
                onClick={() => onQuickAction?.("edit-image")}
              />
              <QuickAction
                icon={<Timer className="h-4 w-4" />}
                label="Batch process"
                onClick={() => onQuickAction?.("batch-process")}
              />
              <QuickAction
                icon={<ArrowUpRight className="h-4 w-4" />}
                label="Platform export"
                onClick={() => onQuickAction?.("social-export")}
              />
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────

const SectionCard = ({
  title,
  subtitle,
  icon,
  actionLabel,
  onAction,
  padded = true,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  padded?: boolean;
  children: React.ReactNode;
}) => (
  <Card className="overflow-hidden border-slate-800/70 bg-slate-900/60 text-slate-100 shadow-none backdrop-blur">
    <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
          {icon}
          <span className="truncate">{title}</span>
        </div>
        {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-blue-300 transition-colors hover:text-blue-200"
        >
          {actionLabel} <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </div>
    <div className={padded ? "p-4" : ""}>{children}</div>
  </Card>
);

const FolderChip = ({
  active,
  onClick,
  onDelete,
  icon,
  label,
  count,
  tone,
  colorClass,
}: {
  active?: boolean;
  onClick: () => void;
  onDelete?: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
  tone?: "amber";
  colorClass?: string;
}) => (
  <div
    className={cn(
      "group inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
      active
        ? "border-blue-400/60 bg-blue-500/20 text-blue-100 shadow-[0_6px_20px_-8px_rgba(59,130,246,0.6)]"
        : tone === "amber"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
        : colorClass
        ? cn("hover:brightness-110", colorClass)
        : "border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700 hover:text-slate-100"
    )}
  >
    <button onClick={onClick} className="inline-flex items-center gap-1.5">
      {icon}
      <span>{label}</span>
      <span className="rounded-full bg-black/25 px-1.5 text-[10px] tabular-nums">{count}</span>
    </button>
    {onDelete && (
      <button
        onClick={onDelete}
        aria-label={`Delete folder ${label}`}
        className="opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-300"
      >
        <Trash2 className="h-3 w-3" />
      </button>
    )}
  </div>
);

const ImageTile = ({
  file,
  url,
  folders,
  onToggleFavorite,
  onAssignFolder,
}: {
  file: SharedFile;
  url: string;
  folders: UserFolder[];
  onToggleFavorite: () => void;
  onAssignFolder: (folderId: string | null) => void;
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.18, ease: "easeOut" }}
    className="group relative overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/50 shadow-sm"
  >
    <div className="aspect-square overflow-hidden bg-slate-900">
      <img
        src={url}
        alt={file.file_name}
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div className="space-y-1 p-2.5">
      <p className="truncate text-xs font-medium text-slate-100">{file.file_name}</p>
      <div className="flex items-center justify-between text-[10px] text-slate-400">
        <span>{formatBytes(file.file_size ?? 0)}</span>
        <span>{relativeTime(file.created_at)}</span>
      </div>
    </div>

    {/* Actions overlay */}
    <div className="absolute inset-x-1 top-1 flex items-start justify-between opacity-0 transition-opacity group-hover:opacity-100">
      <button
        onClick={onToggleFavorite}
        aria-label={file.is_favorite ? "Unfavorite" : "Favorite"}
        className={cn(
          "rounded-full bg-black/60 p-1.5 backdrop-blur-sm transition-colors",
          file.is_favorite ? "text-amber-300" : "text-white hover:text-amber-300"
        )}
      >
        <Star className={cn("h-3.5 w-3.5", file.is_favorite && "fill-current")} />
      </button>
      <Select
        value={file.folder_id ?? "none"}
        onValueChange={(v) => onAssignFolder(v === "none" ? null : v)}
      >
        <SelectTrigger
          className="h-7 w-auto gap-1 border-transparent bg-black/60 px-2 text-[10px] text-white backdrop-blur-sm hover:bg-black/70"
          aria-label="Move to folder"
        >
          <Folder className="h-3 w-3" />
        </SelectTrigger>
        <SelectContent align="end">
          <SelectItem value="none">No folder</SelectItem>
          {folders.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
    {file.is_favorite && (
      <div className="pointer-events-none absolute right-2 bottom-11 rounded-full bg-amber-500/90 p-1 text-white shadow">
        <Star className="h-2.5 w-2.5 fill-current" />
      </div>
    )}
  </motion.div>
);

const FavoriteTile = ({
  file,
  url,
  onToggle,
}: {
  file: SharedFile;
  url: string;
  onToggle: () => void;
}) => (
  <div className="group relative overflow-hidden rounded-lg border border-slate-800/70 bg-slate-950/50">
    <div className="aspect-square overflow-hidden bg-slate-900">
      <img src={url} alt={file.file_name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
    </div>
    <button
      onClick={onToggle}
      aria-label="Unfavorite"
      className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-amber-300 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
    >
      <Star className="h-3 w-3 fill-current" />
    </button>
  </div>
);

const StatCell = ({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) => (
  <div className="bg-slate-900/60 p-4">
    <div className={cn("mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider", accent)}>
      {icon}
      {label}
    </div>
    <p className="text-xl font-semibold text-slate-50">{value}</p>
  </div>
);

const QuickAction = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="group flex flex-col items-start gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/60 hover:bg-slate-900/70"
  >
    <div className="rounded-lg bg-slate-800/80 p-2 text-blue-300 transition-colors group-hover:bg-blue-500/20">
      {icon}
    </div>
    <span className="text-xs font-medium text-slate-100">{label}</span>
  </button>
);

const EmptyState = ({
  icon,
  title,
  hint,
  cta,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  cta?: { label: string; onClick: () => void };
}) => (
  <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-10 text-center text-slate-400">
    <div className="rounded-full bg-slate-900 p-3 text-slate-300">{icon}</div>
    <p className="text-sm font-medium text-slate-200">{title}</p>
    <p className="max-w-xs text-xs">{hint}</p>
    {cta && (
      <Button size="sm" className="mt-2 bg-blue-500 hover:bg-blue-400" onClick={cta.onClick}>
        <Plus className="mr-1 h-3.5 w-3.5" /> {cta.label}
      </Button>
    )}
  </div>
);
