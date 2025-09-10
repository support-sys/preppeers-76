-- add_sample_interviewers_simple.sql

-- First, let's check if we have any existing users we can use
SELECT '--- Checking for existing users to convert to interviewers ---' AS status;

-- Get the first few users from auth.users
SELECT 
    u.id,
    u.email,
    u.created_at
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.interviewers WHERE user_id IS NOT NULL)
LIMIT 3;

-- If we have users, let's create interviewer profiles for them
-- This will only work if we have existing users in auth.users
INSERT INTO public.interviewers (
    user_id,
    position,
    experience_years,
    skills,
    technologies,
    bio,
    is_eligible
)
SELECT 
    u.id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN 'Senior Software Engineer'
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 2 THEN 'Tech Lead'
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 3 THEN 'Principal Engineer'
        ELSE 'Software Engineer'
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN 8
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 2 THEN 10
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 3 THEN 12
        ELSE 5
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN ARRAY['React', 'Node.js', 'TypeScript', 'System Design']
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 2 THEN ARRAY['System Design', 'Microservices', 'Leadership', 'Architecture']
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 3 THEN ARRAY['Architecture', 'DevOps', 'Cloud', 'Scalability']
        ELSE ARRAY['JavaScript', 'Python', 'Web Development']
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN ARRAY['JavaScript', 'Python', 'AWS', 'Docker', 'Kubernetes']
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 2 THEN ARRAY['Java', 'Spring Boot', 'Kubernetes', 'MongoDB', 'Redis']
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 3 THEN ARRAY['Python', 'Go', 'Terraform', 'AWS', 'Docker', 'Kubernetes']
        ELSE ARRAY['HTML', 'CSS', 'JavaScript', 'React', 'Node.js']
    END,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 1 THEN 'Experienced full-stack developer with 8+ years in building scalable web applications. Passionate about mentoring and helping developers grow.'
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 2 THEN 'Tech lead with 10+ years experience in building enterprise-grade systems. Expert in system design and team leadership.'
        WHEN ROW_NUMBER() OVER (ORDER BY u.created_at) = 3 THEN 'Principal engineer with 12+ years in cloud architecture and DevOps. Specializes in building resilient, scalable systems.'
        ELSE 'Experienced software engineer with expertise in modern web technologies and best practices.'
    END,
    true
FROM auth.users u
WHERE u.id NOT IN (SELECT user_id FROM public.interviewers WHERE user_id IS NOT NULL)
LIMIT 3
ON CONFLICT (user_id) DO NOTHING;

-- Update their profiles to have interviewer role
UPDATE public.profiles 
SET role = 'interviewer'::public.user_role
WHERE id IN (
    SELECT user_id FROM public.interviewers 
    WHERE is_eligible = true 
    AND user_id IN (SELECT id FROM public.profiles)
);

-- Check the results
SELECT '--- After adding sample interviewers ---' AS status;
SELECT COUNT(*) as total_interviewers FROM public.interviewers;
SELECT COUNT(*) as eligible_interviewers FROM public.interviewers WHERE is_eligible = true;

SELECT '--- Sample interviewers created ---' AS status;
SELECT 
    i.id,
    p.full_name,
    p.email,
    i.position,
    i.experience_years,
    i.is_eligible
FROM public.interviewers i
JOIN public.profiles p ON i.user_id = p.id
WHERE i.is_eligible = true
ORDER BY i.experience_years DESC;
