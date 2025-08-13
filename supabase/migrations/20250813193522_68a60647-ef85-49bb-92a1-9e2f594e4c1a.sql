-- Add payout details to interviewers table
ALTER TABLE public.interviewers 
ADD COLUMN payout_method TEXT CHECK (payout_method IN ('upi', 'bank_account')),
ADD COLUMN upi_id TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN bank_account_number TEXT,
ADD COLUMN bank_ifsc_code TEXT,
ADD COLUMN account_holder_name TEXT,
ADD COLUMN payout_details_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN payout_details_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payout_details_locked BOOLEAN DEFAULT FALSE;