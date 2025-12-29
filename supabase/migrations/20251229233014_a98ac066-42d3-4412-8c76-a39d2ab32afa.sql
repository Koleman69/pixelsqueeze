-- Create table for tracked competitors
CREATE TABLE public.tracked_competitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  website_url TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  tracking_frequency TEXT DEFAULT 'daily',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for competitor snapshots/changes
CREATE TABLE public.competitor_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competitor_id UUID NOT NULL REFERENCES public.tracked_competitors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  snapshot_type TEXT NOT NULL, -- 'pricing', 'content', 'design', 'feature', 'general'
  title TEXT NOT NULL,
  description TEXT,
  change_detected BOOLEAN DEFAULT false,
  data JSONB,
  captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for user alerts/notifications
CREATE TABLE public.competitor_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competitor_id UUID REFERENCES public.tracked_competitors(id) ON DELETE CASCADE,
  snapshot_id UUID REFERENCES public.competitor_snapshots(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- 'change', 'price_change', 'new_feature', 'daily_digest'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for alert preferences
CREATE TABLE public.alert_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_daily_digest BOOLEAN DEFAULT true,
  email_instant_alerts BOOLEAN DEFAULT false,
  notify_price_changes BOOLEAN DEFAULT true,
  notify_content_changes BOOLEAN DEFAULT true,
  notify_feature_updates BOOLEAN DEFAULT true,
  digest_time TEXT DEFAULT '09:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracked_competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracked_competitors
CREATE POLICY "Users can view their own tracked competitors" 
ON public.tracked_competitors FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tracked competitors" 
ON public.tracked_competitors FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracked competitors" 
ON public.tracked_competitors FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracked competitors" 
ON public.tracked_competitors FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for competitor_snapshots
CREATE POLICY "Users can view their own competitor snapshots" 
ON public.competitor_snapshots FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own competitor snapshots" 
ON public.competitor_snapshots FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor snapshots" 
ON public.competitor_snapshots FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for competitor_alerts
CREATE POLICY "Users can view their own competitor alerts" 
ON public.competitor_alerts FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own competitor alerts" 
ON public.competitor_alerts FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own competitor alerts" 
ON public.competitor_alerts FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Service can create alerts for users"
ON public.competitor_alerts FOR INSERT
WITH CHECK (true);

-- RLS Policies for alert_preferences
CREATE POLICY "Users can view their own alert preferences" 
ON public.alert_preferences FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alert preferences" 
ON public.alert_preferences FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alert preferences" 
ON public.alert_preferences FOR UPDATE 
USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE TRIGGER update_tracked_competitors_updated_at
BEFORE UPDATE ON public.tracked_competitors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alert_preferences_updated_at
BEFORE UPDATE ON public.alert_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();