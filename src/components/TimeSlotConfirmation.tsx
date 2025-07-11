import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, User, CheckCircle, AlertCircle } from "lucide-react";

interface TimeSlotConfirmationProps {
  matchedInterviewer: any;
  alternativeTimeSlot: {
    candidatePreferred: string;
    interviewerAvailable: string;
  };
  onAccept: () => void;
  onWaitForBetter: () => void;
  isLoading?: boolean;
}

const TimeSlotConfirmation = ({ 
  matchedInterviewer, 
  alternativeTimeSlot, 
  onAccept, 
  onWaitForBetter,
  isLoading = false 
}: TimeSlotConfirmationProps) => {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-blue-400/30">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-orange-500/20 backdrop-blur-sm">
            <Clock className="w-10 h-10 text-orange-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-orange-400">
            Great Match Found!
          </CardTitle>
          <CardDescription className="text-lg text-orange-200">
            We found a perfect interviewer, but there's a time preference difference
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Interviewer Details */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-xl">
            <div className="flex items-center space-x-4 mb-4">
              <User className="w-8 h-8 text-blue-400" />
              <div>
                <h3 className="text-xl font-bold text-blue-400">
                  {matchedInterviewer?.company || 'Senior Interviewer'}
                </h3>
                <p className="text-blue-200">
                  {matchedInterviewer?.position || 'Experienced Professional'}
                </p>
              </div>
            </div>
            {matchedInterviewer?.matchReasons && (
              <div className="space-y-2">
                <h4 className="font-semibold text-green-400">Why this is a great match:</h4>
                <ul className="text-sm text-green-200 space-y-1">
                  {matchedInterviewer.matchReasons.map((reason: string, index: number) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Time Slot Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-red-400/30 p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-red-400" />
                <h4 className="font-semibold text-red-400">Your Preference</h4>
              </div>
              <p className="text-red-200">{alternativeTimeSlot.candidatePreferred}</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm border border-green-400/30 p-4 rounded-xl">
              <div className="flex items-center space-x-2 mb-2">
                <Calendar className="w-5 h-5 text-green-400" />
                <h4 className="font-semibold text-green-400">Interviewer Available</h4>
              </div>
              <p className="text-green-200">{alternativeTimeSlot.interviewerAvailable}</p>
            </div>
          </div>

          {/* Recommendation Message */}
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 p-6 rounded-xl">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-blue-400 mt-1" />
              <div>
                <h4 className="font-bold text-blue-400 mb-2">Our Recommendation</h4>
                <p className="text-blue-200 mb-3">
                  We strongly recommend accepting this interviewer's available slot as they are an excellent match for your skills and experience. 
                  Getting a quality interview is more valuable than the specific time preference.
                </p>
                <p className="text-sm text-blue-300">
                  If you wait for your exact preferred time, it may take longer to find another suitable interviewer.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={onAccept}
              disabled={isLoading}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 transform hover:scale-105"
            >
              {isLoading ? 'Scheduling...' : 'Accept & Schedule Interview'}
            </Button>
            
            <Button 
              onClick={onWaitForBetter}
              variant="outline"
              disabled={isLoading}
              className="border-2 border-orange-400/50 text-orange-400 hover:bg-orange-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
            >
              Wait for My Preferred Time
            </Button>
          </div>

          <p className="text-center text-sm text-slate-400">
            Note: If you choose to wait, we'll notify you when an interviewer becomes available for your preferred time slot.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimeSlotConfirmation;