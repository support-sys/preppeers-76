-- Add isEligible column to interviewers table
ALTER TABLE public.interviewers 
ADD COLUMN is_eligible boolean NOT NULL DEFAULT false;