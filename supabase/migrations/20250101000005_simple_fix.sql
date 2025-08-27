-- Simple fix for the exact ambiguous column issues

DROP FUNCTION IF EXISTS public.get_all_users_admin();

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
  -- Check if user is admin by checking profiles table first (FIX: qualify the role column)
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::user_role
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
