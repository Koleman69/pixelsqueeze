-- Fix function search path security issue
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;