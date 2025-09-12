-- Check profiles table structure and data
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Check if there are any profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- Check if there are profiles with the user_ids from interviewers
SELECT 
    i.id as interviewer_id,
    i.user_id,
    p.id as profile_id,
    p.full_name
FROM interviewers i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.is_eligible = true;

-- Check RLS policies on profiles table
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
WHERE tablename = 'profiles';
