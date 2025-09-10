-- Add missing cleanup function
CREATE OR REPLACE FUNCTION cleanup_expired_temporary_blocks()
RETURNS void AS $$
BEGIN
    -- Delete expired temporary reservations
    DELETE FROM interviewer_time_blocks 
    WHERE temporary = true 
    AND created_at < NOW() - INTERVAL '15 minutes';
    
    RAISE NOTICE 'Cleaned up expired temporary reservations';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_temporary_blocks() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_temporary_blocks() TO anon;
