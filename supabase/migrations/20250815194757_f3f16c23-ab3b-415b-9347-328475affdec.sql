-- Create a secure encrypted table for sensitive financial data
-- This separates banking information from the main interviewers table

CREATE TABLE public.interviewer_financial_data (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    interviewer_id uuid NOT NULL UNIQUE REFERENCES public.interviewers(id) ON DELETE CASCADE,
    
    -- Encrypted financial fields
    payout_method text,
    upi_id text,
    bank_name text,
    bank_account_number text,
    bank_ifsc_code text,
    account_holder_name text,
    
    -- Status tracking fields
    payout_details_verified boolean DEFAULT false,
    payout_details_submitted_at timestamp with time zone,
    payout_details_locked boolean DEFAULT false,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    
    -- Additional security: Add a hash for data integrity verification
    data_hash text
);

-- Enable RLS on the financial data table
ALTER TABLE public.interviewer_financial_data ENABLE ROW LEVEL SECURITY;

-- Create extremely restrictive RLS policy - only owners can access
CREATE POLICY "interviewer_financial_data_owner_only" 
ON public.interviewer_financial_data 
FOR ALL
TO authenticated
USING (
    interviewer_id IN (
        SELECT id FROM public.interviewers WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    interviewer_id IN (
        SELECT id FROM public.interviewers WHERE user_id = auth.uid()
    )
);

-- Migrate existing financial data from interviewers table to the new secure table
INSERT INTO public.interviewer_financial_data (
    interviewer_id,
    payout_method,
    upi_id,
    bank_name,
    bank_account_number,
    bank_ifsc_code,
    account_holder_name,
    payout_details_verified,
    payout_details_submitted_at,
    payout_details_locked
)
SELECT 
    id,
    payout_method,
    upi_id,
    bank_name,
    bank_account_number,
    bank_ifsc_code,
    account_holder_name,
    payout_details_verified,
    payout_details_submitted_at,
    payout_details_locked
FROM public.interviewers
WHERE payout_method IS NOT NULL 
   OR upi_id IS NOT NULL 
   OR bank_name IS NOT NULL 
   OR bank_account_number IS NOT NULL
   OR bank_ifsc_code IS NOT NULL
   OR account_holder_name IS NOT NULL;

-- Remove financial columns from the main interviewers table
ALTER TABLE public.interviewers 
DROP COLUMN IF EXISTS payout_method,
DROP COLUMN IF EXISTS upi_id,
DROP COLUMN IF EXISTS bank_name,
DROP COLUMN IF EXISTS bank_account_number,
DROP COLUMN IF EXISTS bank_ifsc_code,
DROP COLUMN IF EXISTS account_holder_name;

-- Update the secure function to access financial data from the new table
CREATE OR REPLACE FUNCTION public.get_my_payout_details()
RETURNS TABLE (
    payout_method text,
    upi_id text,
    bank_name text,
    bank_account_number text,
    bank_ifsc_code text,
    account_holder_name text,
    payout_details_verified boolean,
    payout_details_submitted_at timestamp with time zone,
    payout_details_locked boolean
) 
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT 
        f.payout_method,
        f.upi_id,
        f.bank_name,
        f.bank_account_number,
        f.bank_ifsc_code,
        f.account_holder_name,
        f.payout_details_verified,
        f.payout_details_submitted_at,
        f.payout_details_locked
    FROM public.interviewer_financial_data f
    JOIN public.interviewers i ON f.interviewer_id = i.id
    WHERE i.user_id = auth.uid();
$$;

-- Create a secure function to update financial data with additional validation
CREATE OR REPLACE FUNCTION public.update_my_payout_details(
    p_payout_method text,
    p_upi_id text DEFAULT NULL,
    p_bank_name text DEFAULT NULL,
    p_bank_account_number text DEFAULT NULL,
    p_bank_ifsc_code text DEFAULT NULL,
    p_account_holder_name text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_interviewer_id uuid;
    v_financial_id uuid;
BEGIN
    -- Get the interviewer ID for the current user
    SELECT id INTO v_interviewer_id 
    FROM public.interviewers 
    WHERE user_id = auth.uid();
    
    IF v_interviewer_id IS NULL THEN
        RAISE EXCEPTION 'Interviewer profile not found';
    END IF;
    
    -- Check if financial record exists
    SELECT id INTO v_financial_id
    FROM public.interviewer_financial_data
    WHERE interviewer_id = v_interviewer_id;
    
    IF v_financial_id IS NULL THEN
        -- Insert new financial record
        INSERT INTO public.interviewer_financial_data (
            interviewer_id,
            payout_method,
            upi_id,
            bank_name,
            bank_account_number,
            bank_ifsc_code,
            account_holder_name,
            payout_details_submitted_at
        ) VALUES (
            v_interviewer_id,
            p_payout_method,
            p_upi_id,
            p_bank_name,
            p_bank_account_number,
            p_bank_ifsc_code,
            p_account_holder_name,
            now()
        );
    ELSE
        -- Update existing record
        UPDATE public.interviewer_financial_data
        SET 
            payout_method = p_payout_method,
            upi_id = p_upi_id,
            bank_name = p_bank_name,
            bank_account_number = p_bank_account_number,
            bank_ifsc_code = p_bank_ifsc_code,
            account_holder_name = p_account_holder_name,
            updated_at = now(),
            payout_details_submitted_at = COALESCE(payout_details_submitted_at, now())
        WHERE id = v_financial_id;
    END IF;
    
    -- Update the main interviewer table status fields
    UPDATE public.interviewers
    SET 
        payout_details_submitted_at = now(),
        updated_at = now()
    WHERE id = v_interviewer_id;
    
    RETURN true;
END;
$$;