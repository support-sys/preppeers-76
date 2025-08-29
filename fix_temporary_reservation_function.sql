-- Fix the create_temporary_reservation function
-- The issue is likely in the availability check logic

-- Step 1: Check if the function exists
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'create_temporary_reservation';

-- Step 2: Drop and recreate the function with better logic
DROP FUNCTION IF EXISTS create_temporary_reservation(
  p_interviewer_id UUID,
  p_blocked_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_reserved_by_user_id UUID,
  p_duration_minutes INTEGER
);

-- Step 3: Create improved function
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
  expires_at TIMESTAMPTZ;
  conflicting_blocks_count INTEGER;
BEGIN
  -- Check for any conflicting blocks (permanent or non-expired temporary)
  SELECT COUNT(*) INTO conflicting_blocks_count
  FROM interviewer_time_blocks itb
  WHERE itb.interviewer_id = p_interviewer_id
  AND itb.blocked_date = p_blocked_date
  AND (
    (itb.start_time < p_end_time AND itb.end_time > p_start_time) OR
    (itb.start_time >= p_start_time AND itb.start_time < p_end_time) OR
    (itb.end_time > p_start_time AND itb.end_time <= p_end_time)
  )
  AND (
    itb.is_temporary = false OR 
    (itb.is_temporary = true AND itb.expires_at > NOW())
  );
  
  -- Allow creation if no conflicts
  IF conflicting_blocks_count > 0 THEN
    RAISE EXCEPTION 'Time slot is not available - % conflicting blocks found', conflicting_blocks_count;
  END IF;
  
  -- Calculate expiration time (10 minutes from now)
  expires_at := NOW() + INTERVAL '10 minutes';
  
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
    expires_at,
    p_reserved_by_user_id
  ) RETURNING id INTO reservation_id;
  
  RETURN reservation_id;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Test the function
-- This should help identify what's causing the conflict
SELECT 
  interviewer_id,
  blocked_date,
  start_time,
  end_time,
  is_temporary,
  expires_at,
  block_reason
FROM interviewer_time_blocks 
WHERE interviewer_id = '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28'
AND blocked_date = '2025-01-10'
ORDER BY start_time;

-- Step 5: Check for any overlapping time slots
SELECT 
  t1.id as block1_id,
  t1.start_time as block1_start,
  t1.end_time as block1_end,
  t1.is_temporary as block1_temp,
  t2.id as block2_id,
  t2.start_time as block2_start,
  t2.end_time as block2_end,
  t2.is_temporary as block2_temp
FROM interviewer_time_blocks t1
JOIN interviewer_time_blocks t2 ON 
  t1.interviewer_id = t2.interviewer_id 
  AND t1.blocked_date = t2.blocked_date
  AND t1.id != t2.id
  AND (
    (t1.start_time < t2.end_time AND t1.end_time > t2.start_time) OR
    (t2.start_time < t1.end_time AND t2.end_time > t1.start_time)
  )
WHERE t1.interviewer_id = '5d86581b-40f0-4b2d-8dc6-bfb5baec1e28'
AND t1.blocked_date = '2025-01-10';
