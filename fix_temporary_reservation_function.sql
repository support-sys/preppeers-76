-- Fix the create_temporary_reservation function to handle conflicts better
-- This addresses the "Time slot is not available - 1 conflicting blocks found" error
-- and the "column reference \"expires_at\" is ambiguous" error

-- Drop the existing function
DROP FUNCTION IF EXISTS create_temporary_reservation(UUID, DATE, TIME, TIME, UUID, INTEGER);

-- Create an improved version with better conflict detection
CREATE OR REPLACE FUNCTION create_temporary_reservation(
  p_interviewer_id UUID,
  p_blocked_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_reserved_by_user_id UUID,
  p_duration_minutes INTEGER DEFAULT 10
)
RETURNS UUID AS $$
DECLARE
  reservation_id UUID;
  p_expires_at TIMESTAMPTZ; -- Renamed variable to avoid conflict
  conflicting_blocks_count INTEGER;
BEGIN
  -- First, clean up any expired temporary blocks for this interviewer
  DELETE FROM interviewer_time_blocks 
  WHERE interviewer_id = p_interviewer_id 
  AND is_temporary = true 
  AND expires_at <= NOW();
  
  -- Check for any truly conflicting blocks (only permanent or non-expired temporary)
  SELECT COUNT(*) INTO conflicting_blocks_count
  FROM interviewer_time_blocks itb
  WHERE itb.interviewer_id = p_interviewer_id
  AND itb.blocked_date = p_blocked_date
  AND (
    -- Check for time overlap
    (itb.start_time < p_end_time AND itb.end_time > p_start_time) OR
    (itb.start_time >= p_start_time AND itb.start_time < p_end_time) OR
    (itb.end_time > p_start_time AND itb.end_time <= p_end_time)
  )
  AND (
    -- Only consider permanent blocks or non-expired temporary blocks
    itb.is_temporary = false OR 
    (itb.is_temporary = true AND itb.expires_at > NOW())
  );
  
  -- If there are conflicts, provide detailed information
  IF conflicting_blocks_count > 0 THEN
    RAISE EXCEPTION 'Time slot is not available - % conflicting blocks found. Please try a different time slot.', conflicting_blocks_count;
  END IF;
  
  -- Calculate expiration time (10 minutes from now)
  p_expires_at := NOW() + INTERVAL '10 minutes';
  
  -- Create temporary reservation
  INSERT INTO interviewer_time_blocks (
    interviewer_id,
    blocked_date,
    start_time,
    end_time,
    block_reason,
    is_temporary,
    expires_at,
    reserved_by_user_id
  ) VALUES (
    p_interviewer_id,
    p_blocked_date,
    p_start_time,
    p_end_time,
    'temporary_reservation',
    true,
    p_expires_at, -- Use renamed variable
    p_reserved_by_user_id
  ) RETURNING id INTO reservation_id;
  
  RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Also improve the is_time_slot_available function
DROP FUNCTION IF EXISTS is_time_slot_available(UUID, DATE, TIME, TIME);

CREATE OR REPLACE FUNCTION is_time_slot_available(
  p_interviewer_id UUID,
  p_blocked_date DATE,
  p_start_time TIME,
  p_end_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  conflicting_blocks_count INTEGER;
BEGIN
  -- First, clean up any expired temporary blocks for this interviewer
  DELETE FROM interviewer_time_blocks 
  WHERE interviewer_id = p_interviewer_id 
  AND is_temporary = true 
  AND expires_at <= NOW();
  
  -- Check for any truly conflicting blocks
  SELECT COUNT(*) INTO conflicting_blocks_count
  FROM interviewer_time_blocks itb
  WHERE itb.interviewer_id = p_interviewer_id
  AND itb.blocked_date = p_blocked_date
  AND (
    -- Check for time overlap
    (itb.start_time < p_end_time AND itb.end_time > p_start_time) OR
    (itb.start_time >= p_start_time AND itb.start_time < p_end_time) OR
    (itb.end_time > p_start_time AND itb.end_time <= p_end_time)
  )
  AND (
    -- Only consider permanent blocks or non-expired temporary blocks
    itb.is_temporary = false OR 
    (itb.is_temporary = true AND itb.expires_at > NOW())
  );
  
  -- Return true if no conflicts found
  RETURN conflicting_blocks_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Test the functions
SELECT '✅ Functions updated successfully' as status;

-- Show current temporary blocks for debugging
SELECT 
  id,
  interviewer_id,
  blocked_date,
  start_time,
  end_time,
  is_temporary,
  expires_at,
  block_reason,
  created_at
FROM interviewer_time_blocks 
WHERE is_temporary = true 
ORDER BY created_at DESC 
LIMIT 10;
