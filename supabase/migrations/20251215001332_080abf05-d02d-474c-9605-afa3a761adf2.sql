-- Fix batch_jobs RLS policy - restrict edge function updates to service role only
DROP POLICY IF EXISTS "Edge functions can update batch jobs" ON public.batch_jobs;

CREATE POLICY "Service role can update batch jobs"
ON public.batch_jobs
FOR UPDATE
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Add DELETE policy for users to clean up their own jobs
CREATE POLICY "Users can delete their own batch jobs"
ON public.batch_jobs
FOR DELETE
USING (auth.uid() = user_id);

-- Fix file_jobs RLS policy - restrict service role access properly
DROP POLICY IF EXISTS "Service role can manage file jobs" ON public.file_jobs;

CREATE POLICY "Service role can manage file jobs"
ON public.file_jobs
FOR ALL
USING ((auth.jwt() ->> 'role') = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role') = 'service_role');

-- Add DELETE policy for users on file_jobs
CREATE POLICY "Users can delete their own file jobs"
ON public.file_jobs
FOR DELETE
USING (batch_job_id IN (SELECT id FROM batch_jobs WHERE user_id = auth.uid()));

-- Add DELETE policy for profiles
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (user_id = auth.uid());