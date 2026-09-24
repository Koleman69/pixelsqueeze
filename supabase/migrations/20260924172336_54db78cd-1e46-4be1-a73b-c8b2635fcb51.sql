CREATE TABLE public.guest_iap_entitlements (
  device_token text PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('ios','android')),
  plan text CHECK (plan IS NULL OR plan IN ('creator','pro','business')),
  active boolean NOT NULL DEFAULT false,
  product_id text, base_plan_id text, transaction_id text, original_transaction_id text,
  purchase_token text, expires_at timestamptz, auto_renewing boolean, environment text,
  synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guest_iap_entitlements TO service_role;
ALTER TABLE public.guest_iap_entitlements ENABLE ROW LEVEL SECURITY;
CREATE INDEX guest_iap_otx_idx ON public.guest_iap_entitlements(original_transaction_id) WHERE original_transaction_id IS NOT NULL;
CREATE INDEX guest_iap_token_idx ON public.guest_iap_entitlements(purchase_token) WHERE purchase_token IS NOT NULL;