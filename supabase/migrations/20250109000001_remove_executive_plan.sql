-- Migration: Remove Executive Plan from Database
-- Phase 2: Database Cleanup
-- This migration removes all Executive plan references from the database

-- 1. Update coupons table to remove 'executive' from plan_type constraint
DO $$ 
BEGIN
    -- First, update any existing 'executive' plan_type to 'professional' (closest alternative)
    UPDATE public.coupons 
    SET plan_type = 'professional' 
    WHERE plan_type = 'executive';
    
    -- Drop the existing constraint
    ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_plan_type_check;
    
    -- Add new constraint without 'executive'
    ALTER TABLE public.coupons ADD CONSTRAINT coupons_plan_type_check 
    CHECK (plan_type IN ('all', 'essential', 'professional'));
    
    -- Update comment
    COMMENT ON COLUMN public.coupons.plan_type IS 'Which plans this coupon applies to: all, essential, professional';
END $$;

-- 2. Update interviewees table constraints
DO $$
BEGIN
    -- First, update any existing 'executive' selected_plan to 'professional'
    UPDATE public.interviewees 
    SET selected_plan = 'professional' 
    WHERE selected_plan = 'executive';
    
    -- Drop existing constraints
    ALTER TABLE public.interviewees DROP CONSTRAINT IF EXISTS check_selected_plan;
    
    -- Add new constraint without 'executive' (interviewees table doesn't have interview_duration column)
    ALTER TABLE public.interviewees ADD CONSTRAINT check_selected_plan 
    CHECK (selected_plan IN ('essential', 'professional') OR selected_plan IS NULL);
    
    -- Update comment
    COMMENT ON COLUMN public.interviewees.selected_plan IS 'Plan selected before payment (essential, professional)';
END $$;

-- 3. Update interviews table constraints
DO $$
BEGIN
    -- First, update any existing 'executive' selected_plan to 'professional'
    UPDATE public.interviews 
    SET selected_plan = 'professional' 
    WHERE selected_plan = 'executive';
    
    -- Drop existing constraints
    ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS check_valid_plan;
    ALTER TABLE public.interviews DROP CONSTRAINT IF EXISTS check_duration_plan_match;
    
    -- Add new constraints without 'executive'
    ALTER TABLE public.interviews ADD CONSTRAINT check_valid_plan 
    CHECK (selected_plan IN ('essential', 'professional'));
    
    ALTER TABLE public.interviews ADD CONSTRAINT check_duration_plan_match 
    CHECK (
        ((selected_plan = 'essential') AND (interview_duration = 30)) OR 
        ((selected_plan = 'professional') AND (interview_duration = 60))
    );
    
    -- Update comment
    COMMENT ON COLUMN public.interviews.selected_plan IS 'Selected plan: essential, professional';
END $$;

-- 4. Update payment_sessions table constraints
DO $$
BEGIN
    -- First, update any existing 'executive' selected_plan to 'professional'
    UPDATE public.payment_sessions 
    SET selected_plan = 'professional' 
    WHERE selected_plan = 'executive';
    
    -- Drop existing constraints
    ALTER TABLE public.payment_sessions DROP CONSTRAINT IF EXISTS check_valid_plan_payment;
    ALTER TABLE public.payment_sessions DROP CONSTRAINT IF EXISTS check_duration_plan_match_payment;
    
    -- Add new constraints without 'executive'
    ALTER TABLE public.payment_sessions ADD CONSTRAINT check_valid_plan_payment 
    CHECK (selected_plan IN ('essential', 'professional'));
    
    ALTER TABLE public.payment_sessions ADD CONSTRAINT check_duration_plan_match_payment 
    CHECK (
        ((selected_plan = 'essential') AND (interview_duration = 30)) OR 
        ((selected_plan = 'professional') AND (interview_duration = 60))
    );
    
    -- Update comment
    COMMENT ON COLUMN public.payment_sessions.selected_plan IS 'Selected plan: essential, professional';
END $$;

-- 5. Remove Executive-specific coupon data
DELETE FROM public.coupons WHERE coupon_name = 'EXECUTIVE100';

-- 6. Add logging for the migration
DO $$
BEGIN
    RAISE LOG 'Executive plan removal migration completed successfully';
    RAISE LOG 'Updated constraints in: coupons, interviewees, interviews, payment_sessions';
    RAISE LOG 'Migrated existing executive plan data to professional plan';
    RAISE LOG 'Removed EXECUTIVE100 coupon';
END $$;
