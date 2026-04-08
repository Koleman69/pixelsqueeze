-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can create alerts for users" ON public.competitor_alerts;

-- Create a properly scoped policy
CREATE POLICY "Users can create their own alerts"
ON public.competitor_alerts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);