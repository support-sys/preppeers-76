-- Test query to check interviewer data
DO $$
DECLARE
    interviewer_count integer;
    eligible_count integer;
    sample_interviewer record;
BEGIN
    -- Count total interviewers
    SELECT COUNT(*) INTO interviewer_count FROM public.interviewers;
    RAISE NOTICE 'Total interviewers: %', interviewer_count;
    
    -- Count eligible interviewers
    SELECT COUNT(*) INTO eligible_count FROM public.interviewers WHERE is_eligible = true;
    RAISE NOTICE 'Eligible interviewers: %', eligible_count;
    
    -- Get a sample interviewer
    SELECT * INTO sample_interviewer FROM public.interviewers WHERE is_eligible = true LIMIT 1;
    
    IF sample_interviewer.id IS NOT NULL THEN
        RAISE NOTICE 'Sample interviewer: id=%, position=%, experience_years=%, is_eligible=%', 
            sample_interviewer.id, 
            sample_interviewer.position, 
            sample_interviewer.experience_years, 
            sample_interviewer.is_eligible;
    ELSE
        RAISE NOTICE 'No eligible interviewers found';
    END IF;
END $$;

