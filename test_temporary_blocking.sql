-- Test script for temporary blocking system
-- Run this in Supabase SQL Editor to verify the system works

-- 1. Check if the new columns exist
SELECT 
  'Column Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interviewer_time_blocks' 
    AND column_name = 'is_temporary'
  ) THEN '✅ is_temporary column EXISTS' 
  ELSE '❌ is_temporary column MISSING' 
  END as result;

SELECT 
  'Column Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interviewer_time_blocks' 
    AND column_name = 'expires_at'
  ) THEN '✅ expires_at column EXISTS' 
  ELSE '❌ expires_at column MISSING' 
  END as result;

SELECT 
  'Column Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'interviewer_time_blocks' 
    AND column_name = 'reserved_by_user_id'
  ) THEN '✅ reserved_by_user_id column EXISTS' 
  ELSE '❌ reserved_by_user_id column MISSING' 
  END as result;

-- 2. Check if the functions exist
SELECT 
  'Function Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'create_temporary_reservation'
  ) THEN '✅ create_temporary_reservation function EXISTS' 
  ELSE '❌ create_temporary_reservation function MISSING' 
  END as result;

SELECT 
  'Function Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'convert_temporary_to_permanent'
  ) THEN '✅ convert_temporary_to_permanent function EXISTS' 
  ELSE '❌ convert_temporary_to_permanent function MISSING' 
  END as result;

SELECT 
  'Function Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'cleanup_expired_temporary_blocks'
  ) THEN '✅ cleanup_expired_temporary_blocks function EXISTS' 
  ELSE '❌ cleanup_expired_temporary_blocks function MISSING' 
  END as result;

-- 3. Check if the indexes exist
SELECT 
  'Index Check' as test_type,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'interviewer_time_blocks' 
    AND indexname = 'idx_interviewer_time_blocks_temporary'
  ) THEN '✅ temporary index EXISTS' 
  ELSE '❌ temporary index MISSING' 
  END as result;

-- 4. Test the cleanup function
SELECT 
  'Cleanup Test' as test_type,
  'Running cleanup function...' as action;

SELECT cleanup_expired_temporary_blocks();

-- 5. Show current table structure
SELECT 
  'Table Structure' as test_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'interviewer_time_blocks' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Check for any existing temporary blocks
SELECT 
  'Existing Data' as test_type,
  COUNT(*) as total_blocks,
  COUNT(CASE WHEN is_temporary = true THEN 1 END) as temporary_blocks,
  COUNT(CASE WHEN is_temporary = false THEN 1 END) as permanent_blocks
FROM interviewer_time_blocks;

-- 7. Show sample of existing data
SELECT 
  'Sample Data' as test_type,
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
FROM interviewer_time_blocks 
ORDER BY created_at DESC 
LIMIT 5;
