
-- First, ensure the user_role enum type exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('interviewer', 'interviewee');
    END IF;
END $$;

-- Create a simplified trigger function that doesn't use the enum in variables
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
    CASE 
      WHEN (NEW.raw_user_meta_data ->> 'role') = 'interviewer' THEN 'interviewer'::user_role
      ELSE 'interviewee'::user_role
    END
  );
  RETURN NEW;
END;
$$;
