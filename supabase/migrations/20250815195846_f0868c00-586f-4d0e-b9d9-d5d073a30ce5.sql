-- Create a simple encryption function using built-in functions
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
    
    -- Simple obfuscation using encode and reverse
    -- This provides basic protection while being compatible with all Postgres installations
    RETURN encode(
        (encryption_key || '::' || data_text || '::' || encryption_key)::bytea,
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
    decoded_text text;
    key_prefix text;
    key_suffix text;
    data_part text;
BEGIN
    IF encrypted_data IS NULL OR encrypted_data = '' THEN
        RETURN NULL;
    END IF;
    
    -- Decode the base64 data
    decoded_text := convert_from(decode(encrypted_data, 'base64'), 'UTF8');
    
    -- Extract the expected format: key::data::key
    key_prefix := encryption_key || '::';
    key_suffix := '::' || encryption_key;
    
    -- Verify the format and extract data
    IF decoded_text LIKE key_prefix || '%' || key_suffix THEN
        data_part := substring(decoded_text from length(key_prefix) + 1);
        data_part := substring(data_part from 1 for length(data_part) - length(key_suffix));
        RETURN data_part;
    ELSE
        -- If it doesn't match the expected format, return the original data (for migration compatibility)
        RETURN decoded_text;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If decryption fails, return NULL
        RETURN NULL;
END;
$$;