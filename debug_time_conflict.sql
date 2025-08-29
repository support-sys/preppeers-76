-- Debug script to check time slot conflicts
-- Run this in Supabase SQL Editor to see what's blocking the interviewer

-- 1. Check interviewer_time_blocks for the specific date and time
SELECT 
    id,
    interviewer_id,
    blocked_date,
    start_time,
    end_time,
    block_reason,
    interview_id,
    created_at
FROM interviewer_time_blocks 
WHERE interviewer_id = '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28'
AND blocked_date = '2025-09-02'
ORDER BY start_time;

-- 2. Check scheduled interviews for the same time
SELECT 
    id,
    interviewer_id,
    candidate_email,
    scheduled_time,
    status,
    created_at
FROM interviews 
WHERE interviewer_id = '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28'
AND scheduled_time::date = '2025-09-02'
ORDER BY scheduled_time;

-- 3. Check the specific time slot (17:30-18:00)
SELECT 
    '17:30-18:00' as requested_slot,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM interviewer_time_blocks 
            WHERE interviewer_id = '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28'
            AND blocked_date = '2025-09-02'
            AND (
                (start_time <= '17:30:00' AND end_time > '17:30:00') OR
                (start_time < '18:00:00' AND end_time >= '18:00:00') OR
                (start_time >= '17:30:00' AND end_time <= '18:00:00')
            )
        ) THEN '❌ CONFLICT DETECTED'
        ELSE '✅ SLOT AVAILABLE'
    END as availability_status;

-- 4. Show all time blocks for this interviewer on that date
SELECT 
    'Current blocks on 2025-09-02:' as info,
    start_time || ' - ' || end_time as time_range,
    block_reason,
    CASE 
        WHEN interview_id IS NOT NULL THEN 'Interview scheduled'
        ELSE 'Manual block'
    END as block_type
FROM interviewer_time_blocks 
WHERE interviewer_id = '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28'
AND blocked_date = '2025-09-02'
ORDER BY start_time;
