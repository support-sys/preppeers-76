-- Fix RLS Policy for interviewer_time_blocks table
-- This allows both interviewers and users who made temporary reservations to update records

-- First, drop the existing restrictive policy
DROP POLICY IF EXISTS "Interviewers can manage their own time blocks" ON interviewer_time_blocks;

-- Create a new, more flexible policy that allows:
-- 1. Interviewers to manage their own time blocks
-- 2. Users to update temporary reservations they created
-- 3. System operations (like converting temporary to permanent)
CREATE POLICY "Flexible time block management" ON interviewer_time_blocks
FOR ALL USING (
  -- Allow if user is the interviewer
  auth.uid() = interviewer_id
  OR
  -- Allow if user created a temporary reservation (can convert it)
  (is_temporary = true AND auth.uid() = reserved_by_user_id)
  OR
  -- Allow system operations (service role)
  auth.role() = 'service_role'
);

-- Also add a policy specifically for UPDATE operations
CREATE POLICY "Allow users to update their own temporary reservations" ON interviewer_time_blocks
FOR UPDATE USING (
  -- Allow if user created a temporary reservation (can convert it)
  (is_temporary = true AND auth.uid() = reserved_by_user_id)
  OR
  -- Allow if user is the interviewer
  auth.uid() = interviewer_id
  OR
  -- Allow system operations (service role)
  auth.role() = 'service_role'
);

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'interviewer_time_blocks';

-- Test the policy by checking current user context
SELECT 
  current_user,
  session_user,
  auth.uid() as current_auth_uid,
  auth.role() as current_auth_role;
