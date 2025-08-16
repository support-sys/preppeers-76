import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, CheckCircle, Clock, Calendar, Star, Award, ArrowRight } from "lucide-react";
import MatchQualityIndicator from "@/components/MatchQualityIndicator";
import PoorMatchWarning from "@/components/PoorMatchWarning";

interface InterviewerPreviewProps {
  matchedInterviewer: any;
  alternativeTimeSlot?: {
    candidatePreferred: string;
    interviewerAvailable: string;
  };
  onProceedToPayment: () => void;
  onGoBack: () => void;
  formData: any;
}

const InterviewerPreview = ({ 
  matchedInterviewer, 
  alternativeTimeSlot,
  onProceedToPayment, 
  onGoBack,
  formData 
}: InterviewerPreviewProps) => {
  const isPoorMatch = matchedInterviewer?.skillQuality === 'poor';
  const isExcellentMatch = matchedInterviewer?.skillQuality === 'excellent';
  const isGoodMatch = matchedInterviewer?.skillQuality === 'good';

  const getMatchTitle = () => {
    if (isExcellentMatch) return "Excellent Match Found! 🎯";
    if (isGoodMatch) return "Good Match Found! ✅";
    if (isPoorMatch) return "Interviewer Found ⚠️";
    return "Match Found 📋";
  };

  const getMatchDescription = () => {
    if (isExcellentMatch) return "We found an excellent interviewer with perfect skill alignment.";
    if (isGoodMatch) return "We found a good interviewer with strong skill compatibility."; 
    if (isPoorMatch) return "We found an available interviewer, but with limited skill overlap.";
    return "We found an interviewer for your requirements.";
  };

  // Show poor match warning if skill quality is poor
  if (isPoorMatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl mx-auto">
            <PoorMatchWarning 
              matchQuality={matchedInterviewer.skillQuality}
              matchScore={matchedInterviewer.matchScore}
              skillCategories={formData?.skillCategories || []}
              onAcceptMatch={onProceedToPayment}
              onWaitForBetter={() => {
                // For now, just go back - in future this could trigger notifications
                onGoBack();
              }}
              onModifyRequirements={onGoBack}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              {getMatchTitle()}
            </h1>
            <p className="text-xl text-blue-200">
              {getMatchDescription()} Review the details below and proceed to secure your slot.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interviewer Details */}
            <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-blue-400/30">
              <CardHeader className="text-center">
                <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-blue-500/20 backdrop-blur-sm">
                  <User className="w-10 h-10 text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-blue-400">
                  {matchedInterviewer?.name || matchedInterviewer?.full_name || 'Senior Interviewer'}
                </CardTitle>
                <CardDescription className="text-lg text-blue-200">
                  {matchedInterviewer?.position || 'Experienced Professional'} at {matchedInterviewer?.company || 'Top Company'}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Match Quality Indicator */}
                {matchedInterviewer?.skillQuality && (
                  <MatchQualityIndicator 
                    quality={matchedInterviewer.skillQuality}
                    score={matchedInterviewer.matchScore || 0}
                    maxScore={100}
                  />
                )}

                {/* Match Reasons */}
                {matchedInterviewer?.matchReasons && (
                  <div className="bg-white/5 backdrop-blur-sm border border-green-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <Star className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold text-green-400">Match Highlights:</h4>
                    </div>
                    <ul className="text-sm text-green-200 space-y-2">
                      {matchedInterviewer.matchReasons.map((reason: string, index: number) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Match Details */}
                {matchedInterviewer?.matchDetails && matchedInterviewer.matchDetails.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-400 mb-3">Detailed Match Analysis:</h4>
                    <ul className="text-sm text-blue-200 space-y-1">
                      {matchedInterviewer.matchDetails.map((detail: string, index: number) => (
                        <li key={index}>• {detail}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Experience & Skills */}
                <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-3">
                    <Award className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-blue-400">Expertise</h4>
                  </div>
                  <div className="text-blue-200 text-sm space-y-1">
                    <p><strong>Experience:</strong> {matchedInterviewer?.experienceYears || '5+'} years</p>
                    <p><strong>Specialization:</strong> {formData?.skillCategories?.join(', ') || 'Technical Skills'}</p>
                    {matchedInterviewer?.companyTier && (
                      <p><strong>Company Tier:</strong> {matchedInterviewer.companyTier}</p>
                    )}
                  </div>
                </div>

                {/* Time Slot Information */}
                {alternativeTimeSlot ? (
                  <div className="bg-white/5 backdrop-blur-sm border border-orange-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-3">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <h4 className="font-semibold text-orange-400">Time Adjustment Needed</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="text-red-200">
                        <strong>Your preference:</strong> {alternativeTimeSlot.candidatePreferred}
                      </div>
                      <div className="text-green-200">
                        <strong>Interviewer available:</strong> {alternativeTimeSlot.interviewerAvailable}
                      </div>
                    </div>
                  </div>
                ) : matchedInterviewer?.hasExactTimeMatch ? (
                  <div className="bg-white/5 backdrop-blur-sm border border-green-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-400" />
                      <h4 className="font-semibold text-green-400">Perfect Time Match!</h4>
                    </div>
                    <p className="text-green-200 text-sm">
                      Available for your preferred time: {formData?.timeSlot}
                    </p>
                  </div>
                ) : (
                  <div className="bg-white/5 backdrop-blur-sm border border-blue-400/30 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-400" />
                      <h4 className="font-semibold text-blue-400">Alternative Time Available</h4>
                    </div>
                    <p className="text-blue-200 text-sm">
                      Best available match with alternative timing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-purple-400/30">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-purple-400">
                  Booking Summary
                </CardTitle>
                <CardDescription className="text-purple-200">
                  Your interview session details
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl">
                    <h4 className="font-semibold text-white mb-3">Session Details</h4>
                    <div className="text-sm text-slate-300 space-y-2">
                      <div><strong>Skills Focus:</strong> {formData?.skillCategories?.join(', ')}</div>
                      {formData?.specificSkills && (
                        <div><strong>Specific Skills:</strong> {formData.specificSkills.join(', ')}</div>
                      )}
                      <div><strong>Experience Level:</strong> {formData?.experienceYears} years</div>
                      <div><strong>Session Duration:</strong> 60 minutes</div>
                      <div><strong>Format:</strong> Video call with screen sharing</div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-400/30 p-4 rounded-xl">
                    <h4 className="font-semibold text-green-400 mb-2">What's Included:</h4>
                    <ul className="text-sm text-green-200 space-y-1">
                      <li>• Live technical interview simulation</li>
                      <li>• Detailed feedback and recommendations</li>
                      <li>• Recording of the session (optional)</li>
                      <li>• Follow-up resources and tips</li>
                    </ul>
                  </div>

                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-4 rounded-xl text-center">
                    <div className="text-3xl font-bold text-white">₹999</div>
                    <div className="text-sm text-slate-400">One-time payment</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button 
                    onClick={onProceedToPayment}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Proceed to Payment
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  
                  <Button 
                    onClick={onGoBack}
                    variant="outline"
                    className="w-full border-2 border-slate-400/50 text-slate-400 hover:bg-slate-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
                  >
                    Modify My Preferences
                  </Button>
                </div>

                <div className="text-center text-xs text-slate-400">
                  Secure payment • 100% satisfaction guarantee
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewerPreview;