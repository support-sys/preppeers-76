-- Check if iseligible column exists in interviewers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'interviewers' 
AND table_schema = 'public'
AND column_name IN ('iseligible', 'is_eligible')
ORDER BY column_name;
