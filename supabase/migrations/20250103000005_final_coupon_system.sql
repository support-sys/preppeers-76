-- Final Coupon System Migration
-- This migration consolidates all coupon-related changes including:
-- 1. Creating the coupons table with proper constraints
-- 2. Adding admin role to user_role enum
-- 3. Creating RLS policies
-- 4. Creating the validate_coupon function with proper type casting
-- 5. Inserting sample coupon data

-- ============================================
-- 1. ADD ADMIN ROLE TO USER_ROLE ENUM
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'admin' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
    ) THEN
        ALTER TYPE public.user_role ADD VALUE 'admin';
    END IF;
END $$;

-- ============================================
-- 2. CREATE COUPONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    coupon_name VARCHAR(50) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    expiring_on DATE NOT NULL,
    plan_type VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (plan_type IN ('all', 'essential', 'professional', 'executive')),
    usage_limit INTEGER DEFAULT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comprehensive comments for documentation
COMMENT ON TABLE public.coupons IS 'Coupon codes for discounting interview plans';
COMMENT ON COLUMN public.coupons.coupon_name IS 'Unique coupon code name (e.g., SAVE20, NEWUSER)';
COMMENT ON COLUMN public.coupons.discount_type IS 'Type of discount: percentage or fixed amount';
COMMENT ON COLUMN public.coupons.discount_value IS 'Discount value (percentage 0-100 or fixed amount in rupees)';
COMMENT ON COLUMN public.coupons.status IS 'Coupon status: active or inactive';
COMMENT ON COLUMN public.coupons.expiring_on IS 'Date when coupon expires';
COMMENT ON COLUMN public.coupons.plan_type IS 'Which plans this coupon applies to: all, essential, professional, executive';
COMMENT ON COLUMN public.coupons.usage_limit IS 'Maximum number of times this coupon can be used (NULL = unlimited)';
COMMENT ON COLUMN public.coupons.usage_count IS 'Current number of times this coupon has been used';

-- ============================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coupons_status ON public.coupons(status);
CREATE INDEX IF NOT EXISTS idx_coupons_expiring_on ON public.coupons(expiring_on);
CREATE INDEX IF NOT EXISTS idx_coupons_plan_type ON public.coupons(plan_type);
CREATE INDEX IF NOT EXISTS idx_coupons_active_expired ON public.coupons(status, expiring_on);
CREATE INDEX IF NOT EXISTS idx_coupons_name ON public.coupons(coupon_name);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. CREATE RLS POLICIES
-- ============================================
-- Allow anyone to view active, non-expired coupons
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (status = 'active' AND expiring_on >= CURRENT_DATE);

-- Allow admin users to manage all coupons
CREATE POLICY "Admin can manage all coupons" ON public.coupons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- ============================================
-- 6. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 7. CREATE UPDATED_AT TRIGGER
-- ============================================
DROP TRIGGER IF EXISTS trigger_update_coupons_updated_at ON public.coupons;
CREATE TRIGGER trigger_update_coupons_updated_at
    BEFORE UPDATE ON public.coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

-- ============================================
-- 8. CREATE VALIDATE_COUPON FUNCTION
-- ============================================
DROP FUNCTION IF EXISTS validate_coupon(TEXT, TEXT);

CREATE OR REPLACE FUNCTION validate_coupon(
    p_coupon_name TEXT,
    p_plan_type TEXT DEFAULT NULL
)
RETURNS TABLE (
    is_valid BOOLEAN,
    discount_type TEXT,
    discount_value DECIMAL,
    message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN c.id IS NULL THEN FALSE
            WHEN c.status != 'active' THEN FALSE
            WHEN c.expiring_on < CURRENT_DATE THEN FALSE
            WHEN c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN FALSE
            WHEN p_plan_type IS NOT NULL AND c.plan_type != 'all' AND c.plan_type != p_plan_type THEN FALSE
            ELSE TRUE
        END as is_valid,
        c.discount_type::TEXT as discount_type,  -- Explicit cast to TEXT
        c.discount_value::DECIMAL as discount_value,  -- Explicit cast to DECIMAL
        CASE 
            WHEN c.id IS NULL THEN 'Coupon not found'
            WHEN c.status != 'active' THEN 'Coupon is not active'
            WHEN c.expiring_on < CURRENT_DATE THEN 'Coupon has expired'
            WHEN c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN 'Coupon usage limit reached'
            WHEN p_plan_type IS NOT NULL AND c.plan_type != 'all' AND c.plan_type != p_plan_type THEN 'Coupon not valid for selected plan'
            ELSE 'Valid coupon'
        END as message
    FROM public.coupons c
    WHERE c.coupon_name = UPPER(p_coupon_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. GRANT PERMISSIONS
-- ============================================
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT ALL ON public.coupons TO authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon TO anon, authenticated;

-- ============================================
-- 10. INSERT SAMPLE COUPON DATA
-- ============================================
-- Clear existing sample data if any
DELETE FROM public.coupons WHERE coupon_name IN (
    'WELCOME20', 'SAVE50', 'PROFESSIONAL15', 'EXECUTIVE100', 'NEWUSER30'
);

-- Insert fresh sample coupons with future expiration dates
INSERT INTO public.coupons (coupon_name, discount_type, discount_value, status, expiring_on, plan_type, usage_limit) VALUES
-- Universal coupons (apply to all plans)
('WELCOME20', 'percentage', 20.00, 'active', '2025-03-31', 'all', 100),
('NEWUSER30', 'percentage', 30.00, 'active', '2025-03-15', 'all', 200),

-- Plan-specific coupons
('SAVE50', 'fixed', 50.00, 'active', '2025-04-30', 'essential', 50),
('PROFESSIONAL15', 'percentage', 15.00, 'active', '2025-04-15', 'professional', NULL),
('EXECUTIVE100', 'fixed', 100.00, 'active', '2025-03-20', 'executive', 25),

-- Additional test coupons
('QUICK10', 'percentage', 10.00, 'active', '2025-02-28', 'all', 75),
('EARLYBIRD25', 'percentage', 25.00, 'active', '2025-03-10', 'all', 150),

-- Inactive coupon for testing
('EXPIRED50', 'fixed', 50.00, 'inactive', '2025-01-01', 'all', 10);

-- ============================================
-- 11. CREATE COUPON USAGE TRACKING FUNCTION (OPTIONAL)
-- ============================================
CREATE OR REPLACE FUNCTION increment_coupon_usage(coupon_name_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_exists BOOLEAN;
BEGIN
    -- Check if coupon exists and is valid
    SELECT EXISTS(
        SELECT 1 FROM public.coupons 
        WHERE coupon_name = UPPER(coupon_name_param)
        AND status = 'active'
        AND expiring_on >= CURRENT_DATE
    ) INTO coupon_exists;
    
    IF NOT coupon_exists THEN
        RETURN FALSE;
    END IF;
    
    -- Increment usage count
    UPDATE public.coupons 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE coupon_name = UPPER(coupon_name_param);
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission for coupon usage tracking
GRANT EXECUTE ON FUNCTION increment_coupon_usage TO anon, authenticated;

-- ============================================
-- 12. VERIFICATION QUERIES
-- ============================================
-- Uncomment these to verify the setup (optional)
-- SELECT 'Coupons table created' as status, COUNT(*) as coupon_count FROM public.coupons;
-- SELECT 'Active coupons' as status, COUNT(*) as active_count FROM public.coupons WHERE status = 'active';
-- SELECT 'Admin role exists' as status, EXISTS(SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')) as admin_role_exists;
