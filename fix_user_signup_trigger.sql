-- Fix User Signup Trigger to Auto-Create Profiles
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CHECK IF THE TRIGGER EXISTS
-- ==============================================
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ==============================================
-- 2. CHECK IF THE FUNCTION EXISTS
-- ==============================================
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- ==============================================
-- 3. CREATE THE FUNCTION IF MISSING
-- ==============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
        CASE 
            WHEN NEW.raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::user_role
            ELSE 'interviewee'::user_role
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 4. CREATE THE TRIGGER IF MISSING
-- ==============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- 5. GRANT NECESSARY PERMISSIONS
-- ==============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- ==============================================
-- 6. TEST THE TRIGGER (OPTIONAL)
-- ==============================================
-- You can test by creating a new user and checking if profile is created
-- This is just for verification - don't run unless testing

-- ==============================================
-- 7. VERIFY CURRENT STATE
-- ==============================================
-- Check if trigger is now working
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';
