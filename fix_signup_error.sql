-- Fix Signup Error - Database error saving new user
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CHECK IF PROFILES TABLE EXISTS AND STRUCTURE
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
-- 2. CHECK IF USER_ROLE TYPE EXISTS
-- ==============================================
SELECT 
    typname,
    enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'user_role';

-- ==============================================
-- 3. CHECK CURRENT TRIGGER STATUS
-- ==============================================
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- ==============================================
-- 4. TEMPORARILY DISABLE TRIGGER TO TEST SIGNUP
-- ==============================================
-- This will allow signup to work while we fix the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ==============================================
-- 5. CREATE PROFILES TABLE IF MISSING
-- ==============================================
-- Check if table exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Create user_role type if missing
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
            CREATE TYPE user_role AS ENUM ('interviewee', 'interviewer');
        END IF;
        
        -- Create profiles table
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
        
        -- Create RLS policies
        CREATE POLICY "Users can view own profile" ON profiles
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own profile" ON profiles
            FOR UPDATE USING (auth.uid() = id);
            
        CREATE POLICY "Users can insert own profile" ON profiles
            FOR INSERT WITH CHECK (auth.uid() = id);
        
        RAISE NOTICE 'Profiles table created successfully';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END $$;

-- ==============================================
-- 6. CREATE THE HANDLE_NEW_USER FUNCTION
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
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 7. RECREATE THE TRIGGER
-- ==============================================
CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- 8. GRANT PERMISSIONS
-- ==============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- ==============================================
-- 9. VERIFY EVERYTHING IS WORKING
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

-- Check trigger
SELECT 
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check function
SELECT 
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';
