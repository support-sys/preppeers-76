-- Create a function to send eligibility notification email
CREATE OR REPLACE FUNCTION public.notify_interviewer_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    interviewer_data RECORD;
    profile_data RECORD;
BEGIN
    -- Only proceed if is_eligible changed from false to true
    IF OLD.is_eligible = false AND NEW.is_eligible = true THEN
        -- Get interviewer details
        SELECT * INTO interviewer_data FROM public.interviewers WHERE id = NEW.id;
        
        -- Get profile details
        SELECT * INTO profile_data FROM public.profiles WHERE id = interviewer_data.user_id;
        
        -- Call the edge function to send eligibility email
        PERFORM net.http_post(
            url := 'https://jhhoeodofsbgfxndhotq.supabase.co/functions/v1/send-interviewer-welcome',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || current_setting('app.service_role_key', true)
            ),
            body := jsonb_build_object(
                'type', 'eligibility',
                'interviewer_name', profile_data.full_name,
                'interviewer_email', profile_data.email
            )
        );
        
        RAISE LOG 'Eligibility notification sent for interviewer: %', profile_data.email;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to fire when is_eligible is updated
CREATE TRIGGER trigger_interviewer_eligibility_notification
    AFTER UPDATE OF is_eligible ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_interviewer_eligibility();