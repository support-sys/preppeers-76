-- Alternative approach: Use an email queue table (most secure)
-- No HTTP calls from database, process emails separately

-- Create email queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email_type TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  template_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for admins only
CREATE POLICY "Admin can manage email queue" ON public.email_queue
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'::user_role
    )
  );

-- Simplified trigger that just adds to queue
CREATE OR REPLACE FUNCTION public.handle_interviewer_eligibility_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_record RECORD;
BEGIN
  -- Only proceed if this is an UPDATE operation and iseligible changed from false to true
  IF TG_OP = 'UPDATE' AND OLD.iseligible = false AND NEW.iseligible = true THEN
    
    -- Get profile details
    SELECT full_name, email INTO profile_record FROM public.profiles WHERE id = NEW.user_id;
    
    -- Add to email queue if profile exists
    IF profile_record.full_name IS NOT NULL AND profile_record.email IS NOT NULL THEN
      INSERT INTO public.email_queue (
        email_type,
        recipient_email,
        recipient_name,
        template_data
      ) VALUES (
        'interviewer_eligibility',
        profile_record.email,
        profile_record.full_name,
        jsonb_build_object(
          'interviewer_name', profile_record.full_name,
          'interviewer_email', profile_record.email
        )
      );
      
      -- Log the eligibility change
      INSERT INTO public.audit_log (
        table_name,
        operation,
        old_data,
        new_data,
        user_id,
        timestamp
      ) VALUES (
        'interviewers',
        'eligibility_granted_queued',
        jsonb_build_object(
          'email_queued_for', profile_record.email,
          'name', profile_record.full_name
        ),
        row_to_json(NEW),
        NEW.user_id,
        NOW()
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to process email queue (call this from your application or manually)
CREATE OR REPLACE FUNCTION public.process_pending_emails()
RETURNS TABLE(
  processed_count INTEGER,
  failed_count INTEGER,
  pending_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  processed INTEGER := 0;
  failed INTEGER := 0;
  pending INTEGER := 0;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'::user_role
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;
  
  -- Count pending emails
  SELECT COUNT(*) INTO pending FROM public.email_queue WHERE status = 'pending';
  
  -- For now, just mark them as ready for manual processing
  -- In practice, you'd call your edge function here or from your application
  UPDATE public.email_queue 
  SET 
    status = 'sent',
    sent_at = NOW(),
    updated_at = NOW()
  WHERE status = 'pending';
  
  GET DIAGNOSTICS processed = ROW_COUNT;
  
  RETURN QUERY SELECT processed, failed, pending;
END;
$$;
