-- fix_storage_rls_simple.sql

-- 1. Check if the candidate-resumes bucket exists
SELECT '--- Checking candidate-resumes bucket ---' AS status;
SELECT 
    name,
    id,
    public,
    created_at
FROM storage.buckets 
WHERE name = 'candidate-resumes';

-- 2. Create the candidate-resumes bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'candidate-resumes',
    'candidate-resumes',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Check current RLS policies for storage.objects
SELECT '--- Current RLS policies for storage.objects ---' AS status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 4. Create a simple policy that allows authenticated users to upload to candidate-resumes
-- First, let's try to create a policy that allows all authenticated users to upload
CREATE POLICY "Allow authenticated users to upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'candidate-resumes');

-- Allow authenticated users to view resumes
CREATE POLICY "Allow authenticated users to view resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-resumes');

-- Allow authenticated users to update resumes
CREATE POLICY "Allow authenticated users to update resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'candidate-resumes')
WITH CHECK (bucket_id = 'candidate-resumes');

-- Allow authenticated users to delete resumes
CREATE POLICY "Allow authenticated users to delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'candidate-resumes');

-- 5. Verify the policies were created
SELECT '--- RLS policies after creation ---' AS status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%resumes%';

-- 6. Check bucket status
SELECT '--- Final bucket status ---' AS status;
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE name = 'candidate-resumes';
