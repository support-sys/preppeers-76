-- Fix the notification function to use proper authorization and error handling
CREATE OR REPLACE FUNCTION public.notify_interviewer_eligibility()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;