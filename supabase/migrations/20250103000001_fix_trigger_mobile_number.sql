-- Fix the handle_new_user trigger function to properly handle mobile_number
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    user_role_value public.user_role;
    mobile_value text;
BEGIN
    -- Determine user role from metadata
    IF (NEW.raw_user_meta_data ->> 'role') = 'interviewer' THEN
        user_role_value := 'interviewer'::public.user_role;
    ELSE
        user_role_value := 'interviewee'::public.user_role;
    END IF;
    
    -- Extract mobile number from metadata - check multiple possible keys
    mobile_value := COALESCE(
        NEW.raw_user_meta_data ->> 'mobile_number',
        NEW.raw_user_meta_data ->> 'mobileNumber',
        NEW.raw_user_meta_data ->> 'phone',
        NEW.raw_user_meta_data ->> 'phone_number'
    );
    
    -- Log the mobile number for debugging
    RAISE LOG 'handle_new_user: mobile_number from metadata: %', mobile_value;
    RAISE LOG 'handle_new_user: raw_user_meta_data: %', NEW.raw_user_meta_data;
    
    -- Insert the profile with mobile_number
    INSERT INTO public.profiles (id, email, full_name, role, mobile_number)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        user_role_value,
        mobile_value
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
