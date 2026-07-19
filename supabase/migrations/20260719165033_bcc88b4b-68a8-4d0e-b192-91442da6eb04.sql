-- Extend blog_posts for automated generation
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS faqs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS related_slugs text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS word_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS topic text;

ALTER TABLE public.blog_posts ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.blog_posts ALTER COLUMN author_id DROP DEFAULT;

CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts (published_at DESC) WHERE is_published;
CREATE INDEX IF NOT EXISTS idx_blog_posts_topic ON public.blog_posts (topic);

-- Newsletter signup: allow public inserts
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.email_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.email_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
GRANT INSERT ON public.email_subscribers TO anon, authenticated;

-- Schedule twice-weekly automatic blog generation (Tue & Fri 14:00 UTC)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Remove any existing schedule with the same name
DO $$ BEGIN
  PERFORM cron.unschedule('auto-generate-blog-post');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'auto-generate-blog-post',
  '0 14 * * 2,5',
  $cron$
  SELECT net.http_post(
    url := 'https://xjqysurmwoukskgkwjjc.supabase.co/functions/v1/generate-blog-post',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcXlzdXJtd291a3NrZ2t3ampjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MDYwNDksImV4cCI6MjA3MDA4MjA0OX0.E_dX85lOHjvOjwG6LkQeHXGtC4X7UCNS0JU_PppkCs4"}'::jsonb,
    body := '{"scheduled":true}'::jsonb
  );
  $cron$
);
