-- Fix RLS policies for admins table to avoid infinite recursion

-- Drop existing policies first
DROP POLICY IF EXISTS "Admins can view their own record" ON public.admins;
DROP POLICY IF EXISTS "Allow users to check if they are admin" ON public.admins;
DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;

-- Create simple, non-recursive policies

-- Allow users to read their own admin record (essential for auth flow)
CREATE POLICY "Enable read access for own record" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- Allow insert only for authenticated users (new admin creation)
CREATE POLICY "Enable insert for authenticated users" ON public.admins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow update only for own record
CREATE POLICY "Enable update for own record" ON public.admins
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow delete only for own record
CREATE POLICY "Enable delete for own record" ON public.admins
  FOR DELETE USING (auth.uid() = user_id);

-- Update admin functions to use simpler checks
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
    WHERE id = auth.uid() AND role = 'admin'
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
      WHEN p.role = 'interviewer' THEN EXISTS(SELECT 1 FROM public.interviewers WHERE user_id = p.id)
      WHEN p.role = 'interviewee' THEN EXISTS(SELECT 1 FROM public.interviewees WHERE user_id = p.id)
      ELSE TRUE
    END as profile_complete
  FROM public.profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.role IN ('interviewer', 'interviewee')
  ORDER BY p.created_at DESC;
END;
$$;

-- Update admin interviews function
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
    WHERE id = auth.uid() AND role = 'admin'
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

-- Update dashboard stats function
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
    WHERE id = auth.uid() AND role = 'admin'
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

-- Update user management function
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
    AND p.role = 'admin' 
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

-- Update interview management function
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
    AND p.role = 'admin' 
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
