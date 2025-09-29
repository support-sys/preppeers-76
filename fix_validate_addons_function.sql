-- Fix the validate_addons function
-- The issue is that addon_record is defined from a SELECT that only has addon_key and quantity
-- We need to declare separate variables for the additional fields

DROP FUNCTION IF EXISTS validate_addons(UUID, VARCHAR(50), JSONB);

CREATE OR REPLACE FUNCTION validate_addons(
    p_user_id UUID,
    p_plan_type VARCHAR(50),
    p_addons_json JSONB
)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT,
    validated_addons JSONB
) AS $$
DECLARE
    addon_record RECORD;
    validated_addons JSONB := '[]'::jsonb;
    total_price DECIMAL(10,2) := 0.00;
    addon_price DECIMAL(10,2);
    addon_quantity INTEGER;
    addon_requires_plan VARCHAR(50);
    addon_max_quantity INTEGER;
BEGIN
    -- Loop through each add-on
    FOR addon_record IN 
        SELECT 
            (addon->>'addon_key')::text as addon_key,
            (addon->>'quantity')::integer as quantity
        FROM jsonb_array_elements(p_addons_json) as addon
    LOOP
        -- Check if add-on exists and is active
        SELECT a.price, a.requires_plan, a.max_quantity
        INTO addon_price, addon_requires_plan, addon_max_quantity
        FROM public.add_ons a
        WHERE a.addon_key = addon_record.addon_key
        AND a.is_active = true;
        
        -- If add-on not found
        IF addon_price IS NULL THEN
            RETURN QUERY SELECT false, 'Add-on not found: ' || addon_record.addon_key, '[]'::jsonb;
            RETURN;
        END IF;
        
        -- Check if add-on is compatible with plan
        IF addon_requires_plan IS NOT NULL AND addon_requires_plan != p_plan_type THEN
            RETURN QUERY SELECT false, 'Add-on requires ' || addon_requires_plan || ' plan', '[]'::jsonb;
            RETURN;
        END IF;
        
        -- Check quantity limits
        IF addon_record.quantity > addon_max_quantity THEN
            RETURN QUERY SELECT false, 'Quantity exceeds maximum for add-on: ' || addon_record.addon_key, '[]'::jsonb;
            RETURN;
        END IF;
        
        -- Add to validated add-ons
        validated_addons := validated_addons || jsonb_build_object(
            'addon_key', addon_record.addon_key,
            'quantity', addon_record.quantity,
            'price', addon_price,
            'total', addon_price * addon_record.quantity
        );
        
        -- Add to total
        total_price := total_price + (addon_price * addon_record.quantity);
    END LOOP;
    
    -- Return success
    RETURN QUERY SELECT true, 'All add-ons validated successfully', validated_addons;
END;
$$ LANGUAGE plpgsql;

-- Test the fixed function
DO $$
DECLARE
    test_user_id UUID := '60bd5b10-d586-4bf2-abf6-39c452e3d909';
    test_addons JSONB := '[
        {"addon_key": "resume_review", "quantity": 1},
        {"addon_key": "meeting_recording", "quantity": 1}
    ]';
    validation_result RECORD;
BEGIN
    -- Test valid add-ons for essential plan
    SELECT * INTO validation_result
    FROM validate_addons(test_user_id, 'essential', test_addons);
    
    IF validation_result.is_valid THEN
        RAISE NOTICE 'SUCCESS: validate_addons function fixed and working correctly';
        RAISE NOTICE 'Validated add-ons: %', validation_result.validated_addons;
    ELSE
        RAISE NOTICE 'ERROR: validate_addons function still has issues: %', validation_result.error_message;
    END IF;
END $$;

