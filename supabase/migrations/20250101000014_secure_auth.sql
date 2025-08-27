-- Secure approach: Use database configuration for service role key
-- This way the key is not hardcoded in the migration

-- First, set up the configuration (run this manually with your actual key)
-- ALTER DATABASE postgres SET app.supabase_service_role_key = 'your_actual_service_role_key_here';

CREATE OR REPLACE FUNCTION public.handle_interviewer_eligibility_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
  debug_log TEXT;
  service_key TEXT;
BEGIN
  -- Get the service role key from database configuration
  service_key := current_setting('app.supabase_service_role_key', true);
  
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
        'user_id', NEW.user_id,
        'service_key_available', service_key IS NOT NULL AND length(service_key) > 10
      ),
      row_to_json(NEW),
      NEW.user_id,
      NOW()
    );
    
    -- Proceed if we have both name and email
    IF profile_record.full_name IS NOT NULL AND profile_record.email IS NOT NULL THEN
      
      -- Only proceed if we have a service key
      IF service_key IS NOT NULL AND length(service_key) > 10 THEN
        
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
            'name', profile_record.full_name,
            'has_valid_key', true
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
                'Authorization', 'Bearer ' || service_key
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
        -- Log missing service key
        INSERT INTO public.audit_log (
          table_name,
          operation,
          old_data,
          new_data,
          user_id,
          timestamp
        ) VALUES (
          'interviewers',
          'missing_service_key',
          jsonb_build_object('message', 'Service role key not configured'),
          row_to_json(NEW),
          NEW.user_id,
          NOW()
        );
      END IF;
      
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
