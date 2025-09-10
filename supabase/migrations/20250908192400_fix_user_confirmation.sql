-- fix_user_confirmation.sql

-- 1. Check the user in auth.users
SELECT '--- User in auth.users ---' AS status;
SELECT id, email, created_at, email_confirmed_at, email_change_confirm_status FROM auth.users WHERE email = 'hcks5@powerscrews.com';

-- 2. Check the profile
SELECT '--- Profile in public.profiles ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = 'hcks5@powerscrews.com';

-- 3. If the user's email is not confirmed, let's confirm it (without touching confirmed_at)
UPDATE auth.users 
SET 
    email_confirmed_at = NOW(),
    email_change_confirm_status = 1
WHERE email = 'hcks5@powerscrews.com' 
AND email_confirmed_at IS NULL;

-- 4. Verify the update
SELECT '--- After email confirmation ---' AS status;
SELECT id, email, email_confirmed_at, email_change_confirm_status FROM auth.users WHERE email = 'hcks5@powerscrews.com';

-- 5. Check if there are any duplicate users
SELECT '--- Check for duplicate users ---' AS status;
SELECT COUNT(*) as user_count FROM auth.users WHERE email = 'hcks5@powerscrews.com';

-- 6. Check if there are any duplicate profiles
SELECT '--- Check for duplicate profiles ---' AS status;
SELECT COUNT(*) as profile_count FROM public.profiles WHERE email = 'hcks5@powerscrews.com';

-- 7. If there are multiple users, let's clean them up
DO $$
DECLARE
    user_count integer;
    user_id_to_keep uuid;
BEGIN
    SELECT COUNT(*) INTO user_count FROM auth.users WHERE email = 'hcks5@powerscrews.com';
    
    IF user_count > 1 THEN
        -- Get the most recent user ID
        SELECT id INTO user_id_to_keep 
        FROM auth.users 
        WHERE email = 'hcks5@powerscrews.com' 
        ORDER BY created_at DESC 
        LIMIT 1;
        
        -- Delete duplicate users (keep the most recent one)
        DELETE FROM auth.users 
        WHERE email = 'hcks5@powerscrews.com' 
        AND id != user_id_to_keep;
        
        RAISE NOTICE 'Cleaned up duplicate users, keeping: %', user_id_to_keep;
    END IF;
END $$;
