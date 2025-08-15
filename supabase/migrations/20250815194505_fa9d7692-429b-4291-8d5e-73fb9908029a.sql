-- Drop the existing policies that still expose sensitive data
DROP POLICY IF EXISTS "authenticated_users_can_view_interviewer_public_data" ON public.interviewers;
DROP POLICY IF EXISTS "interviewers_can_view_own_full_data" ON public.interviewers;

-- Create restricted policy for interviewers table that only allows own data access
CREATE POLICY "interviewers_can_manage_own_data" 
ON public.interviewers 
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create a secure function to get safe interviewer data for matching
CREATE OR REPLACE FUNCTION public.get_safe_interviewer_data()
RETURNS TABLE (
    id uuid,
    user_id uuid,
    experience_years integer,
    time_slots jsonb,
    current_available_date date,
    current_time_slots jsonb,
    schedule_last_updated timestamp with time zone,
    is_eligible boolean,
    bio text,
    linkedin_url text,
    github_url text,
    company text,
    position text,
    skills text[],
    technologies text[],
    availability_days text[],
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        i.id,
        i.user_id,
        i.experience_years,
        i.time_slots,
        i.current_available_date,
        i.current_time_slots,
        i.schedule_last_updated,
        i.is_eligible,
        i.bio,
        i.linkedin_url,
        i.github_url,
        i.company,
        i.position,
        i.skills,
        i.technologies,
        i.availability_days,
        i.created_at,
        i.updated_at
    FROM public.interviewers i
    WHERE i.is_eligible = true;
$$;

-- Fix profiles table to restrict personal contact info
DROP POLICY IF EXISTS "users_can_view_interviewer_basic_info" ON public.profiles;

-- Create a secure function for safe profile data
CREATE OR REPLACE FUNCTION public.get_safe_profile_data()
RETURNS TABLE (
    id uuid,
    full_name text,
    role user_role,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        p.id,
        p.full_name,
        p.role,
        p.created_at,
        p.updated_at
    FROM public.profiles p
    WHERE p.role = 'interviewer'::user_role
    AND p.id IN (SELECT user_id FROM public.interviewers WHERE is_eligible = true);
$$;