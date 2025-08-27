-- Clean fix for admin RLS policies
-- This migration safely removes and recreates all admin policies

-- First, drop ALL existing policies for admins table to avoid conflicts
DO $$ 
DECLARE
    policy_name text;
BEGIN
    -- Get all policy names for the admins table
    FOR policy_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'admins' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.admins', policy_name);
    END LOOP;
END $$;

-- Disable RLS temporarily to clean up
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create new, simple policies that avoid recursion

-- Policy 1: Allow users to read their own admin record
CREATE POLICY "admin_select_own_record" ON public.admins
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy 2: Allow users to insert their own admin record (for initial setup)
CREATE POLICY "admin_insert_own_record" ON public.admins
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Allow users to update their own admin record
CREATE POLICY "admin_update_own_record" ON public.admins
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy 4: Allow users to delete their own admin record
CREATE POLICY "admin_delete_own_record" ON public.admins
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Now recreate all the admin functions with explicit schema references
-- These functions will handle permission checks internally

-- Function 1: Get all users (admin only)
CREATE OR REPLACE FUNCTION public.get_all_users_admin()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  role user_role,
  created_at TIMESTAMP WITH TIME ZONE,
  last_sign_in TIMESTAMP WITH TIME ZONE,
  profile_complete BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin by checking profiles table first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.created_at,
    au.last_sign_in_at,
    CASE 
      WHEN p.role = 'interviewer'::user_role THEN EXISTS(SELECT 1 FROM public.interviewers WHERE user_id = p.id)
      WHEN p.role = 'interviewee'::user_role THEN EXISTS(SELECT 1 FROM public.interviewees WHERE user_id = p.id)
      ELSE TRUE
    END as profile_complete
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.role IN ('interviewer'::user_role, 'interviewee'::user_role)
  ORDER BY p.created_at DESC;
END;
$$;

-- Function 2: Get all interviews (admin only)
CREATE OR REPLACE FUNCTION public.get_all_interviews_admin()
RETURNS TABLE(
  interview_id UUID,
  candidate_name TEXT,
  candidate_email TEXT,
  interviewer_name TEXT,
  interviewer_email TEXT,
  scheduled_time TIMESTAMP WITH TIME ZONE,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  target_role TEXT,
  experience TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin by checking profiles table first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    i.id,
    i.candidate_name,
    i.candidate_email,
    i.interviewer_name,
    i.interviewer_email,
    i.scheduled_time,
    i.status,
    i.created_at,
    i.target_role,
    i.experience
  FROM public.interviews i
  ORDER BY i.scheduled_time DESC;
END;
$$;

-- Function 3: Get dashboard stats (admin only)
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE(
  total_users BIGINT,
  total_interviews BIGINT,
  today_interviews BIGINT,
  active_users_week BIGINT,
  completed_interviews BIGINT,
  pending_interviews BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin by checking profiles table first
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles WHERE role IN ('interviewer', 'interviewee')) as total_users,
    (SELECT COUNT(*) FROM public.interviews) as total_interviews,
    (SELECT COUNT(*) FROM public.interviews WHERE DATE(scheduled_time) = CURRENT_DATE) as today_interviews,
    (SELECT COUNT(DISTINCT id) FROM public.profiles WHERE created_at >= NOW() - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(*) FROM public.interviews WHERE status = 'completed') as completed_interviews,
    (SELECT COUNT(*) FROM public.interviews WHERE status = 'scheduled') as pending_interviews;
END;
$$;

-- Function 4: Update user status (admin with manage_users permission)
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  target_user_id UUID,
  new_role user_role DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin with manage_users permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admins a ON p.id = a.user_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'::user_role 
    AND ('manage_users' = ANY(a.permissions) OR a.is_super_admin = TRUE)
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin manage_users permission required';
  END IF;
  
  -- Update the user's role if provided
  IF new_role IS NOT NULL THEN
    UPDATE public.profiles 
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function 5: Update interview status (admin with manage_interviews permission)
CREATE OR REPLACE FUNCTION public.admin_update_interview_status(
  interview_id UUID,
  new_status TEXT,
  admin_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin with manage_interviews permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admins a ON p.id = a.user_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin'::user_role 
    AND ('manage_interviews' = ANY(a.permissions) OR a.is_super_admin = TRUE)
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin manage_interviews permission required';
  END IF;
  
  -- Update interview status
  UPDATE public.interviews 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = interview_id;
  
  RETURN TRUE;
END;
$$;
