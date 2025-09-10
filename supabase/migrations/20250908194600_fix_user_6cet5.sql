-- fix_user_6cet5.sql

-- 1. First, let's manually create the profile for this user
SELECT '--- Manually creating profile for 6cet5@powerscrews.com ---' AS status;

-- Check if user exists
SELECT '--- Checking if user exists ---' AS status;
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = '6cet5@powerscrews.com';

-- Manually create the profile
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'User'),
    CASE
        WHEN u.raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::public.user_role
        ELSE 'interviewee'::public.user_role
    END
FROM auth.users u
WHERE u.email = '6cet5@powerscrews.com'
AND u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify the profile was created
SELECT '--- Profile after manual creation ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = '6cet5@powerscrews.com';

-- 2. Now let's fix the trigger function to prevent this from happening again
SELECT '--- Fixing handle_new_user function ---' AS status;

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Add detailed logging
    RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
    RAISE NOTICE 'User email: %', NEW.email;
    RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;
    
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
            CASE
                WHEN NEW.raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::public.user_role
                ELSE 'interviewee'::public.user_role
            END
        );
        
        RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
            -- Don't re-raise, allow user signup to complete even if profile creation fails
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Test the trigger by checking if it exists
SELECT '--- Trigger status after fix ---' AS status;
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgenabled
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- 4. Final verification
SELECT '--- Final verification ---' AS status;
SELECT 
    'User exists' as status,
    COUNT(*) as count
FROM auth.users 
WHERE email = '6cet5@powerscrews.com'
UNION ALL
SELECT 
    'Profile exists' as status,
    COUNT(*) as count
FROM public.profiles 
WHERE email = '6cet5@powerscrews.com';
