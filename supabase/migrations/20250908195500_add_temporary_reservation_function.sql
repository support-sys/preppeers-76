-- Add the missing create_temporary_reservation function

CREATE OR REPLACE FUNCTION public.create_temporary_reservation(
    p_interviewer_id uuid,
    p_blocked_date date,
    p_start_time time,
    p_end_time time,
    p_duration_minutes integer,
    p_reserved_by_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    reservation_id uuid;
BEGIN
    -- Generate a new UUID for the reservation
    reservation_id := gen_random_uuid();
    
    -- Insert the temporary reservation
    INSERT INTO public.interviewer_time_blocks (
        id,
        interviewer_id,
        blocked_date,
        start_time,
        end_time,
        block_reason,
        is_temporary,
        reserved_by_user_id,
        created_at
    ) VALUES (
        reservation_id,
        p_interviewer_id,
        p_blocked_date,
        p_start_time,
        p_end_time,
        'temporary_reservation',
        true,
        p_reserved_by_user_id,
        NOW()
    );
    
    RETURN reservation_id;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create temporary reservation: %', SQLERRM;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_temporary_reservation(uuid, date, time, time, integer, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_temporary_reservation(uuid, date, time, time, integer, uuid) TO anon;

-- Also add the other missing functions for temporary blocking
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
    blocked_date date;
    start_time time;
    end_time time;
    conflict_count integer;
BEGIN
    -- Convert scheduled time to date and time components
    blocked_date := p_scheduled_time::date;
    start_time := p_scheduled_time::time;
    end_time := (p_scheduled_time + (p_duration_minutes || ' minutes')::interval)::time;
    
    -- Check for conflicts
    SELECT COUNT(*)
    INTO conflict_count
    FROM public.interviewer_time_blocks
    WHERE interviewer_id = p_interviewer_id
    AND blocked_date = blocked_date
    AND (
        (start_time < end_time AND end_time > start_time) OR
        (start_time >= end_time AND (end_time > start_time OR end_time < end_time))
    );
    
    RETURN conflict_count = 0;
END;
$$;

-- Grant permissions for all functions
GRANT EXECUTE ON FUNCTION public.update_temporary_to_permanent(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_temporary_to_permanent(uuid, uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.release_temporary_reservation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.release_temporary_reservation(uuid) TO anon;

GRANT EXECUTE ON FUNCTION public.is_time_slot_available(uuid, timestamptz, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_time_slot_available(uuid, timestamptz, integer) TO anon;
