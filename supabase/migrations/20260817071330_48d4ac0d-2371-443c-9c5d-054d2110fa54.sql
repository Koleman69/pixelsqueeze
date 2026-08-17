CREATE OR REPLACE FUNCTION public.get_my_effective_plan()
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  comp record;
  best record;
BEGIN
  IF uid IS NULL THEN
    RETURN json_build_object('plan','free','provider',NULL,'subscribed',false);
  END IF;

  SELECT complimentary_access, subscription_tier
    INTO comp
  FROM public.subscribers
  WHERE user_id = uid
  LIMIT 1;

  IF comp.complimentary_access IS TRUE THEN
    RETURN json_build_object(
      'plan', lower(coalesce(comp.subscription_tier, 'pro')),
      'provider', 'complimentary',
      'subscribed', true,
      'status', 'active',
      'complimentary', true,
      'auto_renew', true,
      'is_trial', false,
      'current_period_end', NULL
    );
  END IF;

  -- Entitlement is a function of status + current_period_end only.
  -- 'canceled' means auto-renew was switched off: access continues until the
  -- already-paid period ends. 'grace_period' keeps access while the store
  -- retries billing, even though the period end has passed.
  SELECT * INTO best
  FROM public.subscriptions s
  WHERE s.user_id = uid
    AND (
      (s.subscription_status IN ('active','trialing')
        AND (s.current_period_end IS NULL OR s.current_period_end > now()))
      OR s.subscription_status = 'grace_period'
      OR (s.subscription_status = 'canceled'
        AND s.current_period_end IS NOT NULL
        AND s.current_period_end > now())
    )
  ORDER BY CASE s.plan
             WHEN 'business' THEN 3
             WHEN 'pro' THEN 2
             WHEN 'creator' THEN 1
             ELSE 0
           END DESC,
           s.current_period_end DESC NULLS FIRST
  LIMIT 1;

  IF best.id IS NULL THEN
    RETURN json_build_object('plan','free','provider',NULL,'subscribed',false,'complimentary',false);
  END IF;

  RETURN json_build_object(
    'plan', best.plan,
    'provider', best.provider,
    'platform', best.platform,
    'subscribed', true,
    'status', best.subscription_status,
    'current_period_end', best.current_period_end,
    'auto_renew', best.auto_renew,
    'is_trial', best.is_trial,
    'complimentary', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_effective_plan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_effective_plan() TO authenticated, service_role;