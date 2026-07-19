
-- ============================================================
-- 1. Storage: images bucket — fix redundant OR clause
-- ============================================================
DROP POLICY IF EXISTS "Users can view their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own images" ON storage.objects;
-- Keep only the authenticated-role owner-scoped policies already present
-- (Users can read/update/delete/upload own images to authenticated role remain).

-- ============================================================
-- 2. Storage: shared-files bucket — owner-scoped read + upload
-- ============================================================
DROP POLICY IF EXISTS "Anyone can view shared-files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to shared-files" ON storage.objects;

CREATE POLICY "Owners can read their shared-files objects"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'shared-files'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Owners can upload to their shared-files folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'shared-files'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Owners can update their shared-files objects"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'shared-files'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

-- ============================================================
-- 3. shared_files table — remove overly-open public SELECT policy
--    and expose a secure RPC that validates the share code.
-- ============================================================
DROP POLICY IF EXISTS "Public can view files via share code" ON public.shared_files;

CREATE OR REPLACE FUNCTION public.get_shared_file_by_code(_code text)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_path text,
  file_size bigint,
  file_type text,
  download_count integer,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.file_name, s.file_path, s.file_size, s.file_type,
         s.download_count, s.expires_at, s.created_at
  FROM public.shared_files s
  WHERE s.share_code = _code
    AND (s.expires_at IS NULL OR s.expires_at > now())
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_shared_file_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_shared_file_by_code(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.increment_shared_file_download(_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_files
  SET download_count = COALESCE(download_count, 0) + 1
  WHERE share_code = _code
    AND (expires_at IS NULL OR expires_at > now());
$$;

REVOKE EXECUTE ON FUNCTION public.increment_shared_file_download(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_shared_file_download(text) TO anon, authenticated;

-- ============================================================
-- 4. subscribers — consolidate overlapping policies
-- ============================================================
DROP POLICY IF EXISTS "Service role can insert" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can read for billing operations" ON public.subscribers;
DROP POLICY IF EXISTS "Service role can update subscription status" ON public.subscribers;
DROP POLICY IF EXISTS "Service role limited updates" ON public.subscribers;
DROP POLICY IF EXISTS "Service role read with audit" ON public.subscribers;
DROP POLICY IF EXISTS "Users can insert own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can only access their own subscriber data" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscribers;

-- One clear owner policy for authenticated users
CREATE POLICY "Owners manage their own subscriber row"
ON public.subscribers FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS by default; no policies needed for it.

-- ============================================================
-- 5. blog_posts — only admins can create/update/delete
-- ============================================================
DROP POLICY IF EXISTS "Authors can create their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can delete their own blog posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can view their own unpublished blog posts" ON public.blog_posts;

CREATE POLICY "Admins can insert blog posts"
ON public.blog_posts FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blog posts"
ON public.blog_posts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blog posts"
ON public.blog_posts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view unpublished blog posts"
ON public.blog_posts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 6. email_subscribers — replace WITH CHECK (true) with real validation
-- ============================================================
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.email_subscribers;

CREATE POLICY "Anyone can subscribe with a valid email"
ON public.email_subscribers FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) BETWEEN 5 AND 320
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

-- ============================================================
-- 7. Function search_path — fix mutable one
-- ============================================================
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- ============================================================
-- 8. SECURITY DEFINER functions — lock EXECUTE grants
-- ============================================================
-- Revoke default PUBLIC EXECUTE on all SECURITY DEFINER functions we own.
REVOKE EXECUTE ON FUNCTION public.add_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.remove_user_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_user_roles() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.count_daily_ai_usage(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.count_subscriber_access_last_hour(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_safe_subscriber_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_safe_subscription_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_subscriber_encryption_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_subscription_status() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.safe_obfuscate_data(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.safe_deobfuscate_data(text, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- Service-role only functions: also revoke from authenticated
REVOKE EXECUTE ON FUNCTION public.get_subscriber_data_for_service(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_service_access(text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_subscription_safely(uuid, boolean, text, timestamptz, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscriber_data_for_service(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.log_service_access(text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_subscription_safely(uuid, boolean, text, timestamptz, text) TO service_role;

-- Grant back to authenticated where genuinely needed
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_user_roles() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_users_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_daily_ai_usage(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_subscriber_access_last_hour(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_subscriber_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_safe_subscription_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_subscriber_encryption_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_subscription_status() TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_obfuscate_data(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.safe_deobfuscate_data(text, text) TO authenticated;

-- ============================================================
-- 9. Revoke SELECT from anon on sensitive tables (GraphQL exposure)
-- ============================================================
REVOKE SELECT ON public.subscribers FROM anon;
REVOKE SELECT ON public.user_roles FROM anon;
REVOKE SELECT ON public.subscriber_audit_log FROM anon;
REVOKE SELECT ON public.automation_connections FROM anon;
REVOKE SELECT ON public.automation_jobs FROM anon;
REVOKE SELECT ON public.ai_usage FROM anon;
REVOKE SELECT ON public.alert_preferences FROM anon;
REVOKE SELECT ON public.batch_jobs FROM anon;
REVOKE SELECT ON public.batch_processing_stats FROM anon;
REVOKE SELECT ON public.campaign_triggers FROM anon;
REVOKE SELECT ON public.competitor_alerts FROM anon;
REVOKE SELECT ON public.competitor_snapshots FROM anon;
REVOKE SELECT ON public.email_subscribers FROM anon;
REVOKE SELECT ON public.file_jobs FROM anon;
REVOKE SELECT ON public.posting_workflows FROM anon;
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.scheduled_posts FROM anon;
REVOKE SELECT ON public.shared_files FROM anon;
REVOKE SELECT ON public.tracked_competitors FROM anon;
REVOKE SELECT ON public.user_collections FROM anon;
REVOKE SELECT ON public.user_folders FROM anon;

-- Also hide from authenticated GraphQL discovery for the most sensitive ones
REVOKE SELECT ON public.subscriber_audit_log FROM authenticated;
REVOKE SELECT ON public.user_roles FROM authenticated;
