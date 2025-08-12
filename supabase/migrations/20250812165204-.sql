-- Create table for managing interviewer time blocks
CREATE TABLE public.interviewer_time_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    interviewer_id UUID NOT NULL,
    blocked_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    block_reason TEXT NOT NULL DEFAULT 'interview_scheduled',
    interview_id UUID NULLABLE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Ensure no overlapping blocks for same interviewer on same date
    CONSTRAINT no_overlapping_blocks EXCLUDE USING gist (
        interviewer_id WITH =,
        blocked_date WITH =,
        tsrange(start_time::text::time, end_time::text::time) WITH &&
    )
);

-- Add foreign key reference to interviewers table
ALTER TABLE public.interviewer_time_blocks 
ADD CONSTRAINT fk_interviewer_time_blocks_interviewer_id 
FOREIGN KEY (interviewer_id) REFERENCES public.interviewers(id) ON DELETE CASCADE;

-- Add foreign key reference to interviews table (optional, for tracking)
ALTER TABLE public.interviewer_time_blocks 
ADD CONSTRAINT fk_interviewer_time_blocks_interview_id 
FOREIGN KEY (interview_id) REFERENCES public.interviews(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.interviewer_time_blocks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Interviewers can view their own time blocks" 
ON public.interviewer_time_blocks 
FOR SELECT 
USING (interviewer_id IN (
    SELECT id FROM interviewers WHERE user_id = auth.uid()
));

CREATE POLICY "Interviewers can manage their own time blocks" 
ON public.interviewer_time_blocks 
FOR ALL 
USING (interviewer_id IN (
    SELECT id FROM interviewers WHERE user_id = auth.uid()
));

CREATE POLICY "System can create time blocks for interviews" 
ON public.interviewer_time_blocks 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_interviewer_time_blocks_interviewer_date 
ON public.interviewer_time_blocks(interviewer_id, blocked_date);

CREATE INDEX idx_interviewer_time_blocks_interview_id 
ON public.interviewer_time_blocks(interview_id) WHERE interview_id IS NOT NULL;

-- Create trigger for updating timestamps
CREATE TRIGGER update_interviewer_time_blocks_updated_at
    BEFORE UPDATE ON public.interviewer_time_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();