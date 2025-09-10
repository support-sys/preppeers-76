-- investigate_timing_issue.sql

-- 1. Check the exact timing of when the user was created vs when we're checking
SELECT '--- User creation timing analysis ---' AS status;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Email not confirmed when created'
        WHEN email_confirmed_at > created_at THEN 'Email confirmed after creation'
        ELSE 'Email confirmed at creation'
    END as timing_analysis,
    raw_user_meta_data
FROM auth.users 
WHERE email = '6cet5@powerscrews.com';

-- 2. Check if there's a profile that was created but then deleted
SELECT '--- Checking for any existing profile ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = '6cet5@powerscrews.com';

-- 3. The key insight: The trigger might only fire on INSERT, not on UPDATE
-- Let's check if the user was created first, then email was confirmed later
SELECT '--- Checking if email confirmation happened after user creation ---' AS status;
SELECT 
    CASE 
        WHEN email_confirmed_at > created_at + INTERVAL '1 minute' THEN 'Email confirmed significantly after creation'
        WHEN email_confirmed_at > created_at THEN 'Email confirmed after creation'
        WHEN email_confirmed_at = created_at THEN 'Email confirmed at creation'
        ELSE 'Email not confirmed'
    END as confirmation_timing
FROM auth.users 
WHERE email = '6cet5@powerscrews.com';

-- 4. The root cause might be that the trigger only fires on INSERT, not on email confirmation
-- Let's check if we need to create a separate trigger for email confirmation
SELECT '--- Checking for email confirmation triggers ---' AS status;
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgenabled,
    tgtype
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- 5. Let's create a trigger that fires on UPDATE (email confirmation)
SELECT '--- Creating email confirmation trigger ---' AS status;

-- Create a function to handle email confirmation
CREATE OR REPLACE FUNCTION public.handle_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process if email was just confirmed
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        RAISE NOTICE 'Email confirmed for user: %, creating profile if missing', NEW.email;
        
        -- Check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
            -- Create profile
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
            RAISE NOTICE 'Profile created for user: % after email confirmation', NEW.email;
        ELSE
            RAISE NOTICE 'Profile already exists for user: %', NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_email_confirmation() TO anon;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_email_confirmation();

-- 6. Now let's test this by simulating email confirmation for the original user
SELECT '--- Testing email confirmation trigger ---' AS status;

-- Simulate email confirmation (this should trigger the new trigger)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = '6cet5@powerscrews.com' 
AND email_confirmed_at IS NULL;

-- 7. Check if profile was created
SELECT '--- Profile after email confirmation trigger ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = '6cet5@powerscrews.com';
