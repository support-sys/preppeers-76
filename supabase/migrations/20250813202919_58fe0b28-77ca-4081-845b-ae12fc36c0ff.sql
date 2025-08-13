-- Update the handle_new_user function to handle mobile number correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    user_role_value public.user_role;
BEGIN
    -- Determine the user role with explicit casting
    IF (NEW.raw_user_meta_data ->> 'role') = 'interviewer' THEN
        user_role_value := 'interviewer'::public.user_role;
    ELSE
        user_role_value := 'interviewee'::public.user_role;
    END IF;
    
    -- Insert the profile
    INSERT INTO public.profiles (id, email, full_name, role, mobile_number)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        user_role_value,
        NEW.raw_user_meta_data ->> 'mobile_number'
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RAISE;
END;
$function$