-- Make existing interviewers eligible for the showcase
UPDATE public.interviewers 
SET is_eligible = true 
WHERE is_eligible = false;

-- Also ensure we have some sample data for testing
-- First, let's check if we have any interviewers at all
DO $$
DECLARE
    interviewer_count integer;
BEGIN
    SELECT COUNT(*) INTO interviewer_count FROM public.interviewers;
    
    IF interviewer_count = 0 THEN
        -- First create a sample user if none exist
        IF NOT EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
            INSERT INTO auth.users (
                id,
                email,
                encrypted_password,
                email_confirmed_at,
                created_at,
                updated_at,
                raw_app_meta_data,
                raw_user_meta_data,
                is_super_admin,
                role,
                aud,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                gen_random_uuid(),
                'sample-interviewer@example.com',
                crypt('password123', gen_salt('bf')),
                NOW(),
                NOW(),
                NOW(),
                '{"provider": "email", "providers": ["email"]}',
                '{"full_name": "Sample Interviewer"}',
                false,
                'authenticated',
                'authenticated',
                '',
                '',
                '',
                ''
            );
        END IF;
        
        -- Insert a sample interviewer
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

