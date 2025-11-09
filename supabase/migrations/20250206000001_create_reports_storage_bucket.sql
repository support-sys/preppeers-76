-- Create storage bucket for resume review reports
-- Reports will be stored here and URLs saved in resume_reviews.report_url

-- Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-review-reports',
  'resume-review-reports',
  true, -- Public bucket for easy access
  10485760, -- 10MB file size limit
  ARRAY['application/pdf', 'text/html', 'text/plain'] -- PDF, HTML, or text reports
)
ON CONFLICT (id) DO NOTHING;

-- Note: RLS is already enabled on storage.objects by Supabase by default
-- We only need to create policies for our bucket

-- Policy 1: Allow service role to upload reports (for n8n/backend)
-- Drop policy if exists to allow re-running migration
DROP POLICY IF EXISTS "Service role can upload reports" ON storage.objects;
CREATE POLICY "Service role can upload reports" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resume-review-reports'
);

-- Policy 2: Allow public read access to reports (so candidates can access their reports)
-- Drop policy if exists to allow re-running migration
DROP POLICY IF EXISTS "Public read access for reports" ON storage.objects;
CREATE POLICY "Public read access for reports" ON storage.objects
FOR SELECT USING (
  bucket_id = 'resume-review-reports'
);

-- Policy 3: Allow service role to update reports
-- Drop policy if exists to allow re-running migration
DROP POLICY IF EXISTS "Service role can update reports" ON storage.objects;
CREATE POLICY "Service role can update reports" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resume-review-reports'
);

-- Policy 4: Allow service role to delete reports (for cleanup)
-- Drop policy if exists to allow re-running migration
DROP POLICY IF EXISTS "Service role can delete reports" ON storage.objects;
CREATE POLICY "Service role can delete reports" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resume-review-reports'
);


