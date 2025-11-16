-- Make images storage bucket private to prevent unauthorized access
UPDATE storage.buckets 
SET public = false 
WHERE id = 'images';

-- Add RLS policies for the images bucket to allow authenticated users to manage their own files

-- Allow authenticated users to read their own images
CREATE POLICY "Users can read own images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to upload their own images
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);