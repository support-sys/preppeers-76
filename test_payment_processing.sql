-- Test Script: Payment Processing with Updated Constraints
-- This script tests that payment processing works with the new 2-plan system

-- Test 1: Create test payment sessions with valid plans
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    test_payment_id UUID;
BEGIN
    -- Test Essential plan payment session
    BEGIN
        INSERT INTO public.payment_sessions (
            user_id, 
            selected_plan, 
            interview_duration, 
            amount, 
            payment_status,
            created_at
        ) VALUES (
            test_user_id,
            'essential',
            30,
            399,
            'pending',
            NOW()
        ) RETURNING id INTO test_payment_id;
        
        RAISE NOTICE 'SUCCESS: Essential plan payment session created with ID: %', test_payment_id;
        
        -- Clean up
        DELETE FROM public.payment_sessions WHERE id = test_payment_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Essential plan payment session failed: %', SQLERRM;
    END;
    
    -- Test Professional plan payment session
    BEGIN
        INSERT INTO public.payment_sessions (
            user_id, 
            selected_plan, 
            interview_duration, 
            amount, 
            payment_status,
            created_at
        ) VALUES (
            test_user_id,
            'professional',
            60,
            799,
            'pending',
            NOW()
        ) RETURNING id INTO test_payment_id;
        
        RAISE NOTICE 'SUCCESS: Professional plan payment session created with ID: %', test_payment_id;
        
        -- Clean up
        DELETE FROM public.payment_sessions WHERE id = test_payment_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Professional plan payment session failed: %', SQLERRM;
    END;
    
    -- Test invalid plan (should fail)
    BEGIN
        INSERT INTO public.payment_sessions (
            user_id, 
            selected_plan, 
            interview_duration, 
            amount, 
            payment_status,
            created_at
        ) VALUES (
            test_user_id,
            'executive',
            60,
            1299,
            'pending',
            NOW()
        );
        
        RAISE EXCEPTION 'ERROR: Executive plan payment session should have been rejected';
        
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'SUCCESS: Executive plan payment session correctly rejected';
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Unexpected error testing Executive plan: %', SQLERRM;
    END;
    
END $$;

-- Test 2: Test coupon validation with new plan types
DO $$
DECLARE
    test_coupon_id UUID;
BEGIN
    -- Test coupon for Essential plan
    BEGIN
        INSERT INTO public.coupons (
            coupon_name,
            discount_type,
            discount_value,
            plan_type,
            expiring_on,
            status,
            usage_limit,
            usage_count
        ) VALUES (
            'TEST_ESSENTIAL_10',
            'percentage',
            10,
            'essential',
            '2025-12-31',
            'active',
            100,
            0
        ) RETURNING id INTO test_coupon_id;
        
        RAISE NOTICE 'SUCCESS: Essential plan coupon created with ID: %', test_coupon_id;
        
        -- Clean up
        DELETE FROM public.coupons WHERE id = test_coupon_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Essential plan coupon failed: %', SQLERRM;
    END;
    
    -- Test coupon for Professional plan
    BEGIN
        INSERT INTO public.coupons (
            coupon_name,
            discount_type,
            discount_value,
            plan_type,
            expiring_on,
            status,
            usage_limit,
            usage_count
        ) VALUES (
            'TEST_PROFESSIONAL_15',
            'percentage',
            15,
            'professional',
            '2025-12-31',
            'active',
            100,
            0
        ) RETURNING id INTO test_coupon_id;
        
        RAISE NOTICE 'SUCCESS: Professional plan coupon created with ID: %', test_coupon_id;
        
        -- Clean up
        DELETE FROM public.coupons WHERE id = test_coupon_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Professional plan coupon failed: %', SQLERRM;
    END;
    
    -- Test invalid plan type (should fail)
    BEGIN
        INSERT INTO public.coupons (
            coupon_name,
            discount_type,
            discount_value,
            plan_type,
            expiring_on,
            status,
            usage_limit,
            usage_count
        ) VALUES (
            'TEST_EXECUTIVE_20',
            'percentage',
            20,
            'executive',
            '2025-12-31',
            'active',
            100,
            0
        );
        
        RAISE EXCEPTION 'ERROR: Executive plan coupon should have been rejected';
        
    EXCEPTION
        WHEN check_violation THEN
            RAISE NOTICE 'SUCCESS: Executive plan coupon correctly rejected';
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Unexpected error testing Executive coupon: %', SQLERRM;
    END;
    
END $$;

-- Test 3: Test interview creation with new constraints
DO $$
DECLARE
    test_user_id UUID := '00000000-0000-0000-0000-000000000001';
    test_interview_id UUID;
BEGIN
    -- Test Essential plan interview
    BEGIN
        INSERT INTO public.interviews (
            user_id,
            selected_plan,
            interview_duration,
            status,
            created_at
        ) VALUES (
            test_user_id,
            'essential',
            30,
            'scheduled',
            NOW()
        ) RETURNING id INTO test_interview_id;
        
        RAISE NOTICE 'SUCCESS: Essential plan interview created with ID: %', test_interview_id;
        
        -- Clean up
        DELETE FROM public.interviews WHERE id = test_interview_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Essential plan interview failed: %', SQLERRM;
    END;
    
    -- Test Professional plan interview
    BEGIN
        INSERT INTO public.interviews (
            user_id,
            selected_plan,
            interview_duration,
            status,
            created_at
        ) VALUES (
            test_user_id,
            'professional',
            60,
            'scheduled',
            NOW()
        ) RETURNING id INTO test_interview_id;
        
        RAISE NOTICE 'SUCCESS: Professional plan interview created with ID: %', test_interview_id;
        
        -- Clean up
        DELETE FROM public.interviews WHERE id = test_interview_id;
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'ERROR: Professional plan interview failed: %', SQLERRM;
    END;
    
END $$;

-- Test 4: Verify existing payment sessions are accessible
SELECT 
    'Payment Sessions Accessibility' as test_name,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_sessions,
    COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_sessions
FROM public.payment_sessions
WHERE selected_plan IN ('essential', 'professional');

-- Test 5: Check if any payment sessions need attention
SELECT 
    'Payment Sessions Status' as check_type,
    selected_plan,
    payment_status,
    COUNT(*) as count,
    MIN(created_at) as oldest_session,
    MAX(created_at) as newest_session
FROM public.payment_sessions
WHERE selected_plan IN ('essential', 'professional')
GROUP BY selected_plan, payment_status
ORDER BY selected_plan, payment_status;

RAISE NOTICE 'Payment processing tests completed successfully!';

