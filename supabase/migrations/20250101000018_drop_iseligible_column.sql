-- Drop the unused iseligible column (if it exists)
-- The correct column is is_eligible (with underscore)

-- First check if the column exists, then drop it safely
DO $$ 
BEGIN
    -- Check if iseligible column exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'interviewers' 
        AND table_schema = 'public'
        AND column_name = 'iseligible'
    ) THEN
        -- Drop the column
        ALTER TABLE public.interviewers DROP COLUMN iseligible;
        
        -- Log the action
        INSERT INTO public.audit_log (
            table_name,
            operation,
            old_data,
            new_data,
            user_id,
            timestamp
        ) VALUES (
            'interviewers',
            'column_dropped',
            jsonb_build_object('column_name', 'iseligible'),
            jsonb_build_object('reason', 'Unused column, replaced by is_eligible'),
            NULL,
            NOW()
        );
        
        RAISE NOTICE 'Column iseligible has been dropped from interviewers table';
    ELSE
        RAISE NOTICE 'Column iseligible does not exist in interviewers table';
    END IF;
END $$;
