-- Quick fix for payment_sessions and interviews test constraints
-- This script provides the minimum required fields for testing

-- Test 7: Test payment_sessions table with add-ons (Fixed)
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_payment_id UUID;
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00},
        {"addon_key": "meeting_recording", "quantity": 1, "price": 99.00, "total": 99.00}
    ]';
    addons_total DECIMAL(10,2) := 298.00;
    test_candidate_data JSONB := '{
        "fullName": "Test User",
        "email": "test@example.com",
        "targetRole": "Software Engineer",
        "experience": "2-3 years",
        "selectedPlan": "professional"
    }'::jsonb;
BEGIN
    -- Test inserting payment session with add-ons
    INSERT INTO public.payment_sessions (
        user_id,
        candidate_data,
        selected_plan,
        interview_duration,
        amount,
        payment_status,
        selected_add_ons,
        add_ons_total
    ) VALUES (
        test_user_id,
        test_candidate_data,
        'professional',
        60,
        799.00,
        'pending',
        test_addons,
        addons_total
    ) RETURNING id INTO test_payment_id;
    
    RAISE NOTICE 'SUCCESS: Payment session with add-ons created with ID: %', test_payment_id;
    
    -- Verify the data was stored correctly
    IF EXISTS (
        SELECT 1 FROM public.payment_sessions
        WHERE id = test_payment_id
        AND selected_add_ons = test_addons
        AND add_ons_total = addons_total
    ) THEN
        RAISE NOTICE 'SUCCESS: Payment session add-ons data verified';
    ELSE
        RAISE NOTICE 'ERROR: Payment session add-ons data verification failed';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.payment_sessions WHERE id = test_payment_id;
    RAISE NOTICE 'Test payment session cleaned up';
    
END $$;

-- Test 8: Test interviews table with add-ons (Fixed)
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_interview_id UUID;
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00}
    ]';
    addons_total DECIMAL(10,2) := 199.00;
    test_interviewer_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
    -- Test inserting interview with add-ons
    INSERT INTO public.interviews (
        user_id,
        interviewer_id,
        candidate_name,
        candidate_email,
        target_role,
        experience,
        scheduled_time,
        selected_plan,
        interview_duration,
        status,
        selected_add_ons,
        add_ons_total
    ) VALUES (
        test_user_id,
        test_interviewer_id,
        'Test User',
        'test@example.com',
        'Software Engineer',
        '2-3 years',
        NOW() + INTERVAL '1 day',
        'professional',
        60,
        'scheduled',
        test_addons,
        addons_total
    ) RETURNING id INTO test_interview_id;
    
    RAISE NOTICE 'SUCCESS: Interview with add-ons created with ID: %', test_interview_id;
    
    -- Verify the data was stored correctly
    IF EXISTS (
        SELECT 1 FROM public.interviews
        WHERE id = test_interview_id
        AND selected_add_ons = test_addons
        AND add_ons_total = addons_total
    ) THEN
        RAISE NOTICE 'SUCCESS: Interview add-ons data verified';
    ELSE
        RAISE NOTICE 'ERROR: Interview add-ons data verification failed';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.interviews WHERE id = test_interview_id;
    RAISE NOTICE 'Test interview cleaned up';
    
END $$;

RAISE NOTICE 'Payment sessions and interviews add-ons tests completed successfully!';

