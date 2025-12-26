-- Fix shared_files policies to be more restrictive
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can view unexpired shared files" ON public.shared_files;
DROP POLICY IF EXISTS "Allow download count updates" ON public.shared_files;
DROP POLICY IF EXISTS "Owner access to shared files" ON public.shared_files;

-- Create proper policies for shared_files

-- 1. Owner can do everything with their own files
CREATE POLICY "Owners can manage their shared files"
ON public.shared_files
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Public can only SELECT files (not all metadata, but needed for share links to work)
-- The application filters by share_code, and we check expiration
CREATE POLICY "Public can view files via share code"
ON public.shared_files
FOR SELECT
USING (
  -- Only non-expired files
  (expires_at IS NULL OR expires_at > now())
);

-- Note: The download count update must be done via an edge function
-- to properly validate the share_code since RLS cannot access request parameters

-- Fix subscribers table - ensure strict policy
DROP POLICY IF EXISTS "Block anonymous access to subscribers" ON public.subscribers;
DROP POLICY IF EXISTS "Users can view their own subscription only" ON public.subscribers;
DROP POLICY IF EXISTS "Users can update their own subscription only" ON public.subscribers;

-- Single comprehensive policy for subscribers
CREATE POLICY "Users can only access their own subscriber data"
ON public.subscribers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);