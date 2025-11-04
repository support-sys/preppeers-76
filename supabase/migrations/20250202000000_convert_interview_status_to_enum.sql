-- Create interview_status enum type
CREATE TYPE public.interview_status AS ENUM ('scheduled', 'completed', 'under_review', 'cancelled', 'rescheduled');

-- Add new status column with enum type (temporarily)
ALTER TABLE public.interviews 
ADD COLUMN IF NOT EXISTS status_enum public.interview_status DEFAULT 'scheduled';

-- Migrate existing data
UPDATE public.interviews 
SET status_enum = CASE 
  WHEN status = 'scheduled' THEN 'scheduled'::public.interview_status
  WHEN status = 'completed' THEN 'completed'::public.interview_status
  WHEN status = 'cancelled' THEN 'cancelled'::public.interview_status
  WHEN status = 'rescheduled' THEN 'rescheduled'::public.interview_status
  ELSE 'scheduled'::public.interview_status  -- Default fallback
END;

-- Drop old status column
ALTER TABLE public.interviews DROP COLUMN status;

-- Rename new column to status
ALTER TABLE public.interviews RENAME COLUMN status_enum TO status;

-- Set NOT NULL constraint
ALTER TABLE public.interviews 
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN status SET DEFAULT 'scheduled'::public.interview_status;

-- Update admin_update_interview_status function to accept enum
CREATE OR REPLACE FUNCTION "public"."admin_update_interview_status"(
  "interview_id" uuid, 
  "new_status" text, 
  "admin_notes" text DEFAULT NULL::text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET "search_path" TO 'public'
AS $$
DECLARE
  v_new_status public.interview_status;
BEGIN
  -- Check if user is admin with manage_interviews permission
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles p
    JOIN public.admins a ON p.id = a.user_id
    WHERE p.id = auth.uid() 
    AND p.role = 'admin' 
    AND ('manage_interviews' = ANY(a.permissions) OR a.is_super_admin = TRUE)
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin manage_interviews permission required';
  END IF;
  
  -- Convert text to enum
  BEGIN
    v_new_status := new_status::public.interview_status;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Invalid status: %. Must be one of: scheduled, completed, under_review, cancelled, rescheduled', new_status;
  END;
  
  -- Update interview status
  UPDATE public.interviews 
  SET 
    status = v_new_status,
    updated_at = NOW()
  WHERE id = interview_id;
  
  RETURN TRUE;
END;
$$;

-- Comment on enum type
COMMENT ON TYPE public.interview_status IS 'Interview status: scheduled, completed, under_review, cancelled, or rescheduled';

-- Create or replace the payout trigger function
-- NOTE: Amounts match src/config/payoutConfig.ts - if you change those, update these too!
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
    
    -- Map plan to payout amount (values match src/config/payoutConfig.ts)
    -- ⚠️ IMPORTANT: Keep these values in sync with src/config/payoutConfig.ts
    CASE LOWER(v_selected_plan)
      WHEN 'essential' THEN v_payout_amount := 300.00;
      WHEN 'professional' THEN v_payout_amount := 700.00;
      ELSE v_payout_amount := 300.00; -- Default to essential
    END CASE;
    
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
    
    RAISE NOTICE 'Created payout for interview % with amount %', NEW.id, v_payout_amount;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_create_payout_on_interview_complete ON public.interviews;
CREATE TRIGGER trigger_create_payout_on_interview_complete
AFTER UPDATE ON public.interviews
FOR EACH ROW
WHEN (NEW.status = 'completed'::public.interview_status AND (OLD.status IS NULL OR OLD.status != 'completed'::public.interview_status))
EXECUTE FUNCTION create_payout_on_interview_complete();
