
-- Posting workflows configuration
CREATE TABLE public.posting_workflows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  workflow_type TEXT NOT NULL DEFAULT 'auto_schedule',
  is_active BOOLEAN NOT NULL DEFAULT false,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  posts_per_week INTEGER NOT NULL DEFAULT 10,
  preferred_times TEXT[] DEFAULT '{"09:00","12:00","15:00","18:00","20:00"}',
  preferred_days TEXT[] DEFAULT '{"mon","tue","wed","thu","fri","sat","sun"}',
  recycle_after_days INTEGER DEFAULT 30,
  recycle_min_engagement INTEGER DEFAULT 5,
  content_pool_ids UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.posting_workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own workflows" ON public.posting_workflows
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workflows" ON public.posting_workflows
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workflows" ON public.posting_workflows
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workflows" ON public.posting_workflows
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_posting_workflows_updated_at
  BEFORE UPDATE ON public.posting_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Campaign triggers for event-based automation
CREATE TABLE public.campaign_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL DEFAULT 'holiday',
  trigger_date DATE,
  trigger_recurring BOOLEAN DEFAULT false,
  platforms TEXT[] NOT NULL DEFAULT '{}',
  content_template TEXT,
  hashtags TEXT[] DEFAULT '{}',
  tone TEXT DEFAULT 'viral',
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_generate BOOLEAN DEFAULT true,
  posts_count INTEGER DEFAULT 3,
  days_before INTEGER DEFAULT 3,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own triggers" ON public.campaign_triggers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own triggers" ON public.campaign_triggers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own triggers" ON public.campaign_triggers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own triggers" ON public.campaign_triggers
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_campaign_triggers_updated_at
  BEFORE UPDATE ON public.campaign_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add engagement tracking to scheduled_posts
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recycled_from UUID REFERENCES public.scheduled_posts(id),
  ADD COLUMN IF NOT EXISTS workflow_id UUID REFERENCES public.posting_workflows(id),
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaign_triggers(id);

CREATE INDEX idx_posting_workflows_user ON public.posting_workflows (user_id, is_active);
CREATE INDEX idx_campaign_triggers_user ON public.campaign_triggers (user_id, is_active);
CREATE INDEX idx_scheduled_posts_engagement ON public.scheduled_posts (user_id, engagement_score DESC);
