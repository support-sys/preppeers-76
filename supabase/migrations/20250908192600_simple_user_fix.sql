-- simple_user_fix.sql

-- 1. Check current user status
SELECT '--- Current user status ---' AS status;
SELECT 
    id,
    email,
    email_confirmed_at,
    email_change_confirm_status,
    created_at
FROM auth.users 
WHERE email = 'hcks5@powerscrews.com';

-- 2. Check profile status
SELECT '--- Profile status ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = 'hcks5@powerscrews.com';

-- 3. Ensure email is confirmed
UPDATE auth.users 
SET 
    email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    email_change_confirm_status = 1
WHERE email = 'hcks5@powerscrews.com';

-- 4. Verify the update
SELECT '--- After confirmation update ---' AS status;
SELECT 
    id,
    email,
    email_confirmed_at,
    email_change_confirm_status,
    created_at
FROM auth.users 
WHERE email = 'hcks5@powerscrews.com';

SELECT '--- User fix complete ---' AS status;
