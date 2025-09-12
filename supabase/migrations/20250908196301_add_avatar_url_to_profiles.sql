-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to the column
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL of the user profile avatar image';

-- Update any existing profiles to have a default avatar if needed
UPDATE public.profiles 
SET avatar_url = 'https://via.placeholder.com/150x150?text=User' 
WHERE avatar_url IS NULL;
