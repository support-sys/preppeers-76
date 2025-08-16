-- Enable frontend developers to be eligible for matching
UPDATE interviewers 
SET is_eligible = true 
WHERE skills @> ARRAY['Frontend Development'] 
AND is_eligible = false;