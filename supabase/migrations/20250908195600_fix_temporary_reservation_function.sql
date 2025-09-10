-- Fix the create_temporary_reservation function to use correct column name
CREATE OR REPLACE FUNCTION public.create_temporary_reservation(
    p_interviewer_id uuid,
    p_blocked_date date,
    p_start_time time without time zone,
    p_end_time time without time zone,
    p_reserved_by_user_id uuid,
    p_duration_minutes integer
)
RETURNS uuid AS $$
DECLARE
    v_reservation_id uuid;
    v_expires_at timestamptz;
BEGIN
    -- Generate a new UUID for the reservation
    v_reservation_id := gen_random_uuid();
    
    -- Calculate expiration time (e.g., 15 minutes from now)
    v_expires_at := NOW() + INTERVAL '15 minutes';
    
    -- Insert the temporary reservation
    INSERT INTO public.interviewer_time_blocks (
        id,
        interviewer_id,
        blocked_date,
        start_time,
        end_time,
        block_reason,
        is_temporary,
        expires_at,
        reserved_by_user_id,
        created_at
    ) VALUES (
        v_reservation_id,
        p_interviewer_id,
        p_blocked_date,
        p_start_time,
        p_end_time,
        'temporary_reservation',
        true,
        v_expires_at,
        p_reserved_by_user_id,
        NOW()
    );
    
    RETURN v_reservation_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create temporary reservation: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the update_temporary_to_permanent function
CREATE OR REPLACE FUNCTION public.update_temporary_to_permanent(
    p_reservation_id uuid,
    p_interview_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update the temporary reservation to permanent
    UPDATE public.interviewer_time_blocks
    SET 
        is_temporary = false,
        block_reason = 'interview_scheduled',
        interview_id = p_interview_id,
        updated_at = NOW()
    WHERE id = p_reservation_id
    AND is_temporary = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Temporary reservation not found or already converted';
    END IF;
END;
$$;

-- Fix the release_temporary_reservation function
CREATE OR REPLACE FUNCTION public.release_temporary_reservation(
    p_reservation_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete the temporary reservation
    DELETE FROM public.interviewer_time_blocks
    WHERE id = p_reservation_id
    AND is_temporary = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Temporary reservation not found or already released';
    END IF;
END;
$$;

-- Fix the is_time_slot_available function
CREATE OR REPLACE FUNCTION public.is_time_slot_available(
    p_interviewer_id uuid,
    p_scheduled_time timestamptz,
    p_duration_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_blocked_date date;
    v_start_time time;
    v_end_time time;
    v_conflict_count integer;
BEGIN
    -- Extract date and time components
    v_blocked_date := p_scheduled_time::date;
    v_start_time := p_scheduled_time::time;
    v_end_time := (p_scheduled_time + INTERVAL '1 minute' * p_duration_minutes)::time;
    
    -- Check for conflicts in interviewer_time_blocks
    SELECT COUNT(*)
    INTO v_conflict_count
    FROM public.interviewer_time_blocks
    WHERE interviewer_id = p_interviewer_id
    AND blocked_date = v_blocked_date
    AND (
        (start_time < v_end_time AND end_time > v_start_time)
        OR (start_time = v_start_time AND end_time = v_end_time)
    );
    
    -- Return true if no conflicts found
    RETURN v_conflict_count = 0;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to check time slot availability: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_temporary_reservation(uuid, date, time without time zone, time without time zone, uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_temporary_reservation(uuid, date, time without time zone, time without time zone, uuid, integer) TO service_role;

GRANT EXECUTE ON FUNCTION public.update_temporary_to_permanent(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_temporary_to_permanent(uuid, uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.release_temporary_reservation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_temporary_reservation(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.is_time_slot_available(uuid, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_time_slot_available(uuid, timestamptz, integer) TO service_role;
