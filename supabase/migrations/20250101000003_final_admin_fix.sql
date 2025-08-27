-- Final fix for ambiguous column reference in admin functions
-- This migration explicitly drops and recreates the problematic function

-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_all_users_admin();

-- Recreate the function with explicit table qualifications
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
    SELECT 1 FROM public.profiles prof
    WHERE prof.id = auth.uid() AND prof.role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    prof.id as user_id,
    prof.email,
    prof.full_name,
    prof.role,
    prof.created_at,
    au.last_sign_in_at,
    CASE 
      WHEN prof.role = 'interviewer'::user_role THEN EXISTS(
        SELECT 1 FROM public.interviewers iv WHERE iv.user_id = prof.id
      )
      WHEN prof.role = 'interviewee'::user_role THEN EXISTS(
        SELECT 1 FROM public.interviewees ie WHERE ie.user_id = prof.id
      )
      ELSE TRUE
    END as profile_complete
  FROM public.profiles prof
  LEFT JOIN auth.users au ON prof.id = au.id
  WHERE prof.role IN ('interviewer'::user_role, 'interviewee'::user_role)
  ORDER BY prof.created_at DESC;
END;
$$;

-- Also recreate the other admin functions to ensure consistency

-- Drop and recreate get_all_interviews_admin
DROP FUNCTION IF EXISTS public.get_all_interviews_admin();

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
    SELECT 1 FROM public.profiles prof
    WHERE prof.id = auth.uid() AND prof.role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    intv.id as interview_id,
    intv.candidate_name,
    intv.candidate_email,
    intv.interviewer_name,
    intv.interviewer_email,
    intv.scheduled_time,
    intv.status,
    intv.created_at,
    intv.target_role,
    intv.experience
  FROM public.interviews intv
  ORDER BY intv.scheduled_time DESC;
END;
$$;

-- Drop and recreate get_admin_dashboard_stats
DROP FUNCTION IF EXISTS public.get_admin_dashboard_stats();

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
    SELECT 1 FROM public.profiles prof
    WHERE prof.id = auth.uid() AND prof.role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.profiles prof WHERE prof.role IN ('interviewer'::user_role, 'interviewee'::user_role)) as total_users,
    (SELECT COUNT(*) FROM public.interviews) as total_interviews,
    (SELECT COUNT(*) FROM public.interviews intv WHERE DATE(intv.scheduled_time) = CURRENT_DATE) as today_interviews,
    (SELECT COUNT(DISTINCT prof.id) FROM public.profiles prof WHERE prof.created_at >= NOW() - INTERVAL '7 days') as active_users_week,
    (SELECT COUNT(*) FROM public.interviews intv WHERE intv.status = 'completed') as completed_interviews,
    (SELECT COUNT(*) FROM public.interviews intv WHERE intv.status = 'scheduled') as pending_interviews;
END;
$$;

-- Drop and recreate admin_update_user_status
DROP FUNCTION IF EXISTS public.admin_update_user_status(UUID, user_role);

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
    SELECT 1 FROM public.profiles prof
    JOIN public.admins adm ON prof.id = adm.user_id
    WHERE prof.id = auth.uid() 
    AND prof.role = 'admin'::user_role 
    AND ('manage_users' = ANY(adm.permissions) OR adm.is_super_admin = TRUE)
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

-- Drop and recreate admin_update_interview_status
DROP FUNCTION IF EXISTS public.admin_update_interview_status(UUID, TEXT, TEXT);

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
    SELECT 1 FROM public.profiles prof
    JOIN public.admins adm ON prof.id = adm.user_id
    WHERE prof.id = auth.uid() 
    AND prof.role = 'admin'::user_role 
    AND ('manage_interviews' = ANY(adm.permissions) OR adm.is_super_admin = TRUE)
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
