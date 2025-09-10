-- Fix RLS Policies for Profiles Table
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. CHECK CURRENT RLS POLICIES
-- ==============================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ==============================================
-- 2. DROP EXISTING POLICIES
-- ==============================================
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "users_can_view_own_profile" ON profiles;

-- ==============================================
-- 3. CREATE CORRECT RLS POLICIES
-- ==============================================

-- Allow users to view their own profile (authenticated users)
CREATE POLICY "users_can_view_own_profile" ON profiles
    FOR SELECT 
    TO authenticated
    USING (auth.uid() = id);

-- Allow users to update their own profile (authenticated users)
CREATE POLICY "users_can_update_own_profile" ON profiles
    FOR UPDATE 
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup (public role - for trigger)
CREATE POLICY "allow_profile_creation_during_signup" ON profiles
    FOR INSERT 
    TO public
    WITH CHECK (true);

-- Allow service role to manage profiles (for admin functions)
CREATE POLICY "service_role_can_manage_profiles" ON profiles
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==============================================
-- 4. UPDATE THE TRIGGER FUNCTION TO BE MORE ROBUST
-- ==============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert profile with proper error handling
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
    
    RAISE NOTICE 'Profile created for user: %', NEW.email;
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the signup
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- 5. RECREATE THE TRIGGER
-- ==============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created 
AFTER INSERT ON auth.users 
FOR EACH ROW 
EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ==============================================
-- Grant permissions to the function
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;

-- ==============================================
-- 7. VERIFY THE FIX
-- ==============================================
-- Check new policies
SELECT 
    policyname,
    cmd,
    roles,
    qual,
    with_check
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
    proname,
    prosrc
FROM pg_proc 
WHERE proname = 'handle_new_user';
