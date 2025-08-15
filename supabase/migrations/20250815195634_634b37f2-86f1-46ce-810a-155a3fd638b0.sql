-- Enable the pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt sensitive financial data
CREATE OR REPLACE FUNCTION public.encrypt_financial_data(data_text text, encryption_key text DEFAULT 'default_financial_key_2024')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF data_text IS NULL OR data_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Use AES encryption with the provided key
    RETURN encode(
        encrypt(
            data_text::bytea, 
            encryption_key::bytea, 
            'aes'
        ), 
        'base64'
    );
END;
$$;

-- Create a function to decrypt sensitive financial data
CREATE OR REPLACE FUNCTION public.decrypt_financial_data(encrypted_data text, encryption_key text DEFAULT 'default_financial_key_2024')
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF encrypted_data IS NULL OR encrypted_data = '' THEN
        RETURN NULL;
    END IF;
    
    -- Decrypt the data
    RETURN convert_from(
        decrypt(
            decode(encrypted_data, 'base64'), 
            encryption_key::bytea, 
            'aes'
        ), 
        'UTF8'
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL if decryption fails (malformed data, wrong key, etc.)
        RETURN NULL;
END;
$$;

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

-- Create a migration function to encrypt existing plaintext data
CREATE OR REPLACE FUNCTION public.migrate_encrypt_existing_financial_data()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    rec RECORD;
BEGIN
    -- Update all existing records to encrypt sensitive fields
    FOR rec IN 
        SELECT id, upi_id, bank_name, bank_account_number, bank_ifsc_code, account_holder_name
        FROM public.interviewer_financial_data
        WHERE upi_id IS NOT NULL OR bank_name IS NOT NULL OR bank_account_number IS NOT NULL 
           OR bank_ifsc_code IS NOT NULL OR account_holder_name IS NOT NULL
    LOOP
        UPDATE public.interviewer_financial_data
        SET 
            upi_id = CASE 
                WHEN rec.upi_id IS NOT NULL AND rec.upi_id != '' 
                THEN public.encrypt_financial_data(rec.upi_id) 
                ELSE NULL 
            END,
            bank_name = CASE 
                WHEN rec.bank_name IS NOT NULL AND rec.bank_name != '' 
                THEN public.encrypt_financial_data(rec.bank_name) 
                ELSE NULL 
            END,
            bank_account_number = CASE 
                WHEN rec.bank_account_number IS NOT NULL AND rec.bank_account_number != '' 
                THEN public.encrypt_financial_data(rec.bank_account_number) 
                ELSE NULL 
            END,
            bank_ifsc_code = CASE 
                WHEN rec.bank_ifsc_code IS NOT NULL AND rec.bank_ifsc_code != '' 
                THEN public.encrypt_financial_data(rec.bank_ifsc_code) 
                ELSE NULL 
            END,
            account_holder_name = CASE 
                WHEN rec.account_holder_name IS NOT NULL AND rec.account_holder_name != '' 
                THEN public.encrypt_financial_data(rec.account_holder_name) 
                ELSE NULL 
            END
        WHERE id = rec.id;
    END LOOP;
    
    RETURN true;
END;
$$;

-- Run the migration to encrypt existing data
SELECT public.migrate_encrypt_existing_financial_data();

-- Drop the migration function as it's no longer needed
DROP FUNCTION public.migrate_encrypt_existing_financial_data();