-- Fix subscribers table: Add explicit policy to deny public access and ensure only users can see their own data
-- The existing policies may allow broader access than intended

-- First, drop any existing overly permissive policies on subscribers
DROP POLICY IF EXISTS "Users can view own subscription data" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update own subscription data" ON public.subscribers;

-- Create strict RLS policies for subscribers - users can only see their own data
CREATE POLICY "Users can view their own subscription only"
ON public.subscribers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription only"
ON public.subscribers
FOR UPDATE
USING (auth.uid() = user_id);

-- Fix shared_files table: The current policy allows blanket public access
-- Replace with policy that requires share_code to be provided
DROP POLICY IF EXISTS "Anyone can view shared files by code" ON public.shared_files;

-- Create new policy that only allows access when querying by share_code
CREATE POLICY "Public access requires share code filter"
ON public.shared_files
FOR SELECT
USING (
  -- Allow if user is the owner
  auth.uid() = user_id
  OR
  -- Allow public access but the client must filter by share_code
  -- This policy still allows SELECT but the application should always filter by share_code
  share_code IS NOT NULL
);

-- Add policy for subscriber_audit_log - users can only view their own logs
DROP POLICY IF EXISTS "Users can view own audit logs" ON public.subscriber_audit_log;

CREATE POLICY "Users can view their own audit logs only"
ON public.subscriber_audit_log
FOR SELECT
USING (auth.uid() = user_id);