-- Fix subscriber_audit_log RLS policies to restrict access to service roles only
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Service role can manage audit logs" ON public.subscriber_audit_log;

-- Create strict policies for service role access only
CREATE POLICY "Service role can read audit logs" 
ON public.subscriber_audit_log 
FOR SELECT 
USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can insert audit logs" 
ON public.subscriber_audit_log 
FOR INSERT 
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can update audit logs" 
ON public.subscriber_audit_log 
FOR UPDATE 
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role can delete audit logs" 
ON public.subscriber_audit_log 
FOR DELETE 
USING (auth.jwt() ->> 'role' = 'service_role');