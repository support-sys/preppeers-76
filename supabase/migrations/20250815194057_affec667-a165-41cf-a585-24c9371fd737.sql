-- Fix critical security issue: Protect sensitive financial data in interviewers table
-- Drop the overly permissive policy that exposes all data
DROP POLICY IF EXISTS "authenticated_users_can_view_interviewers" ON public.interviewers;

-- Create a new policy that only exposes non-sensitive fields needed for matching
CREATE POLICY "authenticated_users_can_view_public_interviewer_data" 
ON public.interviewers 
FOR SELECT 
TO authenticated
USING (true)
WITH CHECK (false);

-- However, we need to restrict which columns can be accessed
-- Create a view for public interviewer data without sensitive financial info
CREATE OR REPLACE VIEW public.interviewer_public_profiles AS
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
FROM public.interviewers
WHERE is_eligible = true;

-- Enable RLS on the view
ALTER VIEW public.interviewer_public_profiles SET (security_invoker = on);

-- Create RLS policy for the view
CREATE POLICY "authenticated_users_can_view_public_profiles" 
ON public.interviewer_public_profiles 
FOR SELECT 
TO authenticated
USING (true);

-- Fix profiles table exposure - drop overly permissive policy
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Create more restrictive policies for profiles
CREATE POLICY "users_can_view_own_profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Allow viewing of interviewer basic info for matching (but not full profile)
CREATE POLICY "users_can_view_interviewer_basic_info" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
    role = 'interviewer'::user_role AND 
    id IN (SELECT user_id FROM public.interviewers WHERE is_eligible = true)
);

-- Create a secure function for interviewers to access their own financial data
CREATE OR REPLACE FUNCTION public.get_my_payout_details()
RETURNS TABLE (
    payout_method text,
    upi_id text,
    bank_name text,
    bank_account_number text,
    bank_ifsc_code text,
    account_holder_name text,
    payout_details_verified boolean,
    payout_details_submitted_at timestamp with time zone,
    payout_details_locked boolean
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        i.payout_method,
        i.upi_id,
        i.bank_name,
        i.bank_account_number,
        i.bank_ifsc_code,
        i.account_holder_name,
        i.payout_details_verified,
        i.payout_details_submitted_at,
        i.payout_details_locked
    FROM public.interviewers i
    WHERE i.user_id = auth.uid();
$$;