
-- Create payment_sessions table to track payment status
CREATE TABLE public.payment_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  candidate_data JSONB NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  cashfree_order_id VARCHAR(255),
  cashfree_payment_id VARCHAR(255),
  interview_matched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own payment sessions
CREATE POLICY "Users can view their own payment sessions" 
  ON public.payment_sessions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own payment sessions
CREATE POLICY "Users can create their own payment sessions" 
  ON public.payment_sessions 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment sessions
CREATE POLICY "Users can update their own payment sessions" 
  ON public.payment_sessions 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX payment_sessions_user_id_idx ON public.payment_sessions(user_id);
CREATE INDEX payment_sessions_status_idx ON public.payment_sessions(payment_status);
CREATE INDEX payment_sessions_cashfree_order_idx ON public.payment_sessions(cashfree_order_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_payment_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER payment_sessions_update_timestamp
    BEFORE UPDATE ON public.payment_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_payment_session_timestamp();
