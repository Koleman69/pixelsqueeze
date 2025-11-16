-- Add proper auth checks to SECURITY DEFINER functions

-- Update log_service_access to require service role
CREATE OR REPLACE FUNCTION public.log_service_access(
  table_name text, 
  operation text, 
  target_user_id text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Require service role to call this function
  IF auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;

  -- Insert audit log entry for service role access
  INSERT INTO public.subscriber_audit_log (
    user_id,
    action,
    table_name,
    details,
    risk_level,
    session_id
  ) VALUES (
    COALESCE(target_user_id::uuid, '00000000-0000-0000-0000-000000000000'::uuid),
    operation,
    table_name,
    jsonb_build_object(
      'service_role_access', true,
      'timestamp', now(),
      'jwt_subject', auth.jwt() ->> 'sub'
    ),
    'elevated',
    'service_' || extract(epoch from now())::text
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN true;
END;
$$;

-- Update get_subscriber_data_for_service to require service role
CREATE OR REPLACE FUNCTION public.get_subscriber_data_for_service(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_json JSON;
BEGIN
  -- Require service role to call this function
  IF auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Service role required';
  END IF;
  
  SELECT json_build_object(
    'id', s.id,
    'user_id', s.user_id,
    'email', s.email,
    'stripe_customer_id', s.stripe_customer_id,
    'subscribed', s.subscribed,
    'subscription_tier', s.subscription_tier,
    'subscription_end', s.subscription_end
  ) INTO result_json
  FROM public.subscribers s
  WHERE s.user_id = user_uuid;
  
  -- Update tracking
  UPDATE public.subscribers 
  SET 
    access_count = COALESCE(access_count, 0) + 1,
    last_accessed = now()
  WHERE public.subscribers.user_id = user_uuid;
  
  RETURN result_json;
END;
$$;

-- Update count_subscriber_access_last_hour to scope to current user or service role
CREATE OR REPLACE FUNCTION public.count_subscriber_access_last_hour(target_user_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Service role can query any user, regular users can only query themselves
  IF auth.jwt() ->> 'role' = 'service_role' THEN
    RETURN (
      SELECT COUNT(*)::integer
      FROM public.subscriber_audit_log sal
      WHERE sal.accessed_at > now() - interval '1 hour'
      AND (target_user_id IS NULL OR sal.user_id = target_user_id)
    );
  ELSE
    -- Regular users can only see their own access count
    RETURN (
      SELECT COUNT(*)::integer
      FROM public.subscriber_audit_log sal
      WHERE sal.accessed_at > now() - interval '1 hour'
      AND sal.user_id = auth.uid()
    );
  END IF;
END;
$$;

-- Update safe_obfuscate_data to restrict access to authenticated users
CREATE OR REPLACE FUNCTION public.safe_obfuscate_data(
  data_text text, 
  salt text DEFAULT 'PixelSqueeze2025'
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only authenticated users or service role can obfuscate data
  IF auth.uid() IS NULL AND auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;

  RETURN encode(
    (data_text || '::' || salt)::bytea, 
    'base64'
  );
END;
$$;

-- Update safe_deobfuscate_data to restrict access to authenticated users
CREATE OR REPLACE FUNCTION public.safe_deobfuscate_data(
  obfuscated_data text, 
  salt text DEFAULT 'PixelSqueeze2025'
)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only authenticated users or service role can deobfuscate data
  IF auth.uid() IS NULL AND auth.jwt() ->> 'role' != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: Authentication required';
  END IF;

  RETURN split_part(
    convert_from(decode(obfuscated_data, 'base64'), 'UTF8'),
    '::' || salt,
    1
  );
END;
$$;