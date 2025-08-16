
import { Clock, Users, AlertCircle, Lightbulb, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import WhatsAppChat from "@/components/WhatsAppChat";

interface NoMatchFoundProps {
  formData: any;
  onTryAgain: () => void;
}

const NoMatchFound = ({ formData, onTryAgain }: NoMatchFoundProps) => {
  const skillCategories = formData?.skillCategories || [];
  const timeSlot = formData?.timeSlot;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <AlertCircle className="w-20 h-20 text-orange-400 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-white mb-4">No Suitable Match Found</h1>
            <p className="text-xl text-orange-200 mb-8">
              We couldn't find an interviewer that meets our quality standards for your specific requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Why No Match */}
            <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-orange-400/30">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-orange-400 flex items-center">
                  <Users className="w-6 h-6 mr-2" />
                  Why No Match?
                </CardTitle>
                <CardDescription className="text-orange-200">
                  Our algorithm maintains high quality standards
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="bg-white/5 backdrop-blur-sm border border-orange-400/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-orange-400 mb-3">Your Requirements:</h4>
                  <div className="text-sm text-orange-200 space-y-2">
                    <div><strong>Skills:</strong> {skillCategories.join(', ') || 'Not specified'}</div>
                    <div><strong>Experience:</strong> {formData?.experience || 'Not specified'}</div>
                    <div><strong>Preferred Time:</strong> {timeSlot ? new Date(timeSlot).toLocaleString() : 'Not specified'}</div>
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-sm border border-red-400/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-red-400 mb-3">Possible Reasons:</h4>
                  <ul className="text-sm text-red-200 space-y-1">
                    <li>• No interviewers available with {skillCategories.join(' or ')} expertise</li>
                    <li>• Your preferred time slot conflicts with interviewer availability</li>
                    <li>• All qualified interviewers are currently booked</li>
                    <li>• Your experience level needs more specialized mentorship</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* What's Next */}
            <Card className="shadow-2xl backdrop-blur-lg border-2 bg-white/10 border-blue-400/30">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-blue-400 flex items-center">
                  <Lightbulb className="w-6 h-6 mr-2" />
                  What's Next?
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Several options to get your interview scheduled
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Button 
                    onClick={onTryAgain}
                    className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-4 rounded-xl transition-all duration-300"
                  >
                    <Clock className="w-5 h-5 mr-2" />
                    Try Different Time Slot
                  </Button>
                  
                  <Button 
                    onClick={onTryAgain}
                    variant="outline"
                    className="w-full border-2 border-purple-400/50 text-purple-400 hover:bg-purple-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Broaden Skill Requirements
                  </Button>
                  
                  <Link to="/">
                    <Button 
                      variant="outline"
                      className="w-full border-2 border-slate-400/50 text-slate-400 hover:bg-slate-400/10 font-semibold py-4 rounded-xl transition-all duration-300"
                    >
                      Back to Home
                    </Button>
                  </Link>
                </div>

                <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-400/30 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <h4 className="font-semibold text-blue-400">Get Notified</h4>
                  </div>
                  <p className="text-sm text-blue-200">
                    We'll notify you when an interviewer with {skillCategories.join(' or ')} skills becomes available. 
                    Check back later or contact support for priority matching.
                  </p>
                </div>

                <div className="text-center text-xs text-slate-400">
                  High-quality matches • Worth the wait
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <WhatsAppChat />
      <Footer />
    </div>
  );
};

export default NoMatchFound;
