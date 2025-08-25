-- Test the trigger with NOTICE messages
UPDATE interviewers 
SET is_eligible = true, updated_at = now()
WHERE user_id = (SELECT id FROM profiles WHERE email = 'bxvo7@powerscrews.com');