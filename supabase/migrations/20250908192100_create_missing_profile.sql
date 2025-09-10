-- create_missing_profile.sql

-- Manually create profile for the existing user
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'User'),
    'interviewee'::public.user_role
FROM auth.users u
WHERE u.id = 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627'
AND u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- Verify the profile was created
SELECT 'Profile created for user:' AS status, id, email, full_name, role FROM public.profiles WHERE id = 'e8c6c5e9-f94a-42dd-a693-ee4a14a0f627';
