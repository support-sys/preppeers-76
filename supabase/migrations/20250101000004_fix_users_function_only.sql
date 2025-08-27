-- Fix only the get_all_users_admin function with maximum explicit qualification

-- Drop the existing function completely
DROP FUNCTION IF EXISTS public.get_all_users_admin();

-- Recreate with extremely explicit column qualification
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
DECLARE
  current_user_id UUID;
  current_user_role user_role;
BEGIN
  -- Get current user info explicitly
  current_user_id := auth.uid();
  
  -- Check user role explicitly from profiles table only
  SELECT profiles.role INTO current_user_role 
  FROM public.profiles 
  WHERE profiles.id = current_user_id;
  
  -- Check if user is admin
  IF current_user_role != 'admin'::user_role THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Return the query with fully qualified column names
  RETURN QUERY
  SELECT 
    profiles.id,
    profiles.email,
    profiles.full_name,
    profiles.role,
    profiles.created_at,
    auth_users.last_sign_in_at,
    CASE 
      WHEN profiles.role = 'interviewer'::user_role THEN 
        EXISTS(SELECT 1 FROM public.interviewers WHERE interviewers.user_id = profiles.id)
      WHEN profiles.role = 'interviewee'::user_role THEN 
        EXISTS(SELECT 1 FROM public.interviewees WHERE interviewees.user_id = profiles.id)
      ELSE TRUE
    END as profile_complete
  FROM public.profiles
  LEFT JOIN auth.users auth_users ON profiles.id = auth_users.id
  WHERE profiles.role IN ('interviewer'::user_role, 'interviewee'::user_role)
  ORDER BY profiles.created_at DESC;
END;
$$;
