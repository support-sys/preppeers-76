-- Final Database Restoration Script
-- This handles foreign key constraints properly

-- ==============================================
-- 1. DROP EXISTING OBJECTS (if they exist)
-- ==============================================

-- Drop existing enum type if it exists
DROP TYPE IF EXISTS "public"."user_role" CASCADE;

-- ==============================================
-- 2. NOW RUN YOUR ORIGINAL DUMP
-- ==============================================
-- Copy and paste the entire contents of your dump file:
-- /Users/mubeenkazi/Downloads/supabase_dump_2025-09-07.sql
-- Run that here

-- ==============================================
-- 3. ADD MISSING FUNCTIONS
-- ==============================================

-- Cleanup expired temporary blocks function
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

-- ==============================================
-- 4. ADD SAMPLE INTERVIEWERS (ONLY IF YOU HAVE REAL USERS)
-- ==============================================

-- First, check if you have any existing users
-- If you have real users, you can use their IDs instead

-- Option 1: Use existing user IDs (if you have any)
-- Replace these with actual user IDs from your auth.users table
/*
INSERT INTO profiles (id, email, full_name, role) VALUES 
('your-real-user-id-1', 'sarah.johnson@example.com', 'Sarah Johnson', 'interviewer'),
('your-real-user-id-2', 'michael.chen@example.com', 'Michael Chen', 'interviewer')
ON CONFLICT (id) DO NOTHING;

INSERT INTO interviewers (
    user_id,
    position,
    experience_years,
    skills,
    technologies,
    bio,
    is_eligible,
    company
) VALUES 
(
    'your-real-user-id-1',
    'Senior Software Engineer',
    8,
    ARRAY['React', 'Node.js', 'TypeScript', 'System Design'],
    ARRAY['JavaScript', 'Python', 'AWS', 'Docker', 'Kubernetes'],
    'Experienced full-stack developer with 8+ years in building scalable web applications.',
    true,
    'Tech Company A'
)
ON CONFLICT (user_id) DO NOTHING;
*/

-- Option 2: Just make existing interviewers eligible (if you have any)
-- This will make any existing interviewers visible in the showcase
UPDATE interviewers 
SET is_eligible = true 
WHERE position IS NOT NULL 
  AND experience_years IS NOT NULL
  AND is_eligible = false;

-- ==============================================
-- 5. VERIFY RESTORATION
-- ==============================================

-- Check if tables exist
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if functions exist
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
ORDER BY routine_name;

-- Check existing interviewers
SELECT 
    i.id,
    i.position,
    i.experience_years,
    i.is_eligible,
    p.full_name,
    p.email
FROM interviewers i
LEFT JOIN profiles p ON i.user_id = p.id
ORDER BY i.created_at DESC;

-- Check cleanup function
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name = 'cleanup_expired_temporary_blocks';

-- Check if you have any users in auth.users
SELECT COUNT(*) as total_users FROM auth.users;
