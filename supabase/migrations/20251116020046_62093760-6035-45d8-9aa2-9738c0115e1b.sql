-- Fix blog_posts table security issue: Make author_id NOT NULL
-- This prevents bypassing RLS policies that check author_id = auth.uid()

-- Delete orphaned blog posts with NULL author_id (3 posts found)
-- These posts have no owner and cannot be managed due to RLS
DELETE FROM public.blog_posts 
WHERE author_id IS NULL;

-- Make author_id NOT NULL to enforce ownership
ALTER TABLE public.blog_posts 
ALTER COLUMN author_id SET NOT NULL;

-- Set default to current authenticated user
ALTER TABLE public.blog_posts 
ALTER COLUMN author_id SET DEFAULT auth.uid();

-- Update INSERT policy to explicitly enforce non-NULL author_id
DROP POLICY IF EXISTS "Authors can create their own blog posts" ON public.blog_posts;

CREATE POLICY "Authors can create their own blog posts" 
ON public.blog_posts 
FOR INSERT 
WITH CHECK (auth.uid() = author_id AND author_id IS NOT NULL);