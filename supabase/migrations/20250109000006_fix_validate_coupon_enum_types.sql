-- Fix validate_coupon function to handle ENUM types properly
-- This migration updates the function to cast ENUM values correctly

-- Drop existing function
DROP FUNCTION IF EXISTS validate_coupon(TEXT, TEXT, UUID);

-- Recreate with proper ENUM casting
CREATE OR REPLACE FUNCTION validate_coupon(
    p_coupon_name TEXT,
    p_plan_type TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
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
            WHEN c.status::TEXT != 'active' THEN FALSE
            WHEN c.expiring_on < CURRENT_DATE THEN FALSE
            WHEN c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN FALSE
            -- Cast ENUM to TEXT for comparison
            WHEN p_plan_type IS NOT NULL AND c.plan_type::TEXT != 'all' AND c.plan_type::TEXT != p_plan_type THEN FALSE
            -- Check once_per_user constraint
            WHEN c.usage_control::TEXT = 'once_per_user' AND p_user_id IS NOT NULL AND 
                 EXISTS(SELECT 1 FROM public.user_coupon_usage WHERE user_id = p_user_id AND coupon_id = c.id) THEN FALSE
            ELSE TRUE
        END as is_valid,
        c.discount_type::TEXT as discount_type,
        c.discount_value::DECIMAL as discount_value,
        CASE 
            WHEN c.id IS NULL THEN 'Coupon not found'
            WHEN c.status::TEXT != 'active' THEN 'Coupon is not active'
            WHEN c.expiring_on < CURRENT_DATE THEN 'Coupon has expired'
            WHEN c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN 'Coupon usage limit reached'
            WHEN p_plan_type IS NOT NULL AND c.plan_type::TEXT != 'all' AND c.plan_type::TEXT != p_plan_type THEN 'Coupon not valid for selected plan'
            WHEN c.usage_control::TEXT = 'once_per_user' AND p_user_id IS NOT NULL AND 
                 EXISTS(SELECT 1 FROM public.user_coupon_usage WHERE user_id = p_user_id AND coupon_id = c.id) THEN 'You have already used this coupon'
            ELSE 'Valid coupon'
        END as message
    FROM public.coupons c
    WHERE c.coupon_name = UPPER(p_coupon_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_coupon(TEXT, TEXT, UUID) TO anon, authenticated;

COMMENT ON FUNCTION validate_coupon(TEXT, TEXT, UUID) IS 'Validates a coupon code for a specific plan and user, handling ENUM types with explicit casting';

