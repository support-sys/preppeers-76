-- Make existing interviewers eligible for the showcase
UPDATE public.interviewers 
SET is_eligible = true 
WHERE is_eligible = false;

-- Also ensure we have some sample data for testing
-- First, let's check if we have any interviewers at all
DO $$
DECLARE
    interviewer_count integer;
    user_count integer;
BEGIN
    SELECT COUNT(*) INTO interviewer_count FROM public.interviewers;
    SELECT COUNT(*) INTO user_count FROM auth.users;
    
    -- Only create sample data if we have users and no interviewers
    IF interviewer_count = 0 AND user_count > 0 THEN
        -- Insert a sample interviewer if none exist
        INSERT INTO public.interviewers (
            id,
            user_id,
            experience_years,
            company,
            position,
            skills,
            technologies,
            availability_days,
            time_slots,
            bio,
            linkedin_url,
            github_url,
            is_eligible
        ) VALUES (
            gen_random_uuid(),
            (SELECT id FROM auth.users LIMIT 1),
            5,
            'Tech Corp',
            'Senior Software Engineer',
            ARRAY['DevOps Engineer'],
            ARRAY['Linux', 'Shell Scripting'],
            ARRAY['Monday', 'Tuesday'],
            '{"Monday": [{"id": "s11wsmb2s", "start": "09:00", "end": "10:00"}], "Tuesday": [{"id": "79yh0nmke", "start": "09:00", "end": "10:00"}]}'::jsonb,
            'Experienced DevOps engineer with 5 years of experience in Linux and shell scripting.',
            'https://linkedin.com/in/sample',
            'https://github.com/sample',
            true
        );
    END IF;
END $$;

