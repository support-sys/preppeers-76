-- Create Missing Profile for User
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CREATE PROFILE FOR THE MISSING USER
-- ==============================================
INSERT INTO profiles (id, email, full_name, role)
SELECT 
    id,
    email,
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'),
    CASE 
        WHEN raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::user_role
        ELSE 'interviewee'::user_role
    END
FROM auth.users 
WHERE id = 'a3431aa8-8746-4304-9e08-86b298eeadea'
AND id NOT IN (SELECT id FROM profiles);

-- ==============================================
-- 2. VERIFY THE PROFILE WAS CREATED
-- ==============================================
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.id = 'a3431aa8-8746-4304-9e08-86b298eeadea';

-- ==============================================
-- 3. CHECK IF TRIGGER IS WORKING FOR FUTURE USERS
-- ==============================================
-- Verify the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- If trigger is missing, recreate it:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created 
-- AFTER INSERT ON auth.users 
-- FOR EACH ROW 
-- EXECUTE FUNCTION handle_new_user();
