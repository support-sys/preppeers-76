-- Fix RLS policies for interviewers table to allow public read access
-- First, let's see what policies exist
DO $$
DECLARE
    policy_count integer;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'interviewers';
    
    RAISE NOTICE 'Current policies on interviewers table: %', policy_count;
END $$;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to eligible interviewers" ON public.interviewers;
DROP POLICY IF EXISTS "Allow authenticated users to read interviewers" ON public.interviewers;
DROP POLICY IF EXISTS "Allow public read access" ON public.interviewers;

-- Create a policy that allows public read access to eligible interviewers
CREATE POLICY "Allow public read access to eligible interviewers" 
ON public.interviewers 
FOR SELECT 
TO public 
USING (is_eligible = true);

-- Also allow authenticated users to read all interviewers (for admin purposes)
CREATE POLICY "Allow authenticated users to read all interviewers" 
ON public.interviewers 
FOR SELECT 
TO authenticated 
USING (true);

-- Grant necessary permissions
GRANT SELECT ON public.interviewers TO public;
GRANT SELECT ON public.interviewers TO authenticated;
GRANT SELECT ON public.interviewers TO anon;

