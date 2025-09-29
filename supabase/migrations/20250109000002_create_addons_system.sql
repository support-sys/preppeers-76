-- Migration: Create Add-ons System
-- Phase 3.1: Database Schema for Add-ons
-- This migration creates the complete add-ons infrastructure

-- 1. Create add_ons table
CREATE TABLE IF NOT EXISTS public.add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    addon_key VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    category VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    requires_plan VARCHAR(50), -- NULL means available for all plans
    max_quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create add-on categories enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'addon_category') THEN
        CREATE TYPE addon_category AS ENUM ('enhancement', 'service', 'premium');
    END IF;
END $$;

-- 3. Add constraint for addon_category
ALTER TABLE public.add_ons 
ADD CONSTRAINT check_addon_category 
CHECK (category IN ('enhancement', 'service', 'premium'));

-- 4. Add constraint for requires_plan
ALTER TABLE public.add_ons 
ADD CONSTRAINT check_requires_plan 
CHECK (requires_plan IS NULL OR requires_plan IN ('essential', 'professional'));

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_add_ons_active ON public.add_ons (is_active);
CREATE INDEX IF NOT EXISTS idx_add_ons_category ON public.add_ons (category);
CREATE INDEX IF NOT EXISTS idx_add_ons_requires_plan ON public.add_ons (requires_plan);

-- 6. Insert default add-ons
INSERT INTO public.add_ons (addon_key, name, description, price, category, requires_plan, max_quantity) VALUES
('resume_review', 'Resume Review', 'Professional resume feedback and optimization with detailed suggestions for improvement', 199.00, 'service', NULL, 1),
('meeting_recording', 'Meeting Recording', 'Record your interview session for later review and analysis', 99.00, 'enhancement', NULL, 1),
('priority_support', 'Priority Support', 'Get priority customer support with faster response times', 149.00, 'premium', 'professional', 1),
('extended_feedback', 'Extended Feedback Report', 'Get a more detailed feedback report with additional insights', 299.00, 'service', 'professional', 1);

-- 7. Create user_add_ons table to track selected add-ons
CREATE TABLE IF NOT EXISTS public.user_add_ons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, addon_id)
);

-- 8. Create indexes for user_add_ons
CREATE INDEX IF NOT EXISTS idx_user_add_ons_user_id ON public.user_add_ons (user_id);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_addon_id ON public.user_add_ons (addon_id);
CREATE INDEX IF NOT EXISTS idx_user_add_ons_active ON public.user_add_ons (is_active);

-- 9. Update payment_sessions table to include add-ons
ALTER TABLE public.payment_sessions 
ADD COLUMN IF NOT EXISTS selected_add_ons JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS add_ons_total DECIMAL(10,2) DEFAULT 0.00;

-- 10. Update interviews table to include add-ons
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS selected_add_ons JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS add_ons_total DECIMAL(10,2) DEFAULT 0.00;

-- 11. Create function to calculate add-on total
CREATE OR REPLACE FUNCTION calculate_addons_total(addons_json JSONB)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total DECIMAL(10,2) := 0.00;
    addon_record RECORD;
BEGIN
    -- Loop through each add-on in the JSON array
    FOR addon_record IN 
        SELECT 
            (addon->>'addon_key')::text as addon_key,
            (addon->>'quantity')::integer as quantity
        FROM jsonb_array_elements(addons_json) as addon
    LOOP
        -- Get the price from add_ons table and calculate total
        SELECT total + (a.price * addon_record.quantity)
        INTO total
        FROM public.add_ons a
        WHERE a.addon_key = addon_record.addon_key
        AND a.is_active = true;
    END LOOP;
    
    RETURN COALESCE(total, 0.00);
END;
$$ LANGUAGE plpgsql;

-- 12. Create function to validate add-ons
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
        INTO addon_price, addon_record.requires_plan, addon_record.max_quantity
        FROM public.add_ons a
        WHERE a.addon_key = addon_record.addon_key
        AND a.is_active = true;
        
        -- If add-on not found
        IF addon_price IS NULL THEN
            RETURN QUERY SELECT false, 'Add-on not found: ' || addon_record.addon_key, '[]'::jsonb;
            RETURN;
        END IF;
        
        -- Check if add-on is compatible with plan
        IF addon_record.requires_plan IS NOT NULL AND addon_record.requires_plan != p_plan_type THEN
            RETURN QUERY SELECT false, 'Add-on requires ' || addon_record.requires_plan || ' plan', '[]'::jsonb;
            RETURN;
        END IF;
        
        -- Check quantity limits
        IF addon_record.quantity > addon_record.max_quantity THEN
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
    RETURN QUERY SELECT true, 'Add-ons validated successfully', validated_addons;
END;
$$ LANGUAGE plpgsql;

-- 13. Create RLS policies for add_ons table
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Add-ons are viewable by everyone" ON public.add_ons
    FOR SELECT USING (is_active = true);

CREATE POLICY "Add-ons are manageable by admins" ON public.add_ons
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );
    
-- 14. Create RLS policies for user_add_ons table
ALTER TABLE public.user_add_ons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own add-ons" ON public.user_add_ons
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own add-ons" ON public.user_add_ons
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own add-ons" ON public.user_add_ons
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own add-ons" ON public.user_add_ons
    FOR DELETE USING (user_id = auth.uid());

-- 15. Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_add_ons_updated_at 
    BEFORE UPDATE ON public.add_ons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Add comments
COMMENT ON TABLE public.add_ons IS 'Available add-ons for interview plans';
COMMENT ON TABLE public.user_add_ons IS 'User-selected add-ons for their interview sessions';
COMMENT ON COLUMN public.add_ons.addon_key IS 'Unique identifier for the add-on (e.g., resume_review)';
COMMENT ON COLUMN public.add_ons.requires_plan IS 'Plan required for this add-on (NULL = available for all plans)';
COMMENT ON COLUMN public.payment_sessions.selected_add_ons IS 'JSON array of selected add-ons with quantities';
COMMENT ON COLUMN public.payment_sessions.add_ons_total IS 'Total price of selected add-ons';
COMMENT ON COLUMN public.interviews.selected_add_ons IS 'JSON array of selected add-ons with quantities';
COMMENT ON COLUMN public.interviews.add_ons_total IS 'Total price of selected add-ons';

-- 17. Add logging
DO $$
BEGIN
    RAISE LOG 'Add-ons system migration completed successfully';
    RAISE LOG 'Created tables: add_ons, user_add_ons';
    RAISE LOG 'Updated tables: payment_sessions, interviews';
    RAISE LOG 'Created functions: calculate_addons_total, validate_addons';
    RAISE LOG 'Inserted default add-ons: resume_review, meeting_recording, priority_support, extended_feedback';
END $$;

