
-- Add new columns to the interviewers table for enhanced schedule management
ALTER TABLE public.interviewers 
ADD COLUMN current_available_date DATE,
ADD COLUMN current_time_slots JSONB DEFAULT '{}',
ADD COLUMN schedule_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the schedule_last_updated column whenever the table is modified
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.schedule_last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the timestamp
CREATE TRIGGER update_interviewers_schedule_timestamp
    BEFORE UPDATE ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_timestamp();

-- Add index for better performance on date queries
CREATE INDEX idx_interviewers_current_available_date 
ON public.interviewers(current_available_date);
