-- Fix security issue with subscriber_safe_status view
-- Drop the existing unsafe view
DROP VIEW IF EXISTS public.subscriber_safe_status;

-- Create a secure function that returns safe subscription status with proper access control
CREATE OR REPLACE FUNCTION public.get_safe_subscription_status()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  subscribed boolean,
  subscription_end timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  access_count integer,
  last_accessed timestamp with time zone,
  email_status text,
  subscription_tier text,
  stripe_status text,
  security_level text,
  data_classification text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    s.id,
    s.user_id,
    s.subscribed,
    s.subscription_end,
    s.created_at,
    s.updated_at,
    s.access_count,
    s.last_accessed,
    CASE
      WHEN s.obfuscated_email IS NOT NULL THEN 'SECURED'::text
      ELSE 'STANDARD'::text
    END AS email_status,
    s.subscription_tier,
    CASE
      WHEN s.stripe_customer_id IS NOT NULL THEN 'ACTIVE'::text
      ELSE 'INACTIVE'::text
    END AS stripe_status,
    s.security_level,
    s.data_classification
  FROM public.subscribers s
  WHERE s.user_id = auth.uid();
$$;