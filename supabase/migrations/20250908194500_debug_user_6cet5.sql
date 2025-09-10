-- debug_user_6cet5.sql

-- 1. Check if user exists in auth.users
SELECT '--- User in auth.users ---' AS status;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data
FROM auth.users 
WHERE email = '6cet5@powerscrews.com';

-- 2. Check if profile exists in public.profiles
SELECT '--- Profile in public.profiles ---' AS status;
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE email = '6cet5@powerscrews.com';

-- 3. Check handle_new_user function exists and is working
SELECT '--- handle_new_user function status ---' AS status;
SELECT 
    proname,
    proowner,
    proacl,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Check on_auth_user_created trigger exists
SELECT '--- on_auth_user_created trigger status ---' AS status;
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgfoid::regproc as function_name,
    tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 5. Check RLS policies for profiles table
SELECT '--- RLS policies for profiles ---' AS status;
SELECT 
    policyname,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 6. Test if we can manually insert a profile (test RLS)
SELECT '--- Testing manual profile insertion ---' AS status;
-- This will show if RLS is blocking the insertion
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = '6cet5@powerscrews.com'
        ) THEN 'User exists in auth.users'
        ELSE 'User does not exist in auth.users'
    END as user_exists;

-- 7. Check if there are any recent errors in the logs
SELECT '--- Recent trigger executions ---' AS status;
-- This might show if the trigger was called but failed
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE tablename = 'profiles' 
LIMIT 5;
