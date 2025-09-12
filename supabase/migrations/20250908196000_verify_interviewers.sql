-- Check and fix interviewer data
DO $$
DECLARE
    interviewer_count integer;
    eligible_count integer;
BEGIN
    -- Count total interviewers
    SELECT COUNT(*) INTO interviewer_count FROM public.interviewers;
    RAISE NOTICE 'Total interviewers: %', interviewer_count;
    
    -- Count eligible interviewers
    SELECT COUNT(*) INTO eligible_count FROM public.interviewers WHERE is_eligible = true;
    RAISE NOTICE 'Eligible interviewers: %', eligible_count;
    
    -- If no interviewers exist, create a sample one
    IF interviewer_count = 0 THEN
        -- First, create a sample user if none exist
        INSERT INTO auth.users (
            id,
            instance_id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            'sample-interviewer@example.com',
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '',
            '',
            '',
            ''
        ) ON CONFLICT (email) DO NOTHING;
        
        -- Get the user ID
        DECLARE
            sample_user_id uuid;
        BEGIN
            SELECT id INTO sample_user_id FROM auth.users WHERE email = 'sample-interviewer@example.com';
            
            -- Create profile for the user
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                role,
                created_at,
                updated_at
            ) VALUES (
                sample_user_id,
                'sample-interviewer@example.com',
                'Sample Interviewer',
                'interviewer',
                NOW(),
                NOW()
            ) ON CONFLICT (id) DO NOTHING;
            
            -- Create interviewer record
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
                is_eligible,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                sample_user_id,
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
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Created sample interviewer with user_id: %', sample_user_id;
        END;
    ELSE
        -- Make all existing interviewers eligible
        UPDATE public.interviewers 
        SET is_eligible = true 
        WHERE is_eligible = false;
        
        RAISE NOTICE 'Made all existing interviewers eligible';
    END IF;
END $$;

