-- Plan / platform / provider / status vocabularies
DO $$ BEGIN
  CREATE TYPE public.subscription_plan AS ENUM ('free','creator','pro','business');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_platform AS ENUM ('web','ios','android');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.billing_provider AS ENUM ('stripe','apple','google','complimentary');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_state AS ENUM (
    'active','trialing','grace_period','on_hold','paused','canceled','expired','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan public.subscription_plan NOT NULL,
  platform public.billing_platform NOT NULL,
  provider public.billing_provider NOT NULL,
  product_id text,
  base_plan_id text,
  original_transaction_id text,
  purchase_token text,
  stripe_subscription_id text,
  stripe_customer_id text,
  subscription_status public.subscription_state NOT NULL DEFAULT 'active',
  current_period_end timestamptz,
  auto_renew boolean NOT NULL DEFAULT true,
  is_trial boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'production',
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- A store receipt may only ever be bound to a single PixelSqueeze account.
CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_apple_txn_key
  ON public.subscriptions (original_transaction_id)
  WHERE original_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_google_token_key
  ON public.subscriptions (purchase_token)
  WHERE purchase_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS subscriptions_stripe_sub_key
  ON public.subscriptions (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscriptions_user_status_idx
  ON public.subscriptions (user_id, subscription_status);

-- Data API grants: read-only for signed-in users, full access for server code.
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policies: only the service role (edge functions) writes.

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Effective plan resolution: complimentary wins, then the highest ranked
-- live subscription across every provider.
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

  SELECT * INTO best
  FROM public.subscriptions s
  WHERE s.user_id = uid
    AND s.subscription_status IN ('active','trialing','grace_period')
    AND (s.current_period_end IS NULL OR s.current_period_end > now())
  ORDER BY CASE s.plan
             WHEN 'business' THEN 3
             WHEN 'pro' THEN 2
             WHEN 'creator' THEN 1
             ELSE 0
           END DESC,
           s.current_period_end DESC NULLS LAST
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