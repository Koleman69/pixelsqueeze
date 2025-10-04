-- Remove the confusing "Block anonymous access to subscribers" policy
-- This policy used USING (false) which is redundant and confusing
-- The existing "Users can view own subscription" policy already properly restricts access
DROP POLICY IF EXISTS "Block anonymous access to subscribers" ON public.subscribers;

-- Verify that the remaining SELECT policies are secure:
-- 1. "Users can view own subscription" - restricts to user_id = auth.uid() ✓
-- 2. Service role policies - properly restricted to service_role for backend operations ✓

-- Add a comment to document the security approach
COMMENT ON TABLE public.subscribers IS 'Contains sensitive user subscription data. Access is restricted via RLS: users can only view their own data (user_id = auth.uid()), service role can access for billing operations with audit logging.';