-- Complete Database Restoration Script
-- Run this in Supabase SQL Editor to restore all tables and functions

-- ==============================================
-- 1. RESTORE YOUR MAIN DATABASE DUMP
-- ==============================================
-- First, copy and paste the entire contents of your dump file:
-- /Users/mubeenkazi/Downloads/supabase_dump_2025-09-07.sql
-- Run that first, then run the rest of this script

-- ==============================================
-- 2. ADD MISSING FUNCTIONS
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
-- 3. ADD SAMPLE INTERVIEWERS FOR TESTING
-- ==============================================

-- Insert sample profiles (if they don't exist)
INSERT INTO profiles (id, email, full_name, role) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'sarah.johnson@example.com', 'Sarah Johnson', 'interviewer'),
('550e8400-e29b-41d4-a716-446655440002', 'michael.chen@example.com', 'Michael Chen', 'interviewer'),
('550e8400-e29b-41d4-a716-446655440003', 'david.rodriguez@example.com', 'David Rodriguez', 'interviewer'),
('550e8400-e29b-41d4-a716-446655440004', 'emma.wilson@example.com', 'Emma Wilson', 'interviewer'),
('550e8400-e29b-41d4-a716-446655440005', 'alex.kumar@example.com', 'Alex Kumar', 'interviewer')
ON CONFLICT (id) DO NOTHING;

-- Insert sample interviewers
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
    '550e8400-e29b-41d4-a716-446655440001',
    'Senior Software Engineer',
    8,
    ARRAY['React', 'Node.js', 'TypeScript', 'System Design'],
    ARRAY['JavaScript', 'Python', 'AWS', 'Docker', 'Kubernetes'],
    'Experienced full-stack developer with 8+ years in building scalable web applications. Passionate about mentoring and helping developers grow.',
    true,
    'Tech Company A'
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Tech Lead',
    10,
    ARRAY['System Design', 'Microservices', 'Leadership', 'Architecture'],
    ARRAY['Java', 'Spring Boot', 'Kubernetes', 'MongoDB', 'Redis'],
    'Tech lead with 10+ years experience in building enterprise-grade systems. Expert in system design and team leadership.',
    true,
    'Tech Company B'
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'Principal Engineer',
    12,
    ARRAY['Architecture', 'DevOps', 'Cloud', 'Scalability'],
    ARRAY['Python', 'Go', 'Terraform', 'AWS', 'Docker'],
    'Principal engineer with 12+ years in cloud architecture and DevOps. Specializes in building resilient, scalable systems.',
    true,
    'Tech Company C'
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'Senior Frontend Engineer',
    7,
    ARRAY['React', 'Vue.js', 'TypeScript', 'UI/UX'],
    ARRAY['JavaScript', 'CSS', 'Webpack', 'Jest', 'Cypress'],
    'Senior frontend engineer with 7+ years in creating beautiful, performant user interfaces. Expert in modern JavaScript frameworks.',
    true,
    'Tech Company D'
),
(
    '550e8400-e29b-41d4-a716-446655440005',
    'Backend Engineer',
    6,
    ARRAY['API Design', 'Database Design', 'Performance'],
    ARRAY['Node.js', 'PostgreSQL', 'Redis', 'GraphQL', 'Docker'],
    'Backend engineer with 6+ years in building robust APIs and database systems. Focused on performance and scalability.',
    true,
    'Tech Company E'
)
ON CONFLICT (user_id) DO NOTHING;

-- ==============================================
-- 4. VERIFY RESTORATION
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

-- Check interviewers
SELECT 
    i.id,
    i.position,
    i.experience_years,
    i.is_eligible,
    p.full_name
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
