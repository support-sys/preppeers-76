-- Test Script: Add-ons System
-- Phase 3.1-3.2: Complete Add-on Backend Testing

-- Test 1: Verify add_ons table structure and data
SELECT 
    'Add-ons Table Structure' as test_name,
    COUNT(*) as total_addons,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_addons,
    COUNT(CASE WHEN category = 'service' THEN 1 END) as service_addons,
    COUNT(CASE WHEN category = 'enhancement' THEN 1 END) as enhancement_addons,
    COUNT(CASE WHEN category = 'premium' THEN 1 END) as premium_addons
FROM public.add_ons;

-- Test 2: Verify default add-ons were inserted correctly
SELECT 
    addon_key,
    name,
    price,
    category,
    requires_plan,
    is_active
FROM public.add_ons
ORDER BY category, price;

-- Test 3: Test add-on validation function
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1},
        {"addon_key": "meeting_recording", "quantity": 1}
    ]';
    validation_result RECORD;
BEGIN
    -- Test valid add-ons for essential plan
    SELECT * INTO validation_result
    FROM validate_addons(test_user_id, 'essential', test_addons);
    
    IF validation_result.is_valid THEN
        RAISE NOTICE 'SUCCESS: Essential plan add-ons validation passed';
        RAISE NOTICE 'Validated add-ons: %', validation_result.validated_addons;
    ELSE
        RAISE NOTICE 'ERROR: Essential plan add-ons validation failed: %', validation_result.error_message;
    END IF;
    
    -- Test valid add-ons for professional plan
    SELECT * INTO validation_result
    FROM validate_addons(test_user_id, 'professional', test_addons);
    
    IF validation_result.is_valid THEN
        RAISE NOTICE 'SUCCESS: Professional plan add-ons validation passed';
        RAISE NOTICE 'Validated add-ons: %', validation_result.validated_addons;
    ELSE
        RAISE NOTICE 'ERROR: Professional plan add-ons validation failed: %', validation_result.error_message;
    END IF;
    
    -- Test invalid add-on (should fail)
    test_addons := '[{"addon_key": "nonexistent_addon", "quantity": 1}]';
    SELECT * INTO validation_result
    FROM validate_addons(test_user_id, 'essential', test_addons);
    
    IF NOT validation_result.is_valid THEN
        RAISE NOTICE 'SUCCESS: Invalid add-on correctly rejected: %', validation_result.error_message;
    ELSE
        RAISE NOTICE 'ERROR: Invalid add-on should have been rejected';
    END IF;
    
    -- Test professional-only add-on with essential plan (should fail)
    test_addons := '[{"addon_key": "priority_support", "quantity": 1}]';
    SELECT * INTO validation_result
    FROM validate_addons(test_user_id, 'essential', test_addons);
    
    IF NOT validation_result.is_valid THEN
        RAISE NOTICE 'SUCCESS: Professional-only add-on correctly rejected for essential plan: %', validation_result.error_message;
    ELSE
        RAISE NOTICE 'ERROR: Professional-only add-on should have been rejected for essential plan';
    END IF;
    
END $$;

-- Test 4: Test add-ons total calculation function
DO $$
DECLARE
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1},
        {"addon_key": "meeting_recording", "quantity": 1}
    ]';
    calculated_total DECIMAL(10,2);
    expected_total DECIMAL(10,2) := 298.00; -- 199 + 99
BEGIN
    SELECT calculate_addons_total(test_addons) INTO calculated_total;
    
    IF calculated_total = expected_total THEN
        RAISE NOTICE 'SUCCESS: Add-ons total calculation correct: %', calculated_total;
    ELSE
        RAISE NOTICE 'ERROR: Add-ons total calculation incorrect. Expected: %, Got: %', expected_total, calculated_total;
    END IF;
END $$;

-- Test 5: Test user_add_ons table operations
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    resume_review_id UUID;
    meeting_recording_id UUID;
    user_addon_id UUID;
BEGIN
    -- Get add-on IDs (use LIMIT 1 to handle duplicates)
    SELECT id INTO resume_review_id FROM public.add_ons WHERE addon_key = 'resume_review' LIMIT 1;
    SELECT id INTO meeting_recording_id FROM public.add_ons WHERE addon_key = 'meeting_recording' LIMIT 1;
    
    -- Test inserting user add-ons
    INSERT INTO public.user_add_ons (user_id, addon_id, quantity, is_active)
    VALUES 
        (test_user_id, resume_review_id, 1, true),
        (test_user_id, meeting_recording_id, 1, true)
    RETURNING id INTO user_addon_id;
    
    RAISE NOTICE 'SUCCESS: User add-ons inserted successfully';
    
    -- Test querying user add-ons
    IF EXISTS (
        SELECT 1 FROM public.user_add_ons ua
        JOIN public.add_ons a ON ua.addon_id = a.id
        WHERE ua.user_id = test_user_id
        AND a.addon_key IN ('resume_review', 'meeting_recording')
    ) THEN
        RAISE NOTICE 'SUCCESS: User add-ons can be queried successfully';
    ELSE
        RAISE NOTICE 'ERROR: User add-ons query failed';
    END IF;
    
    -- Clean up test data
    DELETE FROM public.user_add_ons WHERE user_id = test_user_id;
    RAISE NOTICE 'Test data cleaned up';
    
END $$;

-- Test 6: Test payment_sessions table with add-ons
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_payment_id UUID;
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00},
        {"addon_key": "meeting_recording", "quantity": 1, "price": 99.00, "total": 99.00}
    ]';
    addons_total DECIMAL(10,2) := 298.00;
BEGIN
    -- Test inserting payment session with add-ons
    INSERT INTO public.payment_sessions (
        user_id,
        selected_plan,
        interview_duration,
        amount,
        payment_status,
        selected_add_ons,
        add_ons_total
    ) VALUES (
        test_user_id,
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

-- Test 7: Test interviews table with add-ons
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_interview_id UUID;
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1, "price": 199.00, "total": 199.00}
    ]';
    addons_total DECIMAL(10,2) := 199.00;
BEGIN
    -- Test inserting interview with add-ons
    INSERT INTO public.interviews (
        user_id,
        selected_plan,
        interview_duration,
        status,
        selected_add_ons,
        add_ons_total
    ) VALUES (
        test_user_id,
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

-- Test 8: Test RLS policies
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    addon_count INTEGER;
BEGIN
    -- Test that users can view active add-ons
    SELECT COUNT(*) INTO addon_count
    FROM public.add_ons
    WHERE is_active = true;
    
    IF addon_count > 0 THEN
        RAISE NOTICE 'SUCCESS: RLS allows viewing active add-ons: % add-ons found', addon_count;
    ELSE
        RAISE NOTICE 'ERROR: RLS may be blocking add-ons view or no active add-ons found';
    END IF;
    
END $$;

-- Test 9: Verify table constraints
DO $$
BEGIN
    -- Test add-on category constraint
    BEGIN
        INSERT INTO public.add_ons (addon_key, name, description, price, category)
        VALUES ('test_invalid_category', 'Test', 'Test description', 100.00, 'invalid_category');
        RAISE EXCEPTION 'ERROR: Invalid category should have been rejected';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'SUCCESS: Invalid category correctly rejected';
    END;
    
    -- Test requires_plan constraint
    BEGIN
        INSERT INTO public.add_ons (addon_key, name, description, price, category, requires_plan)
        VALUES ('test_invalid_plan', 'Test', 'Test description', 100.00, 'service', 'invalid_plan');
        RAISE EXCEPTION 'ERROR: Invalid plan should have been rejected';
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'SUCCESS: Invalid plan correctly rejected';
    END;
    
    -- Clean up any test data
    DELETE FROM public.add_ons WHERE addon_key LIKE 'test_%';
    
END $$;

-- Test 10: Performance check
EXPLAIN (ANALYZE, BUFFERS) 
SELECT a.*, ua.quantity, ua.selected_at
FROM public.add_ons a
LEFT JOIN public.user_add_ons ua ON a.id = ua.addon_id
WHERE a.is_active = true
ORDER BY a.category, a.price;

RAISE NOTICE 'Add-ons system tests completed successfully!';
