-- Fix Storage RLS Policies for Resume Uploads
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CHECK CURRENT STORAGE POLICIES
-- ==============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- ==============================================
-- 2. CHECK STORAGE BUCKETS
-- ==============================================
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'candidate-resumes';

-- ==============================================
-- 3. DROP EXISTING STORAGE POLICIES
-- ==============================================
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable select for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON storage.objects;

-- ==============================================
-- 4. CREATE STORAGE BUCKET IF MISSING
-- ==============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'candidate-resumes',
    'candidate-resumes',
    false,
    10485760, -- 10MB limit
    ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- 5. CREATE NEW STORAGE POLICIES
-- ==============================================

-- Allow authenticated users to upload resumes to their own folder
CREATE POLICY "Users can upload resumes to their own folder" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'candidate-resumes' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow authenticated users to view their own resumes
CREATE POLICY "Users can view their own resumes" ON storage.objects
    FOR SELECT 
    TO authenticated
    USING (
        bucket_id = 'candidate-resumes' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow authenticated users to update their own resumes
CREATE POLICY "Users can update their own resumes" ON storage.objects
    FOR UPDATE 
    TO authenticated
    USING (
        bucket_id = 'candidate-resumes' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    )
    WITH CHECK (
        bucket_id = 'candidate-resumes' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete their own resumes" ON storage.objects
    FOR DELETE 
    TO authenticated
    USING (
        bucket_id = 'candidate-resumes' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Allow service role to manage all resumes (for admin functions)
CREATE POLICY "Service role can manage all resumes" ON storage.objects
    FOR ALL 
    TO service_role
    USING (bucket_id = 'candidate-resumes')
    WITH CHECK (bucket_id = 'candidate-resumes');

-- ==============================================
-- 6. VERIFY STORAGE SETUP
-- ==============================================
-- Check bucket exists
SELECT 
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'candidate-resumes';

-- Check policies
SELECT 
    policyname,
    cmd,
    roles,
    with_check
FROM pg_policies 
WHERE tablename = 'objects'
AND schemaname = 'storage'
ORDER BY policyname;

-- ==============================================
-- 7. TEST STORAGE ACCESS (OPTIONAL)
-- ==============================================
-- This will show if the user can access storage
SELECT 
    auth.uid() as current_user_id,
    'candidate-resumes' as bucket_name,
    'test-file.pdf' as test_filename;
