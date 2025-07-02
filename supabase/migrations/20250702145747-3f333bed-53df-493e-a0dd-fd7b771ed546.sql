
-- Create interviews table to store scheduled interview sessions
CREATE TABLE public.interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  interviewer_id UUID NOT NULL,
  candidate_id TEXT NOT NULL, -- Can be user_id or email
  candidate_name TEXT NOT NULL,
  candidate_email TEXT NOT NULL,
  interviewer_email TEXT NOT NULL,
  target_role TEXT NOT NULL,
  experience TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  resume_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;

-- Policy for interviewers to see their interviews
CREATE POLICY "Interviewers can view their interviews" 
  ON public.interviews 
  FOR SELECT 
  USING (
    interviewer_id IN (
      SELECT id FROM public.interviewers WHERE user_id = auth.uid()
    )
  );

-- Policy for candidates to see their interviews (by email or user_id)
CREATE POLICY "Candidates can view their interviews" 
  ON public.interviews 
  FOR SELECT 
  USING (
    candidate_email = auth.email() OR 
    candidate_id = auth.uid()::text
  );

-- Policy for system to insert interviews
CREATE POLICY "System can insert interviews" 
  ON public.interviews 
  FOR INSERT 
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX idx_interviews_interviewer_id ON public.interviews(interviewer_id);
CREATE INDEX idx_interviews_candidate_email ON public.interviews(candidate_email);
CREATE INDEX idx_interviews_candidate_id ON public.interviews(candidate_id);
CREATE INDEX idx_interviews_scheduled_time ON public.interviews(scheduled_time);
