-- Server-controlled complimentary (free forever) access flag
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS complimentary_access boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.subscribers.complimentary_access IS
  'Server-only flag granting permanent premium access with no Stripe subscription. Never writable by anon/authenticated.';

-- Never allow clients to write this column (RLS aside, revoke column privileges)
REVOKE INSERT (complimentary_access), UPDATE (complimentary_access)
  ON public.subscribers FROM anon, authenticated;

-- Grant permanent free premium access to the requested account
INSERT INTO public.subscribers (user_id, email, subscribed, subscription_tier, subscription_end, complimentary_access)
SELECT u.id, u.email, true, 'Pro', NULL, true
FROM auth.users u
WHERE lower(u.email) = 'siefkenk@icloud.com'
ON CONFLICT (user_id) DO UPDATE
SET subscribed = true,
    subscription_tier = 'Pro',
    subscription_end = NULL,
    complimentary_access = true,
    updated_at = now();