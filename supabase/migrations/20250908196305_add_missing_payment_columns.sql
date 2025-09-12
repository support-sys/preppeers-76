-- Add missing columns to payment_sessions table
ALTER TABLE public.payment_sessions 
ADD COLUMN IF NOT EXISTS match_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS matched_interviewer JSONB,
ADD COLUMN IF NOT EXISTS selected_time_slot TEXT,
ADD COLUMN IF NOT EXISTS selected_date DATE,
ADD COLUMN IF NOT EXISTS plan_duration INTEGER DEFAULT 60;

-- Add comments to the new columns
COMMENT ON COLUMN public.payment_sessions.match_score IS 'Matching score between candidate and interviewer';
COMMENT ON COLUMN public.payment_sessions.matched_interviewer IS 'Matched interviewer data as JSON';
COMMENT ON COLUMN public.payment_sessions.selected_time_slot IS 'Selected time slot for the interview';
COMMENT ON COLUMN public.payment_sessions.selected_date IS 'Selected date for the interview';
COMMENT ON COLUMN public.payment_sessions.plan_duration IS 'Duration of the interview plan in minutes';
