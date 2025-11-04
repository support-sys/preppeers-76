-- Create payout_config table to store configurable payout rates
-- This allows rates to be updated without modifying migrations

CREATE TABLE IF NOT EXISTS public.payout_config (
  plan_type VARCHAR(50) PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES public.profiles(id)
);

-- Add comment
COMMENT ON TABLE public.payout_config IS 'Stores configurable payout amounts per plan type. Updated values take effect immediately for new payouts.';

-- Insert initial values (matching current payoutConfig.ts)
INSERT INTO public.payout_config (plan_type, amount, description) VALUES
  ('essential', 300.00, 'Payout amount for Essential plan (30-minute interviews)'),
  ('professional', 700.00, 'Payout amount for Professional plan (60-minute interviews)'),
  ('referral', 100.00, 'Referral bonus amount (future use)')
ON CONFLICT (plan_type) DO NOTHING; -- Don't overwrite if already exists

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payout_config_plan_type ON public.payout_config(plan_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payout_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_payout_config_updated_at_trigger
  BEFORE UPDATE ON public.payout_config
  FOR EACH ROW
  EXECUTE FUNCTION update_payout_config_updated_at();

-- Enable RLS
ALTER TABLE public.payout_config ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read payout config (needed for trigger function)
CREATE POLICY "Anyone can view payout config" ON public.payout_config
  FOR SELECT USING (true);

-- Policy: Only admins can update payout config
CREATE POLICY "Admins can update payout config" ON public.payout_config
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.admins a ON p.id = a.user_id
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND (a.is_super_admin = TRUE OR 'manage_payouts' = ANY(a.permissions))
    )
  );

-- Policy: Only admins can insert payout config
CREATE POLICY "Admins can insert payout config" ON public.payout_config
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.admins a ON p.id = a.user_id
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND (a.is_super_admin = TRUE OR 'manage_payouts' = ANY(a.permissions))
    )
  );

-- Update the trigger function to read from payout_config table
CREATE OR REPLACE FUNCTION create_payout_on_interview_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_payout_amount DECIMAL(10, 2);
  v_interviewer_financial_data_id UUID;
  v_selected_plan VARCHAR(50);
BEGIN
  -- Only trigger when status changes to 'completed'
  IF NEW.status = 'completed'::public.interview_status AND (OLD.status IS NULL OR OLD.status != 'completed'::public.interview_status) THEN
    -- Determine payout amount based on selected plan
    v_selected_plan := COALESCE(NEW.selected_plan, 'essential');
    
    -- Get payout amount from payout_config table (reads latest value every time)
    SELECT amount INTO v_payout_amount
    FROM public.payout_config
    WHERE plan_type = LOWER(v_selected_plan);
    
    -- If no config found, default to essential rate
    IF v_payout_amount IS NULL THEN
      SELECT amount INTO v_payout_amount
      FROM public.payout_config
      WHERE plan_type = 'essential';
      
      -- If still null (no essential config), use hardcoded fallback
      IF v_payout_amount IS NULL THEN
        v_payout_amount := 300.00;
        RAISE WARNING 'payout_config table missing data, using fallback amount: %', v_payout_amount;
      END IF;
    END IF;
    
    -- Get the interviewer's financial data ID
    SELECT id INTO v_interviewer_financial_data_id
    FROM public.interviewer_financial_data
    WHERE interviewer_id = NEW.interviewer_id
    LIMIT 1;
    
    -- Insert payout record
    INSERT INTO public.payouts (
      interviewer_id,
      interview_id,
      amount,
      status,
      interview_type,
      financial_data_id,
      notes
    ) VALUES (
      NEW.interviewer_id,
      NEW.id,
      v_payout_amount,
      'pending',
      LOWER(v_selected_plan),
      v_interviewer_financial_data_id,
      'Auto-created payout for completed interview'
    );
    
    RAISE NOTICE 'Created payout for interview % with amount % (plan: %)', NEW.id, v_payout_amount, v_selected_plan;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_payout_on_interview_complete() IS 'Auto-creates payout when interview status changes to completed. Reads payout amounts from payout_config table, so rate changes take effect immediately for new payouts.';
