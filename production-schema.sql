

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."user_role" AS ENUM (
    'interviewee',
    'interviewer'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_interview_status"("interview_id" "uuid", "new_status" "text", "admin_notes" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if user is admin with manage_interviews permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admins a ON p.id = a.user_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND ('manage_interviews' = ANY(a.permissions) OR a.is_super_admin = TRUE)
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin manage_interviews permission required';
  END IF;
  
  -- Update interview status
  UPDATE public.interviews 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = interview_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."admin_update_interview_status"("interview_id" "uuid", "new_status" "text", "admin_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_time_block_overlap"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check for overlapping time blocks for the same interviewer on same date
    IF EXISTS (
        SELECT 1 FROM public.interviewer_time_blocks 
        WHERE interviewer_id = NEW.interviewer_id 
        AND blocked_date = NEW.blocked_date
        AND id != COALESCE(NEW.id, gen_random_uuid())
        AND (
            (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
        )
    ) THEN
        RAISE EXCEPTION 'Time block overlaps with existing block for this interviewer on this date';
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_time_block_overlap"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_expired_temporary_blocks"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Check if the table and column exist before trying to delete
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'interviewer_time_blocks' 
        AND column_name = 'temporary'
    ) THEN
        DELETE FROM interviewer_time_blocks
        WHERE temporary = true
        AND created_at < NOW() - INTERVAL '15 minutes';
        
        RAISE NOTICE 'Cleaned up expired temporary reservations';
    ELSE
        RAISE NOTICE 'interviewer_time_blocks table or temporary column does not exist - skipping cleanup';
    END IF;
END;
$$;


ALTER FUNCTION "public"."cleanup_expired_temporary_blocks"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_temporary_reservation"("p_interviewer_id" "uuid", "p_blocked_date" "date", "p_start_time" time without time zone, "p_end_time" time without time zone, "p_reserved_by_user_id" "uuid", "p_duration_minutes" integer) RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_reservation_id uuid;
    v_expires_at timestamptz;
BEGIN
    -- Generate a new UUID for the reservation
    v_reservation_id := gen_random_uuid();
    
    -- Calculate expiration time (e.g., 15 minutes from now)
    v_expires_at := NOW() + INTERVAL '15 minutes';
    
    -- Insert the temporary reservation
    INSERT INTO public.interviewer_time_blocks (
        id,
        interviewer_id,
        blocked_date,
        start_time,
        end_time,
        block_reason,
        is_temporary,
        expires_at,
        reserved_by_user_id,
        created_at
    ) VALUES (
        v_reservation_id,
        p_interviewer_id,
        p_blocked_date,
        p_start_time,
        p_end_time,
        'temporary_reservation',
        true,
        v_expires_at,
        p_reserved_by_user_id,
        NOW()
    );
    
    RETURN v_reservation_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create temporary reservation: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_temporary_reservation"("p_interviewer_id" "uuid", "p_blocked_date" "date", "p_start_time" time without time zone, "p_end_time" time without time zone, "p_reserved_by_user_id" "uuid", "p_duration_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrypt_financial_data"("encrypted_data" "text", "encryption_key" "text" DEFAULT 'default_financial_key_2024'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    decoded_text text;
    key_prefix text;
    key_suffix text;
    data_part text;
BEGIN
    IF encrypted_data IS NULL OR encrypted_data = '' THEN
        RETURN NULL;
    END IF;
    
    -- Decode the base64 data
    decoded_text := convert_from(decode(encrypted_data, 'base64'), 'UTF8');
    
    -- Extract the expected format: key::data::key
    key_prefix := encryption_key || '::';
    key_suffix := '::' || encryption_key;
    
    -- Verify the format and extract data
    IF decoded_text LIKE key_prefix || '%' || key_suffix THEN
        data_part := substring(decoded_text from length(key_prefix) + 1);
        data_part := substring(data_part from 1 for length(data_part) - length(key_suffix));
        RETURN data_part;
    ELSE
        -- If it doesn't match the expected format, return the original data (for migration compatibility)
        RETURN decoded_text;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If decryption fails, return NULL
        RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."decrypt_financial_data"("encrypted_data" "text", "encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."encrypt_financial_data"("data_text" "text", "encryption_key" "text" DEFAULT 'default_financial_key_2024'::"text") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF data_text IS NULL OR data_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Simple obfuscation using encode and reverse
    -- This provides basic protection while being compatible with all Postgres installations
    RETURN encode(
        (encryption_key || '::' || data_text || '::' || encryption_key)::bytea,
        'base64'
    );
END;
$$;


ALTER FUNCTION "public"."encrypt_financial_data"("data_text" "text", "encryption_key" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_stats"() RETURNS TABLE("total_users" bigint, "total_interviews" bigint, "today_interviews" bigint, "active_users_week" bigint, "completed_interviews" bigint, "pending_interviews" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if user is admin by checking profiles table first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role IN ('interviewer', 'interviewee')) as total_users,
    (SELECT COUNT(*) FROM public.interviews) as total_interviews,
    (SELECT COUNT(*) FROM public.interviews WHERE DATE(scheduled_time) = CURRENT_DATE) as today_interviews,
    (SELECT COUNT(DISTINCT id) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(*) FROM public.interviews WHERE status = 'completed') as completed_interviews,
    (SELECT COUNT(*) FROM public.interviews WHERE status = 'scheduled') as pending_interviews;
END;
$$;


ALTER FUNCTION "public"."get_admin_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_interviews_admin"() RETURNS TABLE("interview_id" "uuid", "candidate_name" "text", "candidate_email" "text", "interviewer_name" "text", "interviewer_email" "text", "scheduled_time" timestamp with time zone, "status" "text", "created_at" timestamp with time zone, "target_role" "text", "experience" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Check if user is admin by checking profiles table first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    i.id,
    i.candidate_name,
    i.candidate_email,
    i.interviewer_name,
    i.interviewer_email,
    i.scheduled_time,
    i.status,
    i.created_at,
    i.target_role,
    i.experience
  FROM public.interviews i
  ORDER BY i.scheduled_time DESC;
END;
$$;


ALTER FUNCTION "public"."get_all_interviews_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_payout_details"() RETURNS TABLE("payout_method" "text", "upi_id" "text", "bank_name" "text", "bank_account_number" "text", "bank_ifsc_code" "text", "account_holder_name" "text", "payout_details_verified" boolean, "payout_details_submitted_at" timestamp with time zone, "payout_details_locked" boolean)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT 
        f.payout_method,
        f.upi_id,
        f.bank_name,
        f.bank_account_number,
        f.bank_ifsc_code,
        f.account_holder_name,
        f.payout_details_verified,
        f.payout_details_submitted_at,
        f.payout_details_locked
    FROM public.interviewer_financial_data f
    JOIN public.interviewers i ON f.interviewer_id = i.id
    WHERE i.user_id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_payout_details"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_safe_interviewer_data"() RETURNS TABLE("id" "uuid", "user_id" "uuid", "experience_years" integer, "time_slots" "jsonb", "current_available_date" "date", "current_time_slots" "jsonb", "schedule_last_updated" timestamp with time zone, "is_eligible" boolean, "bio" "text", "linkedin_url" "text", "github_url" "text", "company" "text", "job_position" "text", "skills" "text"[], "technologies" "text"[], "availability_days" "text"[], "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT 
        i.id,
        i.user_id,
        i.experience_years,
        i.time_slots,
        i.current_available_date,
        i.current_time_slots,
        i.schedule_last_updated,
        i.is_eligible,
        i.bio,
        i.linkedin_url,
        i.github_url,
        i.company,
        i."position" as job_position,
        i.skills,
        i.technologies,
        i.availability_days,
        i.created_at,
        i.updated_at
    FROM public.interviewers i
    WHERE i.is_eligible = true;
$$;


ALTER FUNCTION "public"."get_safe_interviewer_data"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_email_confirmation"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Only process if email was just confirmed
    IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
        RAISE NOTICE 'Email confirmed for user: %, creating profile if missing', NEW.email;
        
        -- Check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
            -- Create profile
            INSERT INTO public.profiles (id, email, full_name, role)
            VALUES (
                NEW.id,
                NEW.email,
                COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
                CASE
                    WHEN NEW.raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::public.user_role
                    ELSE 'interviewee'::public.user_role
                END
            );
            RAISE NOTICE 'Profile created for user: % after email confirmation', NEW.email;
        ELSE
            RAISE NOTICE 'Profile already exists for user: %', NEW.email;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_email_confirmation"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_interviewer_eligibility_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."handle_interviewer_eligibility_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Add detailed logging
    RAISE NOTICE 'handle_new_user triggered for user: %', NEW.id;
    RAISE NOTICE 'User email: %', NEW.email;
    RAISE NOTICE 'User metadata: %', NEW.raw_user_meta_data;
    
    BEGIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'User'),
            CASE
                WHEN NEW.raw_user_meta_data->>'role' = 'interviewer' THEN 'interviewer'::public.user_role
                ELSE 'interviewee'::public.user_role
            END
        );
        
        RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
            -- Don't re-raise, allow user signup to complete even if profile creation fails
    END;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_time_slot_available"("p_interviewer_id" "uuid", "p_scheduled_time" timestamp with time zone, "p_duration_minutes" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_blocked_date date;
    v_start_time time;
    v_end_time time;
    v_conflict_count integer;
BEGIN
    -- Extract date and time components
    v_blocked_date := p_scheduled_time::date;
    v_start_time := p_scheduled_time::time;
    v_end_time := (p_scheduled_time + INTERVAL '1 minute' * p_duration_minutes)::time;
    
    -- Check for conflicts in interviewer_time_blocks
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.interviewer_time_blocks
    WHERE interviewer_id = p_interviewer_id
    AND blocked_date = v_blocked_date
    AND (
        (start_time < v_end_time AND end_time > v_start_time)
        OR (start_time = v_start_time AND end_time = v_end_time)
    );
    
    -- Return true if no conflicts found
    RETURN v_conflict_count = 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to check time slot availability: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."is_time_slot_available"("p_interviewer_id" "uuid", "p_scheduled_time" timestamp with time zone, "p_duration_minutes" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_interviewer_eligibility"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    interviewer_data RECORD;
    profile_data RECORD;
    response_status INTEGER;
BEGIN
    -- Only proceed if is_eligible changed from false to true
    IF OLD.is_eligible = false AND NEW.is_eligible = true THEN
        -- Get interviewer details
        SELECT * INTO interviewer_data FROM public.interviewers WHERE id = NEW.id;
        
        -- Get profile details  
        SELECT * INTO profile_data FROM public.profiles WHERE id = interviewer_data.user_id;
        
        -- Call the edge function to send eligibility email
        -- Using the service role key from secrets for authentication
        SELECT status INTO response_status FROM net.http_post(
            url := 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/send-interviewer-welcome',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaG9lb2RvZnNiZ2Z4bmRob3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMDA2NCwiZXhwIjoyMDY2Njg2MDY0fQ.hh5QkJ1RgvMG3JM4KGHfhbZbmhEvjQs7VgU8SjAp5eY'
            ),
            body := jsonb_build_object(
                'type', 'eligibility',
                'interviewer_name', profile_data.full_name,
                'interviewer_email', profile_data.email
            )
        );
        
        IF response_status = 200 THEN
            RAISE LOG 'Eligibility notification sent successfully for interviewer: %', profile_data.email;
        ELSE
            RAISE LOG 'Failed to send eligibility notification for interviewer: %, status: %', profile_data.email, response_status;
        END IF;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error sending eligibility notification: %', SQLERRM;
        RETURN NEW; -- Don't fail the update if email fails
END;
$$;


ALTER FUNCTION "public"."notify_interviewer_eligibility"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."release_temporary_reservation"("p_reservation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Delete the temporary reservation
    DELETE FROM public.interviewer_time_blocks
    WHERE id = p_reservation_id
    AND is_temporary = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Temporary reservation not found or already released';
    END IF;
END;
$$;


ALTER FUNCTION "public"."release_temporary_reservation"("p_reservation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."simple_trigger_test"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RAISE NOTICE 'SIMPLE_TEST: Trigger executed for user_id: %', NEW.user_id;
    RAISE NOTICE 'SIMPLE_TEST: is_eligible changed from % to %', OLD.is_eligible, NEW.is_eligible;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."simple_trigger_test"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_notification_function"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RAISE LOG 'TEST: Trigger fired for user_id: %', NEW.user_id;
    
    -- Only proceed if is_eligible changed from false to true
    IF OLD.is_eligible = false AND NEW.is_eligible = true THEN
        RAISE LOG 'TEST: Eligibility changed from false to true for user_id: %', NEW.user_id;
        
        -- Try to make a simple HTTP call
        BEGIN
            PERFORM net.http_post(
                url := 'https://httpbin.org/post',
                headers := jsonb_build_object('Content-Type', 'application/json'),
                body := jsonb_build_object('test', 'notification_working', 'user_id', NEW.user_id::text)
            );
            RAISE LOG 'TEST: HTTP call successful for user_id: %', NEW.user_id;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'TEST: HTTP call failed for user_id: %, error: %', NEW.user_id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."test_notification_function"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_logger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.trigger_test_log (trigger_name, user_id, old_eligible, new_eligible)
    VALUES ('eligibility_change', NEW.user_id, OLD.is_eligible, NEW.is_eligible);
    
    -- Also try to send the actual notification if eligible changed from false to true
    IF OLD.is_eligible = false AND NEW.is_eligible = true THEN
        -- Try to call the edge function
        BEGIN
            PERFORM net.http_post(
                url := 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/send-interviewer-welcome',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoaG9lb2RvZnNiZ2Z4bmRob3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMDA2NCwiZXhwIjoyMDY2Njg2MDY0fQ.hh5QkJ1RgvMG3JM4KGHfhbZbmhEvjQs7VgU8SjAp5eY'
                ),
                body := jsonb_build_object(
                    'type', 'eligibility',
                    'interviewer_name', (SELECT full_name FROM profiles WHERE id = NEW.user_id),
                    'interviewer_email', (SELECT email FROM profiles WHERE id = NEW.user_id)
                )
            );
            
            -- Log success
            INSERT INTO public.trigger_test_log (trigger_name, user_id, old_eligible, new_eligible)
            VALUES ('http_success', NEW.user_id, OLD.is_eligible, NEW.is_eligible);
        EXCEPTION
            WHEN OTHERS THEN
                -- Log the error
                INSERT INTO public.trigger_test_log (trigger_name, user_id, old_eligible, new_eligible)
                VALUES ('http_error: ' || SQLERRM, NEW.user_id, OLD.is_eligible, NEW.is_eligible);
        END;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_logger"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_my_payout_details"("p_payout_method" "text", "p_upi_id" "text" DEFAULT NULL::"text", "p_bank_name" "text" DEFAULT NULL::"text", "p_bank_account_number" "text" DEFAULT NULL::"text", "p_bank_ifsc_code" "text" DEFAULT NULL::"text", "p_account_holder_name" "text" DEFAULT NULL::"text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_interviewer_id uuid;
    v_financial_id uuid;
BEGIN
    SELECT id INTO v_interviewer_id 
    FROM public.interviewers 
    WHERE user_id = auth.uid();
    IF v_interviewer_id IS NULL THEN
        RAISE EXCEPTION 'Interviewer profile not found';
    END IF;

    SELECT id INTO v_financial_id
    FROM public.interviewer_financial_data
    WHERE interviewer_id = v_interviewer_id;

    IF v_financial_id IS NULL THEN
        INSERT INTO public.interviewer_financial_data (
            interviewer_id,
            payout_method,
            upi_id,
            bank_name,
            bank_account_number,
            bank_ifsc_code,
            account_holder_name,
            payout_details_submitted_at
        ) VALUES (
            v_interviewer_id,
            p_payout_method,
            p_upi_id,
            p_bank_name,
            p_bank_account_number,
            p_bank_ifsc_code,
            p_account_holder_name,
            now()
        );
    ELSE
        UPDATE public.interviewer_financial_data
        SET 
            payout_method = p_payout_method,
            upi_id = p_upi_id,
            bank_name = p_bank_name,
            bank_account_number = p_bank_account_number,
            bank_ifsc_code = p_bank_ifsc_code,
            account_holder_name = p_account_holder_name,
            updated_at = now(),
            payout_details_submitted_at = COALESCE(payout_details_submitted_at, now())
        WHERE id = v_financial_id;
    END IF;

    UPDATE public.interviewers
    SET 
        payout_details_submitted_at = now(),
        updated_at = now()
    WHERE id = v_interviewer_id;

    RETURN true;
END;
$$;


ALTER FUNCTION "public"."update_my_payout_details"("p_payout_method" "text", "p_upi_id" "text", "p_bank_name" "text", "p_bank_account_number" "text", "p_bank_ifsc_code" "text", "p_account_holder_name" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_payment_session_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_payment_session_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_schedule_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.schedule_last_updated = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_schedule_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_temporary_to_permanent"("p_reservation_id" "uuid", "p_interview_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    -- Update the temporary reservation to permanent
    UPDATE public.interviewer_time_blocks
    SET 
        is_temporary = false,
        block_reason = 'interview_scheduled',
        interview_id = p_interview_id,
        expires_at = NULL,
        updated_at = NOW()
    WHERE id = p_reservation_id
    AND is_temporary = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Temporary reservation not found or already converted';
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_temporary_to_permanent"("p_reservation_id" "uuid", "p_interview_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "permissions" "text"[] DEFAULT ARRAY['view_users'::"text", 'manage_users'::"text", 'view_interviews'::"text", 'manage_interviews'::"text"],
    "is_super_admin" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."audit_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "table_name" "text" NOT NULL,
    "operation" "text" NOT NULL,
    "old_data" "jsonb",
    "new_data" "jsonb",
    "user_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviewees" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "target_role" "text",
    "bio" "text",
    "resume_url" "text",
    "linkedin_url" "text",
    "github_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "experience" "text",
    "notice_period" "text",
    "current_position" "text",
    CONSTRAINT "interviewees_notice_period_check" CHECK (("notice_period" = ANY (ARRAY['less_than_30_days'::"text", 'less_than_90_days'::"text", 'not_on_notice'::"text"])))
);


ALTER TABLE "public"."interviewees" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviewer_financial_data" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interviewer_id" "uuid" NOT NULL,
    "payout_method" "text",
    "upi_id" "text",
    "bank_name" "text",
    "bank_account_number" "text",
    "bank_ifsc_code" "text",
    "account_holder_name" "text",
    "payout_details_verified" boolean DEFAULT false,
    "payout_details_submitted_at" timestamp with time zone,
    "payout_details_locked" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "data_hash" "text"
);


ALTER TABLE "public"."interviewer_financial_data" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviewer_time_blocks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interviewer_id" "uuid" NOT NULL,
    "blocked_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "block_reason" "text" DEFAULT 'interview_scheduled'::"text" NOT NULL,
    "interview_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "is_temporary" boolean DEFAULT false,
    "expires_at" timestamp with time zone,
    "reserved_by_user_id" "uuid"
);


ALTER TABLE "public"."interviewer_time_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviewers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "experience_years" integer,
    "company" "text",
    "position" "text",
    "skills" "text"[] DEFAULT '{}'::"text"[],
    "technologies" "text"[] DEFAULT '{}'::"text"[],
    "availability_days" "text"[] DEFAULT '{}'::"text"[],
    "time_slots" "jsonb" DEFAULT '{}'::"jsonb",
    "bio" "text",
    "linkedin_url" "text",
    "github_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "current_available_date" "date",
    "current_time_slots" "jsonb" DEFAULT '{}'::"jsonb",
    "schedule_last_updated" timestamp with time zone DEFAULT "now"(),
    "payout_details_verified" boolean DEFAULT false,
    "payout_details_submitted_at" timestamp with time zone,
    "payout_details_locked" boolean DEFAULT false,
    "is_eligible" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."interviewers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."interviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "interviewer_id" "uuid" NOT NULL,
    "candidate_id" "text" NOT NULL,
    "candidate_name" "text" NOT NULL,
    "candidate_email" "text" NOT NULL,
    "interviewer_email" "text" NOT NULL,
    "target_role" "text" NOT NULL,
    "experience" "text",
    "scheduled_time" timestamp with time zone NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "resume_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "google_meet_link" "text",
    "google_calendar_event_id" "text",
    "email_confirmation_sent" boolean DEFAULT false,
    "reminder_emails_sent" "jsonb" DEFAULT '[]'::"jsonb",
    "interviewer_name" "text",
    "specific_skills" "text"[] DEFAULT '{}'::"text"[],
    "feedback_submitted" boolean DEFAULT false NOT NULL,
    "selected_plan" character varying(50),
    "interview_duration" integer DEFAULT 60,
    "plan_details" "jsonb",
    CONSTRAINT "check_duration_plan_match" CHECK ((((("selected_plan")::"text" = 'essential'::"text") AND ("interview_duration" = 30)) OR ((("selected_plan")::"text" = ANY (ARRAY[('professional'::character varying)::"text", ('executive'::character varying)::"text"])) AND ("interview_duration" = 60)))),
    CONSTRAINT "check_valid_plan" CHECK ((("selected_plan")::"text" = ANY (ARRAY[('essential'::character varying)::"text", ('professional'::character varying)::"text", ('executive'::character varying)::"text"])))
);


ALTER TABLE "public"."interviews" OWNER TO "postgres";


COMMENT ON COLUMN "public"."interviews"."google_meet_link" IS 'Google Meet link for the interview session';



COMMENT ON COLUMN "public"."interviews"."google_calendar_event_id" IS 'Google Calendar event ID for the interview';



COMMENT ON COLUMN "public"."interviews"."email_confirmation_sent" IS 'Whether confirmation emails have been sent';



COMMENT ON COLUMN "public"."interviews"."reminder_emails_sent" IS 'JSON array tracking reminder emails sent';



COMMENT ON COLUMN "public"."interviews"."interviewer_name" IS 'Name of the interviewer conducting the interview';



COMMENT ON COLUMN "public"."interviews"."specific_skills" IS 'Array of specific skills the candidate wants to practice';



COMMENT ON COLUMN "public"."interviews"."selected_plan" IS 'Selected plan: essential, professional, executive';



COMMENT ON COLUMN "public"."interviews"."interview_duration" IS 'Interview duration in minutes based on selected plan';



COMMENT ON COLUMN "public"."interviews"."plan_details" IS 'JSON object containing plan features, price, and other details';



CREATE TABLE IF NOT EXISTS "public"."payment_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "candidate_data" "jsonb" NOT NULL,
    "amount" numeric(10,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'INR'::character varying NOT NULL,
    "payment_status" character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    "cashfree_order_id" character varying(255),
    "cashfree_payment_id" character varying(255),
    "interview_matched" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "selected_plan" character varying(50),
    "interview_duration" integer DEFAULT 60,
    "plan_details" "jsonb",
    "matched_interviewer" "jsonb",
    "interviewer_id" "uuid",
    "match_score" numeric(5,2),
    "selected_time_slot" "text",
    "selected_date" "date",
    "plan_duration" integer DEFAULT 60,
    CONSTRAINT "check_duration_plan_match_payment" CHECK ((((("selected_plan")::"text" = 'essential'::"text") AND ("interview_duration" = 30)) OR ((("selected_plan")::"text" = ANY (ARRAY[('professional'::character varying)::"text", ('executive'::character varying)::"text"])) AND ("interview_duration" = 60)))),
    CONSTRAINT "check_valid_plan_payment" CHECK ((("selected_plan")::"text" = ANY (ARRAY[('essential'::character varying)::"text", ('professional'::character varying)::"text", ('executive'::character varying)::"text"])))
);

ALTER TABLE ONLY "public"."payment_sessions" REPLICA IDENTITY FULL;


ALTER TABLE "public"."payment_sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."payment_sessions"."selected_plan" IS 'Selected plan: essential, professional, executive';



COMMENT ON COLUMN "public"."payment_sessions"."interview_duration" IS 'Interview duration in minutes based on selected plan';



COMMENT ON COLUMN "public"."payment_sessions"."plan_details" IS 'JSON object containing plan features, price, and other details';



COMMENT ON COLUMN "public"."payment_sessions"."matched_interviewer" IS 'Matched interviewer data as JSON';



COMMENT ON COLUMN "public"."payment_sessions"."interviewer_id" IS 'ID of the interviewer for this payment session';



COMMENT ON COLUMN "public"."payment_sessions"."match_score" IS 'Matching score between candidate and interviewer';



COMMENT ON COLUMN "public"."payment_sessions"."selected_time_slot" IS 'Selected time slot for the interview';



COMMENT ON COLUMN "public"."payment_sessions"."selected_date" IS 'Selected date for the interview';



COMMENT ON COLUMN "public"."payment_sessions"."plan_duration" IS 'Duration of the interview plan in minutes';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "public"."user_role" DEFAULT 'interviewee'::"public"."user_role",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "avatar_url" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."avatar_url" IS 'URL of the user profile avatar image';



CREATE TABLE IF NOT EXISTS "public"."trigger_test_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "trigger_name" "text",
    "user_id" "uuid",
    "old_eligible" boolean,
    "new_eligible" boolean,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."trigger_test_log" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."audit_log"
    ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviewees"
    ADD CONSTRAINT "interviewees_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviewees"
    ADD CONSTRAINT "interviewees_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."interviewer_financial_data"
    ADD CONSTRAINT "interviewer_financial_data_interviewer_id_key" UNIQUE ("interviewer_id");



ALTER TABLE ONLY "public"."interviewer_financial_data"
    ADD CONSTRAINT "interviewer_financial_data_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviewer_time_blocks"
    ADD CONSTRAINT "interviewer_time_blocks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviewers"
    ADD CONSTRAINT "interviewers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interviewers"
    ADD CONSTRAINT "interviewers_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."interviews"
    ADD CONSTRAINT "interviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payment_sessions"
    ADD CONSTRAINT "payment_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."trigger_test_log"
    ADD CONSTRAINT "trigger_test_log_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_interviewer_time_blocks_interview_id" ON "public"."interviewer_time_blocks" USING "btree" ("interview_id") WHERE ("interview_id" IS NOT NULL);



CREATE INDEX "idx_interviewer_time_blocks_interviewer_date" ON "public"."interviewer_time_blocks" USING "btree" ("interviewer_id", "blocked_date");



CREATE INDEX "idx_interviewer_time_blocks_reserved_by_user" ON "public"."interviewer_time_blocks" USING "btree" ("reserved_by_user_id") WHERE ("is_temporary" = true);



CREATE INDEX "idx_interviewer_time_blocks_temporary" ON "public"."interviewer_time_blocks" USING "btree" ("is_temporary", "expires_at") WHERE ("is_temporary" = true);



CREATE INDEX "idx_interviewers_current_available_date" ON "public"."interviewers" USING "btree" ("current_available_date");



CREATE INDEX "idx_interviews_candidate_email" ON "public"."interviews" USING "btree" ("candidate_email");



CREATE INDEX "idx_interviews_candidate_id" ON "public"."interviews" USING "btree" ("candidate_id");



CREATE INDEX "idx_interviews_duration" ON "public"."interviews" USING "btree" ("interview_duration");



CREATE INDEX "idx_interviews_google_meet" ON "public"."interviews" USING "btree" ("google_meet_link");



CREATE INDEX "idx_interviews_interviewer_id" ON "public"."interviews" USING "btree" ("interviewer_id");



CREATE INDEX "idx_interviews_interviewer_name" ON "public"."interviews" USING "btree" ("interviewer_name");



CREATE INDEX "idx_interviews_scheduled_time" ON "public"."interviews" USING "btree" ("scheduled_time");



CREATE INDEX "idx_interviews_selected_plan" ON "public"."interviews" USING "btree" ("selected_plan");



CREATE INDEX "idx_interviews_specific_skills" ON "public"."interviews" USING "gin" ("specific_skills");



CREATE INDEX "idx_payment_sessions_matched_interviewer" ON "public"."payment_sessions" USING "gin" ("matched_interviewer");



CREATE INDEX "idx_payment_sessions_plan" ON "public"."payment_sessions" USING "btree" ("selected_plan");



CREATE INDEX "payment_sessions_cashfree_order_idx" ON "public"."payment_sessions" USING "btree" ("cashfree_order_id");



CREATE INDEX "payment_sessions_status_idx" ON "public"."payment_sessions" USING "btree" ("payment_status");



CREATE INDEX "payment_sessions_user_id_idx" ON "public"."payment_sessions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "interviewer_eligibility_trigger" AFTER UPDATE ON "public"."interviewers" FOR EACH ROW EXECUTE FUNCTION "public"."handle_interviewer_eligibility_change"();



CREATE OR REPLACE TRIGGER "payment_sessions_update_timestamp" BEFORE UPDATE ON "public"."payment_sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_payment_session_timestamp"();



CREATE OR REPLACE TRIGGER "prevent_overlapping_time_blocks" BEFORE INSERT OR UPDATE ON "public"."interviewer_time_blocks" FOR EACH ROW EXECUTE FUNCTION "public"."check_time_block_overlap"();



CREATE OR REPLACE TRIGGER "track_eligibility_change" AFTER UPDATE OF "is_eligible" ON "public"."interviewers" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_logger"();



CREATE OR REPLACE TRIGGER "trigger_interviewer_eligibility_notification" AFTER UPDATE OF "is_eligible" ON "public"."interviewers" FOR EACH ROW EXECUTE FUNCTION "public"."notify_interviewer_eligibility"();



CREATE OR REPLACE TRIGGER "update_interviewers_schedule_timestamp" BEFORE UPDATE ON "public"."interviewers" FOR EACH ROW EXECUTE FUNCTION "public"."update_schedule_timestamp"();



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviewer_time_blocks"
    ADD CONSTRAINT "fk_interviewer_time_blocks_interview_id" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviewer_time_blocks"
    ADD CONSTRAINT "fk_interviewer_time_blocks_interviewer_id" FOREIGN KEY ("interviewer_id") REFERENCES "public"."interviewers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviewer_time_blocks"
    ADD CONSTRAINT "fk_interviewer_time_blocks_reserved_by_user_id" FOREIGN KEY ("reserved_by_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviewees"
    ADD CONSTRAINT "interviewees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviewer_financial_data"
    ADD CONSTRAINT "interviewer_financial_data_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."interviewers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interviewers"
    ADD CONSTRAINT "interviewers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payment_sessions"
    ADD CONSTRAINT "payment_sessions_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "public"."interviewers"("id");



ALTER TABLE ONLY "public"."payment_sessions"
    ADD CONSTRAINT "payment_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to read all interviewers" ON "public"."interviewers" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read all profiles" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read interviewer_time_blocks" ON "public"."interviewer_time_blocks" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow interview owner to update" ON "public"."interviews" FOR UPDATE USING ((("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"()))) OR ("candidate_email" = "auth"."email"()))) WITH CHECK ((("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"()))) OR ("candidate_email" = "auth"."email"())));



CREATE POLICY "Allow public read access to eligible interviewers" ON "public"."interviewers" FOR SELECT USING (("is_eligible" = true));



CREATE POLICY "Allow public read access to interviewer_time_blocks" ON "public"."interviewer_time_blocks" FOR SELECT USING (true);



CREATE POLICY "Allow public read access to profiles" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "Allow users to delete their own reservations" ON "public"."interviewer_time_blocks" FOR DELETE TO "authenticated" USING (("reserved_by_user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to insert their own reservations" ON "public"."interviewer_time_blocks" FOR INSERT TO "authenticated" WITH CHECK (("reserved_by_user_id" = "auth"."uid"()));



CREATE POLICY "Allow users to update their own reservations" ON "public"."interviewer_time_blocks" FOR UPDATE TO "authenticated" USING (("reserved_by_user_id" = "auth"."uid"())) WITH CHECK (("reserved_by_user_id" = "auth"."uid"()));



CREATE POLICY "Candidates can view their interviews" ON "public"."interviews" FOR SELECT USING ((("candidate_email" = "auth"."email"()) OR ("candidate_id" = ("auth"."uid"())::"text")));



CREATE POLICY "Enable delete for own record" ON "public"."admins" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."admins" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable insert for authenticated users" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable insert for public during signup" ON "public"."profiles" FOR INSERT WITH CHECK (true);



CREATE POLICY "Enable read access for authenticated users" ON "public"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Enable read access for own record" ON "public"."admins" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Enable update for authenticated users" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Enable update for own record" ON "public"."admins" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Interviewers can manage their own time blocks" ON "public"."interviewer_time_blocks" USING (("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Interviewers can view their interviews" ON "public"."interviews" FOR SELECT USING (("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"()))));



CREATE POLICY "Interviewers can view their own time blocks" ON "public"."interviewer_time_blocks" FOR SELECT USING (("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"()))));



CREATE POLICY "System can create time blocks for interviews" ON "public"."interviewer_time_blocks" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert audit logs" ON "public"."audit_log" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert interviews" ON "public"."interviews" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create their own payment sessions" ON "public"."payment_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own payment sessions" ON "public"."payment_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own payment sessions" ON "public"."payment_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_delete_own_record" ON "public"."admins" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_insert_own_record" ON "public"."admins" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_select_own_record" ON "public"."admins" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "admin_update_own_record" ON "public"."admins" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."audit_log" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interviewees" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interviewees_manage_own" ON "public"."interviewees" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "interviewees_select_own" ON "public"."interviewees" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."interviewer_financial_data" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interviewer_financial_data_owner_only" ON "public"."interviewer_financial_data" TO "authenticated" USING (("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"())))) WITH CHECK (("interviewer_id" IN ( SELECT "interviewers"."id"
   FROM "public"."interviewers"
  WHERE ("interviewers"."user_id" = "auth"."uid"()))));



ALTER TABLE "public"."interviewer_time_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interviewers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interviewers_can_manage_own_data" ON "public"."interviewers" TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "interviewers_manage_own" ON "public"."interviewers" USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."interviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."payment_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."trigger_test_log" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_interview_status"("interview_id" "uuid", "new_status" "text", "admin_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_interview_status"("interview_id" "uuid", "new_status" "text", "admin_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_interview_status"("interview_id" "uuid", "new_status" "text", "admin_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_time_block_overlap"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_time_block_overlap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_time_block_overlap"() TO "service_role";



GRANT ALL ON FUNCTION "public"."cleanup_expired_temporary_blocks"() TO "anon";
GRANT ALL ON FUNCTION "public"."cleanup_expired_temporary_blocks"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."cleanup_expired_temporary_blocks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_temporary_reservation"("p_interviewer_id" "uuid", "p_blocked_date" "date", "p_start_time" time without time zone, "p_end_time" time without time zone, "p_reserved_by_user_id" "uuid", "p_duration_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."create_temporary_reservation"("p_interviewer_id" "uuid", "p_blocked_date" "date", "p_start_time" time without time zone, "p_end_time" time without time zone, "p_reserved_by_user_id" "uuid", "p_duration_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_temporary_reservation"("p_interviewer_id" "uuid", "p_blocked_date" "date", "p_start_time" time without time zone, "p_end_time" time without time zone, "p_reserved_by_user_id" "uuid", "p_duration_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."decrypt_financial_data"("encrypted_data" "text", "encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."decrypt_financial_data"("encrypted_data" "text", "encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrypt_financial_data"("encrypted_data" "text", "encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."encrypt_financial_data"("data_text" "text", "encryption_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."encrypt_financial_data"("data_text" "text", "encryption_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."encrypt_financial_data"("data_text" "text", "encryption_key" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_interviews_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_interviews_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_interviews_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_payout_details"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_payout_details"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_payout_details"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_safe_interviewer_data"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_safe_interviewer_data"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_safe_interviewer_data"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_email_confirmation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_email_confirmation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_email_confirmation"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_email_confirmation"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."handle_interviewer_eligibility_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_interviewer_eligibility_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_interviewer_eligibility_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."is_time_slot_available"("p_interviewer_id" "uuid", "p_scheduled_time" timestamp with time zone, "p_duration_minutes" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."is_time_slot_available"("p_interviewer_id" "uuid", "p_scheduled_time" timestamp with time zone, "p_duration_minutes" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_time_slot_available"("p_interviewer_id" "uuid", "p_scheduled_time" timestamp with time zone, "p_duration_minutes" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_interviewer_eligibility"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_interviewer_eligibility"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_interviewer_eligibility"() TO "service_role";



GRANT ALL ON FUNCTION "public"."release_temporary_reservation"("p_reservation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."release_temporary_reservation"("p_reservation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."release_temporary_reservation"("p_reservation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."simple_trigger_test"() TO "anon";
GRANT ALL ON FUNCTION "public"."simple_trigger_test"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."simple_trigger_test"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_notification_function"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_notification_function"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_notification_function"() TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_logger"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_logger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_logger"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_my_payout_details"("p_payout_method" "text", "p_upi_id" "text", "p_bank_name" "text", "p_bank_account_number" "text", "p_bank_ifsc_code" "text", "p_account_holder_name" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."update_my_payout_details"("p_payout_method" "text", "p_upi_id" "text", "p_bank_name" "text", "p_bank_account_number" "text", "p_bank_ifsc_code" "text", "p_account_holder_name" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_my_payout_details"("p_payout_method" "text", "p_upi_id" "text", "p_bank_name" "text", "p_bank_account_number" "text", "p_bank_ifsc_code" "text", "p_account_holder_name" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_payment_session_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_payment_session_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_payment_session_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_schedule_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_schedule_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_schedule_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_temporary_to_permanent"("p_reservation_id" "uuid", "p_interview_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_temporary_to_permanent"("p_reservation_id" "uuid", "p_interview_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_temporary_to_permanent"("p_reservation_id" "uuid", "p_interview_id" "uuid") TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."audit_log" TO "anon";
GRANT ALL ON TABLE "public"."audit_log" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_log" TO "service_role";



GRANT ALL ON TABLE "public"."interviewees" TO "anon";
GRANT ALL ON TABLE "public"."interviewees" TO "authenticated";
GRANT ALL ON TABLE "public"."interviewees" TO "service_role";



GRANT ALL ON TABLE "public"."interviewer_financial_data" TO "anon";
GRANT ALL ON TABLE "public"."interviewer_financial_data" TO "authenticated";
GRANT ALL ON TABLE "public"."interviewer_financial_data" TO "service_role";



GRANT ALL ON TABLE "public"."interviewer_time_blocks" TO "anon";
GRANT ALL ON TABLE "public"."interviewer_time_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."interviewer_time_blocks" TO "service_role";
GRANT SELECT ON TABLE "public"."interviewer_time_blocks" TO PUBLIC;



GRANT ALL ON TABLE "public"."interviewers" TO "anon";
GRANT ALL ON TABLE "public"."interviewers" TO "authenticated";
GRANT ALL ON TABLE "public"."interviewers" TO "service_role";
GRANT SELECT ON TABLE "public"."interviewers" TO PUBLIC;



GRANT ALL ON TABLE "public"."interviews" TO "anon";
GRANT ALL ON TABLE "public"."interviews" TO "authenticated";
GRANT ALL ON TABLE "public"."interviews" TO "service_role";



GRANT ALL ON TABLE "public"."payment_sessions" TO "anon";
GRANT ALL ON TABLE "public"."payment_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."payment_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT SELECT ON TABLE "public"."profiles" TO PUBLIC;



GRANT ALL ON TABLE "public"."trigger_test_log" TO "anon";
GRANT ALL ON TABLE "public"."trigger_test_log" TO "authenticated";
GRANT ALL ON TABLE "public"."trigger_test_log" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






RESET ALL;
