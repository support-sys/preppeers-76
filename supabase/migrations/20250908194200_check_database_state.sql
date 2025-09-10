-- check_database_state.sql

-- 1. Check current state
SELECT '--- Current database state ---' AS status;
SELECT COUNT(*) as total_interviewers FROM public.interviewers;
SELECT COUNT(*) as eligible_interviewers FROM public.interviewers WHERE is_eligible = true;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as interviewer_profiles FROM public.profiles WHERE role = 'interviewer';

-- 2. Show all interviewers in database
SELECT '--- All interviewers in database ---' AS status;
SELECT 
    i.id,
    i.user_id,
    i.position,
    i.experience_years,
    i.is_eligible,
    p.full_name,
    p.email
FROM public.interviewers i
LEFT JOIN public.profiles p ON i.user_id = p.id
LIMIT 10;

-- 3. Show users with interviewer role
SELECT '--- Users with interviewer role ---' AS status;
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    i.id as interviewer_id,
    i.is_eligible
FROM public.profiles p
LEFT JOIN public.interviewers i ON p.id = i.user_id
WHERE p.role = 'interviewer'
LIMIT 10;

-- 4. Show all users in auth.users
SELECT '--- All users in auth.users ---' AS status;
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
LIMIT 10;
