ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS iap_platform text,
  ADD COLUMN IF NOT EXISTS iap_plan text,
  ADD COLUMN IF NOT EXISTS iap_product_id text,
  ADD COLUMN IF NOT EXISTS iap_base_plan_id text,
  ADD COLUMN IF NOT EXISTS iap_plan_assumed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS iap_transaction_id text,
  ADD COLUMN IF NOT EXISTS iap_original_transaction_id text,
  ADD COLUMN IF NOT EXISTS iap_purchase_token text,
  ADD COLUMN IF NOT EXISTS iap_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS iap_auto_renewing boolean,
  ADD COLUMN IF NOT EXISTS iap_environment text,
  ADD COLUMN IF NOT EXISTS iap_synced_at timestamptz;

ALTER TABLE public.subscribers
  DROP CONSTRAINT IF EXISTS subscribers_iap_platform_check;
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_iap_platform_check
  CHECK (iap_platform IS NULL OR iap_platform IN ('ios','android'));

ALTER TABLE public.subscribers
  DROP CONSTRAINT IF EXISTS subscribers_iap_plan_check;
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_iap_plan_check
  CHECK (iap_plan IS NULL OR iap_plan IN ('creator','pro','business'));

-- Entitlement columns are server-only, like complimentary_access.
REVOKE INSERT (iap_platform, iap_plan, iap_product_id, iap_base_plan_id, iap_plan_assumed,
               iap_transaction_id, iap_original_transaction_id, iap_purchase_token,
               iap_expires_at, iap_auto_renewing, iap_environment, iap_synced_at)
  ON public.subscribers FROM anon, authenticated;
REVOKE UPDATE (iap_platform, iap_plan, iap_product_id, iap_base_plan_id, iap_plan_assumed,
               iap_transaction_id, iap_original_transaction_id, iap_purchase_token,
               iap_expires_at, iap_auto_renewing, iap_environment, iap_synced_at)
  ON public.subscribers FROM anon, authenticated;

GRANT ALL ON public.subscribers TO service_role;

CREATE INDEX IF NOT EXISTS subscribers_iap_original_transaction_id_idx
  ON public.subscribers (iap_original_transaction_id)
  WHERE iap_original_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS subscribers_iap_purchase_token_idx
  ON public.subscribers (iap_purchase_token)
  WHERE iap_purchase_token IS NOT NULL;