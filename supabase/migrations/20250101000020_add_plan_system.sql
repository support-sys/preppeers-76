-- Migration: Add Plan System Support
-- Date: 2025-01-01
-- Description: Add plan-related columns and support for 3-plan system

-- 1. Add plan columns to interviews table
ALTER TABLE interviews 
ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS interview_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS plan_details JSONB;

-- 2. Add plan columns to payment_sessions table
ALTER TABLE payment_sessions 
ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS interview_duration INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS plan_details JSONB;

-- 3. Add comments for documentation
COMMENT ON COLUMN interviews.selected_plan IS 'Selected plan: essential, professional, executive';
COMMENT ON COLUMN interviews.interview_duration IS 'Interview duration in minutes based on selected plan';
COMMENT ON COLUMN interviews.plan_details IS 'JSON object containing plan features, price, and other details';

COMMENT ON COLUMN payment_sessions.selected_plan IS 'Selected plan: essential, professional, executive';
COMMENT ON COLUMN payment_sessions.interview_duration IS 'Interview duration in minutes based on selected plan';
COMMENT ON COLUMN payment_sessions.plan_details IS 'JSON object containing plan features, price, and other details';

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviews_selected_plan ON interviews(selected_plan);
CREATE INDEX IF NOT EXISTS idx_interviews_duration ON interviews(interview_duration);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_plan ON payment_sessions(selected_plan);

-- 5. Update existing records to have default values
UPDATE interviews 
SET interview_duration = 60, selected_plan = 'professional' 
WHERE interview_duration IS NULL OR selected_plan IS NULL;

UPDATE payment_sessions 
SET interview_duration = 60, selected_plan = 'professional' 
WHERE interview_duration IS NULL OR selected_plan IS NULL;

-- 6. Add constraints to ensure valid plan values
ALTER TABLE interviews 
ADD CONSTRAINT check_valid_plan 
CHECK (selected_plan IN ('essential', 'professional', 'executive'));

ALTER TABLE payment_sessions 
ADD CONSTRAINT check_valid_plan_payment 
CHECK (selected_plan IN ('essential', 'professional', 'executive'));

-- 7. Add constraint for duration based on plan
ALTER TABLE interviews 
ADD CONSTRAINT check_duration_plan_match 
CHECK (
  (selected_plan = 'essential' AND interview_duration = 30) OR
  (selected_plan IN ('professional', 'executive') AND interview_duration = 60)
);

ALTER TABLE payment_sessions 
ADD CONSTRAINT check_duration_plan_match_payment 
CHECK (
  (selected_plan = 'essential' AND interview_duration = 30) OR
  (selected_plan IN ('professional', 'executive') AND interview_duration = 60)
);
