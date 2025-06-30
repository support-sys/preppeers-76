
-- Check if tables exist and create only if they don't exist
DO $$
BEGIN
    -- Create profiles table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE public.profiles (
            id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            email TEXT NOT NULL,
            full_name TEXT,
            role user_role NOT NULL,
            phone TEXT,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        );
        
        -- Enable RLS for profiles
        ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
        
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
    END IF;

    -- Create interviewers table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interviewers') THEN
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
        
        -- Enable RLS for interviewers
        ALTER TABLE public.interviewers ENABLE ROW LEVEL SECURITY;
        
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
    END IF;

    -- Create interviewees table if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interviewees') THEN
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
        
        -- Enable RLS for interviewees
        ALTER TABLE public.interviewees ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for interviewees
        CREATE POLICY "Users can view their own interviewee profile" 
            ON public.interviewees 
            FOR SELECT 
            USING (auth.uid() = user_id);

        CREATE POLICY "Users can manage their own interviewee profile" 
            ON public.interviewees 
            FOR ALL 
            USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create or replace the trigger function and trigger
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
    COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'interviewee'::user_role)
  );
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
