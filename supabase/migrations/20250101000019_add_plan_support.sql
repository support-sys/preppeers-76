-- Add plan-related columns to interviews table
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(20) NOT NULL DEFAULT 'professional';
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS interview_duration INTEGER NOT NULL DEFAULT 60;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS plan_details JSONB;

-- Add plan-related columns to payment_sessions table
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(20);
ALTER TABLE payment_sessions ADD COLUMN IF NOT EXISTS plan_details JSONB;

-- Create index for plan-based queries
CREATE INDEX IF NOT EXISTS idx_interviews_selected_plan ON interviews(selected_plan);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_selected_plan ON payment_sessions(selected_plan);

-- Add comment to explain the plan system
COMMENT ON COLUMN interviews.selected_plan IS 'Interview plan: essential, professional, or executive';
COMMENT ON COLUMN interviews.interview_duration IS 'Interview duration in minutes based on selected plan';
COMMENT ON COLUMN interviews.plan_details IS 'JSON details of the selected plan including features and pricing';
COMMENT ON COLUMN payment_sessions.selected_plan IS 'Plan selected during payment: essential, professional, or executive';
COMMENT ON COLUMN payment_sessions.plan_details IS 'JSON details of the selected plan during payment';
