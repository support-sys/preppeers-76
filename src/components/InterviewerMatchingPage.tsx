import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Users, ArrowRight, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { findMatchingInterviewer } from "@/services/interviewScheduling";
import MatchingLoader from "./MatchingLoader";
import NoMatchFound from "./NoMatchFound";

interface InterviewerMatchingPageProps {
  formData: any;
  onInterviewerFound: (interviewer: any) => void;
  onNoMatch: () => void;
  onGoBack: () => void;
}

const InterviewerMatchingPage: React.FC<InterviewerMatchingPageProps> = ({
  formData,
  onInterviewerFound,
  onNoMatch,
  onGoBack
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [matchedInterviewer, setMatchedInterviewer] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    findInterviewer();
  }, []);

  const findInterviewer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Finding matching interviewer...');
      const interviewer = await findMatchingInterviewer(formData, user?.id);
      
      if (interviewer) {
        console.log('Interviewer found:', interviewer);
        setMatchedInterviewer(interviewer);
        // Don't call onInterviewerFound immediately - let user see the match first
      } else {
        console.log('No interviewer found');
        onNoMatch();
      }
    } catch (err: any) {
      console.error("Error finding interviewer:", err);
      setError(err.message || "Unable to find an interviewer. Please try again.");
      toast({
        title: "Error",
        description: "Unable to find an interviewer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    findInterviewer();
  };

  if (isLoading) {
    return <MatchingLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Error Finding Interviewer</h1>
            <p className="text-slate-300 mb-6">{error}</p>
            <div className="space-x-4">
              <Button onClick={handleRetry} className="bg-blue-600 hover:bg-blue-700">
                Try Again
              </Button>
              <Button onClick={onGoBack} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!matchedInterviewer) {
    return <NoMatchFound formData={formData} onTryAgain={handleRetry} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Interviewer Found!</h1>
          <p className="text-slate-300 text-lg">
            We've found the perfect interviewer for your interview
          </p>
        </div>

        {/* Interviewer Card */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8 shadow-lg">
          <CardHeader>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-xl sm:text-2xl text-white mb-1">
                    {matchedInterviewer.name || 'Professional Interviewer'}
                  </CardTitle>
                  <CardDescription className="text-slate-300 text-base sm:text-lg mb-2">
                    {matchedInterviewer.position || 'Senior Professional'} at {matchedInterviewer.company || 'Leading Company'}
                  </CardDescription>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-600 text-white px-3 py-1 text-xs font-bold">
                      <Check className="w-3 h-3 mr-1" />
                      Matched
                    </Badge>
                    <Badge variant="outline" className="border-blue-400/30 text-blue-300 px-3 py-1 text-xs">
                      {matchedInterviewer.experience_years || '5+'} years exp
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Bio Section */}
            {matchedInterviewer.bio && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2 text-blue-400" />
                  About This Interviewer
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {matchedInterviewer.bio.length > 150 
                    ? `${matchedInterviewer.bio.substring(0, 150)}...` 
                    : matchedInterviewer.bio}
                </p>
              </div>
            )}

            {/* How This Interviewer Will Help */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">
                How This Interviewer Will Help You
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start space-x-2 text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Get detailed expert feedback on your performance and areas for improvement</span>
                </li>
                <li className="flex items-start space-x-2 text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Learn from someone with real-world industry experience in your field</span>
                </li>
                <li className="flex items-start space-x-2 text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Receive comprehensive evaluation of your technical and soft skills</span>
                </li>
                <li className="flex items-start space-x-2 text-slate-300">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">Get personalized career guidance and advice to advance your career</span>
                </li>
              </ul>
            </div>

            {/* Key Skills */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Key Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(matchedInterviewer.technologies || matchedInterviewer.skills || []).slice(0, 4).map((skill: string, index: number) => (
                  <Badge key={index} variant="outline" className="border-blue-400/30 text-blue-300 text-xs">
                    {skill}
                  </Badge>
                ))}
                {(matchedInterviewer.technologies || matchedInterviewer.skills || []).length > 4 && (
                  <Badge variant="outline" className="border-slate-400/30 text-slate-300 text-xs">
                    +{(matchedInterviewer.technologies || matchedInterviewer.skills || []).length - 4} more
                  </Badge>
                )}
              </div>
            </div>


            {/* Match Reasons */}
            {matchedInterviewer.matchReasons && matchedInterviewer.matchReasons.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-white mb-3">Why This Interviewer?</h4>
                <ul className="space-y-2">
                  {matchedInterviewer.matchReasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2 text-slate-300">
                      <Check className="w-4 h-4 text-green-400 mt-1 flex-shrink-0" />
                      <span className="text-sm">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <Button 
            onClick={() => onInterviewerFound(matchedInterviewer)}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
          >
            Continue to Plan Selection
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <div className="text-center">
            <Button 
              onClick={onGoBack}
              variant="ghost"
              className="text-slate-400 hover:text-white"
            >
              ← Back to Form
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default InterviewerMatchingPage;

