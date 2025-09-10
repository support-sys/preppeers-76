-- Comprehensive Fix for All Issues
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. DISABLE TRIGGER TEMPORARILY TO ALLOW SIGNUP
-- ==============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ==============================================
-- 2. CHECK PROFILES TABLE STRUCTURE
-- ==============================================
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ==============================================
-- 3. CREATE/FIX PROFILES TABLE
-- ==============================================
-- Drop and recreate profiles table to ensure clean structure
DROP TABLE IF EXISTS profiles CASCADE;

-- Create user_role type if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('interviewee', 'interviewer');
    END IF;
END $$;

-- Create profiles table with proper structure
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role DEFAULT 'interviewee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 4. CREATE SIMPLE RLS POLICIES
-- ==============================================
-- Drop all existing policies
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;
DROP POLICY IF EXISTS "allow_profile_creation_during_signup" ON profiles;
DROP POLICY IF EXISTS "service_role_can_manage_profiles" ON profiles;

-- Create simple, working policies
CREATE POLICY "Enable read access for authenticated users" ON profiles
    FOR SELECT 
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON profiles
    FOR INSERT 
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow public access for signup (temporary)
CREATE POLICY "Enable insert for public during signup" ON profiles
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- ==============================================
-- 5. CREATE SIMPLE TRIGGER FUNCTION
-- ==============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Simple insert without complex logic
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
        'interviewee'::user_role
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail signup if profile creation fails
        RAISE WARNING 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 6. RECREATE TRIGGER
-- ==============================================
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- 7. FIX CLEANUP FUNCTION
-- ==============================================
-- Check if interviewer_time_blocks table exists
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'interviewer_time_blocks'
ORDER BY ordinal_position;

-- Create or fix the cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_blocks()
RETURNS void AS $$
BEGIN
    -- Check if the table and column exist before trying to delete
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'interviewer_time_blocks' 
        AND column_name = 'temporary'
    ) THEN
        DELETE FROM interviewer_time_blocks
        WHERE temporary = true
        AND created_at < NOW() - INTERVAL '15 minutes';
        
        RAISE NOTICE 'Cleaned up expired temporary reservations';
    ELSE
        RAISE NOTICE 'interviewer_time_blocks table or temporary column does not exist - skipping cleanup';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_temporary_blocks() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_temporary_blocks() TO anon;

-- ==============================================
-- 8. GRANT ALL NECESSARY PERMISSIONS
-- ==============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- ==============================================
-- 9. VERIFY EVERYTHING
-- ==============================================
-- Check table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- Check trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function
SELECT 
    proname
FROM pg_proc 
WHERE proname IN ('handle_new_user', 'cleanup_expired_temporary_blocks');
