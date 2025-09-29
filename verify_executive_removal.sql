-- Verification Script: Executive Plan Removal
-- Run this script after executing the migration to verify success

-- 1. Check coupons table constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.coupons'::regclass 
AND conname LIKE '%plan_type%';

-- 2. Check interviewees table constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.interviewees'::regclass 
AND conname LIKE '%selected_plan%';

-- 3. Check interviews table constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.interviews'::regclass 
AND conname LIKE '%selected_plan%';

-- 4. Check payment_sessions table constraints
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.payment_sessions'::regclass 
AND conname LIKE '%selected_plan%';

-- 5. Verify no 'executive' data remains
SELECT 'coupons' as table_name, COUNT(*) as executive_count 
FROM public.coupons WHERE plan_type = 'executive'
UNION ALL
SELECT 'interviewees' as table_name, COUNT(*) as executive_count 
FROM public.interviewees WHERE selected_plan = 'executive'
UNION ALL
SELECT 'interviews' as table_name, COUNT(*) as executive_count 
FROM public.interviews WHERE selected_plan = 'executive'
UNION ALL
SELECT 'payment_sessions' as table_name, COUNT(*) as executive_count 
FROM public.payment_sessions WHERE selected_plan = 'executive';

-- 6. Check if EXECUTIVE100 coupon was removed
SELECT COUNT(*) as executive_coupon_count 
FROM public.coupons WHERE coupon_name = 'EXECUTIVE100';

-- 7. Verify migrated data (should show professional plans)
SELECT 'interviewees' as table_name, selected_plan, COUNT(*) as count
FROM public.interviewees 
WHERE selected_plan IS NOT NULL
GROUP BY selected_plan
UNION ALL
SELECT 'interviews' as table_name, selected_plan, COUNT(*) as count
FROM public.interviews 
GROUP BY selected_plan
UNION ALL
SELECT 'payment_sessions' as table_name, selected_plan, COUNT(*) as count
FROM public.payment_sessions 
GROUP BY selected_plan;

-- 8. Check column comments
SELECT 
    schemaname,
    tablename,
    columnname,
    col_description(c.oid, a.attnum) as comment
FROM pg_class c
JOIN pg_attribute a ON a.attrelid = c.oid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND a.attname IN ('selected_plan', 'plan_type')
AND c.relname IN ('coupons', 'interviewees', 'interviews', 'payment_sessions')
ORDER BY tablename, columnname;

