-- Migration to add temporary blocking support
-- Run this in your Supabase SQL Editor

-- Step 1: Add temporary blocking columns
ALTER TABLE interviewer_time_blocks 
ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reserved_by_user_id UUID;

-- Step 2: Add foreign key constraint for reserved_by_user_id
ALTER TABLE interviewer_time_blocks 
ADD CONSTRAINT fk_interviewer_time_blocks_reserved_by_user_id 
FOREIGN KEY (reserved_by_user_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- Step 3: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interviewer_time_blocks_temporary ON interviewer_time_blocks(is_temporary, expires_at);
CREATE INDEX IF NOT EXISTS idx_interviewer_time_blocks_reserved_by ON interviewer_time_blocks(reserved_by_user_id);

-- Step 4: Add comments for documentation
COMMENT ON COLUMN interviewer_time_blocks.is_temporary IS 'Whether this is a temporary reservation (true) or permanent block (false)';
COMMENT ON COLUMN interviewer_time_blocks.expires_at IS 'When the temporary reservation expires (NULL for permanent blocks)';
COMMENT ON COLUMN interviewer_time_blocks.reserved_by_user_id IS 'User ID who made the temporary reservation';

-- Step 5: Create function to cleanup expired temporary blocks
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_blocks()
RETURNS void AS $$
BEGIN
  DELETE FROM interviewer_time_blocks 
  WHERE is_temporary = true 
  AND expires_at < NOW();
  
  RAISE NOTICE 'Cleaned up expired temporary blocks at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create function to check if slot is available (including temporary blocks)
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
  -- Check for any conflicting blocks (permanent or non-expired temporary)
  SELECT COUNT(*) INTO conflicting_blocks_count
  FROM interviewer_time_blocks 
  WHERE interviewer_id = p_interviewer_id
  AND blocked_date = p_blocked_date
  AND (
    (start_time < p_end_time AND end_time > p_start_time) OR
    (start_time >= p_start_time AND start_time < p_end_time) OR
    (end_time > p_start_time AND end_time <= p_end_time)
  )
  AND (
    is_temporary = false OR 
    (is_temporary = true AND expires_at > NOW())
  );
  
  RETURN conflicting_blocks_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create function to create temporary reservation
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
BEGIN
  -- Check if slot is available
  IF NOT is_time_slot_available(p_interviewer_id, p_blocked_date, p_start_time, p_end_time) THEN
    RAISE EXCEPTION 'Time slot is not available';
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

-- Step 8: Create function to convert temporary to permanent
CREATE OR REPLACE FUNCTION convert_temporary_to_permanent(
  p_reservation_id UUID,
  p_interview_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE interviewer_time_blocks 
  SET 
    is_temporary = false,
    expires_at = NULL,
    block_reason = 'interview_scheduled',
    interview_id = p_interview_id,
    updated_at = NOW()
  WHERE id = p_reservation_id 
  AND is_temporary = true;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Temporary reservation not found or already converted';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Verify the setup
SELECT 
  '✅ Migration completed successfully' as status,
  COUNT(*) as total_columns
FROM information_schema.columns 
WHERE table_name = 'interviewer_time_blocks' 
AND table_schema = 'public';

-- Step 10: Show sample data structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'interviewer_time_blocks' 
AND table_schema = 'public'
ORDER BY ordinal_position;
