-- verify_root_cause_fix.sql

-- 1. Check if the profile was created by the email confirmation trigger
SELECT '--- Profile status after email confirmation trigger ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = '6cet5@powerscrews.com';

-- 2. Check the timing analysis
SELECT '--- Timing analysis for 6cet5@powerscrews.com ---' AS status;
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN 'Email not confirmed'
        WHEN email_confirmed_at > created_at THEN 'Email confirmed after creation'
        ELSE 'Email confirmed at creation'
    END as timing_analysis
FROM auth.users 
WHERE email = '6cet5@powerscrews.com';

-- 3. Verify both triggers exist
SELECT '--- Trigger status ---' AS status;
SELECT 
    tgname,
    tgrelid::regclass as table_name,
    tgenabled
FROM pg_trigger 
WHERE tgname IN ('on_auth_user_created', 'on_auth_user_email_confirmed');

-- 4. Test with a new user to ensure both triggers work
SELECT '--- Testing complete flow with new user ---' AS status;

-- Create a test user (this should trigger the INSERT trigger)
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test-complete-flow@powerscrews.com',
    crypt('password123', gen_salt('bf')),
    NULL, -- Email not confirmed initially
    NULL,
    NULL,
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "Test Complete Flow", "role": "interviewee"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- Check if profile was created (it shouldn't be, since email not confirmed)
SELECT '--- Profile after user creation (email not confirmed) ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = 'test-complete-flow@powerscrews.com';

-- Now confirm the email (this should trigger the UPDATE trigger)
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'test-complete-flow@powerscrews.com';

-- Check if profile was created after email confirmation
SELECT '--- Profile after email confirmation ---' AS status;
SELECT id, email, full_name, role, created_at FROM public.profiles WHERE email = 'test-complete-flow@powerscrews.com';

-- Clean up test user
DELETE FROM public.profiles WHERE email = 'test-complete-flow@powerscrews.com';
DELETE FROM auth.users WHERE email = 'test-complete-flow@powerscrews.com';

-- 5. Final status
SELECT '--- Root cause fix verification complete ---' AS status;
SELECT 
    '6cet5@powerscrews.com profile exists' as check_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.profiles WHERE email = '6cet5@powerscrews.com') 
        THEN 'YES' 
        ELSE 'NO' 
    END as result;
