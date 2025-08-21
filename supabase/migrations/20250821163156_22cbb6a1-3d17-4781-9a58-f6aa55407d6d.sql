-- Fix the RLS policy for interview updates to properly check interviewer ownership
DROP POLICY IF EXISTS "Allow interview owner to update" ON public.interviews;

CREATE POLICY "Allow interview owner to update" 
ON public.interviews 
FOR UPDATE 
USING (
  (interviewer_id IN (
    SELECT id FROM public.interviewers 
    WHERE user_id = auth.uid()
  )) 
  OR 
  (candidate_email = auth.email())
) 
WITH CHECK (
  (interviewer_id IN (
    SELECT id FROM public.interviewers 
    WHERE user_id = auth.uid()
  )) 
  OR 
  (candidate_email = auth.email())
);