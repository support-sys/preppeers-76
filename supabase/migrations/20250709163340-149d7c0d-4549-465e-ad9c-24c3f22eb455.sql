-- Add interviewer_name column to interviews table
ALTER TABLE public.interviews 
ADD COLUMN interviewer_name TEXT;