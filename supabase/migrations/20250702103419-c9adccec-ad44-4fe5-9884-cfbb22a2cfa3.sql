
-- First, let's make sure we clean up everything properly
DO $$ 
BEGIN
    -- Drop trigger first
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Drop function
    DROP FUNCTION IF EXISTS public.handle_new_user();
    
    -- Drop tables in correct order (child tables first)
    DROP TABLE IF EXISTS public.interviewees CASCADE;
    DROP TABLE IF EXISTS public.interviewers CASCADE;
    DROP TABLE IF EXISTS public.profiles CASCADE;
    
    -- Drop enum type
    DROP TYPE IF EXISTS public.user_role CASCADE;
    
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore errors if objects don't exist
END $$;

-- Now create everything fresh
CREATE TYPE public.user_role AS ENUM ('interviewer', 'interviewee');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    role public.user_role NOT NULL DEFAULT 'interviewee',
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create interviewers table
CREATE TABLE public.interviewers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    experience_years INTEGER,
    company TEXT,
    position TEXT,
    skills TEXT[] DEFAULT '{}',
    technologies TEXT[] DEFAULT '{}',
    availability_days TEXT[] DEFAULT '{}',
    time_slots JSONB DEFAULT '{}',
    bio TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create interviewees table
CREATE TABLE public.interviewees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    experience_level TEXT,
    target_role TEXT,
    target_companies TEXT[] DEFAULT '{}',
    skills_to_practice TEXT[] DEFAULT '{}',
    interview_types TEXT[] DEFAULT '{}',
    preferred_interview_length INTEGER DEFAULT 60,
    bio TEXT,
    resume_url TEXT,
    linkedin_url TEXT,
    github_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviewees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "interviewers_select_all" ON public.interviewers FOR SELECT TO authenticated USING (true);
CREATE POLICY "interviewers_manage_own" ON public.interviewers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "interviewees_select_own" ON public.interviewees FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "interviewees_manage_own" ON public.interviewees FOR ALL USING (auth.uid() = user_id);

-- Create the trigger function with proper error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
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
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
        user_role_value
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise it
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RAISE;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();
