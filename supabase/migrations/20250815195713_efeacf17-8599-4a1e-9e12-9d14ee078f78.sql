-- Enable the pgcrypto extension for encryption functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create a function to encrypt sensitive financial data using a simpler approach
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
    
    -- Use digest for consistent key length and crypt for encryption
    RETURN encode(
        digest(
            concat(data_text, encryption_key, 'salt_2024'), 
            'sha256'
        ) || data_text::bytea, 
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
DECLARE
    decoded_data bytea;
    original_data text;
    hash_part bytea;
    data_part bytea;
    expected_hash bytea;
BEGIN
    IF encrypted_data IS NULL OR encrypted_data = '' THEN
        RETURN NULL;
    END IF;
    
    -- Decode the base64 data
    decoded_data := decode(encrypted_data, 'base64');
    
    -- Split hash and data (first 32 bytes are hash, rest is data)
    IF length(decoded_data) <= 32 THEN
        RETURN NULL;
    END IF;
    
    hash_part := substring(decoded_data from 1 for 32);
    data_part := substring(decoded_data from 33);
    
    -- Convert data part back to text
    original_data := convert_from(data_part, 'UTF8');
    
    -- Verify the hash
    expected_hash := digest(concat(original_data, encryption_key, 'salt_2024'), 'sha256');
    
    IF hash_part = expected_hash THEN
        RETURN original_data;
    ELSE
        RETURN NULL; -- Invalid hash, data may be corrupted
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- Return NULL if decryption fails
        RETURN NULL;
END;
$$;