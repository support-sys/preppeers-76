-- Migration to complete payment_sessions table optimization
-- Add missing interviewer_user_id column and prepare for matched_interviewer removal
-- Run this in your Supabase SQL Editor

-- Step 1: Add missing interviewer_user_id column
ALTER TABLE payment_sessions 
ADD COLUMN IF NOT EXISTS interviewer_user_id UUID;

-- Step 2: Add foreign key constraint for interviewer_user_id
ALTER TABLE payment_sessions 
ADD CONSTRAINT fk_payment_sessions_interviewer_user_id 
FOREIGN KEY (interviewer_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 3: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_interviewer_user_id ON payment_sessions(interviewer_user_id);

-- Step 4: Add comment for documentation
COMMENT ON COLUMN payment_sessions.interviewer_user_id IS 'User ID of the matched interviewer for profile lookup during scheduling';

-- Step 5: Migration function to extract interviewer_user_id from existing matched_interviewer JSON
CREATE OR REPLACE FUNCTION migrate_interviewer_user_id()
RETURNS void AS $$
DECLARE
    session_record RECORD;
    interviewer_data JSONB;
BEGIN
    -- Loop through all payment sessions with matched_interviewer data
    FOR session_record IN 
        SELECT id, matched_interviewer 
        FROM payment_sessions 
        WHERE matched_interviewer IS NOT NULL 
        AND interviewer_user_id IS NULL
    LOOP
        interviewer_data := session_record.matched_interviewer;
        
        -- Extract interviewer_user_id from the JSON
        UPDATE payment_sessions 
        SET interviewer_user_id = (interviewer_data->>'user_id')::UUID
        WHERE id = session_record.id;
        
        RAISE NOTICE 'Migrated session %: interviewer_user_id=%', 
            session_record.id, 
            interviewer_data->>'user_id';
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Run the migration
SELECT migrate_interviewer_user_id();

-- Step 7: Drop the migration function
DROP FUNCTION migrate_interviewer_user_id();

-- Step 8: Verify migration results
SELECT 
    COUNT(*) as total_sessions,
    COUNT(interviewer_id) as sessions_with_interviewer_id,
    COUNT(interviewer_user_id) as sessions_with_interviewer_user_id,
    COUNT(selected_time_slot) as sessions_with_time_slot,
    COUNT(selected_date) as sessions_with_date,
    COUNT(plan_duration) as sessions_with_duration,
    COUNT(match_score) as sessions_with_score
FROM payment_sessions;

-- Step 9: Show sample of migrated data
SELECT 
    id,
    interviewer_id,
    interviewer_user_id,
    selected_time_slot,
    selected_date,
    plan_duration,
    match_score,
    created_at
FROM payment_sessions 
WHERE interviewer_id IS NOT NULL 
LIMIT 5;

-- Step 10: Verify foreign key relationships
SELECT 
    ps.id, 
    ps.interviewer_id, 
    ps.interviewer_user_id,
    i.company,
    ps.selected_date,
    ps.plan_duration
FROM payment_sessions ps
JOIN interviewers i ON ps.interviewer_id = i.id
WHERE ps.interviewer_id IS NOT NULL
LIMIT 5;
