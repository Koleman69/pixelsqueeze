-- Create table to track AI feature usage
CREATE TABLE public.ai_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_type TEXT NOT NULL DEFAULT 'image_edit',
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view their own AI usage"
ON public.ai_usage
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own usage records
CREATE POLICY "Users can insert their own AI usage"
ON public.ai_usage
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_ai_usage_user_date ON public.ai_usage (user_id, used_at);

-- Create function to count daily AI usage
CREATE OR REPLACE FUNCTION public.count_daily_ai_usage(target_user_id UUID, feature TEXT DEFAULT 'image_edit')
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.ai_usage
    WHERE user_id = target_user_id
      AND feature_type = feature
      AND used_at >= CURRENT_DATE
      AND used_at < CURRENT_DATE + INTERVAL '1 day'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;