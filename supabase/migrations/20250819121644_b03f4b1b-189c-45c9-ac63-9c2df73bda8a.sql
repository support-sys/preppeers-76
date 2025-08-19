-- Add specific_skills column to interviews table to store the detailed skills selected by candidates
ALTER TABLE public.interviews ADD COLUMN specific_skills text[] DEFAULT '{}';

-- Create index for better performance when querying by skills
CREATE INDEX idx_interviews_specific_skills ON public.interviews USING GIN(specific_skills);