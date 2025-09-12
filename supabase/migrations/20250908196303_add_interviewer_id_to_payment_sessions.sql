-- Add interviewer_id column to payment_sessions table
ALTER TABLE public.payment_sessions 
ADD COLUMN IF NOT EXISTS interviewer_id UUID REFERENCES public.interviewers(id);

-- Add a comment to the column
COMMENT ON COLUMN public.payment_sessions.interviewer_id IS 'ID of the interviewer for this payment session';

-- Update existing payment sessions to have a default interviewer if needed
-- (This is optional - only if you want to backfill existing data)
-- UPDATE public.payment_sessions 
-- SET interviewer_id = (SELECT id FROM public.interviewers WHERE is_eligible = true LIMIT 1)
-- WHERE interviewer_id IS NULL;

