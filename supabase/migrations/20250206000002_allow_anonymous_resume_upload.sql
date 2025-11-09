-- Allow anonymous users to upload resumes for resume review service
-- This enables the resume review form to work without requiring user authentication

-- Drop existing policies if they conflict (we'll keep authenticated policies and add anonymous ones)
-- Note: This migration assumes existing authenticated policies are already in place

-- Policy 1: Allow anonymous users to upload resumes to resume-reviews/ folder only
-- This is specifically for the resume review service which allows anonymous submissions
DROP POLICY IF EXISTS "Allow anonymous uploads to resume-reviews" ON storage.objects;

CREATE POLICY "Allow anonymous uploads to resume-reviews"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'candidate-resumes' AND
  name LIKE 'resume-reviews/%'
);

-- Policy 2: Allow anonymous users to read resumes from resume-reviews/ folder
DROP POLICY IF EXISTS "Allow anonymous read from resume-reviews" ON storage.objects;

CREATE POLICY "Allow anonymous read from resume-reviews"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'candidate-resumes' AND
  name LIKE 'resume-reviews/%'
);

-- Verify policies were created
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects' 
  AND (policyname LIKE '%anonymous%' OR policyname LIKE '%resume-review%');

