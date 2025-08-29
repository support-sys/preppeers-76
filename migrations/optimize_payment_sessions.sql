-- Migration to optimize payment_sessions table
-- Replace large matched_interviewer JSON with specific, minimal columns
-- Run this in your Supabase SQL Editor

-- Step 1: Add new optimized columns
ALTER TABLE payment_sessions 
ADD COLUMN IF NOT EXISTS interviewer_id UUID,
ADD COLUMN IF NOT EXISTS selected_time_slot TEXT,
ADD COLUMN IF NOT EXISTS selected_date DATE,
ADD COLUMN IF NOT EXISTS plan_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS match_score INTEGER;

-- Step 2: Add foreign key constraint for interviewer_id
ALTER TABLE payment_sessions 
ADD CONSTRAINT fk_payment_sessions_interviewer_id 
FOREIGN KEY (interviewer_id) REFERENCES interviewers(id) ON DELETE SET NULL;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_interviewer_id ON payment_sessions(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_selected_date ON payment_sessions(selected_date);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_plan_duration ON payment_sessions(plan_duration);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN payment_sessions.interviewer_id IS 'ID of the matched interviewer for this session';
COMMENT ON COLUMN payment_sessions.selected_time_slot IS 'Time slot selected by candidate (e.g., "17:00-18:00")';
COMMENT ON COLUMN payment_sessions.selected_date IS 'Date selected by candidate for the interview';
COMMENT ON COLUMN payment_sessions.plan_duration IS 'Interview duration in minutes (30 for essential, 60 for professional/executive)';
COMMENT ON COLUMN payment_sessions.match_score IS 'Matching score for audit purposes';

-- Step 5: Migration function to extract data from existing matched_interviewer JSON
CREATE OR REPLACE FUNCTION migrate_matched_interviewer_data()
RETURNS void AS $$
DECLARE
    session_record RECORD;
    interviewer_data JSONB;
    time_slot_text TEXT;
    parsed_date DATE;
BEGIN
    -- Loop through all payment sessions with matched_interviewer data
    FOR session_record IN 
        SELECT id, matched_interviewer, candidate_data 
        FROM payment_sessions 
        WHERE matched_interviewer IS NOT NULL
    LOOP
        interviewer_data := session_record.matched_interviewer;
        
        -- Extract time slot from candidate data
        time_slot_text := session_record.candidate_data->>'timeSlot';
        
        -- Try to parse date from time slot
        BEGIN
            -- Handle ISO date format
            IF time_slot_text ~ '^\d{4}-\d{2}-\d{2}' THEN
                parsed_date := time_slot_text::DATE;
            -- Handle DD/MM/YYYY format
            ELSIF time_slot_text ~ '^\d{1,2}/\d{1,2}/\d{4}' THEN
                parsed_date := TO_DATE(time_slot_text, 'DD/MM/YYYY');
            ELSE
                -- Default to tomorrow if can't parse
                parsed_date := CURRENT_DATE + INTERVAL '1 day';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- Default to tomorrow if parsing fails
                parsed_date := CURRENT_DATE + INTERVAL '1 day';
        END;
        
        -- Update the new columns with extracted data
        UPDATE payment_sessions 
        SET 
            interviewer_id = (interviewer_data->>'id')::UUID,
            selected_time_slot = COALESCE(
                time_slot_text,
                '17:00-18:00'  -- Default time slot
            ),
            selected_date = parsed_date,
            plan_duration = COALESCE(
                (session_record.candidate_data->>'interviewDuration')::INTEGER,
                60  -- Default duration
            ),
            match_score = COALESCE(
                (interviewer_data->>'matchScore')::INTEGER,
                0
            )
        WHERE id = session_record.id;
        
        RAISE NOTICE 'Migrated session %: interviewer_id=%, selected_date=%, plan_duration=%', 
            session_record.id, 
            interviewer_data->>'id',
            parsed_date,
            session_record.candidate_data->>'interviewDuration';
    END LOOP;
    
    RAISE NOTICE 'Migration completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Step 6: Run the migration
SELECT migrate_matched_interviewer_data();

-- Step 7: Drop the migration function
DROP FUNCTION migrate_matched_interviewer_data();

-- Step 8: Verify migration results
SELECT 
    COUNT(*) as total_sessions,
    COUNT(interviewer_id) as sessions_with_interviewer_id,
    COUNT(selected_time_slot) as sessions_with_time_slot,
    COUNT(selected_date) as sessions_with_date,
    COUNT(plan_duration) as sessions_with_duration,
    COUNT(match_score) as sessions_with_score
FROM payment_sessions;

-- Step 9: Show sample of migrated data
SELECT 
    id,
    interviewer_id,
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
    i.company,
    ps.selected_date,
    ps.plan_duration
FROM payment_sessions ps
JOIN interviewers i ON ps.interviewer_id = i.id
WHERE ps.interviewer_id IS NOT NULL
LIMIT 5;
