-- Add admin role to user_role enum
ALTER TYPE public.user_role ADD VALUE 'admin';

-- Create admins table
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  permissions TEXT[] DEFAULT ARRAY['view_users', 'manage_users', 'view_interviews', 'manage_interviews'],
  is_super_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admin can only see their own record (avoid recursion by using profiles table)
CREATE POLICY "Admins can view their own record" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- Allow authenticated users to read their own admin record (needed for auth flow)
CREATE POLICY "Allow users to check if they are admin" ON public.admins
  FOR SELECT USING (auth.uid() = user_id);

-- Only super admins can insert/update/delete (avoid recursion by checking profiles first)
CREATE POLICY "Super admins can manage admins" ON public.admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.admins a ON p.id = a.user_id
      WHERE p.id = auth.uid() 
      AND p.role = 'admin' 
      AND a.is_super_admin = TRUE
    )
  );

-- Function to get all users for admin dashboard
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
  -- Only allow admins to call this function
  IF NOT EXISTS (
    SELECT 1 FROM admins a 
    JOIN profiles p ON a.user_id = p.id 
    WHERE p.id = auth.uid() AND p.role = 'admin'
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
      WHEN p.role = 'interviewer' THEN EXISTS(SELECT 1 FROM interviewers WHERE user_id = p.id)
      WHEN p.role = 'interviewee' THEN EXISTS(SELECT 1 FROM interviewees WHERE user_id = p.id)
      ELSE TRUE
    END as profile_complete
  FROM profiles p
  LEFT JOIN auth.users au ON p.id = au.id
  WHERE p.role IN ('interviewer', 'interviewee')
  ORDER BY p.created_at DESC;
END;
$$;

-- Function to get all interviews for admin dashboard
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
  -- Only allow admins to call this function
  IF NOT EXISTS (
    SELECT 1 FROM admins a 
    JOIN profiles p ON a.user_id = p.id 
    WHERE p.id = auth.uid() AND p.role = 'admin'
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
  FROM interviews i
  ORDER BY i.scheduled_time DESC;
END;
$$;

-- Function to get dashboard stats
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
  -- Only allow admins to call this function
  IF NOT EXISTS (
    SELECT 1 FROM admins a 
    JOIN profiles p ON a.user_id = p.id 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles WHERE role IN ('interviewer', 'interviewee')) as total_users,
    (SELECT COUNT(*) FROM interviews) as total_interviews,
    (SELECT COUNT(*) FROM interviews WHERE DATE(scheduled_time) = CURRENT_DATE) as today_interviews,
    (SELECT COUNT(DISTINCT id) FROM profiles WHERE created_at >= NOW() - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(*) FROM interviews WHERE status = 'completed') as completed_interviews,
    (SELECT COUNT(*) FROM interviews WHERE status = 'scheduled') as pending_interviews;
END;
$$;

-- Function to update user status (for admin management)
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
  -- Only allow admins with manage_users permission
  IF NOT EXISTS (
    SELECT 1 FROM admins a 
    JOIN profiles p ON a.user_id = p.id 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND 'manage_users' = ANY(a.permissions)
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin manage_users permission required';
  END IF;
  
  -- Update the user's role if provided
  IF new_role IS NOT NULL THEN
    UPDATE profiles 
    SET role = new_role, updated_at = NOW()
    WHERE id = target_user_id;
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to cancel/reschedule interview (admin)
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
  -- Only allow admins with manage_interviews permission
  IF NOT EXISTS (
    SELECT 1 FROM admins a 
    JOIN profiles p ON a.user_id = p.id 
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND 'manage_interviews' = ANY(a.permissions)
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin manage_interviews permission required';
  END IF;
  
  -- Update interview status
  UPDATE interviews 
  SET 
    status = new_status,
    updated_at = NOW()
  WHERE id = interview_id;
  
  RETURN TRUE;
END;
$$;
