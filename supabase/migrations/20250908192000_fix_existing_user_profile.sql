-- fix_existing_user_profile.sql

-- 1. Check if the user exists in auth.users
SELECT '--- User in auth.users ---' AS status;
SELECT id, email, created_at, email_confirmed_at FROM auth.users WHERE id = 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627';

-- 2. Check if profile exists for this user
SELECT '--- Profile in public.profiles ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE id = 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627';

-- 3. Manually create profile if missing
SELECT '--- Attempting to create missing profile ---' AS status;
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
WHERE u.id = 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627'
AND u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Verify the profile was created
SELECT '--- Profile after manual creation attempt ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE id = 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627';

-- 5. Check if the trigger exists and is working
SELECT '--- Checking trigger function ---' AS status;
SELECT proname, proowner, proacl FROM pg_proc WHERE proname = 'handle_new_user';

SELECT '--- Checking trigger ---' AS status;
SELECT tgname, tgrelid::regclass, tgfoid::regproc FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- 6. Recreate the trigger to ensure it's working
SELECT '--- Recreating trigger ---' AS status;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Test the trigger function manually
SELECT '--- Testing trigger function ---' AS status;
DO $$
DECLARE
    test_user_id uuid := 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627';
    test_email text := 'hcks5@powerscrews.com';
    test_meta jsonb := '{"full_name": "Test User"}'::jsonb;
BEGIN
    -- Simulate what the trigger should do
    RAISE NOTICE 'Testing trigger function for user: %', test_email;
    
    -- Check if profile exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = test_user_id) THEN
        RAISE NOTICE 'Profile already exists for user: %', test_email;
    ELSE
        RAISE NOTICE 'Profile does not exist for user: %', test_email;
    END IF;
END $$;
