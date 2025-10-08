-- Convert usage_control from VARCHAR to ENUM type
-- This migration converts the existing usage_control field to use ENUM for dropdown support

-- Step 1: Create ENUM type for usage control
DO $$ BEGIN
    CREATE TYPE coupon_usage_control AS ENUM ('once_per_user', 'multiple_per_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Add a temporary column with ENUM type
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS usage_control_new coupon_usage_control DEFAULT 'multiple_per_user';

-- Step 3: Copy data from old column to new column
UPDATE public.coupons 
SET usage_control_new = usage_control::coupon_usage_control
WHERE usage_control IS NOT NULL;

-- Step 4: Drop the old VARCHAR column
ALTER TABLE public.coupons 
DROP COLUMN IF EXISTS usage_control;

-- Step 5: Rename the new column to the original name
ALTER TABLE public.coupons 
RENAME COLUMN usage_control_new TO usage_control;

-- Step 6: Add comments for documentation
COMMENT ON TYPE coupon_usage_control IS 'Controls how coupons can be used: once_per_user (one-time use per user) or multiple_per_user (unlimited use per user)';
COMMENT ON COLUMN public.coupons.usage_control IS 'Controls coupon usage: once_per_user (each user can use only once) or multiple_per_user (users can use multiple times)';

-- Step 7: Recreate index (it was dropped with the old column)
DROP INDEX IF EXISTS idx_coupons_usage_control;
CREATE INDEX idx_coupons_usage_control ON public.coupons(usage_control);

