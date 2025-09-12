-- Fix profiles table RLS and ensure we have profile data for interviewers

-- First, let's check what we have
DO $$
DECLARE
    profile_count integer;
    interviewer_count integer;
    missing_profiles integer;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO interviewer_count FROM interviewers WHERE is_eligible = true;
    
    SELECT COUNT(*) INTO missing_profiles
    FROM interviewers i
    LEFT JOIN profiles p ON i.user_id = p.id
    WHERE i.is_eligible = true AND p.id IS NULL;
    
    RAISE NOTICE 'Total profiles: %', profile_count;
    RAISE NOTICE 'Eligible interviewers: %', interviewer_count;
    RAISE NOTICE 'Missing profiles: %', missing_profiles;
END $$;

-- Drop existing RLS policies on profiles
DROP POLICY IF EXISTS "Allow public read access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new RLS policies for profiles
CREATE POLICY "Allow public read access to profiles" 
ON public.profiles 
FOR SELECT 
TO public 
USING (true);

CREATE POLICY "Allow authenticated users to read all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Grant permissions
GRANT SELECT ON public.profiles TO public;
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- Create missing profiles for interviewers who don't have them
INSERT INTO public.profiles (id, full_name, created_at, updated_at)
SELECT 
    i.user_id,
    COALESCE(i.position, 'Interviewer') || ' ' || COALESCE(i.experience_years::text, '') || '+ years',
    NOW(),
    NOW()
FROM interviewers i
LEFT JOIN profiles p ON i.user_id = p.id
WHERE i.is_eligible = true 
AND p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Update existing profiles with better names if they're generic
UPDATE profiles 
SET full_name = COALESCE(
    (SELECT i.position || ' ' || i.experience_years::text || '+ years' 
     FROM interviewers i 
     WHERE i.user_id = profiles.id AND i.is_eligible = true),
    full_name
)
WHERE full_name IS NULL OR full_name = '';

-- Final check
DO $$
DECLARE
    final_profile_count integer;
    final_missing_profiles integer;
BEGIN
    SELECT COUNT(*) INTO final_profile_count FROM profiles;
    
    SELECT COUNT(*) INTO final_missing_profiles
    FROM interviewers i
    LEFT JOIN profiles p ON i.user_id = p.id
    WHERE i.is_eligible = true AND p.id IS NULL;
    
    RAISE NOTICE 'Final profile count: %', final_profile_count;
    RAISE NOTICE 'Final missing profiles: %', final_missing_profiles;
END $$;
