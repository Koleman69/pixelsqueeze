
-- Collections
CREATE TABLE IF NOT EXISTS public.user_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_collections TO authenticated;
GRANT ALL ON public.user_collections TO service_role;

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own collections"
  ON public.user_collections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_user_collections_updated_at ON public.user_collections;
CREATE TRIGGER trg_user_collections_updated_at
BEFORE UPDATE ON public.user_collections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Extend shared_files
ALTER TABLE public.shared_files
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS collection_id uuid REFERENCES public.user_collections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_viewed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_shared_files_user_deleted ON public.shared_files (user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_shared_files_user_archived ON public.shared_files (user_id, is_archived);
CREATE INDEX IF NOT EXISTS idx_shared_files_collection ON public.shared_files (collection_id);
CREATE INDEX IF NOT EXISTS idx_user_collections_user ON public.user_collections (user_id);
