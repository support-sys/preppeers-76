-- Fix incorrect interviewer data in existing interviews
-- Update interviews with interviewer_id '1cf5ac1c-5164-4cd6-b67b-1b4cb72148b5' (MAc company)
UPDATE public.interviews 
SET interviewer_email = 'interviewer1@gmail.com',
    interviewer_name = 'interviewer1'
WHERE interviewer_id = '1cf5ac1c-5164-4cd6-b67b-1b4cb72148b5'
  AND (interviewer_email = 'mac@example.com' OR interviewer_name = 'MAc');

-- Update interviews with interviewer_id '36af57bc-2500-461e-af4b-fff33c755506' (Infosys company)
UPDATE public.interviews 
SET interviewer_email = 'webwisr@gmail.com',
    interviewer_name = 'Tata'
WHERE interviewer_id = '36af57bc-2500-461e-af4b-fff33c755506'
  AND (interviewer_email = 'infosys@example.com' OR interviewer_name = 'Infosys');

-- Update interviews with interviewer_id '89550987-3404-4cdb-a631-34904d6072ba' (another Infosys)
UPDATE public.interviews 
SET interviewer_email = 'manoj@gmail.com',
    interviewer_name = 'manoj'
WHERE interviewer_id = '89550987-3404-4cdb-a631-34904d6072ba'
  AND (interviewer_email LIKE '%@example.com' OR interviewer_email = 'noreply@interviewscheduler.com');

-- Update any remaining interviews with example.com emails to use proper profile data
UPDATE public.interviews 
SET interviewer_email = p.email,
    interviewer_name = p.full_name
FROM public.interviewers i
JOIN public.profiles p ON i.user_id = p.id
WHERE public.interviews.interviewer_id = i.id
  AND (public.interviews.interviewer_email LIKE '%@example.com' 
       OR public.interviews.interviewer_email = 'noreply@interviewscheduler.com'
       OR public.interviews.interviewer_name IS NULL);