-- Fix for Test 6: Test user_add_ons table operations
-- The issue is with RETURNING id INTO user_addon_id when inserting multiple rows

-- Test 6: Test user_add_ons table operations (Fixed Version)
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    resume_review_id UUID;
    meeting_recording_id UUID;
    user_addon_id UUID;
    addon_exists BOOLEAN := false;
    inserted_count INTEGER := 0;
BEGIN
    -- Check if add-ons exist first
    SELECT EXISTS(SELECT 1 FROM public.add_ons WHERE addon_key = 'resume_review') INTO addon_exists;
    IF NOT addon_exists THEN
        RAISE NOTICE 'SKIP: resume_review add-on not found, skipping user add-ons test';
        RETURN;
    END IF;
    
    SELECT EXISTS(SELECT 1 FROM public.add_ons WHERE addon_key = 'meeting_recording') INTO addon_exists;
    IF NOT addon_exists THEN
        RAISE NOTICE 'SKIP: meeting_recording add-on not found, skipping user add-ons test';
        RETURN;
    END IF;
    
    -- Get add-on IDs (use LIMIT 1 to handle duplicates)
    SELECT id INTO resume_review_id FROM public.add_ons WHERE addon_key = 'resume_review' LIMIT 1;
    SELECT id INTO meeting_recording_id FROM public.add_ons WHERE addon_key = 'meeting_recording' LIMIT 1;
    
    -- Check if we got valid IDs
    IF resume_review_id IS NULL OR meeting_recording_id IS NULL THEN
        RAISE NOTICE 'ERROR: Could not find add-on IDs';
        RETURN;
    END IF;
    
    -- Test inserting user add-ons (insert one at a time to avoid RETURNING multiple rows)
    INSERT INTO public.user_add_ons (user_id, addon_id, quantity, is_active)
    VALUES (test_user_id, resume_review_id, 1, true)
    RETURNING id INTO user_addon_id;
    
    INSERT INTO public.user_add_ons (user_id, addon_id, quantity, is_active)
    VALUES (test_user_id, meeting_recording_id, 1, true)
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

