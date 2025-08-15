-- Update the get_my_payout_details function to decrypt data when returning
CREATE OR REPLACE FUNCTION public.get_my_payout_details()
RETURNS TABLE(
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
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT 
        f.payout_method,
        public.decrypt_financial_data(f.upi_id) as upi_id,
        public.decrypt_financial_data(f.bank_name) as bank_name,
        public.decrypt_financial_data(f.bank_account_number) as bank_account_number,
        public.decrypt_financial_data(f.bank_ifsc_code) as bank_ifsc_code,
        public.decrypt_financial_data(f.account_holder_name) as account_holder_name,
        f.payout_details_verified,
        f.payout_details_submitted_at,
        f.payout_details_locked
    FROM public.interviewer_financial_data f
    JOIN public.interviewers i ON f.interviewer_id = i.id
    WHERE i.user_id = auth.uid();
$$;

-- Update the update_my_payout_details function to encrypt data before storing
CREATE OR REPLACE FUNCTION public.update_my_payout_details(
    p_payout_method text, 
    p_upi_id text DEFAULT NULL::text, 
    p_bank_name text DEFAULT NULL::text, 
    p_bank_account_number text DEFAULT NULL::text, 
    p_bank_ifsc_code text DEFAULT NULL::text, 
    p_account_holder_name text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
        -- Insert new financial record with encrypted data
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
            public.encrypt_financial_data(p_upi_id),
            public.encrypt_financial_data(p_bank_name),
            public.encrypt_financial_data(p_bank_account_number),
            public.encrypt_financial_data(p_bank_ifsc_code),
            public.encrypt_financial_data(p_account_holder_name),
            now()
        );
    ELSE
        -- Update existing record with encrypted data
        UPDATE public.interviewer_financial_data
        SET 
            payout_method = p_payout_method,
            upi_id = public.encrypt_financial_data(p_upi_id),
            bank_name = public.encrypt_financial_data(p_bank_name),
            bank_account_number = public.encrypt_financial_data(p_bank_account_number),
            bank_ifsc_code = public.encrypt_financial_data(p_bank_ifsc_code),
            account_holder_name = public.encrypt_financial_data(p_account_holder_name),
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