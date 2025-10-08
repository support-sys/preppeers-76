-- Fix increment_coupon_usage function to work with ENUM types
-- This ensures the function exists and handles ENUM properly

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS increment_coupon_usage(TEXT, UUID, UUID, DECIMAL);

-- Recreate with proper ENUM handling
CREATE OR REPLACE FUNCTION increment_coupon_usage(
    coupon_name_param TEXT,
    user_id_param UUID,
    payment_session_id_param UUID,
    discount_amount_param DECIMAL
)
RETURNS BOOLEAN AS $$
DECLARE
    coupon_record RECORD;
    usage_count_check INTEGER;
BEGIN
    RAISE NOTICE 'increment_coupon_usage called with: coupon=%, user=%, session=%, amount=%', 
        coupon_name_param, user_id_param, payment_session_id_param, discount_amount_param;
    
    -- Get coupon details
    SELECT * INTO coupon_record FROM public.coupons 
    WHERE coupon_name = UPPER(coupon_name_param)
    AND status::TEXT = 'active'
    AND expiring_on >= CURRENT_DATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coupon % not found or not active', coupon_name_param;
    END IF;
    
    RAISE NOTICE 'Found coupon: id=%, usage_control=%, current usage_count=%', 
        coupon_record.id, coupon_record.usage_control, coupon_record.usage_count;
    
    -- Check total usage limit
    IF coupon_record.usage_limit IS NOT NULL AND 
       coupon_record.usage_count >= coupon_record.usage_limit THEN
        RAISE EXCEPTION 'Coupon usage limit reached: % >= %', 
            coupon_record.usage_count, coupon_record.usage_limit;
    END IF;
    
    -- Check per-user usage control
    IF coupon_record.usage_control::TEXT = 'once_per_user' THEN
        RAISE NOTICE 'Checking once_per_user constraint for user=%', user_id_param;
        
        SELECT COUNT(*) INTO usage_count_check 
        FROM public.user_coupon_usage ucu
        WHERE ucu.user_id = user_id_param 
        AND ucu.coupon_id = coupon_record.id;
        
        RAISE NOTICE 'User has used this coupon % times before', usage_count_check;
        
        IF usage_count_check > 0 THEN
            RAISE EXCEPTION 'You have already used this coupon. This coupon can only be used once per user.';
        END IF;
    END IF;
    
    -- Record the usage
    RAISE NOTICE 'Inserting into user_coupon_usage table';
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
    
    RAISE NOTICE 'Successfully inserted usage record';
    
    -- Increment usage count (use table-qualified column name to avoid ambiguity)
    RAISE NOTICE 'Updating usage_count from % to %', 
        coupon_record.usage_count, coupon_record.usage_count + 1;
    
    UPDATE public.coupons c
    SET usage_count = c.usage_count + 1,
        updated_at = NOW()
    WHERE c.id = coupon_record.id;
    
    -- Auto-disable if limit reached
    IF coupon_record.usage_limit IS NOT NULL AND 
       (coupon_record.usage_count + 1) >= coupon_record.usage_limit THEN
        RAISE NOTICE 'Usage limit reached, disabling coupon';
        UPDATE public.coupons 
        SET status = 'inactive'::coupon_status,
            updated_at = NOW()
        WHERE id = coupon_record.id;
    END IF;
    
    RAISE NOTICE 'increment_coupon_usage completed successfully';
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION increment_coupon_usage(TEXT, UUID, UUID, DECIMAL) TO anon, authenticated;

COMMENT ON FUNCTION increment_coupon_usage IS 'Tracks coupon usage per user and increments total usage count. Enforces once_per_user constraint.';

-- Add some test logging
DO $$
BEGIN
    RAISE NOTICE 'increment_coupon_usage function recreated successfully';
    RAISE NOTICE 'Checking if user_coupon_usage table exists...';
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_coupon_usage') THEN
        RAISE NOTICE '✓ user_coupon_usage table exists';
    ELSE
        RAISE WARNING '✗ user_coupon_usage table NOT FOUND!';
    END IF;
END $$;

