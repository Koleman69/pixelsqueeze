
CREATE TABLE IF NOT EXISTS public.free_tool_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  tool_id TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, tool_id)
);

GRANT ALL ON public.free_tool_usage TO service_role;
ALTER TABLE public.free_tool_usage ENABLE ROW LEVEL SECURITY;

-- No direct policies: all access through security-definer RPCs

CREATE OR REPLACE FUNCTION public.get_free_tool_usage(_email TEXT, _tool_id TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((
    SELECT count FROM public.free_tool_usage
    WHERE email = lower(trim(_email)) AND tool_id = _tool_id
  ), 0);
$$;

CREATE OR REPLACE FUNCTION public.consume_free_tool_usage(_email TEXT, _tool_id TEXT, _amount INTEGER DEFAULT 1)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  clean_email TEXT := lower(trim(_email));
BEGIN
  IF clean_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email';
  END IF;
  IF _amount < 1 OR _amount > 50 THEN
    RAISE EXCEPTION 'Invalid amount';
  END IF;

  INSERT INTO public.free_tool_usage(email, tool_id, count)
  VALUES (clean_email, _tool_id, _amount)
  ON CONFLICT (email, tool_id)
  DO UPDATE SET count = public.free_tool_usage.count + EXCLUDED.count,
                updated_at = now()
  RETURNING count INTO new_count;

  RETURN new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_free_tool_usage(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.consume_free_tool_usage(TEXT, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_free_tool_usage(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_free_tool_usage(TEXT, TEXT, INTEGER) TO anon, authenticated;
