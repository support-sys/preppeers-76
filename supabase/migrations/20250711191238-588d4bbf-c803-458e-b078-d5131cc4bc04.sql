-- Add current_position field to interviewees table to store candidate's current designation
ALTER TABLE public.interviewees 
ADD COLUMN current_position text;