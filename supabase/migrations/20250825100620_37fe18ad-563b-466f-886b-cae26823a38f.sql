-- Check current log settings and create a function that uses NOTICE instead of LOG
SHOW log_min_messages;

-- Create a test function that uses NOTICE which should definitely show up
CREATE OR REPLACE FUNCTION public.simple_trigger_test()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'SIMPLE_TEST: Trigger executed for user_id: %', NEW.user_id;
    RAISE NOTICE 'SIMPLE_TEST: is_eligible changed from % to %', OLD.is_eligible, NEW.is_eligible;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the trigger with our simple test
DROP TRIGGER IF EXISTS test_eligibility_change ON public.interviewers;

CREATE TRIGGER simple_eligibility_test
    AFTER UPDATE ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION public.simple_trigger_test();