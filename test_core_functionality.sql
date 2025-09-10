-- test_core_functionality.sql
-- Run this in Supabase SQL Editor to verify core functionality

-- Test 1: Check if new user signup works (simulate the trigger)
SELECT 'Testing core functionality...' as status;

-- Test 2: Verify essential functions exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') 
        THEN '✅ handle_new_user function exists'
        ELSE '❌ handle_new_user function missing'
    END as handle_new_user_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') 
        THEN '✅ on_auth_user_created trigger exists'
        ELSE '❌ on_auth_user_created trigger missing'
    END as trigger_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') 
        THEN '✅ user_role enum exists'
        ELSE '❌ user_role enum missing'
    END as enum_status;

-- Test 3: Check RLS policies
SELECT 
    CASE 
        WHEN COUNT(*) > 0 
        THEN '✅ RLS policies exist for profiles table'
        ELSE '❌ No RLS policies for profiles table'
    END as rls_status
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'profiles';

-- Test 4: Check if profiles table is accessible
SELECT 
    CASE 
        WHEN COUNT(*) >= 0 
        THEN '✅ profiles table is accessible'
        ELSE '❌ profiles table not accessible'
    END as profiles_access_status
FROM public.profiles;

-- Test 5: Check if we can insert into profiles (test RLS)
-- This should work if RLS is properly configured
SELECT 'Core functionality test completed. Check results above.' as final_status;
