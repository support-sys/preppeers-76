-- Add missing columns to interviewer_time_blocks table for temporary reservations
ALTER TABLE public.interviewer_time_blocks 
ADD COLUMN IF NOT EXISTS is_temporary boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reserved_by_user_id uuid;

-- Add foreign key constraint for reserved_by_user_id
ALTER TABLE public.interviewer_time_blocks 
ADD CONSTRAINT fk_interviewer_time_blocks_reserved_by_user_id 
FOREIGN KEY (reserved_by_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for better performance on temporary reservations
CREATE INDEX IF NOT EXISTS idx_interviewer_time_blocks_temporary 
ON public.interviewer_time_blocks (is_temporary, expires_at) 
WHERE is_temporary = true;

-- Create index for reserved_by_user_id lookups
CREATE INDEX IF NOT EXISTS idx_interviewer_time_blocks_reserved_by_user 
ON public.interviewer_time_blocks (reserved_by_user_id) 
WHERE is_temporary = true;
