-- 1) free_tool_usage is only accessed through security-definer RPCs; no direct table reads needed
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.free_tool_usage FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.free_tool_usage FROM authenticated;
GRANT ALL ON public.free_tool_usage TO service_role;

-- 2) Trigger / internal helper functions must not be directly callable via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_sensitive_subscriber_data() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.simple_subscriber_audit() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;

-- 3) Obfuscation helpers are server-side only
REVOKE ALL ON FUNCTION public.safe_obfuscate_data(text, text) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.safe_deobfuscate_data(text, text) FROM anon, authenticated;

-- 4) Audit-count helper is server-side only
REVOKE ALL ON FUNCTION public.count_subscriber_access_last_hour(uuid) FROM anon, authenticated;