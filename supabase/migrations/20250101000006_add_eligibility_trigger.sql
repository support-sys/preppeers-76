-- Migration to add trigger for sending eligibility email when interviewer becomes eligible

-- First, let's create a function that will be called by the trigger
CREATE OR REPLACE FUNCTION public.handle_interviewer_eligibility_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  interviewer_record RECORD;
  profile_record RECORD;
BEGIN
  -- Only proceed if iseligible changed from false to true
  IF OLD.iseligible = false AND NEW.iseligible = true THEN
    
    -- Get interviewer details
    SELECT * INTO interviewer_record FROM public.interviewers WHERE user_id = NEW.user_id;
    
    -- Get profile details
    SELECT * INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
    -- Call the edge function to send eligibility email using pg_net extension
    -- This will use the same Resend setup as the existing welcome email
    PERFORM
      net.http_post(
        url := 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/send-interviewer-welcome',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := jsonb_build_object(
          'type', 'eligibility',
          'interviewer_name', profile_record.full_name,
          'interviewer_email', profile_record.email,
          'experience_years', interviewer_record.experience_years,
          'company', interviewer_record.company,
          'position', interviewer_record.position
        )
      );
    
    -- Log the eligibility change
    INSERT INTO public.audit_log (
      table_name,
      operation,
      old_data,
      new_data,
      user_id,
      timestamp
    ) VALUES (
      'interviewers',
      'eligibility_granted',
      row_to_json(OLD),
      row_to_json(NEW),
      NEW.user_id,
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS interviewer_eligibility_trigger ON public.interviewers;

CREATE TRIGGER interviewer_eligibility_trigger
  AFTER UPDATE ON public.interviewers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_interviewer_eligibility_change();

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for audit_log (only admins can read)
CREATE POLICY "Admin can read audit logs" ON public.audit_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Create RLS policy for system inserts
CREATE POLICY "System can insert audit logs" ON public.audit_log
  FOR INSERT
  WITH CHECK (true);

-- Enable the pg_net extension if not already enabled (for HTTP requests)
-- Note: This might need to be done manually in Supabase dashboard
-- You can also run: CREATE EXTENSION IF NOT EXISTS pg_net;
-- But this might require superuser privileges
