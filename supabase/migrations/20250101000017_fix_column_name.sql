-- Fix trigger to use correct column name: is_eligible instead of iseligible

CREATE OR REPLACE FUNCTION public.handle_interviewer_eligibility_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  debug_log TEXT;
  auth_header TEXT;
BEGIN
  -- Use the actual service role key (same as current working version)
  auth_header := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaG9lb2RvZnNiZ2Z4bmRob3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMDA2NCwiZXhwIjoyMDY2Njg2MDY0fQ.vtFfGFib_DDdoYgS-KJ6FjEIoM3zjjHzDKOQRZ6XA9U';
  
  -- Always log trigger execution (using correct column name)
  debug_log := format('Trigger fired: TG_OP=%s, NEW.is_eligible=%s', TG_OP, NEW.is_eligible);
  
  IF TG_OP = 'UPDATE' THEN
    debug_log := debug_log || format(', OLD.is_eligible=%s', OLD.is_eligible);
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
  
  -- Only proceed if this is an UPDATE operation and is_eligible changed from false to true
  IF TG_OP = 'UPDATE' AND OLD.is_eligible = false AND NEW.is_eligible = true THEN
    
    -- Get profile details
    SELECT full_name, email INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
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
        'profile_name', COALESCE(profile_record.full_name, 'NULL'),
        'profile_email', COALESCE(profile_record.email, 'NULL'),
        'user_id', NEW.user_id
      ),
      row_to_json(NEW),
      NEW.user_id,
      NOW()
    );
    
    -- Proceed if we have both name and email
    IF profile_record.full_name IS NOT NULL AND profile_record.email IS NOT NULL THEN
      
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
          'email', profile_record.email,
          'name', profile_record.full_name
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
              'Authorization', auth_header
            ),
            body := jsonb_build_object(
              'type', 'eligibility',
              'interviewer_name', profile_record.full_name,
              'interviewer_email', profile_record.email
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
        jsonb_build_object(
          'email_sent_to', profile_record.email,
          'name', profile_record.full_name
        ),
        row_to_json(NEW),
        NEW.user_id,
        NOW()
      );
      
    ELSE
      -- Log that profile data is missing
      INSERT INTO public.audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        timestamp
      ) VALUES (
        'interviewers',
        'profile_data_missing',
        jsonb_build_object(
          'user_id', NEW.user_id,
          'has_name', profile_record.full_name IS NOT NULL,
          'has_email', profile_record.email IS NOT NULL
        ),
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
