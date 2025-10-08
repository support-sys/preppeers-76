-- Add coupon usage control field
-- This migration adds a field to control whether coupons can be used once per user or multiple times

-- Create ENUM type for usage control
DO $$ BEGIN
    CREATE TYPE coupon_usage_control AS ENUM ('once_per_user', 'multiple_per_user');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add usage control field to coupons table using ENUM
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS usage_control coupon_usage_control DEFAULT 'multiple_per_user';

-- Add comments for documentation
COMMENT ON TYPE coupon_usage_control IS 'Controls how coupons can be used: once_per_user (one-time use per user) or multiple_per_user (unlimited use per user)';
COMMENT ON COLUMN public.coupons.usage_control IS 'Controls coupon usage: once_per_user (each user can use only once) or multiple_per_user (users can use multiple times)';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_coupons_usage_control ON public.coupons(usage_control);

-- Create user_coupon_usage table to track individual user coupon usage
CREATE TABLE IF NOT EXISTS public.user_coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    payment_session_id UUID NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discount_amount DECIMAL(10,2) NOT NULL,
    
    -- Ensure unique combination for once_per_user coupons
    UNIQUE(user_id, coupon_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_user_id ON public.user_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_coupon_id ON public.user_coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_payment_session ON public.user_coupon_usage(payment_session_id);

-- Enable RLS
ALTER TABLE public.user_coupon_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own coupon usage" ON public.user_coupon_usage
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert coupon usage records" ON public.user_coupon_usage
    FOR INSERT WITH CHECK (true); -- Allow system to insert usage records

-- Update the increment_coupon_usage function to handle usage control
CREATE OR REPLACE FUNCTION increment_coupon_usage(
    coupon_name_param TEXT,
    user_id_param UUID,
    payment_session_id_param UUID,
    discount_amount_param DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_record RECORD;
    usage_count INTEGER;
    can_use BOOLEAN := TRUE;
BEGIN
    -- Get coupon details and check if it exists
    SELECT * INTO coupon_record FROM public.coupons 
    WHERE coupon_name = UPPER(coupon_name_param)
    AND status = 'active'
    AND expiring_on >= CURRENT_DATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coupon not found or not active';
    END IF;
    
    -- Check usage limit (total across all users)
    IF coupon_record.usage_limit IS NOT NULL AND 
       coupon_record.usage_count >= coupon_record.usage_limit THEN
        RAISE EXCEPTION 'Coupon usage limit reached';
    END IF;
    
    -- Check per-user usage control
    IF coupon_record.usage_control = 'once_per_user' THEN
        -- Check if user has already used this coupon
        SELECT COUNT(*) INTO usage_count 
        FROM public.user_coupon_usage 
        WHERE user_id = user_id_param 
        AND coupon_id = coupon_record.id;
        
        IF usage_count > 0 THEN
            RAISE EXCEPTION 'You have already used this coupon. This coupon can only be used once per user.';
        END IF;
    END IF;
    
    -- Record the usage for this user
    INSERT INTO public.user_coupon_usage (
        user_id, 
        coupon_id, 
        payment_session_id, 
        discount_amount
    ) VALUES (
        user_id_param, 
        coupon_record.id, 
        payment_session_id_param, 
        discount_amount_param
    );
    
    -- Increment total usage count
    UPDATE public.coupons 
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id = coupon_record.id;
    
    -- Check if total usage limit is now reached and disable if needed
    IF coupon_record.usage_limit IS NOT NULL AND 
       (coupon_record.usage_count + 1) >= coupon_record.usage_limit THEN
        UPDATE public.coupons 
        SET status = 'inactive',
            updated_at = NOW()
        WHERE id = coupon_record.id;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the existing validate_coupon function first to avoid conflicts
DROP FUNCTION IF EXISTS validate_coupon(TEXT, TEXT);

-- Update the validate_coupon function to handle usage control
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
            WHEN c.status != 'active' THEN FALSE
            WHEN c.expiring_on < CURRENT_DATE THEN FALSE
            WHEN c.usage_limit IS NOT NULL AND c.usage_count >= c.usage_limit THEN FALSE
            WHEN p_plan_type IS NOT NULL AND c.plan_type != 'all' AND c.plan_type != p_plan_type THEN FALSE
            -- Check once_per_user constraint
            WHEN c.usage_control = 'once_per_user' AND p_user_id IS NOT NULL AND 
                 EXISTS(SELECT 1 FROM public.user_coupon_usage WHERE user_id = p_user_id AND coupon_id = c.id) THEN FALSE
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
            WHEN c.usage_control = 'once_per_user' AND p_user_id IS NOT NULL AND 
                 EXISTS(SELECT 1 FROM public.user_coupon_usage WHERE user_id = p_user_id AND coupon_id = c.id) THEN 'You have already used this coupon'
            ELSE 'Valid coupon'
        END as message
    FROM public.coupons c
    WHERE c.coupon_name = UPPER(p_coupon_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions with explicit function signatures
GRANT EXECUTE ON FUNCTION increment_coupon_usage(TEXT, UUID, UUID, DECIMAL) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_coupon(TEXT, TEXT, UUID) TO anon, authenticated;
GRANT SELECT ON public.user_coupon_usage TO authenticated;

-- Update existing coupons to have default usage control
UPDATE public.coupons 
SET usage_control = 'multiple_per_user' 
WHERE usage_control IS NULL;

-- Add sample coupons with different usage controls
INSERT INTO public.coupons (coupon_name, discount_type, discount_value, status, expiring_on, plan_type, usage_limit, usage_control) VALUES
-- Once per user coupon
('FIRSTTIME20', 'percentage', 20.00, 'active', '2025-12-31', 'all', 500, 'once_per_user'),
-- Multiple per user coupon  
('LOYALTY10', 'percentage', 10.00, 'active', '2025-12-31', 'all', 1000, 'multiple_per_user'),
-- Limited total usage, once per user
('EXCLUSIVE50', 'fixed', 50.00, 'active', '2025-06-30', 'professional', 100, 'once_per_user');

-- Add comment for documentation
COMMENT ON TABLE public.user_coupon_usage IS 'Tracks individual user coupon usage for once_per_user coupons';
