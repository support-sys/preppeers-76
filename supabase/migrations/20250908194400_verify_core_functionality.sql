-- verify_core_functionality.sql

-- 1. Verify essential tables exist and have data
SELECT '--- Core Tables Status ---' AS status;
SELECT 'profiles' as table_name, COUNT(*) as count FROM public.profiles
UNION ALL
SELECT 'interviewers' as table_name, COUNT(*) as count FROM public.interviewers
UNION ALL
SELECT 'payment_sessions' as table_name, COUNT(*) as count FROM public.payment_sessions
UNION ALL
SELECT 'interviews' as table_name, COUNT(*) as count FROM public.interviews;

-- 2. Verify user_role enum exists
SELECT '--- User Role Enum ---' AS status;
SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role');

-- 3. Verify handle_new_user function exists
SELECT '--- handle_new_user Function ---' AS status;
SELECT proname, proowner FROM pg_proc WHERE proname = 'handle_new_user';

-- 4. Verify on_auth_user_created trigger exists
SELECT '--- on_auth_user_created Trigger ---' AS status;
SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 5. Verify RLS policies for profiles table
SELECT '--- RLS Policies for profiles ---' AS status;
SELECT policyname, permissive, roles FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';

-- 6. Verify cleanup_expired_temporary_blocks function exists
SELECT '--- cleanup_expired_temporary_blocks Function ---' AS status;
SELECT proname FROM pg_proc WHERE proname = 'cleanup_expired_temporary_blocks';

-- 7. Check if we have any users and their profiles
SELECT '--- Users and Profiles ---' AS status;
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.role,
    p.created_at as profile_created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
