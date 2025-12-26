-- Create table for batch processing analytics
CREATE TABLE public.batch_processing_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  image_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  total_original_size BIGINT NOT NULL DEFAULT 0,
  total_optimized_size BIGINT NOT NULL DEFAULT 0,
  total_saved BIGINT NOT NULL DEFAULT 0,
  avg_compression_ratio INTEGER NOT NULL DEFAULT 0,
  processing_time_ms INTEGER NOT NULL DEFAULT 0,
  preset_name TEXT,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.batch_processing_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own stats" 
ON public.batch_processing_stats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats" 
ON public.batch_processing_stats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stats" 
ON public.batch_processing_stats 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_batch_processing_stats_user_processed 
ON public.batch_processing_stats (user_id, processed_at DESC);