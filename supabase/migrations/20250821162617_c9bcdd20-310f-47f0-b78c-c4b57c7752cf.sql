-- Add feedback_submitted column to interviews table
ALTER TABLE public.interviews 
ADD COLUMN feedback_submitted boolean NOT NULL DEFAULT false;