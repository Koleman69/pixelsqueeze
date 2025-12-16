-- Create a public storage bucket for shared compressed files
INSERT INTO storage.buckets (id, name, public)
VALUES ('shared-files', 'shared-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create a table to track shared files
CREATE TABLE IF NOT EXISTS public.shared_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  file_type text,
  share_code text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  download_count integer DEFAULT 0,
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days'),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_files ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared files
CREATE POLICY "Users can view their own shared files"
ON public.shared_files FOR SELECT
USING (auth.uid() = user_id);

-- Users can create shared files
CREATE POLICY "Users can create shared files"
ON public.shared_files FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own shared files
CREATE POLICY "Users can delete their own shared files"
ON public.shared_files FOR DELETE
USING (auth.uid() = user_id);

-- Public can view shared files by share_code (for viewing shared links)
CREATE POLICY "Anyone can view shared files by code"
ON public.shared_files FOR SELECT
USING (true);

-- Storage policies for shared-files bucket
CREATE POLICY "Authenticated users can upload to shared-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'shared-files');

CREATE POLICY "Anyone can view shared-files"
ON storage.objects FOR SELECT
USING (bucket_id = 'shared-files');

CREATE POLICY "Users can delete their own shared files from storage"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'shared-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create trigger to update updated_at
CREATE TRIGGER update_shared_files_updated_at
BEFORE UPDATE ON public.shared_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();