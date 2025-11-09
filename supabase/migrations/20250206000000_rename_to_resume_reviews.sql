-- Rename interview_readiness_assessments to resume_reviews
-- Remove assessment-related columns and add resume review columns
-- Add webhook trigger for n8n integration

-- Step 1: Rename the table
ALTER TABLE IF EXISTS public.interview_readiness_assessments 
RENAME TO resume_reviews;

-- Step 2: Drop assessment-related columns
ALTER TABLE public.resume_reviews
DROP COLUMN IF EXISTS questions_answered,
DROP COLUMN IF EXISTS total_questions,
DROP COLUMN IF EXISTS correct_answers,
DROP COLUMN IF EXISTS overall_score,
DROP COLUMN IF EXISTS technical_score,
DROP COLUMN IF EXISTS behavioral_score,
DROP COLUMN IF EXISTS scenario_score,
DROP COLUMN IF EXISTS strengths,
DROP COLUMN IF EXISTS weaknesses,
DROP COLUMN IF EXISTS readiness_level,
DROP COLUMN IF EXISTS completed_at;

-- Step 3: Add resume and review-related columns
ALTER TABLE public.resume_reviews
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS report_url TEXT,
ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS webhook_triggered_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 4: Update indexes
DROP INDEX IF EXISTS idx_readiness_email;
DROP INDEX IF EXISTS idx_readiness_user_id;
DROP INDEX IF EXISTS idx_readiness_role;
DROP INDEX IF EXISTS idx_readiness_converted;
DROP INDEX IF EXISTS idx_readiness_score;
DROP INDEX IF EXISTS idx_readiness_level;
DROP INDEX IF EXISTS idx_readiness_completed;

CREATE INDEX IF NOT EXISTS idx_resume_reviews_email ON resume_reviews(user_email);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_user_id ON resume_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_role ON resume_reviews(target_role);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_status ON resume_reviews(status);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_converted ON resume_reviews(converted_to_booking);
CREATE INDEX IF NOT EXISTS idx_resume_reviews_submitted ON resume_reviews(submitted_at);

-- Step 5: Update RLS policies (drop old ones and create new)
DROP POLICY IF EXISTS "Users can view their own assessments" ON resume_reviews;
DROP POLICY IF EXISTS "Anyone can insert assessments" ON resume_reviews;
DROP POLICY IF EXISTS "Users can update their own assessments" ON resume_reviews;

CREATE POLICY "Users can view their own resume reviews" 
ON resume_reviews FOR SELECT 
USING (user_id = auth.uid() OR user_email = auth.jwt() ->> 'email');

CREATE POLICY "Anyone can insert resume reviews" 
ON resume_reviews FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own resume reviews" 
ON resume_reviews FOR UPDATE 
USING (user_id = auth.uid() OR user_email = auth.jwt() ->> 'email');

-- Step 6: Create function to mark webhook as triggered
-- The actual webhook call is handled by Supabase Database Webhooks (configured in Dashboard)
-- Database Webhook will call the Edge Function, which then forwards to n8n
CREATE OR REPLACE FUNCTION trigger_resume_review_webhook()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on INSERT (new resume submission)
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Mark webhook as triggered (for tracking)
    -- The Database Webhook will automatically send the INSERT event to the Edge Function
    UPDATE resume_reviews 
    SET webhook_triggered_at = NOW()
    WHERE id = NEW.id;
    
    RAISE NOTICE 'Resume review submitted: ID=%, Email=%, Status=pending (Database Webhook will trigger)', NEW.id, NEW.user_email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS trigger_resume_review_webhook_trigger ON resume_reviews;
CREATE TRIGGER trigger_resume_review_webhook_trigger
AFTER INSERT ON resume_reviews
FOR EACH ROW
WHEN (NEW.status = 'pending')
EXECUTE FUNCTION trigger_resume_review_webhook();

-- Step 8: Update table comment
COMMENT ON TABLE resume_reviews IS 'Stores resume review submissions. Database trigger automatically calls n8n webhook when new record is inserted.';

COMMENT ON COLUMN resume_reviews.status IS 'Review status: pending (just submitted), processing (AI generating report), completed (report sent), failed (error occurred)';
COMMENT ON COLUMN resume_reviews.resume_url IS 'Public URL to uploaded resume in Supabase Storage bucket: candidate-resumes';
COMMENT ON COLUMN resume_reviews.report_url IS 'Public URL to generated AI report stored in Supabase Storage bucket: resume-review-reports. Reports are stored as PDF/HTML files and URLs are saved here for email delivery.';
COMMENT ON COLUMN resume_reviews.webhook_triggered_at IS 'Timestamp when webhook was triggered (via pg_net or Database Webhooks)';

-- Step 9: Update analytics view (simplified for resume reviews)
DROP VIEW IF EXISTS readiness_assessment_analytics;
CREATE OR REPLACE VIEW resume_review_analytics AS
SELECT 
    target_role,
    COUNT(*) as total_submissions,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
    COUNT(CASE WHEN converted_to_booking THEN 1 END) as conversions,
    ROUND(COUNT(CASE WHEN converted_to_booking THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2) as conversion_rate,
    AVG(EXTRACT(EPOCH FROM (report_generated_at - submitted_at))/60) as avg_processing_time_minutes
FROM resume_reviews
GROUP BY target_role
ORDER BY total_submissions DESC;

GRANT SELECT ON resume_review_analytics TO authenticated;
COMMENT ON VIEW resume_review_analytics IS 'Analytics view for resume reviews by role';

-- Step 10: Create function to update status (can be called by n8n webhook or Supabase Edge Function)
CREATE OR REPLACE FUNCTION update_resume_review_status(
  review_id UUID,
  new_status VARCHAR(50),
  report_url_param TEXT DEFAULT NULL,
  error_msg TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE resume_reviews
  SET 
    status = new_status,
    report_url = COALESCE(report_url_param, report_url),
    report_generated_at = CASE WHEN new_status = 'completed' AND report_url_param IS NOT NULL THEN NOW() ELSE report_generated_at END,
    email_sent_at = CASE WHEN new_status = 'completed' THEN NOW() ELSE email_sent_at END,
    error_message = COALESCE(error_msg, error_message),
    updated_at = NOW()
  WHERE id = review_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_resume_review_status IS 'Updates resume review status. Can be called by n8n webhook or Supabase Edge Function after processing.';

-- ============================================================================
-- n8n WEBHOOK SETUP INSTRUCTIONS (Using Database Webhooks + Edge Function)
-- ============================================================================
--
-- SETUP STEPS:
-- ----------------------------------------------------------------------------
-- 1. Deploy the Edge Function:
--    supabase functions deploy resume-review-webhook
--
-- 2. Set n8n webhook URL as environment variable:
--    supabase secrets set N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/resume-review
--
-- 3. Create Database Webhook in Supabase Dashboard:
--    - Go to Database > Webhooks
--    - Click "Create a new webhook"
--    - Name: "Resume Review to n8n"
--    - Table: resume_reviews
--    - Events: INSERT
--    - Type: HTTP Request
--    - URL: https://kqyynigirebbggphstac.supabase.co/functions/v1/resume-review-webhook
--    - HTTP Method: POST
--    - HTTP Headers: 
--      {
--        "Authorization": "Bearer {service_role_key}",
--        "Content-Type": "application/json"
--      }
--
-- 4. When a new resume is submitted, the Database Webhook will automatically:
--    - Send INSERT event to Edge Function
--    - Edge Function forwards to n8n webhook
--    - n8n processes the resume review
--
--
-- n8n WORKFLOW SETUP:
-- ----------------------------------------------------------------------------
-- 1. Create webhook node that receives POST requests
-- 2. When webhook is received, n8n workflow should:
--    - Update status to 'processing' (call update_resume_review_status function via Supabase node)
--    - Fetch resume from Supabase Storage using resume_url
--    - Call AI API to generate report
--    - Store report in Supabase Storage (resume-review-reports bucket)
--    - Send email with report and booking CTA
--    - Call update_resume_review_status() function to mark as 'completed'
-- 3. If error occurs, call update_resume_review_status() with status='failed' and error_message
--
-- See SETUP_DATABASE_WEBHOOK.md for detailed step-by-step instructions.
--
-- ============================================================================

