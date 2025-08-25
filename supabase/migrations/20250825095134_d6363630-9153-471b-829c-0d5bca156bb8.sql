-- First, enable the http extension which is needed for net.http_post
CREATE EXTENSION IF NOT EXISTS http;

-- Recreate the trigger to ensure it's properly attached
DROP TRIGGER IF EXISTS notify_eligibility_change ON public.interviewers;

CREATE TRIGGER notify_eligibility_change
    AFTER UPDATE OF is_eligible ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_interviewer_eligibility();