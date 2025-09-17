-- Add assessment tracking columns to interviewers table
ALTER TABLE interviewers 
ADD COLUMN assessment_mcq_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN assessment_session_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN assessment_completed_at TIMESTAMP;

-- Add comment for clarity
COMMENT ON COLUMN interviewers.assessment_mcq_completed IS 'Tracks if interviewer completed MCQ assessment';
COMMENT ON COLUMN interviewers.assessment_session_completed IS 'Tracks if interviewer completed live session assessment';
COMMENT ON COLUMN interviewers.assessment_completed_at IS 'Timestamp when both assessments are completed';
