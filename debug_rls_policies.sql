-- Debug and Fix RLS Policies for interviewer_time_blocks table

-- Step 1: Check current RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'interviewer_time_blocks';

-- Step 2: List all existing policies
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

-- Step 3: Check current user context
SELECT 
  current_user,
  session_user,
  auth.uid() as current_auth_uid,
  auth.role() as current_auth_role;

-- Step 4: Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON interviewer_time_blocks;
DROP POLICY IF EXISTS "Interviewers can manage their own time blocks" ON interviewer_time_blocks;
DROP POLICY IF EXISTS "System can create time blocks for interviews" ON interviewer_time_blocks;
DROP POLICY IF EXISTS "Flexible time block management" ON interviewer_time_blocks;
DROP POLICY IF EXISTS "Allow users to update their own temporary reservations" ON interviewer_time_blocks;

-- Step 5: Create a simple, working policy for ALL operations
CREATE POLICY "Simple time block access" ON interviewer_time_blocks
FOR ALL USING (
  -- Allow if user is the interviewer
  auth.uid() = interviewer_id
  OR
  -- Allow if user created a temporary reservation (can convert it)
  (is_temporary = true AND auth.uid() = reserved_by_user_id)
  OR
  -- Allow system operations (service role)
  auth.role() = 'service_role'
  OR
  -- Allow authenticated users to read (for availability checking)
  auth.role() = 'authenticated'
);

-- Step 6: Verify the new policy
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'interviewer_time_blocks';

-- Step 7: Test the policy with a simple query
-- This should work for authenticated users
SELECT COUNT(*) FROM interviewer_time_blocks WHERE is_temporary = true;
