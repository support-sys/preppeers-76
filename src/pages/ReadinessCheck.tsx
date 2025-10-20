import { useState } from 'react';
import { ReadinessInfoForm, ReadinessInfoData } from '@/components/readiness/ReadinessInfoForm';
import { ReadinessQuestions } from '@/components/readiness/ReadinessQuestions';
import { ReadinessResults } from '@/components/readiness/ReadinessResults';
import { getQuestionsForRole } from '@/config/readinessQuestions';
import { calculateAssessmentResults } from '@/utils/readinessScoring';
import { supabase } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import WhatsAppChat from '@/components/WhatsAppChat';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type AssessmentStep = 'info' | 'questions' | 'results';

// Create a dedicated anonymous client for assessments
const supabaseAnon = createClient(
  "https://kqyynigirebbggphstac.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxeXluaWdpcmViYmdncGhzdGFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3MDU0NzQsImV4cCI6MjA3MzI4MTQ3NH0.yaPxdB8Pcr03GLYcQLmRyk7tKB4bh0lUgoqo31i-aXk",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);

const ReadinessCheck = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [step, setStep] = useState<AssessmentStep>('info');
  const [userInfo, setUserInfo] = useState<ReadinessInfoData | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInfoSubmit = (data: ReadinessInfoData) => {
    console.log('📋 User info submitted:', data);
    setUserInfo(data);
    
    // Get questions for selected role
    const selectedQuestions = getQuestionsForRole(data.targetRole);
    console.log(`📝 Loaded ${selectedQuestions.length} questions for ${data.targetRole}`);
    setQuestions(selectedQuestions);
    
    setStep('questions');
  };

  const handleAssessmentComplete = async (answers: number[]) => {
    if (!userInfo) return;

    setIsProcessing(true);
    console.log('✅ Assessment completed, calculating scores...');

    try {
      // Calculate comprehensive results
      const scoringResults = calculateAssessmentResults(questions, answers);
      console.log('📊 Scoring results:', scoringResults);

      // Prepare assessment data for database
      const assessmentData = {
        user_id: user?.id || null,
        user_email: userInfo.email,
        user_name: userInfo.name,
        target_role: userInfo.targetRole,
        experience_years: userInfo.experienceYears,
        questions_answered: questions.map((q, i) => ({
          question_id: q.id,
          question_text: q.question,
          selected_answer: answers[i],
          correct_answer: q.correctAnswer,
          is_correct: answers[i] === q.correctAnswer,
          category: q.category,
          weight: q.weight
        })),
        total_questions: questions.length,
        correct_answers: scoringResults.correctAnswers,
        overall_score: scoringResults.overallScore,
        technical_score: scoringResults.categoryScores.technical,
        behavioral_score: scoringResults.categoryScores.behavioral,
        scenario_score: scoringResults.categoryScores.scenario,
        strengths: scoringResults.strengths,
        weaknesses: scoringResults.weaknesses,
        readiness_level: scoringResults.readinessLevel,
        utm_source: new URLSearchParams(window.location.search).get('utm_source'),
        referrer: document.referrer
      };

      console.log('💾 Saving assessment to database...');
      console.log('📊 Assessment data to save:', assessmentData);

      // Save to database - use anonymous client to avoid auth issues
      const { data: savedAssessment, error } = await supabaseAnon
        .from('interview_readiness_assessments')
        .insert(assessmentData)
        .select()
        .single();

      if (error) {
        console.error('❌ Error saving assessment:', error);
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "Warning",
          description: `Assessment completed but couldn't save to database: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Assessment saved successfully:', savedAssessment.id);
      }

      // Show results
      setResults({
        ...scoringResults,
        assessmentId: savedAssessment?.id
      });
      setStep('results');

      // Scroll to top to show results
      window.scrollTo({ top: 0, behavior: 'smooth' });

      toast({
        title: "Assessment Complete!",
        description: `You scored ${scoringResults.overallScore}/100. Check out your detailed results below.`,
      });

    } catch (error) {
      console.error('❌ Error processing assessment:', error);
      toast({
        title: "Error",
        description: "Failed to process assessment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      
      {/* Tech Background Pattern - Consistent with main site */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent">
          <div className="w-full h-full" style={{
            background: 'radial-gradient(circle at 25% 25%, rgba(156, 146, 172, 0.1) 2px, transparent 2px)',
            backgroundSize: '60px 60px'
          }} />
        </div>
      </div>

      <div className="relative z-10 pt-20 md:pt-32 pb-16">
        {/* Loading State */}
        {isProcessing && (
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <Card className="bg-white/10 border-white/20 p-8 md:p-12">
                <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-400 animate-spin mx-auto mb-4" />
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                  Calculating Your Results...
                </h3>
                <p className="text-slate-300 text-sm md:text-base">
                  Analyzing your answers and preparing personalized feedback
                </p>
              </Card>
            </div>
          </div>
        )}

        {/* Step 1: Info Collection */}
        {!isProcessing && step === 'info' && (
          <div className="container mx-auto px-4">
            <ReadinessInfoForm onSubmit={handleInfoSubmit} />
          </div>
        )}

        {/* Step 2: Questions */}
        {!isProcessing && step === 'questions' && userInfo && (
          <div className="container mx-auto px-4">
            <ReadinessQuestions
              questions={questions}
              onComplete={handleAssessmentComplete}
              targetRole={userInfo.targetRole}
            />
          </div>
        )}

        {/* Step 3: Results */}
        {!isProcessing && step === 'results' && userInfo && results && (
          <div className="container mx-auto px-4">
            <ReadinessResults
              {...results}
              userEmail={userInfo.email}
              userName={userInfo.name}
              targetRole={userInfo.targetRole}
            />
          </div>
        )}
      </div>

      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default ReadinessCheck;


