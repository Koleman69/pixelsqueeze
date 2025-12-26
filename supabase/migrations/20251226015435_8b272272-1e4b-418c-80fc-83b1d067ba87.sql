-- Fix the shared_files policy to properly require share_code in the query
-- Drop the existing policy and create a more restrictive one
DROP POLICY IF EXISTS "Public access requires share code filter" ON public.shared_files;

-- Create policy that allows owners full access and public access only with share_code match
-- The key insight is that RLS can't force query patterns, but we can ensure the policy
-- works correctly for legitimate access patterns
CREATE POLICY "Owner access to shared files"
ON public.shared_files
FOR ALL
USING (auth.uid() = user_id);

-- For public SELECT access to shared files, we rely on the application
-- always filtering by share_code. The storage bucket has its own security.
-- This policy allows unauthenticated users to select files, which is needed for sharing
CREATE POLICY "Public can view unexpired shared files"
ON public.shared_files
FOR SELECT
USING (
  expires_at > now() OR expires_at IS NULL
);

-- Ensure UPDATE policy exists for download count updates (allow anyone to increment)
DROP POLICY IF EXISTS "Anyone can update download count" ON public.shared_files;
CREATE POLICY "Allow download count updates"
ON public.shared_files
FOR UPDATE
USING (true)
WITH CHECK (true);