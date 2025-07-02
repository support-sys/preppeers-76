
-- Add experience and notice period fields to the interviewees table
ALTER TABLE public.interviewees 
ADD COLUMN experience TEXT,
ADD COLUMN notice_period TEXT CHECK (notice_period IN ('less_than_30_days', 'less_than_90_days', 'not_on_notice'));
