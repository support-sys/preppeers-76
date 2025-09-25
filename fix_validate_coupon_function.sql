-- Fix the validate_coupon function to return proper text types
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
        c.discount_type::TEXT as discount_type,
        c.discount_value::DECIMAL as discount_value,
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION validate_coupon TO anon, authenticated;
