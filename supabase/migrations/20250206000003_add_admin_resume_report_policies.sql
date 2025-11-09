-- Add storage policies so authenticated admins can manage resume review reports

-- Allow authenticated admins to upload reports to the resume-review-reports bucket
DROP POLICY IF EXISTS "Admins can upload resume review reports" ON storage.objects;
CREATE POLICY "Admins can upload resume review reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'resume-review-reports'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);

-- Allow authenticated admins to update reports in the resume-review-reports bucket
DROP POLICY IF EXISTS "Admins can update resume review reports" ON storage.objects;
CREATE POLICY "Admins can update resume review reports"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'resume-review-reports'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'resume-review-reports'
);

-- Allow authenticated admins to delete reports from the resume-review-reports bucket
DROP POLICY IF EXISTS "Admins can delete resume review reports" ON storage.objects;
CREATE POLICY "Admins can delete resume review reports"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'resume-review-reports'
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  )
);


