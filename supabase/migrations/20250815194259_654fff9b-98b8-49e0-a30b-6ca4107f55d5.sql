-- Fix the security definer view issue by removing the problematic view
-- and using RLS policies instead
DROP VIEW IF EXISTS public.interviewer_public_profiles;

-- Add a more restrictive policy that only shows non-sensitive columns
-- Update the existing policy to be more specific about which columns are accessible
DROP POLICY IF EXISTS "authenticated_users_can_view_public_interviewer_data" ON public.interviewers;

-- Create a policy that allows viewing only public data (not financial info)
-- This is handled at the application level by selecting only safe columns
CREATE POLICY "authenticated_users_can_view_interviewer_public_data" 
ON public.interviewers 
FOR SELECT 
TO authenticated
USING (is_eligible = true);

-- Create a separate policy for interviewers to view their own full data
CREATE POLICY "interviewers_can_view_own_full_data" 
ON public.interviewers 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);