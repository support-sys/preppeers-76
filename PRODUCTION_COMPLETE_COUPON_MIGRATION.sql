-- ========================================
-- PRODUCTION MIGRATION: Complete Coupon System with ENUM Conversion
-- ========================================
-- This script:
-- 1. Converts VARCHAR fields to ENUM types (for dropdown support)
-- 2. Adds coupon tracking fields to payment_sessions
-- 3. Creates user_coupon_usage table
-- 4. Creates/fixes increment_coupon_usage function
-- 5. Creates/fixes validate_coupon function
-- 6. Fixes existing data
--
-- Safe to run on production - includes transaction safety
-- ========================================

BEGIN;

-- ========================================
-- STEP 1: Create ENUM Types
-- ========================================
DO $$ BEGIN
    CREATE TYPE coupon_status AS ENUM ('active', 'inactive');
    RAISE NOTICE '✓ Created coupon_status ENUM';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '→ coupon_status ENUM already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_discount_type AS ENUM ('percentage', 'fixed');
    RAISE NOTICE '✓ Created coupon_discount_type ENUM';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '→ coupon_discount_type ENUM already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_plan_type AS ENUM ('all', 'essential', 'professional');
    RAISE NOTICE '✓ Created coupon_plan_type ENUM';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '→ coupon_plan_type ENUM already exists';
END $$;

DO $$ BEGIN
    CREATE TYPE coupon_usage_control AS ENUM ('once_per_user', 'multiple_per_user');
    RAISE NOTICE '✓ Created coupon_usage_control ENUM';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE '→ coupon_usage_control ENUM already exists';
END $$;

-- ========================================
-- STEP 2: Convert STATUS field to ENUM
-- ========================================
DO $$ 
BEGIN
    -- Check if column is already ENUM
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' 
        AND column_name = 'status'
        AND udt_name = 'coupon_status'
    ) THEN
        RAISE NOTICE '→ status is already ENUM type';
    ELSE
        -- Drop dependent policies first
        DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
        DROP POLICY IF EXISTS "Enable read access for all users" ON public.coupons;
        
        -- Add temporary column
        ALTER TABLE public.coupons ADD COLUMN status_new coupon_status DEFAULT 'active';
        
        -- Copy data
        UPDATE public.coupons SET status_new = status::coupon_status WHERE status IS NOT NULL;
        
        -- Drop old column
        ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_status_check;
        ALTER TABLE public.coupons DROP COLUMN status CASCADE;
        
        -- Rename
        ALTER TABLE public.coupons RENAME COLUMN status_new TO status;
        
        -- Recreate policies
        CREATE POLICY "Anyone can view active coupons" ON public.coupons
            FOR SELECT USING (status = 'active'::coupon_status);
        
        -- Recreate index
        DROP INDEX IF EXISTS idx_coupons_status;
        CREATE INDEX idx_coupons_status ON public.coupons(status);
        
        RAISE NOTICE '✓ Converted status to ENUM';
    END IF;
END $$;

-- ========================================
-- STEP 3: Convert DISCOUNT_TYPE field to ENUM
-- ========================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' 
        AND column_name = 'discount_type'
        AND udt_name = 'coupon_discount_type'
    ) THEN
        RAISE NOTICE '→ discount_type is already ENUM type';
    ELSE
        ALTER TABLE public.coupons ADD COLUMN discount_type_new coupon_discount_type;
        UPDATE public.coupons SET discount_type_new = discount_type::coupon_discount_type WHERE discount_type IS NOT NULL;
        ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_discount_type_check;
        ALTER TABLE public.coupons DROP COLUMN discount_type;
        ALTER TABLE public.coupons RENAME COLUMN discount_type_new TO discount_type;
        ALTER TABLE public.coupons ALTER COLUMN discount_type SET NOT NULL;
        RAISE NOTICE '✓ Converted discount_type to ENUM';
    END IF;
END $$;

-- ========================================
-- STEP 4: Convert PLAN_TYPE field to ENUM
-- ========================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' 
        AND column_name = 'plan_type'
        AND udt_name = 'coupon_plan_type'
    ) THEN
        RAISE NOTICE '→ plan_type is already ENUM type';
    ELSE
        ALTER TABLE public.coupons ADD COLUMN plan_type_new coupon_plan_type DEFAULT 'all';
        UPDATE public.coupons SET plan_type_new = plan_type::coupon_plan_type WHERE plan_type IS NOT NULL;
        ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_plan_type_check;
        ALTER TABLE public.coupons DROP COLUMN plan_type;
        ALTER TABLE public.coupons RENAME COLUMN plan_type_new TO plan_type;
        
        -- Recreate index
        DROP INDEX IF EXISTS idx_coupons_plan_type;
        CREATE INDEX idx_coupons_plan_type ON public.coupons(plan_type);
        
        RAISE NOTICE '✓ Converted plan_type to ENUM';
    END IF;
END $$;

-- ========================================
-- STEP 5: Convert USAGE_CONTROL field to ENUM
-- ========================================
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'coupons' 
        AND column_name = 'usage_control'
        AND udt_name = 'coupon_usage_control'
    ) THEN
        RAISE NOTICE '→ usage_control is already ENUM type';
    ELSE
        ALTER TABLE public.coupons ADD COLUMN usage_control_new coupon_usage_control DEFAULT 'multiple_per_user';
        UPDATE public.coupons SET usage_control_new = usage_control::coupon_usage_control WHERE usage_control IS NOT NULL;
        ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_usage_control_check;
        ALTER TABLE public.coupons DROP COLUMN usage_control;
        ALTER TABLE public.coupons RENAME COLUMN usage_control_new TO usage_control;
        
        -- Recreate index
        DROP INDEX IF EXISTS idx_coupons_usage_control;
        CREATE INDEX idx_coupons_usage_control ON public.coupons(usage_control);
        
        RAISE NOTICE '✓ Converted usage_control to ENUM';
    END IF;
END $$;

-- Recreate composite index
DROP INDEX IF EXISTS idx_coupons_active_expired;
CREATE INDEX idx_coupons_active_expired ON public.coupons(status, expiring_on);

-- Add documentation comments
COMMENT ON TYPE coupon_status IS 'Status of coupon: active (can be used) or inactive (disabled)';
COMMENT ON TYPE coupon_discount_type IS 'Type of discount: percentage (%) or fixed (₹)';
COMMENT ON TYPE coupon_plan_type IS 'Plan applicability: all, essential, or professional';
COMMENT ON TYPE coupon_usage_control IS 'Controls how coupons can be used: once_per_user or multiple_per_user';

DO $$ BEGIN
    RAISE NOTICE '✓ ENUM Conversion Complete: All coupon fields now use ENUMs';
END $$;

-- ========================================
-- STEP 6: Add Coupon Fields to payment_sessions Table
-- ========================================
DO $$ 
BEGIN
    -- Add applied_coupon field
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' 
        AND column_name = 'applied_coupon'
    ) THEN
        ALTER TABLE public.payment_sessions ADD COLUMN applied_coupon VARCHAR(50) NULL;
        RAISE NOTICE '✓ Added applied_coupon column to payment_sessions';
    ELSE
        RAISE NOTICE '→ applied_coupon column already exists';
    END IF;
    
    -- Add coupon_discount_amount field
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_sessions' 
        AND column_name = 'coupon_discount_amount'
    ) THEN
        ALTER TABLE public.payment_sessions ADD COLUMN coupon_discount_amount DECIMAL(10,2) NULL DEFAULT 0;
        RAISE NOTICE '✓ Added coupon_discount_amount column to payment_sessions';
    ELSE
        RAISE NOTICE '→ coupon_discount_amount column already exists';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_sessions_applied_coupon ON public.payment_sessions(applied_coupon);

COMMENT ON COLUMN public.payment_sessions.applied_coupon IS 'Name of the coupon code applied to this payment session';
COMMENT ON COLUMN public.payment_sessions.coupon_discount_amount IS 'Discount amount from the applied coupon';

DO $$ BEGIN
    RAISE NOTICE '✓ Step 6 Complete: payment_sessions table updated';
END $$;

-- ========================================
-- STEP 7: Create user_coupon_usage Tracking Table
-- ========================================
CREATE TABLE IF NOT EXISTS public.user_coupon_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    payment_session_id UUID NOT NULL REFERENCES public.payment_sessions(id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    discount_amount DECIMAL(10,2) NOT NULL,
    UNIQUE(user_id, coupon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_user_id ON public.user_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_coupon_id ON public.user_coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_user_coupon_usage_payment_session ON public.user_coupon_usage(payment_session_id);

ALTER TABLE public.user_coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coupon usage" ON public.user_coupon_usage;
CREATE POLICY "Users can view their own coupon usage" ON public.user_coupon_usage
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert coupon usage records" ON public.user_coupon_usage;
CREATE POLICY "System can insert coupon usage records" ON public.user_coupon_usage
    FOR INSERT WITH CHECK (true);

COMMENT ON TABLE public.user_coupon_usage IS 'Tracks individual user coupon usage for once_per_user coupons';

DO $$ BEGIN
    RAISE NOTICE '✓ Step 7 Complete: user_coupon_usage table created';
END $$;

-- ========================================
-- STEP 8: Create/Fix increment_coupon_usage Function
-- ========================================
DROP FUNCTION IF EXISTS increment_coupon_usage(TEXT);
DROP FUNCTION IF EXISTS increment_coupon_usage(TEXT, UUID, UUID, DECIMAL);
DROP FUNCTION IF EXISTS increment_coupon_usage CASCADE;

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
    RAISE NOTICE 'increment_coupon_usage called: coupon=%, user=%, session=%', 
        coupon_name_param, user_id_param, payment_session_id_param;
    
    SELECT * INTO coupon_record FROM public.coupons 
    WHERE coupon_name = UPPER(coupon_name_param)
    AND status::TEXT = 'active'
    AND expiring_on >= CURRENT_DATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Coupon % not found or not active', coupon_name_param;
    END IF;
    
    RAISE NOTICE 'Found coupon: id=%, usage_control=%, current usage_count=%', 
        coupon_record.id, coupon_record.usage_control, coupon_record.usage_count;
    
    IF coupon_record.usage_limit IS NOT NULL AND 
       coupon_record.usage_count >= coupon_record.usage_limit THEN
        RAISE EXCEPTION 'Coupon usage limit reached: % >= %', 
            coupon_record.usage_count, coupon_record.usage_limit;
    END IF;
    
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
    
    UPDATE public.coupons c
    SET usage_count = c.usage_count + 1,
        updated_at = NOW()
    WHERE c.id = coupon_record.id;
    
    RAISE NOTICE 'Updated usage_count to %', (SELECT usage_count FROM coupons WHERE id = coupon_record.id);
    
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

REVOKE ALL ON FUNCTION increment_coupon_usage(TEXT, UUID, UUID, DECIMAL) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(TEXT, UUID, UUID, DECIMAL) TO anon, authenticated;

COMMENT ON FUNCTION increment_coupon_usage IS 'Tracks coupon usage per user and increments total usage count. Enforces once_per_user constraint.';

DO $$ BEGIN
    RAISE NOTICE '✓ Step 8 Complete: increment_coupon_usage function created';
END $$;

-- ========================================
-- STEP 9: Create/Fix validate_coupon Function
-- ========================================
DROP FUNCTION IF EXISTS validate_coupon(TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS validate_coupon(TEXT, TEXT);
DROP FUNCTION IF EXISTS validate_coupon CASCADE;

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
            WHEN p_plan_type IS NOT NULL AND c.plan_type::TEXT != 'all' AND c.plan_type::TEXT != p_plan_type THEN FALSE
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

REVOKE ALL ON FUNCTION validate_coupon(TEXT, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION validate_coupon(TEXT, TEXT, UUID) TO anon, authenticated;

COMMENT ON FUNCTION validate_coupon(TEXT, TEXT, UUID) IS 'Validates a coupon code for a specific plan and user, handling ENUM types';

DO $$ BEGIN
    RAISE NOTICE '✓ Step 9 Complete: validate_coupon function created';
END $$;

-- ========================================
-- STEP 10: Fix Existing Coupon Usage Data
-- ========================================
DO $$
DECLARE
    v_coupon_id UUID;
    v_records_inserted INTEGER := 0;
    v_payment_record RECORD;
BEGIN
    RAISE NOTICE 'Step 10: Fixing existing coupon usage data...';
    
    FOR v_payment_record IN 
        SELECT DISTINCT ps.applied_coupon
        FROM payment_sessions ps
        WHERE ps.applied_coupon IS NOT NULL
        AND ps.payment_status = 'completed'
    LOOP
        SELECT id INTO v_coupon_id 
        FROM coupons 
        WHERE coupon_name = v_payment_record.applied_coupon;
        
        IF v_coupon_id IS NOT NULL THEN
            INSERT INTO user_coupon_usage (user_id, coupon_id, payment_session_id, discount_amount, used_at)
            SELECT 
                ps.user_id,
                v_coupon_id,
                ps.id,
                ps.coupon_discount_amount,
                ps.created_at
            FROM payment_sessions ps
            WHERE ps.applied_coupon = v_payment_record.applied_coupon
            AND ps.payment_status = 'completed'
            AND NOT EXISTS (
                SELECT 1 FROM user_coupon_usage ucu 
                WHERE ucu.payment_session_id = ps.id
            )
            ON CONFLICT (user_id, coupon_id) DO NOTHING;
            
            GET DIAGNOSTICS v_records_inserted = ROW_COUNT;
            
            IF v_records_inserted > 0 THEN
                RAISE NOTICE 'Inserted % usage records for coupon %', v_records_inserted, v_payment_record.applied_coupon;
            END IF;
            
            UPDATE coupons
            SET usage_count = (
                SELECT COUNT(DISTINCT user_id)
                FROM user_coupon_usage
                WHERE coupon_id = v_coupon_id
            ),
            updated_at = NOW()
            WHERE id = v_coupon_id;
            
            RAISE NOTICE 'Updated usage_count for coupon %', v_payment_record.applied_coupon;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✓ Step 10 Complete: Existing data fixed';
END $$;

-- ========================================
-- FINAL VERIFICATION
-- ========================================
DO $$
DECLARE
    v_enum_count INTEGER;
    v_new_cols INTEGER;
    v_table_exists BOOLEAN;
    v_function_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION VERIFICATION';
    RAISE NOTICE '========================================';
    
    -- Check ENUM types
    SELECT COUNT(*) INTO v_enum_count
    FROM pg_type 
    WHERE typname IN ('coupon_status', 'coupon_discount_type', 'coupon_plan_type', 'coupon_usage_control');
    RAISE NOTICE 'ENUM types created: % of 4', v_enum_count;
    
    -- Check payment_sessions columns
    SELECT COUNT(*) INTO v_new_cols
    FROM information_schema.columns 
    WHERE table_name = 'payment_sessions' 
    AND column_name IN ('applied_coupon', 'coupon_discount_amount');
    RAISE NOTICE 'payment_sessions new columns: % of 2', v_new_cols;
    
    -- Check user_coupon_usage table
    SELECT EXISTS(
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'user_coupon_usage'
    ) INTO v_table_exists;
    
    IF v_table_exists THEN
        RAISE NOTICE 'user_coupon_usage table: EXISTS';
        RAISE NOTICE 'Total usage records: %', (SELECT COUNT(*) FROM user_coupon_usage);
    ELSE
        RAISE WARNING 'user_coupon_usage table: NOT FOUND';
    END IF;
    
    -- Check functions
    SELECT COUNT(*) INTO v_function_count
    FROM pg_proc 
    WHERE proname IN ('increment_coupon_usage', 'validate_coupon');
    RAISE NOTICE 'Required functions: % of 2', v_function_count;
    
    -- Show coupon stats
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COUPON STATISTICS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total coupons: %', (SELECT COUNT(*) FROM coupons);
    RAISE NOTICE 'Coupons with usage > 0: %', (SELECT COUNT(*) FROM coupons WHERE usage_count > 0);
    RAISE NOTICE 'Once per user coupons: %', (SELECT COUNT(*) FROM coupons WHERE usage_control::TEXT = 'once_per_user');
    RAISE NOTICE 'Multiple per user coupons: %', (SELECT COUNT(*) FROM coupons WHERE usage_control::TEXT = 'multiple_per_user');
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- Final status message
SELECT 
    '✅ MIGRATION COMPLETE' as status,
    NOW() as completed_at,
    'All coupon fields converted to ENUMs. Tracking system activated.' as message;

