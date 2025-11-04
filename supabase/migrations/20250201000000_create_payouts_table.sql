-- Create payouts table for interviewer compensation tracking
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interviewer_id UUID NOT NULL REFERENCES public.interviewers(id) ON DELETE CASCADE,
  interview_id UUID NOT NULL UNIQUE REFERENCES public.interviews(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  interview_type VARCHAR(50) CHECK (interview_type IN ('essential', 'professional')),
  financial_data_id UUID REFERENCES public.interviewer_financial_data(id),
  paid_at TIMESTAMP WITH TIME ZONE,
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payouts_interviewer_id ON public.payouts(interviewer_id);
CREATE INDEX IF NOT EXISTS idx_payouts_interview_id ON public.payouts(interview_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_created_at ON public.payouts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payouts_interviewer_status ON public.payouts(interviewer_id, status);
CREATE INDEX IF NOT EXISTS idx_payouts_financial_data ON public.payouts(financial_data_id);
CREATE INDEX IF NOT EXISTS idx_payouts_interview_type ON public.payouts(interview_type);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION update_payouts_updated_at();

-- RLS Policies
-- Interviewers can view their own payouts
CREATE POLICY "Interviewers can view own payouts"
ON public.payouts
FOR SELECT
USING (
  interviewer_id IN (
    SELECT id FROM public.interviewers WHERE user_id = auth.uid()
  )
);

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
ON public.payouts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can insert payouts
CREATE POLICY "Admins can insert payouts"
ON public.payouts
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can update payouts
CREATE POLICY "Admins can update payouts"
ON public.payouts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Grant permissions
GRANT SELECT ON public.payouts TO authenticated;
GRANT INSERT ON public.payouts TO authenticated;
GRANT UPDATE ON public.payouts TO authenticated;

/*
 * NOTE: The payout trigger and function are created in the next migration
 * (20250202000000_convert_interview_status_to_enum.sql) because they require
 * the interview_status enum type to be created first.
 *
 * PAYOUT AMOUNTS (configurable in src/config/payoutConfig.ts):
 * - Essential:    150.00 (30 min interviews)
 * - Professional: 300.00 (60 min interviews)
 *
 * The payout trigger will automatically create payouts when interview status
 * changes to 'completed'. Amount is determined based on selected_plan field.
 * If you change amounts in payoutConfig.ts, update the trigger function as well.
 */
