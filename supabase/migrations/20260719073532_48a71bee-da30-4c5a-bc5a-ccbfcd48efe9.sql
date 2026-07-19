-- Folders / collections for the dashboard
CREATE TABLE IF NOT EXISTS public.user_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT 'blue',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_folders TO authenticated;
GRANT ALL ON public.user_folders TO service_role;

ALTER TABLE public.user_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their folders"
ON public.user_folders FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_folders_user_id_idx ON public.user_folders (user_id);

-- Extend shared_files with favorite + folder linkage
ALTER TABLE public.shared_files
  ADD COLUMN IF NOT EXISTS folder_id uuid REFERENCES public.user_folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_favorite boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS shared_files_folder_id_idx ON public.shared_files (folder_id);
CREATE INDEX IF NOT EXISTS shared_files_user_favorite_idx ON public.shared_files (user_id, is_favorite);