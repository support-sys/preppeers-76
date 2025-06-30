
-- Drop all existing tables and types
DROP TABLE IF EXISTS public.interviewees CASCADE;
DROP TABLE IF EXISTS public.interviewers CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('interviewer', 'interviewee');

-- Create profiles table to store additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create interviewers table for interviewer-specific data
CREATE TABLE public.interviewers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_years INTEGER,
  company TEXT,
  position TEXT,
  skills TEXT[] DEFAULT '{}',
  technologies TEXT[] DEFAULT '{}',
  availability_days TEXT[] DEFAULT '{}',
  time_slots JSONB DEFAULT '{}',
  hourly_rate DECIMAL(10,2),
  bio TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create interviewees table for interviewee-specific data
CREATE TABLE public.interviewees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interviewees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create RLS policies for interviewers
CREATE POLICY "Users can view all interviewer profiles" 
  ON public.interviewers 
  FOR SELECT 
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own interviewer profile" 
  ON public.interviewers 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for interviewees
CREATE POLICY "Users can view their own interviewee profile" 
  ON public.interviewees 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interviewee profile" 
  ON public.interviewees 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create function to handle new user registration
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

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
