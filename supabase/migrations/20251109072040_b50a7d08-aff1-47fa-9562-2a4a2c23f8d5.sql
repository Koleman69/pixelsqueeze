-- Add free compressions tracking to subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS free_compressions_used integer DEFAULT 0 NOT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN public.subscribers.free_compressions_used IS 'Tracks number of free compressions used (limit: 3 for non-subscribers)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_subscribers_free_compressions ON public.subscribers(user_id, free_compressions_used) 
WHERE subscribed = false;