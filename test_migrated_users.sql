-- Test Script: Verify Migrated Users
-- This script tests that migrated users can access their accounts

-- Test 1: Check if any Executive users were successfully migrated
SELECT 
    'interviewees' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN selected_plan = 'professional' THEN 1 END) as professional_count,
    COUNT(CASE WHEN selected_plan = 'essential' THEN 1 END) as essential_count,
    COUNT(CASE WHEN selected_plan IS NULL THEN 1 END) as null_count
FROM public.interviewees
UNION ALL
SELECT 
    'interviews' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN selected_plan = 'professional' THEN 1 END) as professional_count,
    COUNT(CASE WHEN selected_plan = 'essential' THEN 1 END) as essential_count,
    0 as null_count
FROM public.interviews
UNION ALL
SELECT 
    'payment_sessions' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN selected_plan = 'professional' THEN 1 END) as professional_count,
    COUNT(CASE WHEN selected_plan = 'essential' THEN 1 END) as essential_count,
    0 as null_count
FROM public.payment_sessions;

-- Test 2: Verify migrated users can be queried successfully
SELECT 
    i.id,
    i.user_id,
    i.selected_plan,
    i.target_role,
    i.experience,
    i.booking_progress,
    i.created_at
FROM public.interviewees i
WHERE i.selected_plan IN ('essential', 'professional')
ORDER BY i.created_at DESC
LIMIT 10;

-- Test 3: Check payment sessions for migrated users
SELECT 
    ps.id,
    ps.user_id,
    ps.selected_plan,
    ps.amount,
    ps.payment_status,
    ps.created_at
FROM public.payment_sessions ps
WHERE ps.selected_plan IN ('essential', 'professional')
ORDER BY ps.created_at DESC
LIMIT 10;

-- Test 4: Verify interview records for migrated users
SELECT 
    int.id,
    int.user_id,
    int.selected_plan,
    int.interview_duration,
    int.status,
    int.created_at
FROM public.interviews int
WHERE int.selected_plan IN ('essential', 'professional')
ORDER BY int.created_at DESC
LIMIT 10;

-- Test 5: Check if any data integrity issues exist
SELECT 
    'Data Integrity Check' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS: No Executive plans found'
        ELSE 'FAIL: ' || COUNT(*) || ' Executive plans still exist'
    END as result
FROM (
    SELECT selected_plan FROM public.interviewees WHERE selected_plan = 'executive'
    UNION ALL
    SELECT selected_plan FROM public.interviews WHERE selected_plan = 'executive'
    UNION ALL
    SELECT selected_plan FROM public.payment_sessions WHERE selected_plan = 'executive'
) as executive_plans;

-- Test 6: Verify coupon system works with new constraints
SELECT 
    c.coupon_name,
    c.plan_type,
    c.discount_type,
    c.discount_value,
    c.status,
    c.expiring_on
FROM public.coupons c
WHERE c.plan_type IN ('essential', 'professional', 'all')
ORDER BY c.created_at DESC;

-- Test 7: Check for any orphaned data or inconsistencies
SELECT 
    'Orphaned Data Check' as check_type,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS: No orphaned data found'
        ELSE 'WARNING: ' || COUNT(*) || ' potential orphaned records'
    END as result
FROM (
    -- Check for interviewees without valid plans
    SELECT 1 FROM public.interviewees 
    WHERE selected_plan IS NOT NULL 
    AND selected_plan NOT IN ('essential', 'professional')
    UNION ALL
    -- Check for interviews without valid plans
    SELECT 1 FROM public.interviews 
    WHERE selected_plan NOT IN ('essential', 'professional')
    UNION ALL
    -- Check for payment sessions without valid plans
    SELECT 1 FROM public.payment_sessions 
    WHERE selected_plan NOT IN ('essential', 'professional')
) as orphaned_data;

