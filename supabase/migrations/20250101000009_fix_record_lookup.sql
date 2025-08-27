-- Fix the record lookup issue in the trigger function

CREATE OR REPLACE FUNCTION public.handle_interviewer_eligibility_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  interviewer_record RECORD;
  profile_record RECORD;
  debug_log TEXT;
  interviewer_found BOOLEAN := false;
  profile_found BOOLEAN := false;
BEGIN
  -- Always log trigger execution
  debug_log := format('Trigger fired: TG_OP=%s, NEW.iseligible=%s', TG_OP, NEW.iseligible);
  
  IF TG_OP = 'UPDATE' THEN
    debug_log := debug_log || format(', OLD.iseligible=%s', OLD.iseligible);
  END IF;
  
  -- Log to audit table for debugging
  INSERT INTO public.audit_log (
    table_name,
    operation,
    old_data,
    new_data,
    user_id,
    timestamp
  ) VALUES (
    'interviewers',
    'trigger_debug',
    jsonb_build_object('debug', debug_log),
    row_to_json(NEW),
    NEW.user_id,
    NOW()
  );
  
  -- Only proceed if this is an UPDATE operation and iseligible changed from false to true
  IF TG_OP = 'UPDATE' AND OLD.iseligible = false AND NEW.iseligible = true THEN
    
    -- Get profile details first
    SELECT * INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    IF FOUND THEN
      profile_found := true;
    END IF;
    
    -- Get interviewer details - use the NEW record directly since we're in the trigger
    interviewer_record := NEW;
    interviewer_found := true;
    
    -- Log what we found
    INSERT INTO public.audit_log (
      table_name,
      operation,
      old_data,
      new_data,
      user_id,
      timestamp
    ) VALUES (
      'interviewers',
      'eligibility_check',
      jsonb_build_object(
        'interviewer_found', interviewer_found,
        'profile_found', profile_found,
        'profile_name', COALESCE(profile_record.full_name, 'NULL'),
        'profile_email', COALESCE(profile_record.email, 'NULL'),
        'user_id', NEW.user_id
      ),
      row_to_json(NEW),
      NEW.user_id,
      NOW()
    );
    
    -- Only proceed if we found the profile record (interviewer is NEW record)
    IF profile_found AND profile_record IS NOT NULL THEN
      
      -- Log before attempting HTTP call
      INSERT INTO public.audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        timestamp
      ) VALUES (
        'interviewers',
        'before_http_call',
        jsonb_build_object(
          'target_url', 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/send-interviewer-welcome',
          'email', profile_record.email,
          'name', profile_record.full_name,
          'company', NEW.company,
          'position', NEW.position,
          'experience_years', NEW.experience_years
        ),
        row_to_json(NEW),
        NEW.user_id,
        NOW()
      );
      
      -- Try to call the edge function
      BEGIN
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
              'experience_years', NEW.experience_years,
              'company', NEW.company,
              'position', NEW.position
            )
          );
        
        -- Log successful HTTP call
        INSERT INTO public.audit_log (
          table_name,
          operation,
          old_data,
          new_data,
          user_id,
          timestamp
        ) VALUES (
          'interviewers',
          'http_call_success',
          jsonb_build_object('email_sent_to', profile_record.email),
          row_to_json(NEW),
          NEW.user_id,
          NOW()
        );
        
      EXCEPTION WHEN OTHERS THEN
        -- Log HTTP call failure
        INSERT INTO public.audit_log (
          table_name,
          operation,
          old_data,
          new_data,
          user_id,
          timestamp
        ) VALUES (
          'interviewers',
          'http_call_failed',
          jsonb_build_object(
            'error_message', SQLERRM,
            'error_state', SQLSTATE
          ),
          row_to_json(NEW),
          NEW.user_id,
          NOW()
        );
      END;
      
      -- Log the eligibility change (final success)
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
    ELSE
      -- Log that profile was not found
      INSERT INTO public.audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        timestamp
      ) VALUES (
        'interviewers',
        'profile_not_found',
        jsonb_build_object('user_id', NEW.user_id),
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
