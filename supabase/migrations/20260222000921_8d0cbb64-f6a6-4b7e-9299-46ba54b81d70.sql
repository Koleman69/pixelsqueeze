
-- Table for storing user's cloud service connections
CREATE TABLE public.automation_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'dropbox', 'shopify', 'local_folder')),
  display_name TEXT NOT NULL DEFAULT '',
  credentials JSONB DEFAULT '{}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'error', 'syncing')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Table for automation processing jobs
CREATE TABLE public.automation_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.automation_connections(id) ON DELETE CASCADE,
  source_file_name TEXT NOT NULL,
  source_file_path TEXT,
  source_file_size INTEGER,
  processed_file_path TEXT,
  processed_file_size INTEGER,
  compression_ratio NUMERIC,
  output_format TEXT DEFAULT 'webp',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for automation_connections
CREATE POLICY "Users can view own connections"
  ON public.automation_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own connections"
  ON public.automation_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON public.automation_connections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON public.automation_connections FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for automation_jobs
CREATE POLICY "Users can view own jobs"
  ON public.automation_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own jobs"
  ON public.automation_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs"
  ON public.automation_jobs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs"
  ON public.automation_jobs FOR DELETE
  USING (auth.uid() = user_id);

-- Service role policies for edge function processing
CREATE POLICY "Service role can manage connections"
  ON public.automation_connections FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

CREATE POLICY "Service role can manage jobs"
  ON public.automation_jobs FOR ALL
  USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
  WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Trigger for updated_at
CREATE TRIGGER update_automation_connections_updated_at
  BEFORE UPDATE ON public.automation_connections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_automation_jobs_updated_at
  BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_automation_jobs_connection_id ON public.automation_jobs(connection_id);
CREATE INDEX idx_automation_jobs_user_status ON public.automation_jobs(user_id, status);
CREATE INDEX idx_automation_connections_user ON public.automation_connections(user_id);
