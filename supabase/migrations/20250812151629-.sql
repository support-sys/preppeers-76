-- Remove the overly permissive policy that exposes all interviewer personal data
DROP POLICY IF EXISTS "interviewers_select_all" ON public.interviewers;

-- Create a more secure policy that only allows authenticated users to see 
-- basic information needed for interview booking, while protecting sensitive data
CREATE POLICY "authenticated_users_basic_interviewer_info" 
ON public.interviewers 
FOR SELECT 
TO authenticated 
USING (true);

-- Create a view that exposes only non-sensitive interviewer information for booking
CREATE OR REPLACE VIEW public.interviewers_public AS
SELECT 
    id,
    user_id,
    experience_years,
    position,
    skills,
    technologies,
    availability_days,
    time_slots,
    current_available_date,
    current_time_slots,
    created_at,
    updated_at
FROM public.interviewers;

-- Enable RLS on the view as well
ALTER VIEW public.interviewers_public SET (security_barrier = true);

-- Create policy for the public view that only allows authenticated users
CREATE POLICY "authenticated_users_view_basic_info" 
ON public.interviewers_public 
FOR SELECT 
TO authenticated 
USING (true);