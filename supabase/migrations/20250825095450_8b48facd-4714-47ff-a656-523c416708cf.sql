-- Create a simplified test function with better error handling and logging
CREATE OR REPLACE FUNCTION public.test_notification_function()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop the old trigger and create a new one with the test function
DROP TRIGGER IF EXISTS notify_eligibility_change ON public.interviewers;

CREATE TRIGGER test_eligibility_change
    AFTER UPDATE OF is_eligible ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION public.test_notification_function();