-- Add booking progress tracking columns to interviewees table
-- This tracks how far users get in the booking funnel before payment

ALTER TABLE public.interviewees 
ADD COLUMN IF NOT EXISTS selected_plan VARCHAR(50),
ADD COLUMN IF NOT EXISTS selected_time_slot TEXT,
ADD COLUMN IF NOT EXISTS matched_interviewer_id UUID REFERENCES public.interviewers(id),
ADD COLUMN IF NOT EXISTS matched_interviewer_name TEXT,
ADD COLUMN IF NOT EXISTS booking_progress VARCHAR(30) DEFAULT 'profile_complete',
ADD COLUMN IF NOT EXISTS form_data JSONB,
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS match_score DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS payment_session_id UUID REFERENCES public.payment_sessions(id);

-- Add comments to explain the columns
COMMENT ON COLUMN public.interviewees.selected_plan IS 'Plan selected before payment (essential, professional, executive)';
COMMENT ON COLUMN public.interviewees.selected_time_slot IS 'Time slot selected before payment';
COMMENT ON COLUMN public.interviewees.matched_interviewer_id IS 'Interviewer matched before payment';
COMMENT ON COLUMN public.interviewees.matched_interviewer_name IS 'Name of matched interviewer before payment';
COMMENT ON COLUMN public.interviewees.booking_progress IS 'Progress: profile_complete, plan_selected, time_selected, matched, payment_initiated';
COMMENT ON COLUMN public.interviewees.form_data IS 'Complete form data submitted by user for funnel analysis';
COMMENT ON COLUMN public.interviewees.last_activity_at IS 'Last activity timestamp for funnel analysis';
COMMENT ON COLUMN public.interviewees.match_score IS 'Matching score between candidate and interviewer';
COMMENT ON COLUMN public.interviewees.payment_session_id IS 'Reference to payment session if payment was initiated';

-- Add check constraint for booking_progress values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_booking_progress'
    ) THEN
        ALTER TABLE public.interviewees 
        ADD CONSTRAINT check_booking_progress 
        CHECK (booking_progress IN (
            'profile_complete',
            'plan_selected', 
            'time_selected',
            'matched',
            'payment_initiated',
            'completed'
        ));
    END IF;
END $$;

-- Add check constraint for selected_plan values
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_selected_plan'
    ) THEN
        ALTER TABLE public.interviewees 
        ADD CONSTRAINT check_selected_plan 
        CHECK (selected_plan IN ('essential', 'professional', 'executive') OR selected_plan IS NULL);
    END IF;
END $$;

-- Create index for funnel analysis queries
CREATE INDEX IF NOT EXISTS idx_interviewees_booking_progress ON public.interviewees(booking_progress);
CREATE INDEX IF NOT EXISTS idx_interviewees_last_activity ON public.interviewees(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_interviewees_selected_plan ON public.interviewees(selected_plan);
