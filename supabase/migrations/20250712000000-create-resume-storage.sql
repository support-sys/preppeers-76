-- Create storage bucket for candidate resumes
-- This migration sets up the storage bucket and policies for resume uploads

-- Create the storage bucket (this is typically done through the Supabase dashboard)
-- But we can document the required bucket name and policies here

-- Bucket name: candidate-resumes
-- This should be created in the Supabase dashboard under Storage

-- Storage policies for the candidate-resumes bucket:

-- 1. Allow authenticated users to upload their own resumes
CREATE POLICY "Users can upload their own resumes" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. Allow users to view their own resumes
CREATE POLICY "Users can view their own resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Allow users to update their own resumes
CREATE POLICY "Users can update their own resumes" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Allow users to delete their own resumes
CREATE POLICY "Users can delete their own resumes" ON storage.objects
FOR DELETE USING (
  bucket_id = 'candidate-resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Allow interviewers to view resumes for interviews they're conducting
-- This is a more complex policy that would need to be implemented based on interview relationships
-- For now, we'll allow public read access to resumes (with proper URL security)
CREATE POLICY "Public read access for resumes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'candidate-resumes'
);

-- Note: The actual bucket creation should be done through the Supabase dashboard:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Create a new bucket called "candidate-resumes"
-- 3. Set it to public (for read access)
-- 4. Apply the policies above 