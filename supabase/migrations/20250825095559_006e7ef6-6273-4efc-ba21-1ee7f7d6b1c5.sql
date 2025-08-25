-- Test the trigger with the test function
UPDATE interviewers 
SET is_eligible = false 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'bxvo7@powerscrews.com');

-- Then set it back to true to trigger the notification
UPDATE interviewers 
SET is_eligible = true 
WHERE user_id = (SELECT id FROM profiles WHERE email = 'bxvo7@powerscrews.com');