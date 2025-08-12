-- Remove the overly permissive policy that exposes all interviewer personal data
DROP POLICY IF EXISTS "interviewers_select_all" ON public.interviewers;

-- Create a more secure policy that only allows authenticated users to see interviewer information
-- This replaces the previous "true" policy that allowed public access
CREATE POLICY "authenticated_users_can_view_interviewers" 
ON public.interviewers 
FOR SELECT 
TO authenticated 
USING (true);