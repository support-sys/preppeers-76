-- Convert coupon fields from VARCHAR to ENUM types for dropdown support
-- This migration converts status, discount_type, and plan_type to use ENUM

-- Step 1: Create ENUM types
DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('active', 'inactive');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_plan_type AS ENUM ('all', 'essential', 'professional');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Convert STATUS field
-- First, drop any RLS policies that depend on the status column
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.coupons;

-- Add temporary column
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS status_new coupon_status DEFAULT 'active';

-- Copy data
UPDATE public.coupons 
SET status_new = status::coupon_status
WHERE status IS NOT NULL;

-- Drop old column and its check constraint
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
ALTER TABLE public.coupons DROP COLUMN IF EXISTS status CASCADE;

-- Rename new column
ALTER TABLE public.coupons RENAME COLUMN status_new TO status;

-- Recreate RLS policies
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (status = 'active'::coupon_status);

-- Step 3: Convert DISCOUNT_TYPE field
-- Add temporary column
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS discount_type_new coupon_discount_type;

-- Copy data
UPDATE public.coupons 
SET discount_type_new = discount_type::coupon_discount_type
WHERE discount_type IS NOT NULL;

-- Drop old column and its check constraint
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
ALTER TABLE public.coupons DROP COLUMN IF EXISTS discount_type;

-- Rename new column
ALTER TABLE public.coupons RENAME COLUMN discount_type_new TO discount_type;

-- Make discount_type NOT NULL (it was before)
ALTER TABLE public.coupons ALTER COLUMN discount_type SET NOT NULL;

-- Step 4: Convert PLAN_TYPE field
-- Add temporary column
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS plan_type_new coupon_plan_type DEFAULT 'all';

-- Copy data
UPDATE public.coupons 
SET plan_type_new = plan_type::coupon_plan_type
WHERE plan_type IS NOT NULL;

-- Drop old column and its check constraint
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_plan_type_check;
ALTER TABLE public.coupons DROP COLUMN IF EXISTS plan_type;

-- Rename new column
ALTER TABLE public.coupons RENAME COLUMN plan_type_new TO plan_type;

-- Step 5: Add documentation comments
COMMENT ON TYPE coupon_status IS 'Status of coupon: active (can be used) or inactive (disabled)';
COMMENT ON TYPE coupon_discount_type IS 'Type of discount: percentage (%) or fixed (₹)';
COMMENT ON TYPE coupon_plan_type IS 'Plan applicability: all, essential, or professional';

COMMENT ON COLUMN public.coupons.status IS 'Current status of the coupon';
COMMENT ON COLUMN public.coupons.discount_type IS 'Type of discount applied by this coupon';
COMMENT ON COLUMN public.coupons.plan_type IS 'Which plan(s) this coupon is valid for';

-- Step 6: Recreate indexes (they were dropped with the old columns)
DROP INDEX IF EXISTS idx_coupons_status;
CREATE INDEX idx_coupons_status ON public.coupons(status);

DROP INDEX IF EXISTS idx_coupons_plan_type;
CREATE INDEX idx_coupons_plan_type ON public.coupons(plan_type);

DROP INDEX IF EXISTS idx_coupons_active_expired;
CREATE INDEX idx_coupons_active_expired ON public.coupons(status, expiring_on);

