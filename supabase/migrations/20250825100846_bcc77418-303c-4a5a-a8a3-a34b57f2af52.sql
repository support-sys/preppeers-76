-- Create a test table to track trigger executions
CREATE TABLE IF NOT EXISTS public.trigger_test_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trigger_name text,
    user_id uuid,
    old_eligible boolean,
    new_eligible boolean,
    created_at timestamp with time zone DEFAULT now()
);

-- Create a trigger function that writes to our test table
CREATE OR REPLACE FUNCTION public.trigger_logger()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Replace the trigger
DROP TRIGGER IF EXISTS simple_eligibility_test ON public.interviewers;

CREATE TRIGGER track_eligibility_change
    AFTER UPDATE OF is_eligible ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_logger();