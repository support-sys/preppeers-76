-- Create interview readiness assessment system
-- This allows candidates to take a free quick assessment and check their interview readiness

-- Create readiness level ENUM
DO $$ BEGIN
    CREATE TYPE readiness_level AS ENUM ('excellent', 'good', 'needs_improvement', 'not_ready');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create main assessment table
CREATE TABLE IF NOT EXISTS public.interview_readiness_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) NULL, -- NULL if not logged in
    user_email TEXT NOT NULL,
    user_name TEXT,
    target_role TEXT NOT NULL,
    experience_years INTEGER,
    
    -- Assessment data
    questions_answered JSONB NOT NULL, -- [{question_id, selected_answer, is_correct, category}]
    total_questions INTEGER DEFAULT 15,
    correct_answers INTEGER NOT NULL,
    
    -- Scores
    overall_score INTEGER NOT NULL, -- 0-100
    technical_score INTEGER, -- 0-100
    behavioral_score INTEGER, -- 0-100
    scenario_score INTEGER, -- 0-100
    
    -- Analysis
    strengths TEXT[], -- ["Technical knowledge", "Problem-solving"]
    weaknesses TEXT[], -- ["Behavioral answers", "STAR method"]
    readiness_level readiness_level NOT NULL,
    
    -- Conversion tracking
    completed_at TIMESTAMP DEFAULT NOW(),
    converted_to_booking BOOLEAN DEFAULT FALSE,
    booking_id UUID REFERENCES interviews(id) NULL,
    conversion_date TIMESTAMP NULL,
    
    -- Source tracking
    utm_source TEXT,
    referrer TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance and analytics
CREATE INDEX IF NOT EXISTS idx_readiness_email ON interview_readiness_assessments(user_email);
CREATE INDEX IF NOT EXISTS idx_readiness_user_id ON interview_readiness_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_readiness_role ON interview_readiness_assessments(target_role);
CREATE INDEX IF NOT EXISTS idx_readiness_converted ON interview_readiness_assessments(converted_to_booking);
CREATE INDEX IF NOT EXISTS idx_readiness_score ON interview_readiness_assessments(overall_score);
CREATE INDEX IF NOT EXISTS idx_readiness_level ON interview_readiness_assessments(readiness_level);
CREATE INDEX IF NOT EXISTS idx_readiness_completed ON interview_readiness_assessments(completed_at);

-- Enable RLS
ALTER TABLE interview_readiness_assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own assessments" 
ON interview_readiness_assessments FOR SELECT 
USING (user_id = auth.uid() OR user_email = auth.jwt() ->> 'email');

CREATE POLICY "Anyone can insert assessments" 
ON interview_readiness_assessments FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own assessments" 
ON interview_readiness_assessments FOR UPDATE 
USING (user_id = auth.uid() OR user_email = auth.jwt() ->> 'email');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON interview_readiness_assessments TO anon, authenticated;

-- Add comments
COMMENT ON TABLE interview_readiness_assessments IS 'Stores free interview readiness assessment results for lead generation and conversion tracking';
COMMENT ON COLUMN interview_readiness_assessments.readiness_level IS 'Overall readiness level: excellent (80+), good (65-79), needs_improvement (50-64), not_ready (<50)';

-- Create analytics view for admin dashboard
CREATE OR REPLACE VIEW readiness_assessment_analytics AS
SELECT 
    target_role,
    COUNT(*) as total_assessments,
    ROUND(AVG(overall_score), 1) as avg_score,
    ROUND(AVG(technical_score), 1) as avg_technical,
    ROUND(AVG(behavioral_score), 1) as avg_behavioral,
    ROUND(AVG(scenario_score), 1) as avg_scenario,
    COUNT(CASE WHEN converted_to_booking THEN 1 END) as conversions,
    ROUND(COUNT(CASE WHEN converted_to_booking THEN 1 END)::NUMERIC / NULLIF(COUNT(*), 0)::NUMERIC * 100, 2) as conversion_rate,
    COUNT(CASE WHEN readiness_level = 'excellent' THEN 1 END) as excellent_count,
    COUNT(CASE WHEN readiness_level = 'good' THEN 1 END) as good_count,
    COUNT(CASE WHEN readiness_level = 'needs_improvement' THEN 1 END) as needs_improvement_count,
    COUNT(CASE WHEN readiness_level = 'not_ready' THEN 1 END) as not_ready_count
FROM interview_readiness_assessments
GROUP BY target_role
ORDER BY total_assessments DESC;

GRANT SELECT ON readiness_assessment_analytics TO authenticated;

COMMENT ON VIEW readiness_assessment_analytics IS 'Analytics view for readiness assessments by role';






