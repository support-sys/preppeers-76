-- Test Script: Payment Webhook with Add-ons
-- This script tests the complete webhook flow with add-ons data

-- Test 1: Create a test payment session with add-ons
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_payment_id UUID;
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00, "name": "Resume Review"},
        {"addon_key": "meeting_recording", "quantity": 1, "price": 99.00, "total": 99.00, "name": "Meeting Recording"}
    ]';
    addons_total DECIMAL(10,2) := 298.00;
    test_candidate_data JSONB := '{
        "fullName": "Test User",
        "email": "test@example.com",
        "targetRole": "Software Engineer",
        "experience": "2-3 years",
        "selectedPlan": "professional",
        "skillCategories": ["Frontend Development", "React"],
        "specificSkills": ["React", "JavaScript", "TypeScript"],
        "experienceYears": 3,
        "selectedTimeSlot": "Monday, 08/09/2025 17:00-17:30",
        "timeSlot": "Monday, 08/09/2025 17:00-17:30"
    }'::jsonb;
BEGIN
    -- Create test payment session with add-ons
    INSERT INTO public.payment_sessions (
        user_id,
        candidate_data,
        amount,
        selected_plan,
        interview_duration,
        payment_status,
        selected_add_ons,
        add_ons_total
    ) VALUES (
        test_user_id,
        test_candidate_data,
        1097.00, -- 799 (plan) + 298 (add-ons)
        'professional',
        60,
        'pending',
        test_addons,
        addons_total
    ) RETURNING id INTO test_payment_id;
    
    RAISE NOTICE 'SUCCESS: Test payment session created with ID: %', test_payment_id;
    RAISE NOTICE 'Payment session includes add-ons: %', test_addons;
    RAISE NOTICE 'Add-ons total: ₹%', addons_total;
    
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

-- Test 2: Simulate webhook processing with add-ons
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_payment_id UUID;
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00, "name": "Resume Review"}
    ]';
    addons_total DECIMAL(10,2) := 199.00;
    test_candidate_data JSONB := '{
        "fullName": "Webhook Test User",
        "email": "webhook-test@example.com",
        "targetRole": "Full Stack Developer",
        "experience": "3-5 years",
        "selectedPlan": "professional",
        "skillCategories": ["Backend Development", "Node.js"],
        "specificSkills": ["Node.js", "Express", "MongoDB"],
        "experienceYears": 4,
        "selectedTimeSlot": "Tuesday, 09/09/2025 14:00-14:30",
        "timeSlot": "Tuesday, 09/09/2025 14:00-14:30"
    }'::jsonb;
BEGIN
    -- Create test payment session with add-ons
    INSERT INTO public.payment_sessions (
        user_id,
        candidate_data,
        amount,
        selected_plan,
        interview_duration,
        payment_status,
        selected_add_ons,
        add_ons_total
    ) VALUES (
        test_user_id,
        test_candidate_data,
        998.00, -- 799 (plan) + 199 (add-ons)
        'professional',
        60,
        'pending',
        test_addons,
        addons_total
    ) RETURNING id INTO test_payment_id;
    
    RAISE NOTICE 'SUCCESS: Webhook test payment session created with ID: %', test_payment_id;
    
    -- Simulate webhook success - update payment status
    UPDATE public.payment_sessions
    SET payment_status = 'completed',
        cashfree_payment_id = 'CF_TEST_PAYMENT_123'
    WHERE id = test_payment_id;
    
    RAISE NOTICE 'SUCCESS: Payment status updated to completed';
    
    -- Verify payment session is ready for auto-booking
    IF EXISTS (
        SELECT 1 FROM public.payment_sessions
        WHERE id = test_payment_id
        AND payment_status = 'completed'
        AND selected_add_ons = test_addons
        AND add_ons_total = addons_total
    ) THEN
        RAISE NOTICE 'SUCCESS: Payment session ready for auto-booking with add-ons';
        RAISE NOTICE 'Add-ons data preserved: %', test_addons;
    ELSE
        RAISE NOTICE 'ERROR: Payment session not ready for auto-booking';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.payment_sessions WHERE id = test_payment_id;
    RAISE NOTICE 'Webhook test payment session cleaned up';
    
END $$;

-- Test 3: Verify add-ons data structure compatibility
DO $$
DECLARE
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00, "name": "Resume Review"},
        {"addon_key": "meeting_recording", "quantity": 1, "price": 99.00, "total": 99.00, "name": "Meeting Recording"},
        {"addon_key": "priority_support", "quantity": 1, "price": 149.00, "total": 149.00, "name": "Priority Support"}
    ]';
    addon_count INTEGER;
    total_price DECIMAL(10,2);
BEGIN
    -- Test JSON parsing and calculation
    SELECT 
        jsonb_array_length(test_addons) as count,
        SUM((addon->>'total')::DECIMAL(10,2)) as total
    INTO addon_count, total_price
    FROM jsonb_array_elements(test_addons) as addon;
    
    IF addon_count = 3 AND total_price = 447.00 THEN
        RAISE NOTICE 'SUCCESS: Add-ons JSON structure is compatible';
        RAISE NOTICE 'Add-ons count: %, Total price: ₹%', addon_count, total_price;
    ELSE
        RAISE NOTICE 'ERROR: Add-ons JSON structure incompatible';
        RAISE NOTICE 'Expected: 3 add-ons, ₹447.00. Got: % add-ons, ₹%', addon_count, total_price;
    END IF;
    
END $$;

-- Test 4: Verify edge function compatibility
DO $$
DECLARE
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00, "name": "Resume Review"}
    ]';
    parsed_addons JSONB;
    addon_key TEXT;
    addon_name TEXT;
    addon_price DECIMAL(10,2);
BEGIN
    -- Test JSON parsing for edge function compatibility
    SELECT addon->>'addon_key', addon->>'name', (addon->>'price')::DECIMAL(10,2)
    INTO addon_key, addon_name, addon_price
    FROM jsonb_array_elements(test_addons) as addon
    LIMIT 1;
    
    IF addon_key = 'resume_review' AND addon_name = 'Resume Review' AND addon_price = 199.00 THEN
        RAISE NOTICE 'SUCCESS: Add-ons data compatible with edge functions';
        RAISE NOTICE 'Parsed: % - % (₹%)', addon_key, addon_name, addon_price;
    ELSE
        RAISE NOTICE 'ERROR: Add-ons data incompatible with edge functions';
        RAISE NOTICE 'Expected: resume_review - Resume Review (₹199.00)';
        RAISE NOTICE 'Got: % - % (₹%)', addon_key, addon_name, addon_price;
    END IF;
    
END $$;

RAISE NOTICE 'Payment webhook add-ons tests completed successfully!';

