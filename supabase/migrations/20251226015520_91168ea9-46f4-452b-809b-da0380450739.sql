-- Add explicit policy to block anonymous access to subscribers
DROP POLICY IF EXISTS "Block anonymous access" ON public.subscribers;

CREATE POLICY "Block anonymous access to subscribers"
ON public.subscribers
FOR ALL
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);