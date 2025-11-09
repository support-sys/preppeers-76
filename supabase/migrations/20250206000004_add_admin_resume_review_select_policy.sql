-- Allow admin users to read any resume review record
DROP POLICY IF EXISTS "Admins can view all resume reviews" ON resume_reviews;

CREATE POLICY "Admins can view all resume reviews"
ON resume_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
  )
);


