-- Debug queries to check trigger functionality

-- 1. Check if pg_net extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_net';

-- 2. Check if the trigger exists and is active
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'interviewer_eligibility_trigger';

-- 3. Check recent audit log entries to see if trigger fired
SELECT * FROM public.audit_log 
WHERE operation = 'eligibility_granted' 
ORDER BY timestamp DESC 
LIMIT 5;

-- 4. Check interviewers table for recent changes
SELECT 
    user_id, 
    iseligible, 
    created_at, 
    updated_at,
    company,
    position,
    experience_years
FROM public.interviewers 
WHERE iseligible = true 
ORDER BY updated_at DESC 
LIMIT 5;

-- 5. Check if there are any interviewer records with profiles
SELECT 
    i.user_id,
    i.iseligible,
    p.full_name,
    p.email
FROM public.interviewers i
JOIN public.profiles p ON i.user_id = p.id
WHERE i.iseligible = true
LIMIT 3;
