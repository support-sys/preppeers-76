-- simple_sample_data.sql

-- 1. Check current state
SELECT '--- Current database state ---' AS status;
SELECT COUNT(*) as total_interviewers FROM public.interviewers;
SELECT COUNT(*) as eligible_interviewers FROM public.interviewers WHERE is_eligible = true;
SELECT COUNT(*) as total_profiles FROM public.profiles;
SELECT COUNT(*) as interviewer_profiles FROM public.profiles WHERE role = 'interviewer';

-- 2. Make existing interviewers eligible (if any exist)
UPDATE public.interviewers 
SET is_eligible = true 
WHERE position IS NOT NULL 
  AND experience_years IS NOT NULL 
  AND user_id IN (SELECT id FROM auth.users);

-- 3. Check if we have any eligible interviewers now
SELECT '--- After making existing interviewers eligible ---' AS status;
SELECT COUNT(*) as eligible_interviewers FROM public.interviewers WHERE is_eligible = true;

-- 4. If still no eligible interviewers, let's check what we have
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

-- 5. Check if there are any users with interviewer role
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
