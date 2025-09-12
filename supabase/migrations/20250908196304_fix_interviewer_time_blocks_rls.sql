-- Fix RLS policies for interviewer_time_blocks table
-- This table stores temporary reservations and blocked time slots

-- First, check current RLS status
DO $$
DECLARE
    rls_enabled boolean;
    policy_count integer;
BEGIN
    SELECT rowsecurity INTO rls_enabled 
    FROM pg_tables 
    WHERE tablename = 'interviewer_time_blocks';
    
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'interviewer_time_blocks';
    
    RAISE NOTICE 'RLS enabled on interviewer_time_blocks: %', rls_enabled;
    RAISE NOTICE 'Current policies count: %', policy_count;
END $$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to interviewer_time_blocks" ON public.interviewer_time_blocks;
DROP POLICY IF EXISTS "Allow authenticated users to read interviewer_time_blocks" ON public.interviewer_time_blocks;
DROP POLICY IF EXISTS "Allow users to read their own reservations" ON public.interviewer_time_blocks;

-- Create new RLS policies
-- Allow public read access for checking availability
CREATE POLICY "Allow public read access to interviewer_time_blocks" 
ON public.interviewer_time_blocks 
FOR SELECT 
TO public 
USING (true);

-- Allow authenticated users to read all blocked slots
CREATE POLICY "Allow authenticated users to read interviewer_time_blocks" 
ON public.interviewer_time_blocks 
FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to insert their own temporary reservations
CREATE POLICY "Allow users to insert their own reservations" 
ON public.interviewer_time_blocks 
FOR INSERT 
TO authenticated 
WITH CHECK (reserved_by_user_id = auth.uid());

-- Allow users to update their own temporary reservations
CREATE POLICY "Allow users to update their own reservations" 
ON public.interviewer_time_blocks 
FOR UPDATE 
TO authenticated 
USING (reserved_by_user_id = auth.uid())
WITH CHECK (reserved_by_user_id = auth.uid());

-- Allow users to delete their own temporary reservations
CREATE POLICY "Allow users to delete their own reservations" 
ON public.interviewer_time_blocks 
FOR DELETE 
TO authenticated 
USING (reserved_by_user_id = auth.uid());

-- Grant necessary permissions
GRANT SELECT ON public.interviewer_time_blocks TO public;
GRANT SELECT ON public.interviewer_time_blocks TO authenticated;
GRANT SELECT ON public.interviewer_time_blocks TO anon;
GRANT INSERT, UPDATE, DELETE ON public.interviewer_time_blocks TO authenticated;

-- Test the fix
DO $$
DECLARE
    test_count integer;
BEGIN
    SELECT COUNT(*) INTO test_count 
    FROM interviewer_time_blocks 
    WHERE interviewer_id = 'f44fe488-b7bb-42d8-bc39-a34a073482cd';
    
    RAISE NOTICE 'Test query result - blocked slots count: %', test_count;
END $$;

