-- Resume Review Payments - Phase 1
-- Adds payment tracking columns and tables for resume review checkout flow

-- 1. Extend resume_reviews with payment metadata
ALTER TABLE public.resume_reviews
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.resume_reviews.payment_status IS 'Payment state for this resume review request';
COMMENT ON COLUMN public.resume_reviews.payment_reference IS 'External payment reference / order id';
COMMENT ON COLUMN public.resume_reviews.payment_amount IS 'Amount collected for this resume review';
COMMENT ON COLUMN public.resume_reviews.payment_verified_at IS 'Timestamp when payment was verified';

-- Ensure existing rows default to pending
UPDATE public.resume_reviews
SET payment_status = COALESCE(payment_status, 'pending');

-- 2. Create resume_review_payments table
CREATE TABLE IF NOT EXISTS public.resume_review_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_review_id UUID NOT NULL REFERENCES public.resume_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  cashfree_order_id TEXT,
  cashfree_payment_id TEXT,
  coupon_code TEXT,
  raw_payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.resume_review_payments IS 'Stores Cashfree payment sessions for resume review purchases';

CREATE INDEX IF NOT EXISTS idx_resume_review_payments_review_id ON public.resume_review_payments(resume_review_id);
CREATE INDEX IF NOT EXISTS idx_resume_review_payments_user_id ON public.resume_review_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_review_payments_status ON public.resume_review_payments(status);

-- 3. Timestamp update trigger for resume_review_payments
CREATE OR REPLACE FUNCTION public.set_resume_review_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_resume_review_payments_updated_at ON public.resume_review_payments;
CREATE TRIGGER trg_resume_review_payments_updated_at
BEFORE UPDATE ON public.resume_review_payments
FOR EACH ROW
EXECUTE FUNCTION public.set_resume_review_payments_updated_at();

-- 4. RLS policies
ALTER TABLE public.resume_review_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage resume review payments" ON public.resume_review_payments;
CREATE POLICY "Admins can manage resume review payments"
ON public.resume_review_payments
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
));

DROP POLICY IF EXISTS "Users can view their resume review payments" ON public.resume_review_payments;
CREATE POLICY "Users can view their resume review payments"
ON public.resume_review_payments
FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role manages resume review payments" ON public.resume_review_payments;
CREATE POLICY "Service role manages resume review payments"
ON public.resume_review_payments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5a. Expand coupon plan_type to include resume reviews
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'resume_review'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'coupon_plan_type')
  ) THEN
    ALTER TYPE public.coupon_plan_type ADD VALUE 'resume_review';
  END IF;
END $$;

ALTER TABLE public.coupons
DROP CONSTRAINT IF EXISTS coupons_plan_type_check;

ALTER TABLE public.coupons
ADD CONSTRAINT coupons_plan_type_check 
CHECK (plan_type IN ('all', 'essential', 'professional', 'resume_review'));

-- 5. Update trigger function to only fire after payment confirmation
CREATE OR REPLACE FUNCTION public.trigger_resume_review_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Only mark webhook trigger once payment is verified and review is pending
  IF NEW.status = 'pending'
     AND NEW.payment_status = 'paid'
     AND (TG_OP = 'INSERT' OR OLD.payment_status IS DISTINCT FROM NEW.payment_status)
  THEN
    NEW.webhook_triggered_at := COALESCE(NEW.webhook_triggered_at, NOW());
    RAISE NOTICE 'Resume review payment confirmed: ID=%', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_resume_review_webhook_trigger ON public.resume_reviews;
CREATE TRIGGER trigger_resume_review_webhook_trigger
BEFORE INSERT OR UPDATE OF payment_status
ON public.resume_reviews
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION public.trigger_resume_review_webhook();


