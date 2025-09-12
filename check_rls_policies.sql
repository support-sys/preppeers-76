-- Check RLS policies on interviewer_time_blocks table
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

-- Check if RLS is enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'interviewer_time_blocks';

-- Test query to see if we can access the data
SELECT 
    interviewer_id,
    blocked_date,
    start_time,
    end_time,
    is_temporary,
    expires_at
FROM interviewer_time_blocks 
WHERE interviewer_id = 'f44fe488-b7bb-42d8-bc39-a34a073482cd'
ORDER BY blocked_date, start_time;

