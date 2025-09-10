-- Fix Profiles Table Issue
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CHECK IF PROFILES TABLE EXISTS
-- ==============================================
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- ==============================================
-- 2. CHECK IF USER EXISTS IN AUTH.USERS
-- ==============================================
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users 
WHERE id = 'a3431aa8-8746-4304-9e08-86b298eeadea';

-- ==============================================
-- 3. CHECK IF PROFILE EXISTS FOR THIS USER
-- ==============================================
SELECT 
    id,
    email,
    full_name,
    role,
    created_at
FROM profiles 
WHERE id = 'a3431aa8-8746-4304-9e08-86b298eeadea';

-- ==============================================
-- 4. MANUALLY CREATE PROFILE IF MISSING
-- ==============================================
-- First, get the user ID from auth.users
-- Then insert the profile manually

-- Get the user ID (replace with actual ID from step 2)
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT 
--     id,
--     email,
--     COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', 'User'),
--     CASE 
--         WHEN raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::user_role
--         ELSE 'interviewee'::user_role
--     END
-- FROM auth.users 
-- WHERE email = 'inzwv@powerscrews.com'
-- AND id NOT IN (SELECT id FROM profiles);

-- ==============================================
-- 5. CHECK TRIGGER STATUS
-- ==============================================
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ==============================================
-- 6. RECREATE TRIGGER IF MISSING
-- ==============================================
-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- 7. CHECK RLS POLICIES
-- ==============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- ==============================================
-- 8. VERIFY FINAL STATE
-- ==============================================
-- Check if profile now exists
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    au.email_confirmed_at
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE p.email = 'inzwv@powerscrews.com';
