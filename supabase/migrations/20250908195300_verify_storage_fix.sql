-- verify_storage_fix.sql

-- 1. Verify the candidate-resumes bucket exists and is configured correctly
SELECT '--- Bucket configuration ---' AS status;
SELECT 
    name,
    id,
    public,
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets 
WHERE name = 'candidate-resumes';

-- 2. Verify RLS policies are in place
SELECT '--- RLS policies for candidate-resumes ---' AS status;
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%resumes%';

-- 3. Check if there are any existing files in the bucket
SELECT '--- Existing files in bucket ---' AS status;
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at
FROM storage.objects 
WHERE bucket_id = 'candidate-resumes'
LIMIT 5;

-- 4. Test if we can access the bucket (this will show any permission issues)
SELECT '--- Bucket access test ---' AS status;
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'candidate-resumes') 
        THEN 'Bucket exists'
        ELSE 'Bucket does not exist'
    END as bucket_status;

-- 5. Check if RLS is enabled on storage.objects
SELECT '--- RLS status on storage.objects ---' AS status;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 6. Final verification
SELECT '--- Storage fix verification complete ---' AS status;
SELECT 
    'candidate-resumes bucket' as component,
    CASE 
        WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'candidate-resumes') 
        THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status
UNION ALL
SELECT 
    'RLS policies' as component,
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ EXISTS (' || COUNT(*) || ' policies)'
        ELSE '❌ MISSING'
    END as status
FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%resumes%';
