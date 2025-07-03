
-- Add Google Meet and email tracking columns to interviews table
ALTER TABLE public.interviews 
ADD COLUMN google_meet_link TEXT,
ADD COLUMN google_calendar_event_id TEXT,
ADD COLUMN email_confirmation_sent BOOLEAN DEFAULT FALSE,
ADD COLUMN reminder_emails_sent JSONB DEFAULT '[]'::jsonb;
