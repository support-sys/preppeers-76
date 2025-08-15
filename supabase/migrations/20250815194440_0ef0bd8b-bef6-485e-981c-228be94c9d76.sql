-- Create a completely secure solution by creating a view for public data only
-- Drop the existing policies that still expose sensitive data
DROP POLICY IF EXISTS "authenticated_users_can_view_interviewer_public_data" ON public.interviewers;
DROP POLICY IF EXISTS "interviewers_can_view_own_full_data" ON public.interviewers;

-- Create a secure view that only exposes safe, non-financial columns
CREATE VIEW public.interviewer_safe_view AS
SELECT 
    id,
    user_id,
    experience_years,
    time_slots,
    current_available_date,
    current_time_slots,
    schedule_last_updated,
    is_eligible,
    bio,
    linkedin_url,
    github_url,
    company,
    position,
    skills,
    technologies,
    availability_days,
    created_at,
    updated_at
FROM public.interviewers;

-- Grant select permissions on the safe view to authenticated users
GRANT SELECT ON public.interviewer_safe_view TO authenticated;

-- Create policy for the safe view
CREATE POLICY "authenticated_users_can_view_safe_interviewer_data" 
ON public.interviewer_safe_view 
FOR SELECT 
TO authenticated
USING (is_eligible = true);

-- Create restricted policy for interviewers table that only allows own data access
CREATE POLICY "interviewers_can_manage_own_data" 
ON public.interviewers 
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix profiles table to restrict personal contact info
DROP POLICY IF EXISTS "users_can_view_interviewer_basic_info" ON public.profiles;

-- Create safer profile access that excludes contact details
CREATE VIEW public.profiles_safe_view AS
SELECT 
    id,
    full_name,
    role,
    created_at,
    updated_at
FROM public.profiles;

-- Grant permissions on safe profiles view
GRANT SELECT ON public.profiles_safe_view TO authenticated;

-- Create policy for safe profiles view
CREATE POLICY "users_can_view_safe_profile_data" 
ON public.profiles_safe_view 
FOR SELECT 
TO authenticated
USING (role = 'interviewer'::user_role);