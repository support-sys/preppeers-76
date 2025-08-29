-- Test script to check current payment_sessions table setup
-- Run this in your Supabase SQL Editor to verify current state

-- 1. Check current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_sessions' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if new optimized columns exist
SELECT 
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' 
        AND column_name = 'interviewer_user_id'
    ) THEN '✅ interviewer_user_id column EXISTS' 
    ELSE '❌ interviewer_user_id column MISSING' 
    END as column_status;

-- 3. Check sample data from existing payment sessions
SELECT 
    id,
    user_id,
    amount,
    payment_status,
    created_at,
    -- Check if matched_interviewer has data
    CASE 
        WHEN matched_interviewer IS NOT NULL THEN 'Has JSON data'
        ELSE 'No JSON data'
    END as matched_interviewer_status,
    -- Check if optimized columns have data
    interviewer_id,
    selected_time_slot,
    selected_date,
    plan_duration,
    match_score
FROM payment_sessions 
ORDER BY created_at DESC 
LIMIT 5;

-- 4. Check data consistency
SELECT 
    COUNT(*) as total_sessions,
    COUNT(matched_interviewer) as sessions_with_json,
    COUNT(interviewer_id) as sessions_with_interviewer_id,
    COUNT(selected_time_slot) as sessions_with_time_slot,
    COUNT(selected_date) as sessions_with_date,
    COUNT(plan_duration) as sessions_with_duration,
    COUNT(match_score) as sessions_with_score
FROM payment_sessions;

-- 5. Check for any existing interviewer_user_id data
SELECT 
    COUNT(*) as total_sessions,
    COUNT(interviewer_user_id) as sessions_with_user_id
FROM payment_sessions;
