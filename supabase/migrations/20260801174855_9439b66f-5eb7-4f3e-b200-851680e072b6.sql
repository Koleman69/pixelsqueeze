-- 1. Restrict AI usage counts to the caller's own user id (or service role)
CREATE OR REPLACE FUNCTION public.count_daily_ai_usage(target_user_id uuid, feature text DEFAULT 'image_edit'::text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role' THEN
    IF auth.uid() IS NULL OR auth.uid() <> target_user_id THEN
      RAISE EXCEPTION 'Access denied: can only read your own usage';
    END IF;
  END IF;

  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.ai_usage
    WHERE user_id = target_user_id
      AND feature_type = feature
      AND used_at >= CURRENT_DATE
      AND used_at < CURRENT_DATE + INTERVAL '1 day'
  );
END;
$function$;

-- 2. Re-key free tool usage to caller-owned identifiers
ALTER TABLE public.free_tool_usage ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.free_tool_usage ADD COLUMN IF NOT EXISTS client_key text;

UPDATE public.free_tool_usage
SET client_key = 'email:' || lower(trim(email))
WHERE client_key IS NULL AND email IS NOT NULL;

DELETE FROM public.free_tool_usage WHERE client_key IS NULL;

ALTER TABLE public.free_tool_usage ALTER COLUMN client_key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'free_tool_usage_client_key_tool_id_key'
  ) THEN
    ALTER TABLE public.free_tool_usage
      ADD CONSTRAINT free_tool_usage_client_key_tool_id_key UNIQUE (client_key, tool_id);
  END IF;
END $$;

DROP FUNCTION IF EXISTS public.get_free_tool_usage(text, text);
DROP FUNCTION IF EXISTS public.consume_free_tool_usage(text, text, integer);

CREATE OR REPLACE FUNCTION public.get_free_tool_usage(_client_token text, _tool_id text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  resolved_key text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    resolved_key := 'user:' || auth.uid()::text;
  ELSE
    IF _client_token IS NULL OR length(_client_token) < 24 OR _client_token !~ '^[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'Invalid client token';
    END IF;
    resolved_key := 'anon:' || _client_token;
  END IF;

  IF _tool_id IS NULL OR length(_tool_id) < 1 OR length(_tool_id) > 64 THEN
    RAISE EXCEPTION 'Invalid tool id';
  END IF;

  RETURN COALESCE((
    SELECT count FROM public.free_tool_usage
    WHERE client_key = resolved_key AND tool_id = _tool_id
  ), 0);
END;
$function$;

CREATE OR REPLACE FUNCTION public.consume_free_tool_usage(_client_token text, _tool_id text, _amount integer DEFAULT 1)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  new_count INTEGER;
  resolved_key text;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    resolved_key := 'user:' || auth.uid()::text;
  ELSE
    IF _client_token IS NULL OR length(_client_token) < 24 OR _client_token !~ '^[A-Za-z0-9_-]+$' THEN
      RAISE EXCEPTION 'Invalid client token';
    END IF;
    resolved_key := 'anon:' || _client_token;
  END IF;

  IF _tool_id IS NULL OR length(_tool_id) < 1 OR length(_tool_id) > 64 THEN
    RAISE EXCEPTION 'Invalid tool id';
  END IF;

  IF _amount < 1 OR _amount > 50 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  INSERT INTO public.free_tool_usage(client_key, tool_id, count)
  VALUES (resolved_key, _tool_id, _amount)
  ON CONFLICT (client_key, tool_id)
  DO UPDATE SET count = public.free_tool_usage.count + EXCLUDED.count,
                updated_at = now()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_free_tool_usage(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_free_tool_usage(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_free_tool_usage(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_free_tool_usage(text, text, integer) TO anon, authenticated, service_role;