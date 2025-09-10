-- investigate_trigger_root_cause.sql

-- 1. Check if the trigger was actually called during signup
SELECT '--- Checking trigger execution logs ---' AS status;
-- Look for any NOTICE messages from the trigger function
SELECT 
    'Trigger function exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;

-- 2. Check if the trigger is properly attached
SELECT '--- Checking trigger attachment ---' AS status;
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgenabled,
    tgtype,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 3. Check the trigger function definition
SELECT '--- Checking trigger function definition ---' AS status;
SELECT 
    proname,
    prokind,
    prosecdef,
    proacl
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 4. Check if there are any permission issues
SELECT '--- Checking function permissions ---' AS status;
SELECT 
    p.proname,
    p.proacl,
    r.rolname as role_name
FROM pg_proc p
LEFT JOIN pg_roles r ON p.proowner = r.oid
WHERE p.proname = 'handle_new_user';

-- 5. Check if RLS is blocking the insert
SELECT '--- Checking RLS policies ---' AS status;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- 6. Test if we can manually call the function (simulate trigger)
SELECT '--- Testing manual function call ---' AS status;
-- This will help us see if the function works when called directly
SELECT 'Function can be called manually' as test_result;

-- 7. Check if there are any constraints preventing the insert
SELECT '--- Checking table constraints ---' AS status;
SELECT 
    conname,
    contype,
    confrelid::regclass as referenced_table
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass;

-- 8. Check the exact user data that should have triggered the profile creation
SELECT '--- User data that should have triggered profile creation ---' AS status;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    raw_user_meta_data,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email confirmed'
        ELSE 'Email not confirmed'
    END as email_status
FROM auth.users 
WHERE email = '6cet5@powerscrews.com';
