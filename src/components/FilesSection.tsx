import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderPlus,
  Folder,
  Star,
  Archive,
  Trash2,
  FolderHeart,
  Search,
  Clock,
  Pin,
  Share2,
  MoreHorizontal,
  Copy,
  Move,
  Pencil,
  Undo2,
  Eye,
  HardDrive,
  Sparkles,
  Tag,
  Loader2,
  FileImage,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ViewKey =
  | "recent"
  | "pinned"
  | "favorites"
  | "shared"
  | "archive"
  | "trash"
  | { kind: "folder"; id: string; name: string }
  | { kind: "collection"; id: string; name: string }
  | { kind: "tag"; name: string };

interface FileRow {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  file_type: string | null;
  share_code: string | null;
  download_count: number | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  folder_id: string | null;
  collection_id: string | null;
  is_favorite: boolean | null;
  is_pinned: boolean | null;
  is_archived: boolean | null;
  deleted_at: string | null;
  tags: string[] | null;
  last_viewed_at: string | null;
}

interface FolderRow {
  id: string;
  name: string;
  color: string | null;
}

interface CollectionRow {
  id: string;
  name: string;
  color: string | null;
  description: string | null;
}

const STORAGE_TIERS: Record<string, { label: string; gb: number }> = {
  free: { label: "Free", gb: 1 },
  creator: { label: "Creator", gb: 25 },
  pro: { label: "Pro", gb: 100 },
  business: { label: "Business", gb: 500 },
};

function bytesFmt(n: number | null | undefined) {
  if (!n) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const m = Math.floor(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export const FilesSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<FileRow[]>([]);
  const [folders, setFolders] = useState<FolderRow[]>([]);
  const [collections, setCollections] = useState<CollectionRow[]>([]);
  const [view, setView] = useState<ViewKey>("recent");
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<FileRow | null>(null);
  const [renameDialog, setRenameDialog] = useState<FileRow | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newCollectionOpen, setNewCollectionOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [storageTier, setStorageTier] = useState<keyof typeof STORAGE_TIERS>("free");

  // Load
  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [f, fo, co, sub] = await Promise.all([
      supabase.from("shared_files").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("user_folders").select("*").eq("user_id", user.id).order("name"),
      supabase.from("user_collections").select("*").eq("user_id", user.id).order("name"),
      supabase.rpc("get_my_subscription_status"),
    ]);
    if (f.data) setFiles(f.data as any);
    if (fo.data) setFolders(fo.data as any);
    if (co.data) setCollections(co.data as any);
    const tier = (sub.data as any)?.subscription_tier;
    if (tier && STORAGE_TIERS[String(tier).toLowerCase()]) {
      setStorageTier(String(tier).toLowerCase() as keyof typeof STORAGE_TIERS);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // Realtime sync
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel("files-section")
      .on("postgres_changes", { event: "*", schema: "public", table: "shared_files", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_folders", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .on("postgres_changes", { event: "*", schema: "public", table: "user_collections", filter: `user_id=eq.${user.id}` }, () => loadAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, loadAll]);

  // Storage
  const usedBytes = useMemo(
    () => files.filter((f) => !f.deleted_at).reduce((a, b) => a + (b.file_size || 0), 0),
    [files]
  );
  const tierGB = STORAGE_TIERS[storageTier].gb;
  const usedPct = Math.min(100, (usedBytes / (tierGB * 1024 * 1024 * 1024)) * 100);

  // Tags catalog
  const allTags = useMemo(() => {
    const set = new Set<string>();
    files.forEach((f) => (f.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [files]);

  // Filter visible
  const visible = useMemo(() => {
    let list = files;
    // Base scope
    if (view === "trash") {
      list = list.filter((f) => !!f.deleted_at);
    } else {
      list = list.filter((f) => !f.deleted_at);
      if (view === "archive") list = list.filter((f) => f.is_archived);
      else list = list.filter((f) => !f.is_archived);
    }
    if (view === "recent") {
      list = list.slice().sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 200);
    } else if (view === "pinned") {
      list = list.filter((f) => f.is_pinned);
    } else if (view === "favorites") {
      list = list.filter((f) => f.is_favorite);
    } else if (view === "shared") {
      list = list.filter((f) => !!f.share_code);
    } else if (typeof view === "object") {
      if (view.kind === "folder") list = list.filter((f) => f.folder_id === view.id);
      else if (view.kind === "collection") list = list.filter((f) => f.collection_id === view.id);
      else if (view.kind === "tag") list = list.filter((f) => (f.tags || []).includes(view.name));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (f) =>
          f.file_name.toLowerCase().includes(q) ||
          (f.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    // Pinned first
    return list.slice().sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned));
  }, [files, view, query]);

  // Mutations
  const patchFile = async (id: string, patch: Partial<FileRow>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
    const { error } = await supabase.from("shared_files").update(patch as any).eq("id", id);
    if (error) { toast.error(error.message); loadAll(); }
  };

  const toggleField = (f: FileRow, field: "is_favorite" | "is_pinned" | "is_archived") =>
    patchFile(f.id, { [field]: !f[field] } as any);

  const trashFile = (f: FileRow) => patchFile(f.id, { deleted_at: new Date().toISOString() as any });
  const restoreFile = (f: FileRow) => patchFile(f.id, { deleted_at: null as any });

  const purgeFile = async (f: FileRow) => {
    setFiles((prev) => prev.filter((x) => x.id !== f.id));
    await supabase.from("shared_files").delete().eq("id", f.id);
  };

  const duplicateFile = async (f: FileRow) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("shared_files")
      .insert({
        user_id: user.id,
        file_name: f.file_name.replace(/(\.[^.]+)?$/, (m) => ` (copy)${m || ""}`),
        file_path: f.file_path,
        file_size: f.file_size,
        file_type: f.file_type,
        folder_id: f.folder_id,
        collection_id: f.collection_id,
        tags: f.tags || [],
      } as any)
      .select("*")
      .single();
    if (error) return toast.error(error.message);
    if (data) setFiles((p) => [data as any, ...p]);
    toast.success("Duplicated");
  };

  const renameFile = async () => {
    if (!renameDialog || !renameValue.trim()) return;
    await patchFile(renameDialog.id, { file_name: renameValue.trim() });
    setRenameDialog(null);
    toast.success("Renamed");
  };

  const moveToFolder = (f: FileRow, folder_id: string | null) =>
    patchFile(f.id, { folder_id: folder_id as any });

  const moveToCollection = (f: FileRow, collection_id: string | null) =>
    patchFile(f.id, { collection_id: collection_id as any });

  const addTag = async (f: FileRow, tag: string) => {
    const t = tag.trim();
    if (!t) return;
    const next = Array.from(new Set([...(f.tags || []), t]));
    await patchFile(f.id, { tags: next });
  };

  const removeTag = async (f: FileRow, tag: string) => {
    const next = (f.tags || []).filter((x) => x !== tag);
    await patchFile(f.id, { tags: next });
  };

  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { error } = await supabase.from("user_folders").insert({ user_id: user.id, name: newFolderName.trim() });
    if (error) toast.error(error.message);
    setNewFolderOpen(false);
    setNewFolderName("");
    loadAll();
  };

  const createCollection = async () => {
    if (!user || !newCollectionName.trim()) return;
    const { error } = await supabase.from("user_collections").insert({ user_id: user.id, name: newCollectionName.trim() });
    if (error) toast.error(error.message);
    setNewCollectionOpen(false);
    setNewCollectionName("");
    loadAll();
  };

  const deleteFolder = async (id: string) => {
    if (!confirm("Delete this folder? Files inside will be moved out.")) return;
    await supabase.from("shared_files").update({ folder_id: null }).eq("folder_id", id);
    await supabase.from("user_folders").delete().eq("id", id);
    if (typeof view === "object" && view.kind === "folder" && view.id === id) setView("recent");
    loadAll();
  };

  const deleteCollection = async (id: string) => {
    if (!confirm("Delete this collection?")) return;
    await supabase.from("shared_files").update({ collection_id: null }).eq("collection_id", id);
    await supabase.from("user_collections").delete().eq("id", id);
    if (typeof view === "object" && view.kind === "collection" && view.id === id) setView("recent");
    loadAll();
  };

  const emptyTrash = async () => {
    if (!user) return;
    if (!confirm("Permanently delete everything in Trash?")) return;
    await supabase.from("shared_files").delete().eq("user_id", user.id).not("deleted_at", "is", null);
    loadAll();
  };

  const viewLabel = useMemo(() => {
    if (typeof view === "object") return view.name;
    return { recent: "Recent", pinned: "Pinned", favorites: "Favorites", shared: "Shared", archive: "Archive", trash: "Trash" }[view];
  }, [view]);

  const isTrash = view === "trash";

  if (!user) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Sign in to access your Files.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
      {/* Sidebar */}
      <aside className="space-y-4">
        <Card className="p-3">
          <SidebarButton icon={Clock} label="Recent" active={view === "recent"} onClick={() => setView("recent")} />
          <SidebarButton icon={Pin} label="Pinned" active={view === "pinned"} onClick={() => setView("pinned")} />
          <SidebarButton icon={Star} label="Favorites" active={view === "favorites"} onClick={() => setView("favorites")} />
          <SidebarButton icon={Share2} label="Shared" active={view === "shared"} onClick={() => setView("shared")} />
          <SidebarButton icon={Archive} label="Archive" active={view === "archive"} onClick={() => setView("archive")} />
          <SidebarButton icon={Trash2} label="Trash" active={view === "trash"} onClick={() => setView("trash")} />
        </Card>

        <Card className="p-3">
          <SectionHeader
            label="Folders"
            action={<button onClick={() => setNewFolderOpen(true)} className="text-primary hover:opacity-80"><FolderPlus className="w-4 h-4" /></button>}
          />
          {folders.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">No folders yet</p>}
          {folders.map((f) => (
            <SidebarRow
              key={f.id}
              active={typeof view === "object" && view.kind === "folder" && view.id === f.id}
              onClick={() => setView({ kind: "folder", id: f.id, name: f.name })}
              onDelete={() => deleteFolder(f.id)}
              icon={<Folder className="w-4 h-4" style={f.color ? { color: f.color } : undefined} />}
              label={f.name}
            />
          ))}
        </Card>

        <Card className="p-3">
          <SectionHeader
            label="Collections"
            action={<button onClick={() => setNewCollectionOpen(true)} className="text-primary hover:opacity-80"><FolderHeart className="w-4 h-4" /></button>}
          />
          {collections.length === 0 && <p className="text-xs text-muted-foreground px-2 py-1">No collections yet</p>}
          {collections.map((c) => (
            <SidebarRow
              key={c.id}
              active={typeof view === "object" && view.kind === "collection" && view.id === c.id}
              onClick={() => setView({ kind: "collection", id: c.id, name: c.name })}
              onDelete={() => deleteCollection(c.id)}
              icon={<FolderHeart className="w-4 h-4 text-pink-500" />}
              label={c.name}
            />
          ))}
        </Card>

        {allTags.length > 0 && (
          <Card className="p-3">
            <SectionHeader label="Tags" />
            <div className="flex flex-wrap gap-1.5 px-1">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setView({ kind: "tag", name: t })}
                  className={cn(
                    "text-[11px] px-2 py-0.5 rounded-full border transition",
                    typeof view === "object" && view.kind === "tag" && view.name === t
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-muted"
                  )}
                >
                  #{t}
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* Storage */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <HardDrive className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Storage</span>
            <Badge variant="outline" className="ml-auto text-[10px]">{STORAGE_TIERS[storageTier].label}</Badge>
          </div>
          <Progress value={usedPct} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 tabular-nums">
            {bytesFmt(usedBytes)} of {tierGB} GB used
          </p>
          {storageTier !== "business" && (
            <Button
              size="sm"
              className="w-full mt-3 gap-2"
              onClick={() => window.location.assign("/#pricing")}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade storage
            </Button>
          )}
        </Card>
      </aside>

      {/* Main */}
      <section className="min-w-0 space-y-4">
        <Card className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">{viewLabel}</h2>
            <p className="text-xs text-muted-foreground">
              {visible.length} file{visible.length === 1 ? "" : "s"}
              {selection.size > 0 && ` • ${selection.size} selected`}
            </p>
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search files, tags…"
              className="pl-9"
              aria-label="Search files"
            />
          </div>
          {isTrash && files.some((f) => f.deleted_at) && (
            <Button variant="destructive" size="sm" onClick={emptyTrash}>
              Empty trash
            </Button>
          )}
        </Card>

        {loading ? (
          <Card className="p-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </Card>
        ) : visible.length === 0 ? (
          <Card className="p-16 text-center border-dashed">
            <FileImage className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {isTrash ? "Trash is empty." : "No files here yet."}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {visible.map((f) => (
              <FileCard
                key={f.id}
                file={f}
                folders={folders}
                collections={collections}
                selected={selection.has(f.id)}
                onSelect={(v) => setSelection((s) => {
                  const n = new Set(s);
                  v ? n.add(f.id) : n.delete(f.id);
                  return n;
                })}
                onPreview={() => setPreview(f)}
                onToggle={(field) => toggleField(f, field)}
                onTrash={() => trashFile(f)}
                onRestore={() => restoreFile(f)}
                onPurge={() => purgeFile(f)}
                onDuplicate={() => duplicateFile(f)}
                onRename={() => { setRenameDialog(f); setRenameValue(f.file_name); }}
                onMoveFolder={(id) => moveToFolder(f, id)}
                onMoveCollection={(id) => moveToCollection(f, id)}
                onAddTag={(t) => addTag(f, t)}
                onRemoveTag={(t) => removeTag(f, t)}
                isTrash={isTrash}
              />
            ))}
          </div>
        )}
      </section>

      {/* Rename */}
      <Dialog open={!!renameDialog} onOpenChange={(o) => !o && setRenameDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rename file</DialogTitle></DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameDialog(null)}>Cancel</Button>
            <Button onClick={renameFile}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New folder */}
      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New folder</DialogTitle></DialogHeader>
          <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Folder name" autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)}>Cancel</Button>
            <Button onClick={createFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New collection */}
      <Dialog open={newCollectionOpen} onOpenChange={setNewCollectionOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New collection</DialogTitle></DialogHeader>
          <Input value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="Collection name" autoFocus />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewCollectionOpen(false)}>Cancel</Button>
            <Button onClick={createCollection}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle className="truncate">{preview?.file_name}</DialogTitle></DialogHeader>
          {preview && (
            <div className="space-y-3">
              {preview.file_type?.startsWith("image/") ? (
                <img
                  src={preview.file_path}
                  alt={preview.file_name}
                  className="w-full max-h-[70vh] object-contain rounded-md bg-muted"
                  loading="lazy"
                />
              ) : (
                <div className="p-10 text-center text-muted-foreground bg-muted rounded-md">
                  Preview not available for this file type.
                </div>
              )}
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span>{bytesFmt(preview.file_size)}</span>
                <span>•</span>
                <span>{timeAgo(preview.created_at)}</span>
                {preview.share_code && <><span>•</span><span>Shared</span></>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ Small building blocks ============

const SidebarButton = ({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
      active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted"
    )}
  >
    <Icon className="w-4 h-4" />
    {label}
  </button>
);

const SectionHeader = ({ label, action }: { label: string; action?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-2 pb-1.5">
    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</span>
    {action}
  </div>
);

const SidebarRow = ({
  active, onClick, onDelete, icon, label,
}: { active: boolean; onClick: () => void; onDelete?: () => void; icon: React.ReactNode; label: string }) => (
  <div className={cn("group flex items-center gap-2 rounded-md text-sm", active ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted")}>
    <button onClick={onClick} className="flex-1 flex items-center gap-2 px-3 py-2 text-left min-w-0">
      {icon}
      <span className="truncate">{label}</span>
    </button>
    {onDelete && (
      <button onClick={onDelete} className="opacity-0 group-hover:opacity-100 pr-2 text-muted-foreground hover:text-destructive transition" aria-label={`Delete ${label}`}>
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

interface FileCardProps {
  file: FileRow;
  folders: FolderRow[];
  collections: CollectionRow[];
  selected: boolean;
  onSelect: (v: boolean) => void;
  onPreview: () => void;
  onToggle: (field: "is_favorite" | "is_pinned" | "is_archived") => void;
  onTrash: () => void;
  onRestore: () => void;
  onPurge: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  onMoveFolder: (id: string | null) => void;
  onMoveCollection: (id: string | null) => void;
  onAddTag: (t: string) => void;
  onRemoveTag: (t: string) => void;
  isTrash: boolean;
}

const FileCard = ({
  file, folders, collections, selected, onSelect, onPreview, onToggle,
  onTrash, onRestore, onPurge, onDuplicate, onRename, onMoveFolder, onMoveCollection, onAddTag, onRemoveTag, isTrash,
}: FileCardProps) => {
  const [tagInput, setTagInput] = useState("");
  const isImage = file.file_type?.startsWith("image/");
  return (
    <div className={cn(
      "group relative rounded-xl border bg-card overflow-hidden transition-all hover:shadow-lg hover:-translate-y-0.5",
      selected && "ring-2 ring-primary"
    )}>
      <button
        onClick={onPreview}
        className="block w-full aspect-square bg-muted overflow-hidden"
        aria-label={`Preview ${file.file_name}`}
      >
        {isImage ? (
          <img src={file.file_path} alt={file.file_name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <FileImage className="w-10 h-10" />
          </div>
        )}
      </button>

      {/* Top badges */}
      <div className="absolute top-2 left-2 flex gap-1">
        {file.is_pinned && <Badge variant="secondary" className="h-5 gap-1 px-1.5"><Pin className="w-3 h-3" /></Badge>}
        {file.is_favorite && <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-yellow-500"><Star className="w-3 h-3 fill-current" /></Badge>}
        {file.share_code && <Badge variant="secondary" className="h-5 gap-1 px-1.5"><Share2 className="w-3 h-3" /></Badge>}
      </div>

      {/* Menu */}
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="secondary" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
            <DropdownMenuItem onClick={onPreview}><Eye className="w-4 h-4 mr-2" />Preview</DropdownMenuItem>
            {!isTrash && <>
              <DropdownMenuItem onClick={() => onToggle("is_favorite")}>
                <Star className={cn("w-4 h-4 mr-2", file.is_favorite && "fill-yellow-500 text-yellow-500")} />
                {file.is_favorite ? "Unfavorite" : "Favorite"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle("is_pinned")}>
                <Pin className="w-4 h-4 mr-2" />{file.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRename}><Pencil className="w-4 h-4 mr-2" />Rename</DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}><Copy className="w-4 h-4 mr-2" />Duplicate</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><Move className="w-4 h-4 mr-2" />Move to folder</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-popover z-50">
                  <DropdownMenuItem onClick={() => onMoveFolder(null)}>No folder</DropdownMenuItem>
                  {folders.map((fo) => (
                    <DropdownMenuItem key={fo.id} onClick={() => onMoveFolder(fo.id)}>{fo.name}</DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><FolderHeart className="w-4 h-4 mr-2" />Add to collection</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-popover z-50">
                  <DropdownMenuItem onClick={() => onMoveCollection(null)}>Remove</DropdownMenuItem>
                  {collections.map((c) => (
                    <DropdownMenuItem key={c.id} onClick={() => onMoveCollection(c.id)}>{c.name}</DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => onToggle("is_archived")}>
                <Archive className="w-4 h-4 mr-2" />{file.is_archived ? "Unarchive" : "Archive"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onTrash} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />Move to trash
              </DropdownMenuItem>
            </>}
            {isTrash && <>
              <DropdownMenuItem onClick={onRestore}><Undo2 className="w-4 h-4 mr-2" />Restore</DropdownMenuItem>
              <DropdownMenuItem onClick={onPurge} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />Delete forever
              </DropdownMenuItem>
            </>}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Meta */}
      <div className="p-3 space-y-1.5">
        <p className="text-sm font-medium truncate" title={file.file_name}>{file.file_name}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground tabular-nums">
          <span>{bytesFmt(file.file_size)}</span>
          <span>•</span>
          <span>{timeAgo(file.created_at)}</span>
        </div>
        {!isTrash && (
          <div className="flex flex-wrap gap-1 pt-1">
            {(file.tags || []).map((t) => (
              <button
                key={t}
                onClick={(e) => { e.stopPropagation(); onRemoveTag(t); }}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted hover:bg-destructive/10 hover:text-destructive transition"
                title="Remove tag"
              >
                #{t}
              </button>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[10px] px-1.5 py-0.5 rounded-full border border-dashed text-muted-foreground hover:text-primary hover:border-primary transition inline-flex items-center gap-0.5">
                  <Tag className="w-2.5 h-2.5" /> tag
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="p-2 bg-popover z-50" align="start">
                <form
                  onSubmit={(e) => { e.preventDefault(); if (tagInput.trim()) { onAddTag(tagInput); setTagInput(""); } }}
                  className="flex gap-1"
                >
                  <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} placeholder="Add tag" className="h-7 text-xs" autoFocus />
                  <Button size="sm" className="h-7" type="submit">Add</Button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilesSection;
