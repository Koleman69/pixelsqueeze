-- Add restrictive SELECT policy to block anonymous access to subscribers table
-- This prevents unauthenticated users from accessing sensitive customer data
CREATE POLICY "Block anonymous access to subscribers"
ON public.subscribers
FOR SELECT
TO anon
USING (false);