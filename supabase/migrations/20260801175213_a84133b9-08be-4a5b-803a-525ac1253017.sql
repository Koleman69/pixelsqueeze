REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_sensitive_subscriber_data() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.simple_subscriber_audit() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;