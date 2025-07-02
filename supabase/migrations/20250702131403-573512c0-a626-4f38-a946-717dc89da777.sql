
-- Add new columns to the interviewers table for enhanced schedule management
ALTER TABLE public.interviewers 
ADD COLUMN current_available_date DATE,
ADD COLUMN current_time_slots JSONB DEFAULT '{}',
ADD COLUMN schedule_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the schedule_last_updated column whenever the table is modified
CREATE OR REPLACE FUNCTION update_schedule_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.schedule_last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the timestamp
CREATE TRIGGER update_interviewers_schedule_timestamp
    BEFORE UPDATE ON public.interviewers
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_timestamp();

-- Add index for better performance on date queries
CREATE INDEX idx_interviewers_current_available_date 
ON public.interviewers(current_available_date);

-- Update the handle_new_user function to handle mobile number
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
    
    -- Insert the profile with mobile number
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
