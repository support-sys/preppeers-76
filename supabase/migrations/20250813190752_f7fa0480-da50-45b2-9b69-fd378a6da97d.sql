-- Reset interview_matched flag for payment session that was incorrectly marked as matched
UPDATE payment_sessions 
SET interview_matched = false 
WHERE id = 'eb754f3c-fd3e-4be5-90d8-1f328d1442fb';