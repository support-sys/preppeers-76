import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp, AlertCircle, ArrowRight, Download, Check, Tag } from 'lucide-react';
import { getReadinessMessage, AssessmentResults } from '@/utils/readinessScoring';
import AvailableCoupons from '@/components/AvailableCoupons';

interface ReadinessResultsProps extends AssessmentResults {
  userEmail: string;
  userName: string;
  targetRole: string;
}

export const ReadinessResults = ({ 
  overallScore,
  categoryScores,
  correctAnswers,
  totalQuestions,
  strengths,
  weaknesses,
  readinessLevel,
  userEmail,
  userName,
  targetRole
}: ReadinessResultsProps) => {
  const navigate = useNavigate();
  const message = getReadinessMessage(overallScore, readinessLevel);

  const handleBookInterview = () => {
    // Navigate to book page with prefilled data
    navigate('/book', {
      state: {
        prefilled: {
          email: userEmail,
          name: userName,
          targetRole: targetRole,
          fromReadinessCheck: true
        }
      }
    });
  };

  // Score color based on level
  const getScoreColor = () => {
    if (overallScore >= 80) return 'from-green-500 to-emerald-400';
    if (overallScore >= 65) return 'from-blue-500 to-cyan-400';
    if (overallScore >= 50) return 'from-yellow-500 to-orange-400';
    return 'from-red-500 to-pink-400';
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      {/* Main Score Card - Compact */}
      <Card className="bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-blue-400/50 shadow-2xl p-4 md:p-6 text-center mb-6">
        <h2 className="text-lg md:text-xl text-slate-300 mb-3">
          Your Interview Readiness Score
        </h2>

        {/* Compact Score Display */}
        <div className="flex items-center justify-center gap-4 mb-3">
          {/* Score Number */}
          <div className={`text-5xl md:text-6xl font-bold bg-gradient-to-r ${getScoreColor()} bg-clip-text text-transparent`}>
            {overallScore}
          </div>
          
          {/* Score Info */}
          <div className="text-left">
            <div className="text-2xl md:text-3xl text-slate-400">/100</div>
            <div className="text-sm text-slate-300">
              {correctAnswers}/{totalQuestions} correct
            </div>
          </div>
        </div>

        {/* Result Message */}
        <h3 className="text-lg md:text-xl font-bold text-white">
          {message.title}
        </h3>
      </Card>

      

      {/* Quick Summary Cards */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        {/* Strengths */}
        <Card className="bg-green-900/20 border-2 border-green-500/40 p-4">
          <div className="flex items-center mb-3">
            <Trophy className="w-5 h-5 text-green-400 mr-2" />
            <h4 className="text-lg font-bold text-green-400">Strengths</h4>
          </div>
          <div className="space-y-2">
            {strengths.length > 0 ? (
              strengths.slice(0, 2).map((strength, i) => (
                <div key={i} className="flex items-start text-green-300">
                  <Check className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-green-400" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))
            ) : (
              <div className="text-green-300/70 text-sm">Keep building your foundation!</div>
            )}
          </div>
        </Card>

        {/* Areas to Improve */}
        <Card className="bg-orange-900/20 border-2 border-orange-500/40 p-4">
          <div className="flex items-center mb-3">
            <AlertCircle className="w-5 h-5 text-orange-400 mr-2" />
            <h4 className="text-lg font-bold text-orange-400">Focus Areas</h4>
          </div>
          <div className="space-y-2">
            {weaknesses.length > 0 ? (
              weaknesses.slice(0, 2).map((weakness, i) => (
                <div key={i} className="flex items-start text-orange-300">
                  <TrendingUp className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0 text-orange-400" />
                  <span className="text-sm">{weakness}</span>
                </div>
              ))
            ) : (
              <div className="text-orange-300/70 text-sm">You're doing great!</div>
            )}
          </div>
        </Card>
      </div>

      {/* CTA Card */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-2xl p-6 md:p-8 mb-6">
        <div className="text-center">
          <h3 className="text-xl md:text-2xl font-bold text-white mb-3">
            Want detailed feedback on your weak areas?
          </h3>

          <p className="text-slate-300 mb-6 text-sm md:text-base max-w-lg mx-auto">
            Book a mock interview to get personalized coaching and improve your interview skills
          </p>

          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white text-base md:text-lg px-8 py-4 font-semibold shadow-xl transition-all duration-300 transform hover:scale-105"
            onClick={handleBookInterview}
          >
            Book Mock Interview
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>

          <p className="text-slate-400 text-xs mt-3">
            ✓ Expert interviewers • ✓ Detailed feedback • ✓ Skill improvement
          </p>
        </div>
      </Card>

      {/* Coupons Section - Simplified */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20 p-4 md:p-6 mb-6">
        <div className="flex items-center justify-center mb-4">
          <Tag className="w-5 h-5 text-yellow-300 mr-2" />
          <h4 className="text-lg font-semibold text-white">Available Discounts</h4>
        </div>
        <AvailableCoupons onCouponSelect={() => {}} />
      </Card>

      {/* Simple Action Button */}
      <div className="text-center">
        <Button
          variant="outline"
          className="border-white/30 text-white hover:bg-white/10"
          onClick={() => window.location.href = '/'}
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
};

