-- Fix the trigger function to handle INSERT vs UPDATE properly

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
  -- Only proceed if this is an UPDATE operation and iseligible changed from false to true
  IF TG_OP = 'UPDATE' AND OLD.iseligible = false AND NEW.iseligible = true THEN
    
    -- Get interviewer details
    SELECT * INTO interviewer_record FROM public.interviewers WHERE user_id = NEW.user_id;
    
    -- Get profile details
    SELECT * INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
    -- Only proceed if we found the records
    IF interviewer_record IS NOT NULL AND profile_record IS NOT NULL THEN
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
    
  END IF;
  
  -- Always return NEW for AFTER triggers
  RETURN NEW;
END;
$$;

-- Also ensure the interviewers table has the correct default value for iseligible
-- This will only add the column if it doesn't exist
DO $$ 
BEGIN
    -- Check if iseligible column exists and has the right default
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'interviewers' 
               AND column_name = 'iseligible' 
               AND table_schema = 'public') THEN
        -- Column exists, ensure it has the right default
        ALTER TABLE public.interviewers ALTER COLUMN iseligible SET DEFAULT false;
    ELSE
        -- Column doesn't exist, add it with default
        ALTER TABLE public.interviewers ADD COLUMN iseligible BOOLEAN DEFAULT false NOT NULL;
    END IF;
END $$;
