-- Add coupon tracking fields to payment_sessions table
-- This migration adds fields to store applied coupon information

-- Add coupon fields to payment_sessions
ALTER TABLE public.payment_sessions 
ADD COLUMN IF NOT EXISTS applied_coupon VARCHAR(50) NULL,
ADD COLUMN IF NOT EXISTS coupon_discount_amount DECIMAL(10,2) NULL DEFAULT 0;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_sessions_applied_coupon ON public.payment_sessions(applied_coupon);

-- Add comments for documentation
COMMENT ON COLUMN public.payment_sessions.applied_coupon IS 'Name of the coupon code applied to this payment session';
COMMENT ON COLUMN public.payment_sessions.coupon_discount_amount IS 'Discount amount from the applied coupon';

