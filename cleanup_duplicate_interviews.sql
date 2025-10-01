-- Cleanup script to remove duplicate interviews created due to race condition
-- This script will keep the first interview and remove duplicates

-- First, let's see the duplicate interviews
SELECT 
    id,
    interviewer_id,
    candidate_email,
    scheduled_time,
    created_at,
    status
FROM interviews 
WHERE candidate_email = 'nnolb@tiffincrane.com'
    AND interviewer_id = '7e0c0053-cd94-40a7-a6b6-e7f687c19455'
    AND scheduled_time = '2025-10-06T09:30:00+00:00'
ORDER BY created_at;

-- Remove the duplicate interview (keeping the first one created)
-- The first interview has ID: c7419305-f45b-4a6d-a9b8-696bf0607edd (created at 15:34:08)
-- The duplicate has ID: 88d3c133-39c9-4259-b6f4-094b5fdf98de (created at 15:34:09)

DELETE FROM interviews 
WHERE id = '88d3c133-39c9-4259-b6f4-094b5fdf98de';

-- Verify cleanup
SELECT 
    id,
    interviewer_id,
    candidate_email,
    scheduled_time,
    created_at,
    status
FROM interviews 
WHERE candidate_email = 'nnolb@tiffincrane.com'
    AND interviewer_id = '7e0c0053-cd94-40a7-a6b6-e7f687c19455'
    AND scheduled_time = '2025-10-06T09:30:00+00:00'
ORDER BY created_at;

-- Also clean up any duplicate temporary reservations that might exist
-- (This is optional, but helps keep the database clean)
SELECT * FROM interviewer_time_blocks 
WHERE interviewer_id = '7e0c0053-cd94-40a7-a6b6-e7f687c19455'
    AND blocked_date = '2025-10-06'
    AND start_time = '09:30:00'
    AND block_reason = 'interview_scheduled';

-- If there are duplicate time blocks, keep only one
-- (This query shows duplicates if any exist)
SELECT 
    interviewer_id,
    blocked_date,
    start_time,
    block_reason,
    COUNT(*) as count
FROM interviewer_time_blocks 
WHERE interviewer_id = '7e0c0053-cd94-40a7-a6b6-e7f687c19455'
    AND blocked_date = '2025-10-06'
    AND start_time = '09:30:00'
    AND block_reason = 'interview_scheduled'
GROUP BY interviewer_id, blocked_date, start_time, block_reason
HAVING COUNT(*) > 1;
