-- Create table for managing interviewer time blocks
CREATE TABLE public.interviewer_time_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    interviewer_id UUID NOT NULL,
    blocked_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    block_reason TEXT NOT NULL DEFAULT 'interview_scheduled',
    interview_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
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

-- Create function to check for overlapping time blocks
CREATE OR REPLACE FUNCTION check_time_block_overlap()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for overlapping time blocks for the same interviewer on same date
    IF EXISTS (
        SELECT 1 FROM public.interviewer_time_blocks 
        WHERE interviewer_id = NEW.interviewer_id 
        AND blocked_date = NEW.blocked_date
        AND id != COALESCE(NEW.id, gen_random_uuid())
        AND (
            (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Time block overlaps with existing block for this interviewer on this date';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent overlapping blocks
CREATE TRIGGER prevent_overlapping_time_blocks
    BEFORE INSERT OR UPDATE ON public.interviewer_time_blocks
    FOR EACH ROW EXECUTE FUNCTION check_time_block_overlap();