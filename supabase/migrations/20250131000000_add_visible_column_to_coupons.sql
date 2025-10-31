-- Add visible column to coupons table
-- This allows coupons to be hidden from the website while still being usable if they are active

-- ============================================
-- 1. ADD VISIBLE COLUMN TO COUPONS TABLE
-- ============================================
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS visible BOOLEAN DEFAULT true NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.coupons.visible IS 'Whether coupon is visible on website. False means hidden but still usable if active';

-- ============================================
-- 2. CREATE INDEX FOR VISIBLE COLUMN
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coupons_visible ON public.coupons(visible);

-- ============================================
-- 3. UPDATE RLS POLICY TO INCLUDE VISIBLE CHECK
-- ============================================
-- Drop old policy
DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;

-- Create new policy with visible check
CREATE POLICY "Anyone can view active, visible coupons" ON public.coupons
    FOR SELECT USING (
        status = 'active' 
        AND expiring_on >= CURRENT_DATE
        AND visible = true
    );

-- ============================================
-- 4. UPDATE VALIDATE_COUPON FUNCTION
-- ============================================
-- The validate_coupon function doesn't need to check visible column
-- because it validates when user enters coupon code, not when displaying
-- So we don't modify it here

-- ============================================
-- 5. GRANT PERMISSIONS (if not already granted)
-- ============================================
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO authenticated;

