import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";
import { formatDateTimeIST } from "@/utils/dateUtils";

interface InterviewScheduledSuccessProps {
  matchedInterviewer: any;
  formData: any;
  userEmail?: string;
}

const InterviewScheduledSuccess = ({ matchedInterviewer, formData, userEmail }: InterviewScheduledSuccessProps) => {
  const hasExactTimeMatch = matchedInterviewer?.matchReasons?.includes('Time available');
  const hasAlternativeSlots = matchedInterviewer?.alternativeTimeSlots?.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
            {hasExactTimeMatch ? (
              <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            ) : (
              <Clock className="w-20 h-20 text-yellow-400 mx-auto mb-6" />
            )}
            
            <h1 className="text-4xl font-bold text-white mb-4">
              {hasExactTimeMatch ? 'Interview Scheduled!' : 'Interviewer Found!'}
            </h1>
            
            {hasExactTimeMatch ? (
              <p className="text-xl text-slate-300 mb-8">
                Your interview has been scheduled with {matchedInterviewer?.company || 'an expert interviewer'}. 
                You'll receive a Google Meet link at {userEmail} shortly.
              </p>
            ) : (
              <p className="text-xl text-slate-300 mb-8">
                We found a perfect interviewer from {matchedInterviewer?.company || 'an expert company'} for your {formData?.targetRole} role! 
                Your preferred time isn't available, but here are some alternatives:
              </p>
            )}

            <div className="space-y-4 text-left bg-white/5 rounded-xl p-6 mb-8">
              <div className="flex justify-between">
                <span className="text-slate-400">Experience:</span>
                <span className="text-white">{formData?.experience}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Role:</span>
                <span className="text-white">{formData?.targetRole}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Interviewer:</span>
                <span className="text-white">{matchedInterviewer?.company || 'Expert'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Your Preferred Time:</span>
                <span className="text-white">
                  {formData?.timeSlot ? formatDateTimeIST(formData.timeSlot) : "To be confirmed"}
                </span>
              </div>
              {!hasExactTimeMatch && hasAlternativeSlots && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <span className="text-slate-400 block mb-2">Available Alternative Times:</span>
                  <div className="space-y-1">
                    {matchedInterviewer.alternativeTimeSlots.slice(0, 3).map((slot: string, index: number) => (
                      <div key={index} className="text-green-400 text-sm">
                        • {slot}
                      </div>
                    ))}
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    Our team will contact you to confirm the best time slot.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-4 justify-center">
              <Link to="/">
                <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                  Back to Home
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default InterviewScheduledSuccess;
